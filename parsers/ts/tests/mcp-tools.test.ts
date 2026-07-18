import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  beginSpecSession,
  checkSpecSession,
  draftAgentRun,
  getAcceptanceCriteria,
  getAiEvals,
  getEvidenceChecklist,
  getProductSpec,
  getProductSummary,
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

## Product Summary

A transcript search feature lets researchers search one transcript by phrase and open timestamped result snippets.

## Scope

\`\`\`productspec-scope
in:
  - Include transcript text search in this version.
  - Include timestamped result links in this version.
out:
  - Do not build semantic search in this version.
cut:
  - Cut saved searches from the first version if implementation time is tight.
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

    expect(getProductSummary({ root: dir, path: "search.product-spec.md" })).toContain(
      "A transcript search feature lets researchers search one transcript"
    );
    expect(getScope({ root: dir, path: "search.product-spec.md" })).toEqual({
      in: ["Include transcript text search in this version.", "Include timestamped result links in this version."],
      out: ["Do not build semantic search in this version."],
      cut: ["Cut saved searches from the first version if implementation time is tight."]
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

  it("returns an evidence checklist grouped by Product Spec item id", () => {
    const dir = writeFixture();
    const withEvidence = `${validSpec}

## Related Artifacts

\`\`\`productspec-related-artifacts
- type: github_pr
  url: "https://github.com/acme/transcripts/pull/77"
  title: "Implement transcript search"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "https://evals.example.com/transcript-search/run-12"
  title: "Transcript search eval run"
  section_id: acceptance_criteria
  item_id: EVAL-1
- type: dashboard
  url: "https://analytics.example.com/transcript-search"
  title: "Transcript search launch dashboard"
  section_id: success_metrics
  item_id: SM-1
\`\`\`
`;
    writeFileSync(join(dir, "search.product-spec.md"), withEvidence, "utf8");

    expect(getEvidenceChecklist({ root: dir, path: "search.product-spec.md" })).toMatchObject({
      spec_valid: true,
      message: "ProductSpec does not collect evidence. It lists the evidence that should attach to the spec before and after launch.",
      acceptance_criteria: [
        {
          id: "AC-1",
          evidence_needed: "Implementation evidence, such as a pull request, test, code link, or release note.",
          related_artifacts: [
            {
              type: "github_pr",
              url: "https://github.com/acme/transcripts/pull/77",
              title: "Implement transcript search"
            }
          ]
        },
        {
          id: "AC-2",
          related_artifacts: []
        }
      ],
      ai_evals: [
        {
          id: "EVAL-1",
          evidence_needed: "Eval evidence, such as an eval run, test report, or human review record.",
          related_artifacts: [
            {
              type: "eval_run",
              url: "https://evals.example.com/transcript-search/run-12",
              title: "Transcript search eval run"
            }
          ]
        }
      ],
      success_metrics: [
        {
          id: "SM-1",
          release_blocking: false,
          evidence_needed: "Post-launch outcome evidence, such as a dashboard, analytics snapshot, experiment, or metric review.",
          related_artifacts: [
            {
              type: "dashboard",
              url: "https://analytics.example.com/transcript-search",
              title: "Transcript search launch dashboard"
            }
          ]
        }
      ]
    });
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

  it("drafts an Agent Run receipt from a Product Spec", () => {
    const dir = writeFixture();

    expect(draftAgentRun({
      root: dir,
      path: "search.product-spec.md",
      agent_name: "Codex",
      agent_version: "cli"
    })).toMatchObject({
      agent_run_format_version: "0.1",
      run_id: "search-run",
      agent: {
        name: "Codex",
        version: "cli"
      },
      product_spec: {
        path: "search.product-spec.md",
        spec_revision: 1
      },
      status: "draft",
      checked_items: [
        { item_id: "AC-1", status: "not_checked" },
        { item_id: "AC-2", status: "not_checked" },
        { item_id: "EVAL-1", status: "not_checked" },
        { item_id: "SM-1", status: "not_checked" }
      ],
      drift: { detected: false }
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

  it("a hash-only session check (no started_revision) does not fabricate drift on an unchanged spec", () => {
    const dir = writeFixture();
    const session = beginSpecSession({ root: dir, path: "search.product-spec.md" });

    // Stateless path: only the content hash is pinned, no started_revision. This is the
    // CLI's `session check --against <hash>` case. It must not read as drift when nothing changed.
    const unchanged = checkSpecSession({ root: dir, path: "search.product-spec.md", started_hash: session.content_hash });
    expect(unchanged.changed).toBe(false);
    expect(unchanged.recommended_action).toBe("continue_against_pinned_revision");

    // A real edit is still caught, because the content hash covers the whole file.
    writeFileSync(join(dir, "search.product-spec.md"), `${validSpec}\n<!-- edit -->\n`, "utf8");
    const drifted = checkSpecSession({ root: dir, path: "search.product-spec.md", started_hash: session.content_hash });
    expect(drifted.changed).toBe(true);
  });

  it("refuses to read a spec whose symlink resolves outside root", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-confine-"));
    const root = join(base, "root");
    const outside = join(base, "outside");
    mkdirSync(root);
    mkdirSync(outside);
    writeFileSync(join(outside, "leak.product-spec.md"), validSpec, "utf8");
    symlinkSync(join(outside, "leak.product-spec.md"), join(root, "escape.product-spec.md"));

    expect(() => getProductSpec({ root, path: "escape.product-spec.md" })).toThrow(
      /must stay inside root/
    );
  });

  it("does not discover specs through a symlinked directory outside root", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-confine-"));
    const root = join(base, "root");
    const outside = join(base, "outside");
    mkdirSync(root);
    mkdirSync(outside);
    writeFileSync(join(root, "own.product-spec.md"), validSpec, "utf8");
    writeFileSync(join(outside, "leak.product-spec.md"), validSpec, "utf8");
    symlinkSync(outside, join(root, "outside-link"));

    expect(listProductSpecs({ root }).map((item) => item.path)).toEqual(["own.product-spec.md"]);
  });
});
