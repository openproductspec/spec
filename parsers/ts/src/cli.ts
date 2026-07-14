#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { draftAgentRun } from "./mcp-tools.js";
import { changelogSince, defaultSkillRoots, parseChangelog, upgradeSkills } from "./upgrade.js";
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
const dryRun = args.includes("--dry-run");

function packageVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
  return JSON.parse(readFileSync(packageJsonPath, "utf8")).version as string;
}

function packagedAssetPath(relative: string): string {
  return fileURLToPath(new URL(`../${relative}`, import.meta.url));
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

if (command === "version" || args.includes("--version")) {
  console.log(packageVersion());
  process.exit(0);
}

if (command === "whats-new") {
  const changelogPath = packagedAssetPath("CHANGELOG.md");
  if (!existsSync(changelogPath)) {
    console.error("error: CHANGELOG.md is not bundled in this build; run `npm run build` to package assets");
    process.exit(1);
  }

  const entries = parseChangelog(readFileOrExit(changelogPath));
  if (!entries.length) {
    console.error("error: no changelog entries found");
    process.exit(1);
  }

  const since = filePath;
  const selected = since ? changelogSince(entries, since) : [entries[0]];
  if (!selected.length) {
    console.log(`No changes since v${since}. Current version: v${entries[0].version}.`);
    process.exit(0);
  }

  for (const entry of selected) {
    console.log(`## v${entry.version}${entry.title ? ` - ${entry.title}` : ""}\n`);
    if (entry.body) console.log(`${entry.body}\n`);
  }
  process.exit(0);
}

if (command === "upgrade-skills") {
  const packagedSkillsDir = packagedAssetPath("skills");
  if (!existsSync(packagedSkillsDir)) {
    console.error("error: skills are not bundled in this build; run `npm run build` to package assets");
    process.exit(1);
  }

  const roots = filePath
    ? [{ path: filePath, installMissing: true }]
    : defaultSkillRoots(process.cwd(), homedir()).map((path) => ({ path, installMissing: false }));

  if (!roots.length) {
    console.error("error: no skill directories found (looked in ./skills, ./.claude/skills, ~/.claude/skills); pass a target directory to install into");
    process.exit(1);
  }

  try {
    const results = upgradeSkills({ packagedSkillsDir, version: packageVersion(), roots, dryRun });
    if (jsonOutput) {
      console.log(JSON.stringify({ version: packageVersion(), results }, null, 2));
    } else if (!results.length) {
      console.log("No installed ProductSpec skills found in the detected directories.");
    } else {
      for (const result of results) {
        const from = result.from ?? "unversioned";
        const suffix = result.dry_run ? " (dry run)" : "";
        console.log(`${result.path}: ${from} -> ${result.to} (${result.action})${suffix}`);
      }
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
  for (const warning of graph.warnings) {
    console.warn(`warning ${warning.code}: ${warning.message}`);
  }
  process.exit(0);
} else if (command !== "validate" || !filePath) {
  console.error("Usage: productspec validate path/to/file.product-spec.md\n       productspec validate-trace path/to/file.decision-trace.json\n       productspec validate-run path/to/file.agent-run.json\n       productspec graph path/to/spec-directory [--json]\n       productspec init path/to/file.product-spec.md\n       productspec init-run path/to/file.product-spec.md [path/to/file.agent-run.json]\n       productspec mcp\n       productspec mcp-config claude|cursor\n       productspec upgrade-skills [path/to/skills-dir] [--json] [--dry-run]\n       productspec whats-new [since-version]\n       productspec version");
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
