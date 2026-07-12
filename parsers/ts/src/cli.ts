#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { validateDecisionTraceJson, validateProductSpecMarkdown } from "./index.js";
import { runProductSpecMcpServer } from "./mcp.js";

const [command, filePath] = process.argv.slice(2);

const starterProductSpec = `---
spec_format_version: "0.1"
title: "Untitled Product Spec"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
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

if (command === "init" && filePath) {
  if (existsSync(filePath)) {
    console.error(`${filePath} already exists`);
    process.exit(1);
  }

  writeFileSync(filePath, starterProductSpec, "utf8");
  console.log(`${filePath}: created`);
  process.exit(0);
}

if (command === "mcp") {
  runProductSpecMcpServer();
  process.stdin.resume();
} else if (command === "validate-trace" && filePath) {
  const result = validateDecisionTraceJson(readFileSync(filePath, "utf8"));
  if (result.valid) {
    console.log(`${filePath}: valid`);
    process.exit(0);
  }

  for (const error of result.errors) {
    console.error(`${error.code}: ${error.message}`);
  }
  process.exit(1);
} else if (command !== "validate" || !filePath) {
  console.error("Usage: productspec validate path/to/file.product-spec.md\n       productspec validate-trace path/to/file.decision-trace.json\n       productspec init path/to/file.product-spec.md\n       productspec mcp");
  process.exit(1);
} else {
  const result = validateProductSpecMarkdown(readFileSync(filePath, "utf8"));

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
