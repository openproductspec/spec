import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAcceptanceCriteria,
  getAiEvals,
  getScope,
  listProductSpecs,
  checkCompletionClaim
} from "../src/mcp-tools";

const validSpec = `---
spec_format_version: "0.1"
title: "Transcript Search"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped matches with context, researchers will cite video passages faster.

## Scope

\`\`\`productspec-scope
in:
  - transcript text search
  - timestamped result links
out:
  - semantic search
cut:
  - saved searches
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Search returns timestamped transcript matches.
- id: AC-2
  criterion: Each result includes surrounding context.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: contains
  cases:
    - input: "Find product judgment quote"
      expected: "product judgment"
  evaluator: deterministic
  pass_threshold: 1
  checks:
    - result contains the requested phrase
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: median_time_to_find_quote
  target: "< 2 minutes"
  target_status: committed
  window: first search session
\`\`\`
`;

function writeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "productspec-mcp-"));
  writeFileSync(join(dir, "search.product-spec.md"), validSpec, "utf8");
  writeFileSync(join(dir, "notes.md"), "# Not a ProductSpec", "utf8");
  return dir;
}

describe("ProductSpec MCP tools", () => {
  it("lists ProductSpec files with title and validity", () => {
    const dir = writeFixture();

    expect(listProductSpecs({ root: dir })).toEqual([
      {
        path: "search.product-spec.md",
        title: "Transcript Search",
        spec_revision: 1,
        valid: true,
        errors: [],
        warnings: []
      }
    ]);
  });

  it("returns structured execution fields", () => {
    const dir = writeFixture();

    expect(getScope({ root: dir, path: "search.product-spec.md" })).toEqual({
      in: ["transcript text search", "timestamped result links"],
      out: ["semantic search"],
      cut: ["saved searches"]
    });
    expect(getAcceptanceCriteria({ root: dir, path: "search.product-spec.md" })).toHaveLength(2);
    expect(getAiEvals({ root: dir, path: "search.product-spec.md" })).toEqual([
      {
        id: "EVAL-1",
        type: "contains",
        cases: [{ input: "Find product judgment quote", expected: "product judgment" }],
        evaluator: "deterministic",
        pass_threshold: 1,
        checks: ["result contains the requested phrase"]
      }
    ]);
  });

  it("turns a completion claim into a verification checklist", () => {
    const dir = writeFixture();

    expect(checkCompletionClaim({
      root: dir,
      path: "search.product-spec.md",
      claim: "Implemented transcript search with timestamped results."
    })).toMatchObject({
      spec_valid: true,
      claim: "Implemented transcript search with timestamped results.",
      acceptance_criteria: [
        { id: "AC-1", status: "needs_verification" },
        { id: "AC-2", status: "needs_verification" }
      ],
      ai_evals: [{ id: "EVAL-1", status: "not_run_by_productspec" }]
    });
  });
});
