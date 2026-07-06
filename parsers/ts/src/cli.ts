#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { validateProductSpecMarkdown } from "./index.js";

const [command, filePath] = process.argv.slice(2);

const starterProductSpec = `---
spec_format_version: "0.1"
title: "Untitled Product Spec"
artifact_type: "prd"
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

- Given the intended user or system state, when the core action happens, then the expected result occurs.

## Success Metrics

- What real-world user or business outcome would make this worth continuing?
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

if (command !== "validate" || !filePath) {
  console.error("Usage: productspec validate path/to/file.product-spec.md\n       productspec init path/to/file.product-spec.md");
  process.exit(1);
}

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
