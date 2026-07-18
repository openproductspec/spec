import { createHash, randomUUID } from "node:crypto";
import { type Dirent, existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { isAbsolute, join, normalize, relative, resolve } from "node:path";
import {
  parseProductSpecMarkdown,
  resolveProductSpecGraph,
  type AgentRunDocument,
  type ProductSpecAcceptanceCriterion,
  type ProductSpecAiEval,
  type ProductSpecDocument,
  type ProductSpecGraph,
  type ProductSpecGraphInput,
  type ProductSpecGraphWarning,
  type ProductSpecRelatedArtifact,
  type ProductSpecScope,
  type ProductSpecSuccessMetric,
  validateProductSpecMarkdown,
  type ProductSpecValidationError,
  type ProductSpecValidationWarning
} from "./index.js";

export interface ProductSpecMcpArgs {
  root?: string;
  path?: string;
}

export interface ProductSpecListItem {
  path: string;
  title?: string;
  spec_revision?: number;
  valid: boolean;
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface CompletionClaimCheck {
  spec_valid: boolean;
  claim: string;
  message: string;
  acceptance_criteria: Array<ProductSpecAcceptanceCriterion & { status: "needs_verification" }>;
  ai_evals: Array<ProductSpecAiEval & { status: "not_run_by_productspec" }>;
  success_metrics: ProductSpecSuccessMetric[];
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface EvidenceChecklist {
  spec_valid: boolean;
  message: string;
  acceptance_criteria: EvidenceChecklistItem[];
  ai_evals: EvidenceChecklistItem[];
  success_metrics: EvidenceChecklistItem[];
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface EvidenceChecklistItem {
  id: string;
  evidence_needed: string;
  release_blocking: boolean;
  related_artifacts: ProductSpecRelatedArtifact[];
}

export interface AgentHandoff {
  spec_valid: boolean;
  markdown: string;
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface ProductSpecSession {
  session_id: string;
  path: string;
  spec_revision?: number;
  content_hash: string;
  started_at: string;
  message: string;
}

export interface ProductSpecSessionCheck {
  session_id?: string;
  path: string;
  changed: boolean;
  current_valid: boolean;
  started_revision?: number;
  current_revision?: number;
  started_hash: string;
  current_hash?: string;
  started_at?: string;
  checked_at: string;
  recommended_action: "continue_against_pinned_revision" | "replan_before_continuing" | "resolve_invalid_current_spec";
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

interface ProductSpecSessionRecord {
  root: string;
  path: string;
  spec_revision?: number;
  content_hash: string;
  started_at: string;
}

export interface ProductSpecSessionCheckArgs extends ProductSpecMcpArgs {
  session_id?: string;
  started_revision?: number;
  started_hash?: string;
}

export interface DraftAgentRunArgs extends ProductSpecMcpArgs {
  agent_name?: string;
  agent_version?: string;
  run_id?: string;
}

const DEFAULT_ROOT = process.cwd();
const specSessions = new Map<string, ProductSpecSessionRecord>();

export function listProductSpecs(args: { root?: string } = {}): ProductSpecListItem[] {
  const root = resolveRoot(args.root);
  return findProductSpecFiles(root).map((absolutePath) => {
    const path = relative(root, absolutePath);
    const result = validateProductSpecMarkdown(readFileSync(absolutePath, "utf8"));
    if (!result.valid) {
      return { path, valid: false, errors: result.errors, warnings: result.warnings };
    }
    return {
      path,
      title: result.document.frontmatter.title,
      spec_revision: result.document.frontmatter.spec_revision,
      valid: true,
      errors: [],
      warnings: result.warnings
    };
  });
}

export function getProductSpec(args: ProductSpecMcpArgs): ProductSpecDocument {
  return readValidProductSpec(args);
}

export function validateProductSpec(args: ProductSpecMcpArgs) {
  const markdown = readProductSpecMarkdown(args);
  return validateProductSpecMarkdown(markdown);
}

export function beginSpecSession(args: ProductSpecMcpArgs): ProductSpecSession {
  const root = resolveRoot(args.root);
  if (!args.path) throw new Error("path is required");
  const absolutePath = resolveSpecPath(root, args.path);
  const path = relative(root, absolutePath);
  const markdown = readFileSync(absolutePath, "utf8");
  const result = validateProductSpecMarkdown(markdown);
  if (!result.valid) {
    throw new Error(`Invalid Product Spec: ${result.errors.map((error) => error.message).join("; ")}`);
  }

  const session_id = `productspec-session-${randomUUID()}`;
  const started_at = new Date().toISOString();
  const record: ProductSpecSessionRecord = {
    root,
    path,
    spec_revision: result.document.frontmatter.spec_revision,
    content_hash: contentHash(markdown),
    started_at
  };
  specSessions.set(session_id, record);

  return {
    session_id,
    path,
    spec_revision: record.spec_revision,
    content_hash: record.content_hash,
    started_at,
    message: "Product Spec session pinned. Call check_spec_session before claiming done or after long-running work."
  };
}

export function checkSpecSession(args: ProductSpecSessionCheckArgs): ProductSpecSessionCheck {
  const session = resolveSessionCheckArgs(args);
  const checked_at = new Date().toISOString();
  const markdown = readProductSpecMarkdown({ root: session.root, path: session.path });
  const current_hash = contentHash(markdown);
  const result = validateProductSpecMarkdown(markdown);

  if (!result.valid) {
    return {
      session_id: session.session_id,
      path: session.path,
      changed: true,
      current_valid: false,
      started_revision: session.started_revision,
      started_hash: session.started_hash,
      current_hash,
      started_at: session.started_at,
      checked_at,
      recommended_action: "resolve_invalid_current_spec",
      errors: result.errors,
      warnings: result.warnings
    };
  }

  const current_revision = result.document.frontmatter.spec_revision;
  // The content hash covers the whole file including spec_revision, so a hash match
  // already means the revision matches. Only compare revisions when one was pinned;
  // otherwise an unpinned revision (a hash-only CLI check) would falsely read as drift.
  const changed =
    current_hash !== session.started_hash ||
    (session.started_revision !== undefined && current_revision !== session.started_revision);
  return {
    session_id: session.session_id,
    path: session.path,
    changed,
    current_valid: true,
    started_revision: session.started_revision,
    current_revision,
    started_hash: session.started_hash,
    current_hash,
    started_at: session.started_at,
    checked_at,
    recommended_action: changed ? "replan_before_continuing" : "continue_against_pinned_revision",
    errors: [],
    warnings: result.warnings
  };
}

export function getScope(args: ProductSpecMcpArgs): ProductSpecScope | null {
  const section = readValidProductSpec(args).sections.find((candidate) => candidate.id === "scope");
  return section?.scope ?? null;
}

export function getProductSummary(args: ProductSpecMcpArgs): string {
  const section = readValidProductSpec(args).sections.find((candidate) => candidate.id === "product_summary");
  return section?.content.trim() ?? "";
}

export function getAcceptanceCriteria(args: ProductSpecMcpArgs): ProductSpecAcceptanceCriterion[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.acceptance_criteria ?? []);
}

export function getAiEvals(args: ProductSpecMcpArgs): ProductSpecAiEval[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.ai_evals ?? []);
}

export function getSuccessMetrics(args: ProductSpecMcpArgs): ProductSpecSuccessMetric[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.success_metrics ?? []);
}

export function getRelatedArtifacts(args: ProductSpecMcpArgs): ProductSpecRelatedArtifact[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.related_artifacts ?? []);
}

export function getEvidenceChecklist(args: ProductSpecMcpArgs): EvidenceChecklist {
  const result = validateProductSpec(args);
  if (!result.valid) {
    return {
      spec_valid: false,
      message: "The Product Spec is invalid. Fix validation errors before collecting evidence against it.",
      acceptance_criteria: [],
      ai_evals: [],
      success_metrics: [],
      errors: result.errors,
      warnings: result.warnings
    };
  }

  const artifacts = result.document.sections.flatMap((section) => section.related_artifacts ?? []);
  return {
    spec_valid: true,
    message: "ProductSpec does not collect evidence. It lists the evidence that should attach to the spec before and after launch.",
    acceptance_criteria: result.document.sections.flatMap((section) =>
      (section.acceptance_criteria ?? []).map((criterion) => ({
        id: criterion.id,
        evidence_needed: "Implementation evidence, such as a pull request, test, code link, or release note.",
        release_blocking: true,
        related_artifacts: artifactsForItem(artifacts, criterion.id)
      }))
    ),
    ai_evals: result.document.sections.flatMap((section) =>
      (section.ai_evals ?? []).map((evalSpec) => ({
        id: evalSpec.id,
        evidence_needed: "Eval evidence, such as an eval run, test report, or human review record.",
        release_blocking: true,
        related_artifacts: artifactsForItem(artifacts, evalSpec.id)
      }))
    ),
    success_metrics: result.document.sections.flatMap((section) =>
      (section.success_metrics ?? []).map((metric) => ({
        id: metric.id,
        evidence_needed: "Post-launch outcome evidence, such as a dashboard, analytics snapshot, experiment, or metric review.",
        release_blocking: false,
        related_artifacts: artifactsForItem(artifacts, metric.id)
      }))
    ),
    errors: [],
    warnings: result.warnings
  };
}

export function generateAgentHandoff(args: ProductSpecMcpArgs): AgentHandoff {
  const result = validateProductSpec(args);
  if (!result.valid) {
    return {
      spec_valid: false,
      markdown: "",
      errors: result.errors,
      warnings: result.warnings
    };
  }

  const root = resolveRoot(args.root);
  if (!args.path) throw new Error("path is required");
  const absolutePath = resolveSpecPath(root, args.path);
  const path = relative(root, absolutePath);
  const document = result.document;
  const productSummary = document.sections.find((section) => section.id === "product_summary")?.content.trim();
  const scope = document.sections.find((section) => section.id === "scope")?.scope;
  const acceptanceCriteria = document.sections.flatMap((section) => section.acceptance_criteria ?? []);
  const aiEvals = document.sections.flatMap((section) => section.ai_evals ?? []);
  const successMetrics = document.sections.flatMap((section) => section.success_metrics ?? []);
  const relatedArtifacts = document.sections.flatMap((section) => section.related_artifacts ?? []);

  const lines = [
    `# Agent Handoff: ${document.frontmatter.title}`,
    "",
    "## Build Contract",
    "",
    `Implement ProductSpec revision ${document.frontmatter.spec_revision ?? 1}.`,
    `Source Product Spec: \`${path}\`.`,
    "Satisfy every acceptance criterion before claiming the work is done.",
    "Stay inside scope. If implementation pressure changes product intent, stop and propose a Product Spec update or Decision Trace.",
    "",
    "## Product Summary",
    "",
    productSummary || "No Product Summary found.",
    "",
    "## Scope Guardrails",
    ""
  ];

  appendScope(lines, "In", scope?.in ?? []);
  appendScope(lines, "Out", scope?.out ?? []);
  appendScope(lines, "Cut if needed", scope?.cut ?? []);

  lines.push("", "## Must Satisfy", "");
  if (acceptanceCriteria.length) {
    for (const criterion of acceptanceCriteria) lines.push(`- ${criterion.id}: ${criterion.criterion}`);
  } else {
    lines.push("- No Acceptance Criteria found.");
  }

  lines.push("", "## Evidence The Agent Must Produce", "");
  if (acceptanceCriteria.length) {
    for (const criterion of acceptanceCriteria) {
      lines.push(`- Verification for ${criterion.id}: prove that "${criterion.criterion}" is true in the built product.`);
    }
  } else {
    lines.push("- Return proof for each Acceptance Criterion before claiming the work is done.");
  }

  if (aiEvals.length) {
    lines.push("", "## AI Evals", "");
    for (const evalSpec of aiEvals) {
      lines.push(`- ${evalSpec.id}: ${evalSpec.type}, evaluator ${evalSpec.evaluator}, pass threshold ${evalSpec.pass_threshold}`);
      evalSpec.cases.forEach((testCase, index) => {
        lines.push(`  - Case ${index + 1}`);
        lines.push(`    - Input: ${testCase.input}`);
        lines.push(`    - Expected: ${testCase.expected}`);
      });
    }
  }

  lines.push("", "## Success Metrics", "");
  if (successMetrics.length) {
    for (const metric of successMetrics) {
      const status = metric.target_status === "provisional" ? "provisional" : "committed";
      lines.push(`- ${metric.id}: ${metric.metric} targets ${metric.target} over ${metric.window} (${status}).`);
    }
  } else {
    lines.push("- No Success Metrics found.");
  }

  if (relatedArtifacts.length) {
    lines.push("", "## Existing Evidence And Links", "");
    for (const artifact of relatedArtifacts) {
      const target = artifact.item_id ? ` for ${artifact.item_id}` : "";
      const label = artifact.title ?? artifact.url ?? artifact.product_spec_path ?? "Untitled artifact";
      lines.push(`- ${artifact.type}${target}: ${label}`);
    }
  }

  lines.push(
    "",
    "## Evidence To Return",
    "",
    "- Pull request URL.",
    "- Verification result for each acceptance criterion.",
    "- Eval run result for each AI eval.",
    "- Screenshots or demo link if UI changed.",
    "- Decision Trace if implementation changes product intent.",
    ""
  );

  return {
    spec_valid: true,
    markdown: lines.join("\n"),
    errors: [],
    warnings: result.warnings
  };
}

export function draftAgentRun(args: DraftAgentRunArgs): AgentRunDocument {
  const root = resolveRoot(args.root);
  if (!args.path) throw new Error("path is required");
  const absolutePath = resolveSpecPath(root, args.path);
  const path = relative(root, absolutePath);
  const markdown = readFileSync(absolutePath, "utf8");
  const result = validateProductSpecMarkdown(markdown);
  if (!result.valid) {
    throw new Error(`Invalid Product Spec: ${result.errors.map((error) => error.message).join("; ")}`);
  }

  const checked_items = result.document.sections.flatMap((section) => [
    ...(section.acceptance_criteria ?? []).map((criterion) => criterion.id),
    ...(section.ai_evals ?? []).map((evalSpec) => evalSpec.id),
    ...(section.success_metrics ?? []).map((metric) => metric.id)
  ]).map((item_id) => ({ item_id, status: "not_checked" as const }));

  const agent: AgentRunDocument["agent"] = { name: args.agent_name ?? "unknown" };
  if (args.agent_version) agent.version = args.agent_version;

  return {
    agent_run_format_version: "0.1",
    run_id: args.run_id ?? runIdForPath(path),
    agent,
    product_spec: {
      path,
      spec_revision: result.document.frontmatter.spec_revision ?? 1,
      content_hash: contentHash(markdown)
    },
    started_at: new Date().toISOString(),
    status: "draft",
    checked_items,
    drift: { detected: false }
  };
}

export function checkCompletionClaim(args: ProductSpecMcpArgs & { claim?: string }): CompletionClaimCheck {
  const result = validateProductSpec(args);
  const claim = args.claim ?? "";
  if (!result.valid) {
    return {
      spec_valid: false,
      claim,
      message: "The Product Spec is invalid. Fix validation errors before using it as the control file for implementation.",
      acceptance_criteria: [],
      ai_evals: [],
      success_metrics: [],
      errors: result.errors,
      warnings: result.warnings
    };
  }

  return {
    spec_valid: true,
    claim,
    message: "ProductSpec does not verify code execution. Before claiming done, verify every Acceptance Criterion and run or review every listed AI Eval.",
    acceptance_criteria: getAcceptanceCriteria(args).map((criterion) => ({
      ...criterion,
      status: "needs_verification"
    })),
    ai_evals: getAiEvals(args).map((evalSpec) => ({
      ...evalSpec,
      status: "not_run_by_productspec"
    })),
    success_metrics: getSuccessMetrics(args),
    errors: [],
    warnings: result.warnings
  };
}

function artifactsForItem(artifacts: ProductSpecRelatedArtifact[], itemId: string): ProductSpecRelatedArtifact[] {
  return artifacts.filter((artifact) => artifact.item_id === itemId);
}

function appendScope(lines: string[], label: string, items: string[]) {
  if (!items.length) {
    lines.push(`- ${label}: none specified.`);
    return;
  }
  for (const item of items) lines.push(`- ${label}: ${item}`);
}

function readValidProductSpec(args: ProductSpecMcpArgs): ProductSpecDocument {
  const result = validateProductSpec(args);
  if (!result.valid) {
    throw new Error(`Invalid Product Spec: ${result.errors.map((error) => error.message).join("; ")}`);
  }
  return result.document;
}

function readProductSpecMarkdown(args: ProductSpecMcpArgs): string {
  if (!args.path) throw new Error("path is required");
  const root = resolveRoot(args.root);
  const absolutePath = resolveSpecPath(root, args.path);
  return readFileSync(absolutePath, "utf8");
}

function resolveSessionCheckArgs(args: ProductSpecSessionCheckArgs) {
  if (args.session_id) {
    const record = specSessions.get(args.session_id);
    if (!record) throw new Error(`Unknown Product Spec session: ${args.session_id}`);
    return {
      session_id: args.session_id,
      root: record.root,
      path: record.path,
      started_revision: record.spec_revision,
      started_hash: record.content_hash,
      started_at: record.started_at
    };
  }

  if (!args.path) throw new Error("path is required when session_id is not provided");
  if (!args.started_hash) throw new Error("started_hash is required when session_id is not provided");
  return {
    root: resolveRoot(args.root),
    path: args.path,
    started_revision: args.started_revision,
    started_hash: args.started_hash
  };
}

function contentHash(markdown: string): string {
  return `sha256:${createHash("sha256").update(markdown).digest("hex")}`;
}

function runIdForPath(path: string): string {
  const name = path.split("/").pop() ?? "productspec";
  return name
    .replace(/\.product-spec\.md$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .concat("-run");
}

export function getSpecGraph(args: { root?: string } = {}): ProductSpecGraph {
  const root = resolveRoot(args.root);
  const inputs: ProductSpecGraphInput[] = [];
  const skipped: ProductSpecGraphWarning[] = [];
  for (const absolutePath of findProductSpecFiles(root)) {
    const path = relative(root, absolutePath);
    const result = validateProductSpecMarkdown(readFileSync(absolutePath, "utf8"));
    if (!result.valid || !result.document) {
      skipped.push({
        code: "skipped_invalid_spec",
        message: `${path} fails validation and is not in the graph.`,
        path
      });
      continue;
    }
    inputs.push({ path, document: result.document });
  }
  const graph = resolveProductSpecGraph(inputs);
  graph.warnings.push(...skipped);
  return graph;
}

function resolveRoot(root?: string): string {
  return resolve(root ?? DEFAULT_ROOT);
}

function resolveSpecPath(root: string, filePath: string): string {
  const absolutePath = isAbsolute(filePath) ? normalize(filePath) : resolve(root, filePath);
  const relativePath = relative(root, absolutePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Product Spec path must stay inside root: ${filePath}`);
  }
  if (!existsSync(absolutePath)) throw new Error(`Product Spec not found: ${filePath}`);

  const realRelativePath = relative(realpathSync(root), realpathSync(absolutePath));
  if (realRelativePath.startsWith("..") || isAbsolute(realRelativePath)) {
    throw new Error(`Product Spec path must stay inside root: ${filePath}`);
  }
  return absolutePath;
}

function findProductSpecFiles(root: string): string[] {
  const results: string[] = [];
  visit(root);
  return results.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));

  function visit(dir: string) {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      // A directory the process cannot read (permissions, races) is skipped, not fatal.
      return;
    }
    for (const entry of entries) {
      if (shouldSkip(entry.name) || entry.isSymbolicLink()) continue;
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".product-spec.md")) results.push(absolutePath);
    }
  }
}

function shouldSkip(entry: string): boolean {
  return entry === ".git" || entry === "node_modules" || entry === "dist" || entry === ".next";
}
