import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  beginSpecSession,
  checkSpecSession,
  getAcceptanceCriteria,
  getAiEvals,
  getScope,
  getSpecGraph,
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

  it("resolves the spec graph across a root", () => {
    const dir = writeFixture();
    const dependentSpec = validSpec
      .replace('title: "Transcript Search"', 'title: "Passage Sharing"')
      .concat(`
## Related Artifacts

\`\`\`productspec-related-artifacts
- type: product_spec
  product_spec_path: "./search.product-spec.md"
  relation: depends_on
  title: "Transcript Search"
\`\`\`
`);
    writeFileSync(join(dir, "sharing.product-spec.md"), dependentSpec, "utf8");

    const graph = getSpecGraph({ root: dir });

    expect(graph.buildable).toEqual(["search.product-spec.md"]);
    expect(graph.blocked).toEqual([
      { path: "sharing.product-spec.md", waits_on: ["search.product-spec.md"] }
    ]);
    expect(graph.order).toEqual(["search.product-spec.md", "sharing.product-spec.md"]);
    expect(graph.warnings).toEqual([]);
  });

  it("detects when a Product Spec changes during an MCP session", () => {
    const dir = writeFixture();

    const session = beginSpecSession({ root: dir, path: "search.product-spec.md" });

    expect(session).toMatchObject({
      path: "search.product-spec.md",
      spec_revision: 1
    });
    expect(session.session_id).toMatch(/^productspec-session-/);
    expect(session.content_hash).toMatch(/^sha256:/);
    expect(checkSpecSession({ session_id: session.session_id })).toMatchObject({
      session_id: session.session_id,
      path: "search.product-spec.md",
      changed: false,
      started_revision: 1,
      current_revision: 1,
      current_valid: true,
      recommended_action: "continue_against_pinned_revision"
    });

    writeFileSync(
      join(dir, "search.product-spec.md"),
      validSpec.replace("spec_revision: 1", "spec_revision: 2"),
      "utf8"
    );

    expect(checkSpecSession({ session_id: session.session_id })).toMatchObject({
      session_id: session.session_id,
      path: "search.product-spec.md",
      changed: true,
      started_revision: 1,
      current_revision: 2,
      current_valid: true,
      recommended_action: "replan_before_continuing"
    });
  });
});
