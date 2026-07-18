#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import {
  beginSpecSession,
  checkCompletionClaim,
  checkSpecSession,
  draftAgentRun,
  generateAgentHandoff,
  getAcceptanceCriteria,
  getAiEvals,
  getEvidenceChecklist,
  getProductSpec,
  getProductSummary,
  getRelatedArtifacts,
  getScope,
  getSpecGraph,
  getSuccessMetrics,
  listProductSpecs
} from "./mcp-tools.js";
import {
  validateAgentRunJson,
  validateDecisionTraceJson,
  validateProductSpecMarkdown
} from "./index.js";
import { runProductSpecMcpServer } from "./mcp.js";

const argv = process.argv.slice(2);

const VALUE_FLAGS = new Set(["--claim", "--against", "--revision"]);
const BOOL_FLAGS = new Set(["--json", "--help", "-h"]);

/**
 * Parse argv into positionals, valued flags, and boolean flags.
 *
 * Value flags accept both `--flag value` and `--flag=value`, and their values
 * are consumed out of the positional stream so a flag value can never shift a
 * command's file argument (e.g. `check-claim --claim x spec.md` keeps `spec.md`
 * as the file, not `x`). `--` ends option parsing. Unknown options are rejected.
 * A value flag whose next token is itself an option (starts with `-`) is treated
 * as having no value; pass such a value with the `--flag=value` form.
 */
function parseArgs(tokens: string[]): {
  positionals: string[];
  values: Record<string, string>;
  bools: Set<string>;
  unknown: string[];
} {
  const positionals: string[] = [];
  const values: Record<string, string> = {};
  const bools = new Set<string>();
  const unknown: string[] = [];
  let optionsEnded = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (optionsEnded) {
      positionals.push(token);
      continue;
    }
    if (token === "--") {
      optionsEnded = true;
      continue;
    }
    if (token.startsWith("--") && token.includes("=")) {
      const name = token.slice(0, token.indexOf("="));
      if (VALUE_FLAGS.has(name)) values[name] = token.slice(token.indexOf("=") + 1);
      else if (BOOL_FLAGS.has(name)) bools.add(name);
      else unknown.push(name);
      continue;
    }
    if (VALUE_FLAGS.has(token)) {
      const next = tokens[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        values[token] = next;
        i += 1;
      }
      continue;
    }
    if (BOOL_FLAGS.has(token)) {
      bools.add(token);
      continue;
    }
    if (token.startsWith("-") && token !== "-") {
      unknown.push(token);
      continue;
    }
    positionals.push(token);
  }
  return { positionals, values, bools, unknown };
}

const parsed = parseArgs(argv);
if (parsed.unknown.length) {
  console.error(`error: unknown option ${parsed.unknown[0]}`);
  process.exit(1);
}

const positional = parsed.positionals;
const [command, filePath, outputPath] = positional;
const jsonOutput = parsed.bools.has("--json");

function flagValue(name: string): string | undefined {
  return parsed.values[name];
}

