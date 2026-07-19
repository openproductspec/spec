import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { relative, resolve } from "node:path";
import {
  resolveProductSpecGraph,
  validateAgentRunJson,
  validateDecisionTraceJson,
  validateProductSpecMarkdown,
  type AgentRunDocument,
  type DecisionTraceDocument,
  type ProductSpecDocument,
  type ProductSpecGraph,
  type ProductSpecGraphInput,
  type ProductSpecGraphWarning,
  type ProductSpecRelatedArtifact,
  type ProductSpecValidationError,
  type ProductSpecValidationWarning
} from "./index.js";

export interface ScannedProductSpec {
  path: string;
  valid: boolean;
  document?: ProductSpecDocument;
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface ScannedAgentRun {
  path: string;
  valid: boolean;
  document?: AgentRunDocument;
  errors: ProductSpecValidationError[];
}

export interface ScannedDecisionTrace {
  path: string;
  valid: boolean;
  document?: DecisionTraceDocument;
  errors: ProductSpecValidationError[];
}

export interface EvidenceGap {
  spec_path: string;
  item_id: string;
  kind: "acceptance_criterion" | "ai_eval" | "success_metric";
  message: string;
}

export interface StaleRevisionLink {
  spec_path: string;
  target_path: string;
  pinned_revision: number;
  current_revision: number;
}

export interface StaleAgentRun {
  spec_path: string;
  run_path: string;
  pinned_revision: number;
  current_revision: number;
}

export interface AgentRunGap {
  spec_path: string;
  message: string;
}

export interface DecisionTraceGap {
  trace_path: string;
  message: string;
}

export interface ProductSpecRepoReport {
  root: string;
  product_specs: ScannedProductSpec[];
  agent_runs: ScannedAgentRun[];
  decision_traces: ScannedDecisionTrace[];
  graph: ProductSpecGraph | null;
  evidence_gaps: EvidenceGap[];
  stale_revision_links: StaleRevisionLink[];
  stale_agent_runs: StaleAgentRun[];
  agent_run_gaps: AgentRunGap[];
  decision_trace_gaps: DecisionTraceGap[];
  ready_for_agents: string[];
  needs_attention: string[];
}

export interface ReconciliationReport {
  spec_path: string;
  spec_revision?: number;
  spec_valid: boolean;
  run_path?: string;
  run_valid?: boolean;
  run_status?: AgentRunDocument["status"];
  checked: Array<{ item_id: string; status: string; evidence_count: number }>;
  missing_items: string[];
  failed_items: string[];
  incomplete_items: string[];
  passed_without_evidence: string[];
  stale_run: boolean;
  drift_detected: boolean;
  drift_requires_trace: boolean;
  satisfied: boolean;
  recommended_actions: string[];
  errors: ProductSpecValidationError[];
}

export function scanProductSpecRepo(rootPath: string): ProductSpecRepoReport {
  const root = resolve(rootPath);
  const files = collectFiles(root);
  const productSpecs = files
    .filter((file) => file.endsWith(".product-spec.md"))
    .map((file) => scanProductSpec(root, file));
  const agentRuns = files
    .filter((file) => file.endsWith(".agent-run.json"))
    .map((file) => scanAgentRun(root, file));
  const decisionTraces = files
    .filter((file) => file.endsWith(".decision-trace.json"))
    .map((file) => scanDecisionTrace(root, file));

  const graphInputs: ProductSpecGraphInput[] = [];
  const skipped: ProductSpecGraphWarning[] = [];
  for (const spec of productSpecs) {
    if (spec.valid && spec.document) graphInputs.push({ path: spec.path, document: spec.document });
    else skipped.push({ code: "skipped_invalid_spec", message: `${spec.path} fails validation and is not in the graph.`, path: spec.path });
  }
  const graph = graphInputs.length ? resolveProductSpecGraph(graphInputs) : null;
  if (graph) graph.warnings.push(...skipped);

  const evidenceGaps = collectEvidenceGaps(productSpecs, agentRuns);
  const staleRevisionLinks = collectStaleRevisionLinks(productSpecs);
  const staleAgentRuns = collectStaleAgentRuns(productSpecs, agentRuns);
  const agentRunGaps = collectAgentRunGaps(productSpecs, agentRuns);
  const decisionTraceGaps = collectDecisionTraceGaps(productSpecs, decisionTraces);
  const needsAttention = new Set<string>();
  for (const spec of productSpecs) {
    if (!spec.valid || spec.warnings.length) needsAttention.add(spec.path);
  }
  for (const gap of evidenceGaps) needsAttention.add(gap.spec_path);
  for (const link of staleRevisionLinks) needsAttention.add(link.spec_path);
  for (const run of staleAgentRuns) needsAttention.add(run.spec_path);
  for (const gap of agentRunGaps) needsAttention.add(gap.spec_path);
  for (const warning of graph?.warnings ?? []) needsAttention.add(warning.path);

  const readyForAgents = productSpecs
    .filter((spec) => spec.valid && !needsAttention.has(spec.path) && !graph?.blocked.some((node) => node.path === spec.path))
    .map((spec) => spec.path);

  return {
    root,
    product_specs: productSpecs,
    agent_runs: agentRuns,
    decision_traces: decisionTraces,
    graph,
    evidence_gaps: evidenceGaps,
    stale_revision_links: staleRevisionLinks,
    stale_agent_runs: staleAgentRuns,
    agent_run_gaps: agentRunGaps,
    decision_trace_gaps: decisionTraceGaps,
    ready_for_agents: readyForAgents,
    needs_attention: [...needsAttention].sort()
  };
}

export function reconcileProductSpec(rootPath: string, specPath: string, runPath?: string): ReconciliationReport {
  const root = resolve(rootPath);
  const absoluteSpecPath = resolve(root, specPath);
  const spec = scanProductSpec(root, absoluteSpecPath);
  const errors = [...spec.errors];
  if (!spec.valid || !spec.document) {
    return {
      spec_path: relative(root, absoluteSpecPath),
      spec_valid: false,
      checked: [],
      missing_items: [],
      failed_items: [],
      incomplete_items: [],
      passed_without_evidence: [],
      stale_run: false,
      drift_detected: false,
      drift_requires_trace: false,
      satisfied: false,
      recommended_actions: ["Fix Product Spec validation errors before reconciling execution evidence."],
      errors
    };
  }

  const expectedItems = expectedEvidenceItems(spec.document);
  const absoluteRunPath = runPath
    ? resolve(root, runPath)
    : findRunForSpec(root, relative(root, absoluteSpecPath), spec.document.frontmatter.spec_revision);
  const run = absoluteRunPath ? scanAgentRun(root, absoluteRunPath) : undefined;
  if (run && !run.valid) errors.push(...run.errors);
  const checked = run?.document?.checked_items.map((item) => ({
    item_id: item.item_id,
    status: item.status,
    evidence_count: item.evidence?.length ?? 0
  })) ?? [];
  const checkedById = new Map(checked.map((item) => [item.item_id, item]));
  const missingItems = expectedItems.filter((item) => !checkedById.has(item));
  const failedItems = checked.filter((item) => item.status === "failed").map((item) => item.item_id);
  const incompleteItems = expectedItems.filter((item) => {
    const checkedItem = checkedById.get(item);
    return checkedItem !== undefined && checkedItem.status !== "passed";
  });
  const passedWithoutEvidence = expectedItems.filter((item) => {
    const checkedItem = checkedById.get(item);
    return checkedItem?.status === "passed" && checkedItem.evidence_count === 0;
  });
  const staleRun = Boolean(run?.document && run.document.product_spec.spec_revision !== spec.document.frontmatter.spec_revision);
  const driftDetected = Boolean(run?.document?.drift.detected);
  const driftRequiresTrace = Boolean(driftDetected && !run?.document?.drift.decision_trace_path);
  const runCompleted = run?.document?.status === "completed";
  const blockers: string[] = [];

  if (!run) blockers.push("Create an Agent Run receipt with productspec init-run before claiming implementation complete.");
  if (run && !run.valid) blockers.push("Fix Agent Run validation errors before relying on this execution receipt.");
  if (run?.valid && !runCompleted) blockers.push("Mark the Agent Run completed before claiming implementation complete.");
  if (staleRun) blockers.push("Re-plan against the current Product Spec revision and update the Agent Run revision pin.");
  if (missingItems.length) blockers.push(`Check remaining ProductSpec items: ${missingItems.join(", ")}.`);
  if (incompleteItems.length) blockers.push(`Do not claim completion while these items are not passed: ${incompleteItems.join(", ")}.`);
  for (const item of passedWithoutEvidence) {
    blockers.push(`Attach evidence for ${item} before treating it as complete.`);
  }
  if (driftRequiresTrace) {
    blockers.push("Record a Decision Trace or link one from the Agent Run because drift was detected.");
  }
  const satisfied = blockers.length === 0;
  const recommendedActions = satisfied
    ? ["No reconciliation blockers found in ProductSpec artifacts."]
    : [...new Set(blockers)];

  return {
    spec_path: relative(root, absoluteSpecPath),
    spec_revision: spec.document.frontmatter.spec_revision,
    spec_valid: true,
    run_path: run?.path,
    run_valid: run?.valid,
    run_status: run?.document?.status,
    checked,
    missing_items: missingItems,
    failed_items: failedItems,
    incomplete_items: incompleteItems,
    passed_without_evidence: passedWithoutEvidence,
    stale_run: staleRun,
    drift_detected: driftDetected,
    drift_requires_trace: driftRequiresTrace,
    satisfied,
    recommended_actions: recommendedActions,
    errors
  };
}

export function gardenText(report: ProductSpecRepoReport): string {
  const lines: string[] = ["Garden report", ""];
  lines.push(`Product Specs: ${report.product_specs.length}`);
  lines.push(`Agent Runs: ${report.agent_runs.length}`);
  lines.push(`Decision Traces: ${report.decision_traces.length}`);
  lines.push("");
  lines.push("Needs attention:");
  pushList(lines, report.needs_attention);
  lines.push("Ready for agents:");
  pushList(lines, report.ready_for_agents);
  if (report.graph) {
    lines.push("Blocked:");
    pushList(lines, report.graph.blocked.map((node) => `${node.path} (waits on: ${node.waits_on.join(", ")})`));
    lines.push("Parallel waves:");
    pushList(lines, report.graph.waves.map((wave, index) => `Wave ${index + 1}: ${wave.join(", ")}`));
    lines.push("Contention:");
    pushList(lines, report.graph.contention.map((surface) => `${surface.kind} ${surface.value}: ${surface.specs.join(", ")}`));
    lines.push("Unscoped:");
    pushList(lines, report.graph.unscoped);
  }
  lines.push("Missing evidence:");
  pushList(lines, report.evidence_gaps.map((gap) => `${gap.spec_path} ${gap.item_id}: ${gap.message}`));
  lines.push("Stale revision links:");
  pushList(lines, report.stale_revision_links.map((link) => `${link.spec_path} pins ${link.target_path} at ${link.pinned_revision}, current ${link.current_revision}`));
  lines.push("Stale Agent Runs:");
  pushList(lines, report.stale_agent_runs.map((run) => `${run.run_path} pins ${run.spec_path} at ${run.pinned_revision}, current ${run.current_revision}`));
  lines.push("Agent Run gaps:");
  pushList(lines, report.agent_run_gaps.map((gap) => `${gap.spec_path}: ${gap.message}`));
  lines.push("Decision Trace gaps:");
  pushList(lines, report.decision_trace_gaps.map((gap) => `${gap.trace_path}: ${gap.message}`));
  return `${lines.join("\n")}\n`;
}

export function reconciliationText(report: ReconciliationReport): string {
  const lines = ["Reconciliation report", "", `Spec: ${report.spec_path}`];
  if (report.spec_revision !== undefined) lines.push(`Revision: ${report.spec_revision}`);
  if (report.run_path) lines.push(`Agent Run: ${report.run_path}`);
  lines.push(`Satisfied: ${report.satisfied ? "yes" : "no"}`);
  lines.push("", "Checked:");
  pushList(lines, report.checked.map((item) => `${item.item_id}: ${item.status} (${item.evidence_count} evidence links)`));
  lines.push("Missing items:");
  pushList(lines, report.missing_items);
  lines.push("Failed items:");
  pushList(lines, report.failed_items);
  lines.push("Incomplete items:");
  pushList(lines, report.incomplete_items);
  lines.push("Passed without evidence:");
  pushList(lines, report.passed_without_evidence);
  lines.push("Recommended actions:");
  pushList(lines, report.recommended_actions);
  return `${lines.join("\n")}\n`;
}

export function serveProductSpecRepo(report: ProductSpecRepoReport, port: number): Server {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(repoHtml(report));
  });
  server.listen(port);
  return server;
}

