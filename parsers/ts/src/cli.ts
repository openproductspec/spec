#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { draftAgentRun, generateAgentHandoff } from "./mcp-tools.js";
import { gardenText, reconciliationText, scanProductSpecRepo, serveProductSpecRepo, reconcileProductSpec } from "./repo-scan.js";
import {
  resolveProductSpecGraph,
  validateAgentRunJson,
  validateDecisionTraceJson,
  validateProductSpecMarkdown,
  type ProductSpecGraphInput,
  type ProductSpecGraphWarning
} from "./index.js";
import { runProductSpecMcpServer } from "./mcp.js";

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const [command, filePath, outputPath] = positional;
const jsonOutput = args.includes("--json");

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


if (command === "garden" && filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isDirectory()) {
    console.error(`${filePath}: not a directory`);
    process.exit(1);
  }

  const report = scanProductSpecRepo(filePath);
  if (jsonOutput) console.log(JSON.stringify(report, null, 2));
  else process.stdout.write(gardenText(report));
  process.exit(0);
}

if (command === "reconcile" && filePath) {
  const againstIndex = args.indexOf("--against");
  const againstPath = againstIndex === -1 ? undefined : args[againstIndex + 1];
  const report = reconcileProductSpec(process.cwd(), filePath, againstPath);
  if (jsonOutput) console.log(JSON.stringify(report, null, 2));
  else process.stdout.write(reconciliationText(report));
  process.exit(report.errors.length ? 1 : 0);
}

if (command === "serve" && filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isDirectory()) {
    console.error(`${filePath}: not a directory`);
    process.exit(1);
  }
  const portIndex = args.indexOf("--port");
  const portValue = portIndex === -1 ? "4317" : args[portIndex + 1];
  const port = Number(portValue);
  if (!Number.isInteger(port) || port <= 0) {
    console.error("error: --port must be a positive integer");
    process.exit(1);
  }
  const report = scanProductSpecRepo(filePath);
  serveProductSpecRepo(report, port);
  console.log(`ProductSpec repo dashboard listening on http://localhost:${port}`);
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

  const specFiles = collectSpecFiles(filePath);
  if (!specFiles.length) {
    console.error(`${filePath}: no .product-spec.md files found`);
    process.exit(1);
  }

  const inputs: ProductSpecGraphInput[] = [];
  const skipped: ProductSpecGraphWarning[] = [];
  for (const specFile of specFiles) {
    const result = validateProductSpecMarkdown(readFileOrExit(specFile));
    if (!result.valid || !result.document) {
      skipped.push({
        code: "skipped_invalid_spec",
        message: `${specFile} fails validation and is not in the graph.`,
        path: specFile
      });
      continue;
    }
    inputs.push({ path: specFile, document: result.document });
  }

  if (!inputs.length) {
    for (const warning of skipped) console.warn(`warning ${warning.code}: ${warning.message}`);
    console.error(`${filePath}: no valid .product-spec.md files`);
    process.exit(1);
  }

  const graph = resolveProductSpecGraph(inputs);
  graph.warnings.push(...skipped);

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
  console.error("Usage: productspec validate path/to/file.product-spec.md\n       productspec validate-trace path/to/file.decision-trace.json\n       productspec validate-run path/to/file.agent-run.json\n       productspec graph path/to/spec-directory [--json]\n       productspec garden path/to/repo [--json]\n       productspec reconcile path/to/file.product-spec.md [--against path/to/file.agent-run.json] [--json]\n       productspec serve path/to/repo [--port 4317]\n       productspec init path/to/file.product-spec.md\n       productspec init-run path/to/file.product-spec.md [path/to/file.agent-run.json]\n       productspec handoff path/to/file.product-spec.md [path/to/file.agent-handoff.md]\n       productspec mcp\n       productspec mcp-config claude|cursor");
  process.exit(1);
} else {
  const result = validateProductSpecMarkdown(readFileOrExit(filePath));

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