const HELP = `ProductSpec CLI, read and drive a Product Spec library from the shell.

Every read command supports --json. The CLI and the MCP server call the same functions,
so the CLI is the lower-overhead surface for the same operations.

Read a spec
  productspec validate <file> [--json]        Validate one Product Spec.
  productspec show <file> [--json]            Show a parsed Product Spec (summary, or full document with --json).
  productspec get <file> <section> [--json]   Read one section:
                                                summary | scope | acceptance | evals | metrics | related | evidence
  productspec list <dir> [--json]             List every .product-spec.md under a directory, with validity.

Plan a spec library
  productspec graph <dir> [--json]            Resolve links into buildable, blocked, order, waves, and contention.

Build contract
  productspec handoff <file> [out.md]         Generate the Agent Handoff build contract (stdout, or write to out.md).
  productspec check-claim <file> [--claim "<text>"] [--json]
                                              List the Acceptance Criteria and AI Evals to verify before claiming done.

Detect drift (stateless, pass the pin explicitly)
  productspec session begin <file> [--json]   Pin the spec's revision and content hash. Prints the pin.
  productspec session check <file> --against <content_hash> [--revision <n>] [--json]
                                              Report whether the spec changed since the pinned hash and revision.

Scaffold and receipts
  productspec init <file>                      Scaffold a new Product Spec.
  productspec init-run <file> [out.json]       Draft an Agent Run receipt with every AC, EVAL, and SM unchecked.
  productspec validate-run <file.agent-run.json>         Validate an Agent Run receipt.
  productspec validate-trace <file.decision-trace.json>  Validate a Decision Trace.

MCP
  productspec mcp                              Run the MCP server over stdio.
  productspec mcp-config claude|cursor         Print MCP client config.

Flags
  --json               Machine-readable JSON (validate, show, get, list, graph, check-claim, session *).
  --claim "<text>"     The completion claim for check-claim.
  --against <hash>     The pinned content hash for session check (from session begin).
  --revision <n>       The pinned spec revision for session check, a non-negative integer. Optional.
  --help, -h           Show this help.

Value flags also accept --flag=value, and their values never shift the positional
arguments. Unknown options are rejected. Use -- to end option parsing.

Examples
  productspec list specs --json
  productspec get specs/checkout.product-spec.md acceptance --json
  productspec check-claim specs/checkout.product-spec.md --claim "shipped 3DS recovery"
  productspec session begin specs/checkout.product-spec.md
  productspec session check specs/checkout.product-spec.md --against sha256:abc --revision 2`;

if (!command || command === "help" || parsed.bools.has("--help") || parsed.bools.has("-h")) {
  console.log(HELP);
  process.exit(0);
}

function mcpClientConfig() {
  return {
    mcpServers: {
      productspec: {
        command: "npx",
        args: ["--yes", "--package", "@productspec/parser@latest", "productspec", "mcp"]
      }
    }
  };
}

function collectSpecFiles(dir: string): string[] {
  const found: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = `${dir.replace(/\/$/, "")}/${entry.name}`;
    if (entry.isDirectory()) found.push(...collectSpecFiles(entryPath));
    else if (entry.name.endsWith(".product-spec.md")) found.push(entryPath);
  }
  return found;
}

function starterProductSpec(timestamp: string): string {
  return `---
spec_format_version: "0.1"
title: "Untitled Product Spec"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "${timestamp}"
updated_at: "${timestamp}"
---

## Problem

Who is hurting, what pain do they feel, and why does it matter?

## Hypothesis

If we ship this product change, what behavior will change, and why?

## Product Summary

A starter Product Spec captures the product summary, scope, acceptance criteria, and success metrics for the work.

## Scope

In: what the first version includes.

Out: what this version will not do.

Cut from this version: what is tempting but deliberately deferred.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Given the intended user or system state, when the core action happens, then the expected result occurs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: meaningful_outcome
  target: ">= target threshold"
  window: measurement window
\`\`\`
`;
}

function readFileOrExit(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`error: cannot read ${path}: ${reason}`);
    process.exit(1);
  }
}

if (command === "init" && filePath) {
  if (existsSync(filePath)) {
    console.error(`${filePath} already exists`);
    process.exit(1);
  }

  writeFileSync(filePath, starterProductSpec(new Date().toISOString()), "utf8");
  console.log(`${filePath}: created`);
  process.exit(0);
}

