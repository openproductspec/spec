#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import {
  resolveProductSpecGraph,
  validateDecisionTraceJson,
  validateProductSpecMarkdown,
  type ProductSpecGraphInput,
  type ProductSpecGraphWarning
} from "./index.js";
import { runProductSpecMcpServer } from "./mcp.js";

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const [command, filePath] = positional;
const jsonOutput = args.includes("--json");

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

if (command === "mcp") {
  runProductSpecMcpServer();
  process.stdin.resume();
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
    const result = validateProductSpecMarkdown(readFileSync(specFile, "utf8"));
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
  for (const warning of graph.warnings) {
    console.warn(`warning ${warning.code}: ${warning.message}`);
  }
  process.exit(0);
} else if (command !== "validate" || !filePath) {
  console.error("Usage: productspec validate path/to/file.product-spec.md\n       productspec validate-trace path/to/file.decision-trace.json\n       productspec graph path/to/spec-directory [--json]\n       productspec init path/to/file.product-spec.md\n       productspec mcp");
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