export function repoHtml(report: ProductSpecRepoReport): string {
  const graph = report.graph;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ProductSpec Repo</title>
<style>
body{font-family:ui-sans-serif,system-ui,sans-serif;margin:40px;line-height:1.45;color:#1f1d1a;background:#faf9f6}main{max-width:1080px}section{border-top:1px solid #ddd7ce;padding:24px 0}code{background:#eee9df;padding:2px 5px;border-radius:4px}li{margin:6px 0}.stat{display:inline-block;margin:0 12px 12px 0;padding:8px 10px;border:1px solid #ddd7ce;background:white}</style>
</head>
<body><main>
<h1>ProductSpec Repo</h1>
<p>${escapeHtml(report.root)}</p>
<div>
<span class="stat">${report.product_specs.length} specs</span>
<span class="stat">${report.needs_attention.length} need attention</span>
<span class="stat">${report.ready_for_agents.length} ready for agents</span>
<span class="stat">${graph?.waves.length ?? 0} waves</span>
</div>
${htmlSection("Needs attention", report.needs_attention)}
${htmlSection("Ready for agents", report.ready_for_agents)}
${htmlSection("Parallel waves", graph?.waves.map((wave, index) => `Wave ${index + 1}: ${wave.join(", ")}`) ?? [])}
${htmlSection("Contention", graph?.contention.map((surface) => `${surface.kind} ${surface.value}: ${surface.specs.join(", ")}`) ?? [])}
${htmlSection("Missing evidence", report.evidence_gaps.map((gap) => `${gap.spec_path} ${gap.item_id}: ${gap.message}`))}
${htmlSection("Stale Agent Runs", report.stale_agent_runs.map((run) => `${run.run_path} pins ${run.spec_path} at ${run.pinned_revision}, current ${run.current_revision}`))}
${htmlSection("Agent Run gaps", report.agent_run_gaps.map((gap) => `${gap.spec_path}: ${gap.message}`))}
${htmlSection("Decision Trace gaps", report.decision_trace_gaps.map((gap) => `${gap.trace_path}: ${gap.message}`))}
</main></body></html>`;
}

function collectFiles(dir: string): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const found: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if ([".git", "node_modules", "dist", ".next"].includes(entry.name)) continue;
    const entryPath = `${dir.replace(/\/$/, "")}/${entry.name}`;
    if (entry.isDirectory()) found.push(...collectFiles(entryPath));
    else found.push(entryPath);
  }
  return found;
}

function scanProductSpec(root: string, file: string): ScannedProductSpec {
  const path = relative(root, file);
  const result = validateProductSpecMarkdown(readFileSync(file, "utf8"));
  return result.valid
    ? { path, valid: true, document: result.document, errors: [], warnings: result.warnings }
    : { path, valid: false, errors: result.errors, warnings: result.warnings };
}

function scanAgentRun(root: string, file: string): ScannedAgentRun {
  const path = relative(root, file);
  const result = validateAgentRunJson(readFileSync(file, "utf8"));
  return result.valid ? { path, valid: true, document: result.document, errors: [] } : { path, valid: false, errors: result.errors };
}

function scanDecisionTrace(root: string, file: string): ScannedDecisionTrace {
  const path = relative(root, file);
  const result = validateDecisionTraceJson(readFileSync(file, "utf8"));
  return result.valid ? { path, valid: true, document: result.document, errors: [] } : { path, valid: false, errors: result.errors };
}

function expectedEvidenceItems(document: ProductSpecDocument): string[] {
  return document.sections.flatMap((section) => [
    ...(section.acceptance_criteria ?? []).map((item) => item.id),
    ...(section.ai_evals ?? []).map((item) => item.id),
    ...(section.success_metrics ?? []).map((item) => item.id)
  ]);
}

function collectEvidenceGaps(specs: ScannedProductSpec[], runs: ScannedAgentRun[]): EvidenceGap[] {
  const gaps: EvidenceGap[] = [];
  for (const spec of specs) {
    if (!spec.valid || !spec.document) continue;
    const artifacts = spec.document.sections.flatMap((section) => section.related_artifacts ?? []);
    const specRuns = runs.filter((run) => run.valid && run.document && referencesSpec(spec.path, run.document.product_spec.path));
    for (const section of spec.document.sections) {
      for (const item of section.acceptance_criteria ?? []) {
        if (!hasEvidence(artifacts, item.id) && !hasRunEvidence(specRuns, item.id)) gaps.push({ spec_path: spec.path, item_id: item.id, kind: "acceptance_criterion", message: "No related artifact or Agent Run evidence is linked." });
      }
      for (const item of section.ai_evals ?? []) {
        if (!hasEvidence(artifacts, item.id) && !hasRunEvidence(specRuns, item.id)) gaps.push({ spec_path: spec.path, item_id: item.id, kind: "ai_eval", message: "No eval evidence is linked." });
      }
      for (const item of section.success_metrics ?? []) {
        if (hasRunEvidence(specRuns, item.id) || hasEvidence(artifacts, item.id)) continue;
        if (specRuns.some((run) => run.document?.checked_items.some((checked) => checked.item_id === item.id && checked.status !== "not_checked"))) {
          gaps.push({ spec_path: spec.path, item_id: item.id, kind: "success_metric", message: "No outcome evidence is linked." });
        }
      }
    }
  }
  return gaps;
}

function collectStaleRevisionLinks(specs: ScannedProductSpec[]): StaleRevisionLink[] {
  const byPath = new Map(specs.filter((spec) => spec.valid && spec.document).map((spec) => [spec.path, spec.document as ProductSpecDocument]));
  const stale: StaleRevisionLink[] = [];
  for (const spec of specs) {
    if (!spec.valid || !spec.document) continue;
    for (const artifact of spec.document.sections.flatMap((section) => section.related_artifacts ?? [])) {
      if (artifact.type !== "product_spec" || !artifact.product_spec_path || artifact.product_spec_revision === undefined) continue;
      const target = byPath.get(resolveRelatedSpecPath(spec.path, artifact.product_spec_path));
      const current = target?.frontmatter.spec_revision;
      if (target && current !== undefined && current !== artifact.product_spec_revision) {
        stale.push({ spec_path: spec.path, target_path: resolveRelatedSpecPath(spec.path, artifact.product_spec_path), pinned_revision: artifact.product_spec_revision, current_revision: current });
      }
    }
  }
  return stale;
}

function collectStaleAgentRuns(specs: ScannedProductSpec[], runs: ScannedAgentRun[]): StaleAgentRun[] {
  const stale: StaleAgentRun[] = [];
  for (const run of runs) {
    if (!run.valid || !run.document) continue;
    const runDocument = run.document;
    const spec = specs.find((candidate) => (
      candidate.valid
      && candidate.document
      && referencesSpec(candidate.path, runDocument.product_spec.path)
    ));
    const currentRevision = spec?.document?.frontmatter.spec_revision;
    if (spec && currentRevision !== undefined && currentRevision !== runDocument.product_spec.spec_revision) {
      stale.push({
        spec_path: spec.path,
        run_path: run.path,
        pinned_revision: runDocument.product_spec.spec_revision,
        current_revision: currentRevision
      });
    }
  }
  return stale;
}

function collectAgentRunGaps(specs: ScannedProductSpec[], runs: ScannedAgentRun[]): AgentRunGap[] {
  const runsBySpec = new Map<string, AgentRunDocument[]>();
  for (const run of runs) {
    if (!run.valid || !run.document) continue;
    const runPath = normalizePath(run.document.product_spec.path);
    const list = runsBySpec.get(runPath) ?? [];
    list.push(run.document);
    runsBySpec.set(runPath, list);
  }
  const gaps: AgentRunGap[] = [];
  for (const spec of specs) {
    if (!spec.valid || !spec.document) continue;
    const artifacts = spec.document.sections.flatMap((section) => section.related_artifacts ?? []);
    const hasExecutionEvidence = artifacts.some((artifact) => artifact.type === "github_pr" || artifact.type === "release" || artifact.type === "eval_run");
    if (hasExecutionEvidence && ![...runsBySpec.keys()].some((runSpecPath) => referencesSpec(spec.path, runSpecPath))) {
      gaps.push({ spec_path: spec.path, message: "Execution evidence exists, but no Agent Run references this spec." });
    }
  }
  return gaps;
}

function collectDecisionTraceGaps(specs: ScannedProductSpec[], traces: ScannedDecisionTrace[]): DecisionTraceGap[] {
  const byPath = new Map(specs.filter((spec) => spec.valid && spec.document).map((spec) => [spec.path, spec.document as ProductSpecDocument]));
  const gaps: DecisionTraceGap[] = [];
  for (const trace of traces) {
    if (!trace.valid || !trace.document) continue;
    const path = trace.document.subject.product_spec_path;
    if (!path) continue;
    const resolvedPath = resolveRelatedSpecPath(trace.path, path);
    const spec = byPath.get(resolvedPath) ?? [...byPath.entries()].find(([specPath]) => referencesSpec(specPath, resolvedPath))?.[1];
    if (!spec) gaps.push({ trace_path: trace.path, message: `References missing Product Spec ${path}.` });
    else if (trace.document.subject.product_spec_revision !== undefined && spec.frontmatter.spec_revision !== trace.document.subject.product_spec_revision) {
      gaps.push({ trace_path: trace.path, message: `References ${path} revision ${trace.document.subject.product_spec_revision}, current revision is ${spec.frontmatter.spec_revision}.` });
    }
  }
  return gaps;
}

function findRunForSpec(root: string, specPath: string, specRevision?: number): string | undefined {
  const runs = collectFiles(root).filter((file) => file.endsWith(".agent-run.json"));
  let fallback: string | undefined;
  for (const file of runs) {
    const result = validateAgentRunJson(readFileSync(file, "utf8"));
    if (!result.valid || !referencesSpec(specPath, result.document.product_spec.path)) continue;
    fallback ??= file;
    if (result.document.product_spec.spec_revision === specRevision) return file;
  }
  return fallback;
}

function hasEvidence(artifacts: ProductSpecRelatedArtifact[], itemId: string): boolean {
  return artifacts.some((artifact) => artifact.item_id === itemId && Boolean(artifact.url || artifact.product_spec_path));
}

function hasRunEvidence(runs: ScannedAgentRun[], itemId: string): boolean {
  return runs.some((run) => run.document?.checked_items.some((checked) => checked.item_id === itemId && Boolean(checked.evidence?.length)));
}

function referencesSpec(specPath: string, referencedPath: string): boolean {
  const normalizedSpec = normalizePath(specPath);
  const normalizedReference = normalizePath(referencedPath);
  return normalizedSpec === normalizedReference
    || normalizedSpec.endsWith(`/${normalizedReference}`)
    || normalizedReference.endsWith(`/${normalizedSpec}`);
}

function resolveRelatedSpecPath(fromPath: string, link: string): string {
  if (!link.startsWith("./") && !link.startsWith("../")) return normalizePath(link);
  const dir = fromPath.split("/").slice(0, -1).join("/");
  return normalizePath(dir ? `${dir}/${link}` : link);
}

function normalizePath(path: string): string {
  const segments: string[] = [];
  for (const segment of path.replace(/\\/g, "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") segments.pop();
    else segments.push(segment);
  }
  return segments.join("/");
}

function pushList(lines: string[], items: string[]): void {
  if (!items.length) lines.push("- none");
  else for (const item of items) lines.push(`- ${item}`);
  lines.push("");
}

function htmlSection(title: string, items: string[]): string {
  const list = items.length ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>none</li>";
  return `<section><h2>${escapeHtml(title)}</h2><ul>${list}</ul></section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] as string));
}