if (command === "init-run" && filePath) {
  const targetPath = outputPath ?? defaultAgentRunPath(filePath);
  if (existsSync(targetPath)) {
    console.error(`${targetPath} already exists`);
    process.exit(1);
  }

  try {
    const run = draftAgentRun({ root: process.cwd(), path: filePath });
    writeFileSync(targetPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
    console.log(`${targetPath}: created`);
    process.exit(0);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (command === "handoff" && filePath) {
  try {
    const handoff = generateAgentHandoff({ root: process.cwd(), path: filePath });
    if (!handoff.spec_valid) {
      for (const error of handoff.errors) {
        console.error(`${error.code}: ${error.message}`);
      }
      process.exit(1);
    }
    if (outputPath) {
      if (existsSync(outputPath)) {
        console.error(`${outputPath} already exists`);
        process.exit(1);
      }
      writeFileSync(outputPath, handoff.markdown, "utf8");
      console.log(`${outputPath}: created`);
    } else {
      process.stdout.write(handoff.markdown);
    }
    process.exit(0);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (command === "list") {
  const root = filePath ?? process.cwd();
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`${root}: not a directory`);
    process.exit(1);
  }

  const specs = listProductSpecs({ root });
  if (jsonOutput) {
    console.log(JSON.stringify(specs, null, 2));
    process.exit(0);
  }

  if (!specs.length) {
    console.log("no .product-spec.md files found");
    process.exit(0);
  }
  for (const spec of specs) {
    if (spec.valid) {
      const revision = spec.spec_revision !== undefined ? ` (rev ${spec.spec_revision})` : "";
      console.log(`  valid    ${spec.path}${revision}  ${spec.title ?? ""}`.trimEnd());
    } else {
      console.log(`  invalid  ${spec.path}`);
    }
  }
  process.exit(0);
}

if (command === "show") {
  if (!filePath) {
    console.error("error: path is required");
    process.exit(1);
  }
  try {
    const document = getProductSpec({ root: process.cwd(), path: filePath });
    if (jsonOutput) {
      console.log(JSON.stringify(document, null, 2));
      process.exit(0);
    }
    console.log(`title: ${document.frontmatter.title}`);
    console.log(`spec_revision: ${document.frontmatter.spec_revision}`);
    console.log(`sections: ${document.sections.map((section) => section.id).join(", ")}`);
    console.log("(use --json for the full parsed document)");
    process.exit(0);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (command === "get") {
  const section = positional[2];
  if (!filePath) {
    console.error("error: path is required");
    process.exit(1);
  }
  const specArgs = { root: process.cwd(), path: filePath };
  try {
    switch (section) {
      case "summary": {
        const summary = getProductSummary(specArgs);
        if (jsonOutput) console.log(JSON.stringify(summary));
        else console.log(summary || "(no product summary)");
        break;
      }
      case "scope": {
        const scope = getScope(specArgs);
        if (jsonOutput) {
          console.log(JSON.stringify(scope, null, 2));
          break;
        }
        if (!scope) {
          console.log("(no structured scope: in/out/cut not found)");
          break;
        }
        for (const label of ["in", "out", "cut"] as const) {
          const items = scope[label];
          if (!items.length) {
            console.log(`${label}: none`);
            continue;
          }
          console.log(`${label}:`);
          for (const item of items) console.log(`  - ${item}`);
        }
        break;
      }
      case "acceptance": {
        const items = getAcceptanceCriteria(specArgs);
        if (jsonOutput) console.log(JSON.stringify(items, null, 2));
        else if (!items.length) console.log("(no acceptance criteria)");
        else for (const criterion of items) console.log(`  ${criterion.id}: ${criterion.criterion}`);
        break;
      }
      case "evals": {
        const items = getAiEvals(specArgs);
        if (jsonOutput) console.log(JSON.stringify(items, null, 2));
        else if (!items.length) console.log("(no AI evals)");
        else for (const item of items) console.log(`  ${item.id}: ${item.type} via ${item.evaluator}, pass >= ${item.pass_threshold}`);
        break;
      }
      case "metrics": {
        const items = getSuccessMetrics(specArgs);
        if (jsonOutput) console.log(JSON.stringify(items, null, 2));
        else if (!items.length) console.log("(no success metrics)");
        else for (const item of items) console.log(`  ${item.id}: ${item.metric} ${item.target} (${item.target_status}, ${item.window})`);
        break;
      }
      case "related": {
        const items = getRelatedArtifacts(specArgs);
        if (jsonOutput) console.log(JSON.stringify(items, null, 2));
        else if (!items.length) console.log("(no related artifacts)");
        else
          for (const item of items) {
            const label = item.item_id ? ` [${item.item_id}]` : "";
            console.log(`  ${item.type}${label}: ${item.title ?? item.url ?? item.product_spec_path ?? ""}`.trimEnd());
          }
        break;
      }
      case "evidence": {
        const checklist = getEvidenceChecklist(specArgs);
        if (jsonOutput) {
          console.log(JSON.stringify(checklist, null, 2));
          break;
        }
        console.log(checklist.message);
        for (const [label, list] of [
          ["acceptance_criteria", checklist.acceptance_criteria],
          ["ai_evals", checklist.ai_evals],
          ["success_metrics", checklist.success_metrics]
        ] as const) {
          if (!list.length) continue;
          console.log(`${label}:`);
          for (const item of list) {
            const blocking = item.release_blocking ? " (release-blocking)" : "";
            console.log(`  ${item.id}${blocking}: ${item.evidence_needed}`);
          }
        }
        break;
      }
      default:
        console.error(
          `error: unknown section "${section ?? ""}". Valid sections: summary, scope, acceptance, evals, metrics, related, evidence.`
        );
        process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (command === "check-claim") {
  if (!filePath) {
    console.error("error: path is required");
    process.exit(1);
  }
  try {
    const check = checkCompletionClaim({ root: process.cwd(), path: filePath, claim: flagValue("--claim") });
    if (jsonOutput) {
      console.log(JSON.stringify(check, null, 2));
      process.exit(check.spec_valid ? 0 : 1);
    }
    console.log(check.message);
    if (!check.spec_valid) {
      for (const error of check.errors) console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    if (check.acceptance_criteria.length) {
      console.log("acceptance criteria to verify:");
      for (const criterion of check.acceptance_criteria) console.log(`  ${criterion.id}: ${criterion.criterion}`);
    }
    if (check.ai_evals.length) {
      console.log("AI evals to run or review:");
      for (const item of check.ai_evals) console.log(`  ${item.id}: ${item.type} via ${item.evaluator}`);
    }
    if (check.success_metrics.length) {
      console.log("success metrics (measured after launch):");
      for (const metric of check.success_metrics) console.log(`  ${metric.id}: ${metric.metric} ${metric.target}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (command === "session") {
  const subcommand = positional[1];
  const specFile = positional[2];
  if (subcommand === "begin") {
    if (!specFile) {
      console.error("error: path is required");
      process.exit(1);
    }
    try {
      const session = beginSpecSession({ root: process.cwd(), path: specFile });
      if (jsonOutput) {
        console.log(JSON.stringify(session, null, 2));
        process.exit(0);
      }
      console.log(`path: ${session.path}`);
      console.log(`spec_revision: ${session.spec_revision}`);
      console.log(`content_hash: ${session.content_hash}`);
      console.log("");
      console.log("Pin captured. To check for drift later, run:");
      console.log(`  productspec session check ${specFile} --against ${session.content_hash} --revision ${session.spec_revision}`);
      process.exit(0);
    } catch (error) {
      console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
  if (subcommand === "check") {
    if (!specFile) {
      console.error("error: path is required");
      process.exit(1);
    }
    const against = flagValue("--against");
    if (!against) {
      console.error("error: --against <content_hash> is required (from `productspec session begin`)");
      process.exit(1);
    }
    const revisionRaw = flagValue("--revision");
    let started_revision: number | undefined;
    if (revisionRaw !== undefined) {
      if (!/^\d+$/.test(revisionRaw.trim())) {
        console.error("error: --revision must be a non-negative integer");
        process.exit(1);
      }
      started_revision = Number(revisionRaw.trim());
    }
    try {
      const check = checkSpecSession({
        root: process.cwd(),
        path: specFile,
        started_hash: against,
        started_revision
      });
      if (jsonOutput) {
        console.log(JSON.stringify(check, null, 2));
        process.exit(check.current_valid ? 0 : 1);
      }
      console.log(`path: ${check.path}`);
      console.log(`changed: ${check.changed}`);
      console.log(`recommended_action: ${check.recommended_action}`);
      if (check.current_hash) console.log(`current_hash: ${check.current_hash}`);
      if (check.current_revision !== undefined) console.log(`current_revision: ${check.current_revision}`);
      process.exit(check.current_valid ? 0 : 1);
    } catch (error) {
      console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
  console.error("error: session subcommand must be begin or check");
  process.exit(1);
}

if (command === "mcp") {
  runProductSpecMcpServer();
  process.stdin.resume();
} else if (command === "mcp-config") {
  if (filePath !== "claude" && filePath !== "cursor") {
    console.error("error: supported targets are claude and cursor");
    process.exit(1);
  }

  console.log(JSON.stringify(mcpClientConfig(), null, 2));
  process.exit(0);
} else if (command === "validate-trace" && filePath) {
  const result = validateDecisionTraceJson(readFileOrExit(filePath));
  if (result.valid) {
    console.log(`${filePath}: valid`);
    process.exit(0);
  }

  for (const error of result.errors) {
    console.error(`${error.code}: ${error.message}`);
  }
  process.exit(1);
} else if (command === "validate-run" && filePath) {
  const result = validateAgentRunJson(readFileOrExit(filePath));
  if (result.valid) {
    console.log(`${filePath}: valid`);
    process.exit(0);
  }

  for (const error of result.errors) {
    console.error(`${error.code}: ${error.message}`);
  }
  process.exit(1);
} else if (command === "graph" && filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isDirectory()) {
    console.error(`${filePath}: not a directory`);
    process.exit(1);
  }

  if (!collectSpecFiles(filePath).length) {
    console.error(`${filePath}: no .product-spec.md files found`);
    process.exit(1);
  }

  // Route through the same function the MCP get_spec_graph tool wraps, so the
  // CLI and the MCP cannot drift. The parity test in tests/cli.test.ts pins this.
  const graph = getSpecGraph({ root: filePath });

  if (!graph.buildable.length && !graph.blocked.length && !graph.unscoped.length) {
    for (const warning of graph.warnings) console.warn(`warning ${warning.code}: ${warning.message}`);
    console.error(`${filePath}: no valid .product-spec.md files`);
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(graph, null, 2));
    process.exit(0);
  }

  if (graph.buildable.length) {
    console.log("buildable:");
    for (const path of graph.buildable) console.log(`  ${path}`);
  }
  if (graph.blocked.length) {
    console.log("blocked:");
    for (const node of graph.blocked) {
      console.log(`  ${node.path} (waits on: ${node.waits_on.join(", ")})`);
    }
  }
  if (graph.order.length > 1) {
    console.log(`order: ${graph.order.join(" -> ")}`);
  }
  if (graph.waves.length > 1) {
    console.log("waves (safe to run at the same time):");
    graph.waves.forEach((wave, index) => {
      console.log(`  ${index + 1}. ${wave.join(", ")}`);
    });
  }
  if (graph.contention.length) {
    console.log("contention (never hand these to two agents at once):");
    for (const surface of graph.contention) {
      console.log(`  ${surface.kind} "${surface.value}": ${surface.specs.join(", ")}`);
    }
  }
  if (graph.unscoped.length) {
    console.log(`unscoped (no applies_to, surface unknown): ${graph.unscoped.join(", ")}`);
  }
  for (const warning of graph.warnings) {
    console.warn(`warning ${warning.code}: ${warning.message}`);
  }
  process.exit(0);
} else if (command !== "validate" || !filePath) {
  console.error(HELP);
  process.exit(1);
} else {
  const result = validateProductSpecMarkdown(readFileOrExit(filePath));

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  for (const warning of result.warnings) {
    console.warn(`warning ${warning.code}: ${warning.message}`);
  }

  if (result.valid) {
    console.log(`${filePath}: valid`);
    process.exit(0);
  }

  for (const error of result.errors) {
    console.error(`${error.code}: ${error.message}`);
  }
  process.exit(1);
}

function defaultAgentRunPath(path: string): string {
  return path.endsWith(".product-spec.md")
    ? path.replace(/\.product-spec\.md$/, ".agent-run.json")
    : `${path}.agent-run.json`;
}
