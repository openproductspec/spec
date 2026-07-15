import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CANONICAL_SECTION_IDS,
  MANDATORY_SECTION_IDS,
  parseProductSpecMarkdown,
  resolveProductSpecGraph,
  serializeProductSpecMarkdown,
  validateDecisionTraceJson,
  validateAgentRunJson,
  validateProductSpecMarkdown,
  type ProductSpecGraphInput
} from "../src/index";
import { handleRequest } from "../src/mcp";
import { generateAgentHandoff } from "../src/mcp-tools";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const packageRoot = fileURLToPath(new URL("..", import.meta.url));

// The CLI tests run the built dist, and `npm test` is only `vitest run`, so
// nothing builds it first. One build for the whole file, above the describes, so
// no test depends on another describe having run first, a filtered run still
// builds what it needs, and no test timeout has to cover a compile.
beforeAll(() => {
  const built = spawnSync("npm", ["run", "build"], { cwd: packageRoot, encoding: "utf8" });
  expect(built.status, built.stderr).toBe(0);
}, 120000);

describe("@productspec/parser", () => {
  it("round-trips the minimal example", () => {
    const markdown = readFileSync(
      fileURLToPath(new URL("../../../examples/minimal.product-spec.md", import.meta.url)),
      "utf8"
    );
    const parsed = parseProductSpecMarkdown(markdown);

    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
  });

  it("does not require user experience", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "API Import"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot import customer records reliably.

## Hypothesis

If imports expose a clear upload path, teams will trust automated onboarding.

## Product Summary

A CSV import tool lets an operator upload a customer file, review row-level errors, and create an import job.

## Scope

In: CSV upload and row-level error responses.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Valid CSV files create import jobs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: import_completion_without_support_contact
  target: ">= 80%"
  window: per import
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);

    expect(parsed.sections.map((section) => section.id)).toEqual([
      "problem",
      "hypothesis",
      "product_summary",
      "scope",
      "acceptance_criteria",
      "success_metrics"
    ]);
  });

  it("requires Product Summary between Hypothesis and Scope", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Missing Product Summary"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot import customer records reliably.

## Hypothesis

If imports expose a clear upload path, teams will trust automated onboarding.

## Scope

In: CSV upload and row-level error responses.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Valid CSV files create import jobs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: import_completion_without_support_contact
  target: ">= 80%"
  window: per import
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual({
        code: "missing_required_section",
        message: "Missing mandatory section: product_summary",
        path: "sections.product_summary"
      });
    }
  });

  it("round-trips optional spec revision frontmatter", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Versioned Spec"
artifact_type: "prd"
spec_revision: 2
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
---

## Problem

Teams cannot tell which intent revision an engineering plan came from.

## Hypothesis

If specs carry a simple revision number, downstream plans can reference the exact intent they implement.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: optional positive integer revision in frontmatter.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Parser exposes spec revision as a number.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: handoffs_with_named_spec_revision
  target: ">= 90%"
  window: per engineering handoff
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const serialized = serializeProductSpecMarkdown(parsed);

    expect(parsed.frontmatter.spec_revision).toBe(2);
    expect(serialized).toContain("spec_revision: 2");
    expect(parseProductSpecMarkdown(serialized).frontmatter.spec_revision).toBe(2);
  });

  it("rejects invalid Product Spec date-time frontmatter", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Bad Dates"
artifact_type: "prd"
author: "ProductSpec"
created_at: "NOT-A-DATE"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot trust invalid timestamps.

## Hypothesis

If timestamps are valid date-times, tools can compare specs reliably.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: date-time validation.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Invalid date-time frontmatter is rejected.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: invalid_dates_rejected
  target: "100%"
  window: per validation
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual({
        code: "invalid_datetime",
        message: "Invalid Product Spec date-time: created_at must be ISO 8601.",
        path: "frontmatter.created_at"
      });
    }
  });

  it("extracts structured AI evals from Acceptance Criteria", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "AI Quote Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If quote search returns cited transcript passages, researchers will trust the transcript as a source.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search, timestamp citations, and quote copy.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search a transcript by phrase.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  evaluator: llm
  pass_threshold: 0.85
  cases:
    - input: "Find the passage where the speaker defines activation."
      expected: "Returns the relevant timestamped transcript passage."
  checks:
    - returned passage answers the query
    - citation links to the correct timestamp
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: weekly_active_researchers_copying_timestamped_quote
  target: ">= 40%"
  window: weekly
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const acceptanceCriteria = parsed.sections.find((section) => section.id === "acceptance_criteria");

    expect(acceptanceCriteria?.acceptance_criteria).toEqual([
      {
        id: "AC-1",
        criterion: "User can search a transcript by phrase."
      }
    ]);
    expect(acceptanceCriteria?.ai_evals).toEqual([
      {
        id: "EVAL-1",
        type: "llm_judge",
        evaluator: "llm",
        pass_threshold: 0.85,
        cases: [
          {
            input: "Find the passage where the speaker defines activation.",
            expected: "Returns the relevant timestamped transcript passage."
          }
        ],
        checks: ["returned passage answers the query", "citation links to the correct timestamp"]
      }
    ]);
    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
  });

  it("rejects duplicate durable item ids", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Duplicate IDs"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot attach evidence when item IDs collide.

## Hypothesis

If durable IDs are unique, evidence links resolve to one thing.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: duplicate ID validation.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: First criterion.
- id: AC-1
  criterion: Duplicate criterion.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: contains
  cases:
    - input: "Find quote"
      expected: "quote"
  evaluator: deterministic
  pass_threshold: 1
- id: EVAL-1
  type: contains
  cases:
    - input: "Find metric"
      expected: "metric"
  evaluator: deterministic
  pass_threshold: 1
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: first_metric
  target: ">= 1"
  window: weekly
- id: SM-1
  metric: duplicate_metric
  target: ">= 1"
  window: weekly
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            code: "duplicate_item_id",
            message: "Duplicate Product Spec item id: AC-1.",
            path: "sections.acceptance_criteria.acceptance_criteria.1.id"
          },
          {
            code: "duplicate_item_id",
            message: "Duplicate Product Spec item id: EVAL-1.",
            path: "sections.acceptance_criteria.ai_evals.1.id"
          },
          {
            code: "duplicate_item_id",
            message: "Duplicate Product Spec item id: SM-1.",
            path: "sections.success_metrics.success_metrics.1.id"
          }
        ])
      );
    }
  });

  it("extracts ProductSpec blocks written with tilde fences", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Tilde Fences"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-10T00:00:00Z"
updated_at: "2026-07-10T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

~~~productspec-scope
in:
  - transcript search
out:
  - team libraries
cut:
  - speaker labels
~~~

## Acceptance Criteria

~~~productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
~~~

~~~productspec-ai-evals
- id: EVAL-1
  type: exact_match
  cases:
    - input: "Copy passage"
      expected: "Copied"
  evaluator: deterministic
  pass_threshold: 1
~~~

## Success Metrics

~~~productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
~~~

## Related Artifacts

~~~productspec-related-artifacts
- type: github_issue
  url: "https://github.com/acme/app/issues/123"
  section_id: acceptance_criteria
  item_id: AC-1
~~~
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const scope = parsed.sections.find((section) => section.id === "scope");
    const acceptanceCriteria = parsed.sections.find((section) => section.id === "acceptance_criteria");
    const successMetrics = parsed.sections.find((section) => section.id === "success_metrics");
    const relatedArtifacts = parsed.sections.find((section) => section.id === "related_artifacts");

    expect(scope?.scope?.in).toEqual(["transcript search"]);
    expect(acceptanceCriteria?.acceptance_criteria?.[0].id).toBe("AC-1");
    expect(acceptanceCriteria?.ai_evals?.[0]).toMatchObject({
      id: "EVAL-1",
      type: "exact_match",
      evaluator: "deterministic",
      pass_threshold: 1
    });
    expect(successMetrics?.success_metrics?.[0].id).toBe("SM-1");
    expect(relatedArtifacts?.related_artifacts?.[0].type).toBe("github_issue");
    expect(validateProductSpecMarkdown(markdown).valid).toBe(true);
  });

  it("accepts structured AI evals without optional checks", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "AI Quote Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If quote search returns cited transcript passages, researchers will trust the transcript as a source.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search a transcript by phrase.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: exact_match
  evaluator: deterministic
  pass_threshold: 1
  cases:
    - input: "Copy passage"
      expected: "Copied"
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: weekly_active_researchers_copying_timestamped_quote
  target: ">= 40%"
  window: weekly
\`\`\`
`);

    expect(result.valid).toBe(true);
  });

  it("rejects unsupported AI eval type and evaluator values", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Unsupported AI Evals"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If quote search returns cited transcript passages, researchers will trust the transcript as a source.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search a transcript by phrase.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: custom
  evaluator: llm_judge
  pass_threshold: 1
  cases:
    - input: "Model classifies a refund request."
      expected: "refund_request"
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: weekly_active_researchers_copying_timestamped_quote
  target: ">= 40%"
  window: weekly
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.message)).toContain(
        "Invalid AI eval: type must be one of exact_match, contains, regex, llm_judge, human_review."
      );
      expect(result.errors.map((error) => error.message)).toContain(
        "Invalid AI eval: evaluator must be one of deterministic, llm, human."
      );
    }
  });

  it("rejects malformed AI eval blocks", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Malformed AI Evals"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If quote search returns cited transcript passages, researchers will trust the transcript as a source.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search, timestamp citations, and quote copy.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  pass_threshold: 0.85
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: weekly_active_researchers_copying_timestamped_quote
  target: ">= 40%"
  window: weekly
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.map((error) => error.code)).toContain("invalid_ai_eval");
  });

  it("rejects semantic parent IDs and child IDs in AI evals", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Invalid AI Eval IDs"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If quote search returns cited transcript passages, researchers will trust the transcript as a source.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search, timestamp citations, and quote copy.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: search_works
  criterion: User can search one transcript by phrase.
\`\`\`

\`\`\`productspec-ai-evals
- id: quote_relevance
  type: llm_judge
  evaluator: llm
  pass_threshold: 0.85
  cases:
    - input: "Find the passage where the speaker defines activation."
      expected: "Returns the relevant timestamped transcript passage."
  checks:
    - id: check-1
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: quote_copy_rate
  metric: weekly_active_researchers_copying_timestamped_quote
  target: ">= 40%"
  window: weekly
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.code)).toContain("invalid_acceptance_criterion");
      expect(result.errors.map((error) => error.code)).toContain("invalid_ai_eval");
      expect(result.errors.map((error) => error.code)).toContain("invalid_success_metric");
    }
  });

  it("extracts structured scope and success metrics", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Transcript Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

\`\`\`productspec-scope
in:
  - transcript search
  - timestamped quote copy
out:
  - team libraries
cut:
  - speaker labels
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const scope = parsed.sections.find((section) => section.id === "scope");
    const successMetrics = parsed.sections.find((section) => section.id === "success_metrics");

    expect(scope?.scope).toEqual({
      in: ["transcript search", "timestamped quote copy"],
      out: ["team libraries"],
      cut: ["speaker labels"]
    });
    expect(successMetrics?.success_metrics).toEqual([
      {
        id: "SM-1",
        metric: "copied_timestamped_quote_rate",
        target: ">= 35%",
        target_status: "committed",
        window: "within 7 days of transcript creation"
      }
    ]);
    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
  });

  it("allows provisional success metric targets with an owner", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Transcript Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-09T00:00:00Z"
updated_at: "2026-07-09T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes inside long videos.

## Hypothesis

If transcripts become searchable, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

\`\`\`productspec-scope
in:
  - transcript search
out:
  - team libraries
cut:
  - speaker labels
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: tbd
  target_status: provisional
  target_owner: Data lead
  window: within 7 days of transcript creation
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);
    const parsed = parseProductSpecMarkdown(markdown);
    const successMetrics = parsed.sections.find((section) => section.id === "success_metrics");

    expect(result.errors).toEqual([]);
    expect(successMetrics?.success_metrics?.[0]).toMatchObject({
      id: "SM-1",
      target: "tbd",
      target_status: "provisional",
      target_owner: "Data lead"
    });
  });

  it("requires an owner for provisional success metric targets", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Transcript Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-09T00:00:00Z"
updated_at: "2026-07-09T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes inside long videos.

## Hypothesis

If transcripts become searchable, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

\`\`\`productspec-scope
in:
  - transcript search
out:
  - team libraries
cut:
  - speaker labels
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: tbd
  target_status: provisional
  window: within 7 days of transcript creation
\`\`\`
`;

    expect(validateProductSpecMarkdown(markdown).errors).toContainEqual({
      code: "invalid_success_metric",
      message: "Invalid success metric: provisional targets require target_owner.",
      path: "sections.success_metrics.success_metrics.0"
    });
  });

  it("extracts traceability frontmatter and related artifacts", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Traceable Feature"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-09T00:00:00Z"
updated_at: "2026-07-09T00:00:00Z"
linked_github_repo: "acme/app"
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search, timestamp citations, and quote copy.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`

## Related Artifacts

\`\`\`productspec-related-artifacts
- type: github_issue
  url: "https://github.com/acme/app/issues/123"
  title: "Build transcript search"
  section_id: acceptance_criteria
  item_id: AC-1
- type: dashboard
  url: "https://analytics.example.com/dashboards/transcript-search"
  section_id: success_metrics
  item_id: SM-1
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const relatedArtifacts = parsed.sections.find((section) => section.id === "related_artifacts");

    expect(parsed.frontmatter.applies_to).toEqual([
      { path: "apps/web/src/transcripts/" },
      { component: "transcript-search" }
    ]);
    expect(relatedArtifacts?.related_artifacts).toEqual([
      {
        type: "github_issue",
        url: "https://github.com/acme/app/issues/123",
        title: "Build transcript search",
        section_id: "acceptance_criteria",
        item_id: "AC-1"
      },
      {
        type: "dashboard",
        url: "https://analytics.example.com/dashboards/transcript-search",
        section_id: "success_metrics",
        item_id: "SM-1"
      }
    ]);
    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
  });

  it("preserves tool metadata on parse and serialize", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Tool Metadata"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-10T00:00:00Z"
updated_at: "2026-07-10T00:00:00Z"
tool_metadata:
  coach_doc_id: "abc123"
  imported_from: "notion"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const serialized = serializeProductSpecMarkdown(parsed);

    expect(parsed.frontmatter.tool_metadata).toEqual({
      coach_doc_id: "abc123",
      imported_from: "notion"
    });
    expect(serialized).toContain("tool_metadata:");
    expect(serialized).toContain('  coach_doc_id: "abc123"');
    expect(parseProductSpecMarkdown(serialized).frontmatter.tool_metadata).toEqual(parsed.frontmatter.tool_metadata);
  });

  it("preserves unknown frontmatter as parser metadata without making it standard frontmatter", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Unknown Frontmatter"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-12T00:00:00Z"
updated_at: "2026-07-12T00:00:00Z"
tags:
  - product
  - search
aliases:
  - Transcript Search PRD
publish: false
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const serialized = serializeProductSpecMarkdown(parsed);

    expect(parsed.frontmatter).not.toHaveProperty("tags");
    expect(parsed.frontmatter).not.toHaveProperty("aliases");
    expect(parsed.frontmatter).not.toHaveProperty("publish");
    expect(parsed.parser_metadata?.unknown_frontmatter).toEqual([
      "tags:\n  - product\n  - search",
      "aliases:\n  - Transcript Search PRD",
      "publish: false"
    ]);
    expect(serialized).toContain("tags:\n  - product\n  - search\n");
    expect(serialized).toContain("aliases:\n  - Transcript Search PRD\n");
    expect(serialized).toContain("publish: false\n");
    expect(parseProductSpecMarkdown(serialized)).toEqual(parsed);
  });

  it("preserves unknown frontmatter keys that are not snake_case", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Unknown Key Shapes"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
code-fold: true
header-includes:
  - \\usepackage{fontspec}
review date: 2026-08-01
"due-date": 2026-08-01
期日: 2026-08-01
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`
`;

    const parsed = parseProductSpecMarkdown(markdown);
    const serialized = serializeProductSpecMarkdown(parsed);

    expect(parsed.parser_metadata?.unknown_frontmatter).toEqual([
      "code-fold: true",
      "header-includes:\n  - \\usepackage{fontspec}",
      "review date: 2026-08-01",
      '"due-date": 2026-08-01',
      "期日: 2026-08-01"
    ]);
    expect(serialized).toContain("code-fold: true\n");
    expect(serialized).toContain("header-includes:\n  - \\usepackage{fontspec}\n");
    expect(serialized).toContain("review date: 2026-08-01\n");
    expect(serialized).toContain('"due-date": 2026-08-01\n');
    expect(serialized).toContain("期日: 2026-08-01\n");
    expect(parseProductSpecMarkdown(serialized)).toEqual(parsed);
  });

  it("treats custom section after metadata as advisory while preserving physical order", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Custom Order"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-10T00:00:00Z"
updated_at: "2026-07-10T00:00:00Z"
custom_sections:
  - id: "custom-appendix"
    label: "Appendix"
    after: "hypothesis"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`

## Appendix

Extra notes.
`;

    const parsed = parseProductSpecMarkdown(markdown);

    expect(parsed.frontmatter.custom_sections?.[0].after).toBe("hypothesis");
    expect(parsed.sections.map((section) => section.id)).toEqual([
      "problem",
      "hypothesis",
      "product_summary",
      "scope",
      "acceptance_criteria",
      "success_metrics",
      "custom-appendix"
    ]);
  });

  it("rejects malformed traceability blocks", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Malformed Traceability"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-09T00:00:00Z"
updated_at: "2026-07-09T00:00:00Z"
applies_to:
  - note: "not a path or component"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`

## Related Artifacts

\`\`\`productspec-related-artifacts
- type: github_issue
  section_id: acceptance_criteria
  item_id: bad-id
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.code)).toContain("invalid_applies_to");
      expect(result.errors.map((error) => error.code)).toContain("invalid_related_artifact");
    }
  });

  it("rejects malformed structured scope and success metric blocks", () => {
    const malformedScope = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Malformed Scope"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

\`\`\`productspec-scope
maybe:
  - transcript search
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
\`\`\`
`);
    expect(malformedScope.valid).toBe(false);
    if (!malformedScope.valid) {
      expect(malformedScope.errors.map((error) => error.code)).toContain("invalid_structured_scope");
    }

    const malformedMetric = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Malformed Metrics"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
\`\`\`
`);
    expect(malformedMetric.valid).toBe(false);
    if (!malformedMetric.valid) {
      expect(malformedMetric.errors.map((error) => error.code)).toContain("invalid_success_metric");
    }

    const oldMetricShape = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Old Metrics"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If transcript search returns timestamped passages, researchers will cite video sources more often.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: transcript search.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can search one transcript by phrase.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
  segment: first-time transcript creators
  source: product_analytics
\`\`\`
`);
    expect(oldMetricShape.valid).toBe(false);
    if (!oldMetricShape.valid) {
      expect(oldMetricShape.errors.map((error) => error.code)).toContain("invalid_success_metric");
    }
  });

  it("ships conformance fixtures for valid and invalid Product Specs", () => {
    const fixtures = [
      "conformance/valid/minimal.product-spec.md",
      "conformance/valid/with-user-experience.product-spec.md",
      "conformance/valid/with-structured-scope-and-metrics.product-spec.md",
      "conformance/valid/with-ai-evals.product-spec.md",
      "conformance/valid/with-traceability.product-spec.md",
      "conformance/valid/with-custom-section.product-spec.md",
      "conformance/valid/with-fenced-heading.product-spec.md",
      "conformance/valid/with-spec-dependency.product-spec.md",
      "conformance/valid/with-provisional-success-metric.product-spec.md",
      "starter-kit/docs/product-specs/example.product-spec.md",
      "conformance/invalid/missing-frontmatter.product-spec.md",
      "conformance/invalid/missing-required-section.product-spec.md",
      "conformance/invalid/unsupported-version.product-spec.md",
      "conformance/invalid/malformed-applies-to.product-spec.md",
      "conformance/invalid/malformed-related-artifact.product-spec.md",
      "conformance/invalid/malformed-spec-dependency.product-spec.md",
      "conformance/invalid/missing-required-decision-trace-field.decision-trace.json"
    ];

    for (const fixture of fixtures) {
      expect(existsSync(`${root}/${fixture}`), fixture).toBe(true);
    }
  });

  it("validates conformance fixtures with stable error codes", () => {
    const validFixtures = [
      "conformance/valid/minimal.product-spec.md",
      "conformance/valid/with-user-experience.product-spec.md",
      "conformance/valid/with-structured-scope-and-metrics.product-spec.md",
      "conformance/valid/with-ai-evals.product-spec.md",
      "conformance/valid/with-traceability.product-spec.md",
      "conformance/valid/with-custom-section.product-spec.md",
      "conformance/valid/with-fenced-heading.product-spec.md",
      "conformance/valid/with-provisional-success-metric.product-spec.md",
      "starter-kit/docs/product-specs/example.product-spec.md"
    ];

    for (const fixture of validFixtures) {
      const result = validateProductSpecMarkdown(readFileSync(`${root}/${fixture}`, "utf8"));
      expect(result.valid, fixture).toBe(true);
      if (result.valid) expect(result.document.frontmatter.spec_format_version).toBe("0.1");
    }

    const invalidFixtures: Array<[string, string]> = [
      ["conformance/invalid/missing-frontmatter.product-spec.md", "missing_frontmatter"],
      ["conformance/invalid/missing-required-section.product-spec.md", "missing_required_section"],
      ["conformance/invalid/unsupported-version.product-spec.md", "unsupported_version"],
      ["conformance/invalid/malformed-applies-to.product-spec.md", "invalid_applies_to"],
      ["conformance/invalid/malformed-related-artifact.product-spec.md", "invalid_related_artifact"],
      ["conformance/invalid/malformed-spec-dependency.product-spec.md", "invalid_related_artifact"]
    ];

    for (const [fixture, code] of invalidFixtures) {
      const result = validateProductSpecMarkdown(readFileSync(`${root}/${fixture}`, "utf8"));
      expect(result.valid, fixture).toBe(false);
      if (!result.valid) expect(result.errors.map((error) => error.code)).toContain(code);
    }
  });

  it("keeps the JSON Schema aligned with parser section rules", () => {
    const schema = JSON.parse(readFileSync(`${root}/schema/product-spec.schema.json`, "utf8"));
    const sectionIdSchema = schema.properties.sections.items.properties.id;

    expect(sectionIdSchema.anyOf[0].enum).toEqual(CANONICAL_SECTION_IDS);
    expect(sectionIdSchema.anyOf[1].pattern).toBe("^custom-[a-z0-9]+(-[a-z0-9]+)*$");

    const requiredSectionIds = schema.properties.sections.allOf.map(
      (rule: { contains: { properties: { id: { const: string } } } }) => rule.contains.properties.id.const
    );
    expect(requiredSectionIds).toEqual(MANDATORY_SECTION_IDS);

    expect(schema.properties.frontmatter.required).toEqual([
      "spec_format_version",
      "title",
      "artifact_type",
      "author",
      "created_at",
      "updated_at"
    ]);
    expect(schema.properties.frontmatter.properties.custom_sections.items.properties.id.pattern).toBe(
      "^custom-[a-z0-9]+(-[a-z0-9]+)*$"
    );
    expect(schema.properties.frontmatter.properties.spec_revision).toEqual({
      type: "integer",
      minimum: 1
    });
    expect(schema.properties.frontmatter.properties.applies_to.items.anyOf).toEqual([
      {
        type: "object",
        required: ["path"],
        properties: { path: { type: "string", "minLength": 1 } },
        additionalProperties: false
      },
      {
        type: "object",
        required: ["component"],
        properties: { component: { type: "string", "minLength": 1 } },
        additionalProperties: false
      }
    ]);
    expect(schema.properties.sections.items.properties.scope.required).toEqual(["in", "out", "cut"]);
    expect(schema.properties.sections.items.properties.acceptance_criteria.items.required).toEqual([
      "id",
      "criterion"
    ]);
    expect(schema.properties.sections.items.properties.acceptance_criteria.items.properties.id.pattern).toBe(
      "^AC-[1-9][0-9]*$"
    );
    expect(schema.properties.sections.items.properties.ai_evals.items.required).toEqual([
      "id",
      "type",
      "evaluator",
      "pass_threshold",
      "cases"
    ]);
    expect(schema.properties.sections.items.properties.ai_evals.items.properties.id.pattern).toBe(
      "^EVAL-[1-9][0-9]*$"
    );
    expect(schema.properties.sections.items.properties.ai_evals.items.properties.type.enum).toEqual([
      "exact_match",
      "contains",
      "regex",
      "llm_judge",
      "human_review"
    ]);
    expect(schema.properties.sections.items.properties.ai_evals.items.properties.evaluator.enum).toEqual([
      "deterministic",
      "llm",
      "human"
    ]);
    expect(schema.properties.sections.items.properties.success_metrics.items.required).toEqual([
      "id",
      "metric",
      "target",
      "window"
    ]);
    expect(schema.properties.sections.items.properties.success_metrics.items.properties.target_status.enum).toEqual([
      "committed",
      "provisional"
    ]);
    expect(schema.properties.sections.items.properties.success_metrics.items.allOf[0].then.required).toEqual([
      "target_owner"
    ]);
    expect(schema.properties.sections.items.properties.success_metrics.items.properties.id.pattern).toBe(
      "^SM-[1-9][0-9]*$"
    );
    expect(schema.properties.sections.items.properties.related_artifacts.items.required).toEqual(["type"]);
    expect(schema.properties.sections.items.properties.related_artifacts.items.allOf).toEqual([
      {
        if: { properties: { type: { const: "product_spec" } }, required: ["type"] },
        then: { required: ["product_spec_path"], not: { required: ["url"] } },
        else: {
          required: ["url"],
          not: {
            anyOf: [{ required: ["product_spec_path"] }, { required: ["product_spec_revision"] }, { required: ["relation"] }]
          }
        }
      }
    ]);
    expect(schema.properties.sections.items.properties.related_artifacts.items.properties.type.enum).toContain(
      "product_spec"
    );
    expect(schema.properties.sections.items.properties.related_artifacts.items.properties.relation.enum).toEqual([
      "depends_on",
      "blocks",
      "supersedes",
      "relates_to"
    ]);
  });

  it("ships Decision Trace as an optional companion standard", () => {
    const schemaPath = `${root}/schema/decision-trace.schema.json`;
    const examplePath = `${root}/examples/decision-traces/transcript-search.decision-trace.json`;

    expect(existsSync(schemaPath)).toBe(true);
    expect(existsSync(examplePath)).toBe(true);

    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    const example = JSON.parse(readFileSync(examplePath, "utf8"));

    expect(schema.properties.decision_trace_format_version.const).toBe("0.1");
    expect(schema.required).toEqual([
      "decision_trace_format_version",
      "trace_id",
      "title",
      "created_at",
      "updated_at",
      "subject",
      "events"
    ]);
    expect(schema.properties.events.items.properties.event_type.enum).toEqual([
      "intent_decision",
      "scope_drift",
      "acceptance_criteria_drift",
      "ux_drift",
      "ai_eval_drift",
      "success_metric_review",
      "implementation_tradeoff",
      "spec_revision",
      "outcome_review"
    ]);

    expect(example.decision_trace_format_version).toBe("0.1");
    expect(example.subject.type).toBe("product_spec");
    expect(example.events.map((event: { event_type: string }) => event.event_type)).toContain("scope_drift");
    expect(example.events.map((event: { event_type: string }) => event.event_type)).toContain("spec_revision");
  });

  it("ships loadable agent guidance and agent usage docs", () => {
    expect(existsSync(`${root}/skills/productspec/SKILL.md`)).toBe(true);
    expect(existsSync(`${root}/docs/agent-usage.md`)).toBe(true);
    expect(existsSync(`${root}/starter-kit/AGENTS.md`)).toBe(true);
    expect(existsSync(`${root}/starter-kit/CLAUDE.md`)).toBe(true);
    expect(existsSync(`${root}/starter-kit/skills/productspec/SKILL.md`)).toBe(true);

    const skill = readFileSync(`${root}/skills/productspec/SKILL.md`, "utf8");
    const docs = readFileSync(`${root}/docs/agent-usage.md`, "utf8");
    const starterSkill = readFileSync(`${root}/starter-kit/skills/productspec/SKILL.md`, "utf8");

    expect(skill).toContain("product contract for the work");
    expect(skill).toContain("Acceptance Criteria are the build contract");
    expect(docs).toContain("Load `skills/productspec/SKILL.md`");
    expect(starterSkill).toBe(skill);
  });

  it("rejects invalid spec revision values", () => {
    const result = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Invalid Revision"
artifact_type: "prd"
spec_revision: 0
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
---

## Problem

Teams cannot tell which intent revision an engineering plan came from.

## Hypothesis

If specs carry a simple revision number, downstream plans can reference the exact intent they implement.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: optional positive integer revision in frontmatter.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Parser exposes spec revision as a number.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: handoffs_with_named_spec_revision
  target: ">= 90%"
  window: per engineering handoff
\`\`\`
`);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.map((error) => error.code)).toContain("invalid_spec_revision");
  });

  it("warns when required sections are present but too thin", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Thin Spec"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

TBD

## Hypothesis

If onboarding improves, users activate.

## Product Summary

An onboarding checklist guides new users from signup to first completed setup task.

## Scope

In: onboarding.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Users can finish onboarding.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: activation_rate
  target: ">= 10% lift"
  window: within 14 days
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.warnings.map((warning) => warning.code)).toContain("empty_required_section");
      expect(result.warnings.map((warning) => warning.code)).toContain("thin_required_section");
    }
  });

  it("warns when structured scope items are fragments instead of clear statements", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Fragment Scope"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts.

## Hypothesis

If searchable transcripts expose timestamped passages, researchers will cite video sources more often.

## Product Summary

A transcript search app lets a researcher paste a YouTube URL, view existing captions, and search timestamped transcript lines.

## Scope

\`\`\`productspec-scope
in:
  - search
out:
  - accounts
cut:
  - storage
\`\`\`

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Given a captioned YouTube URL, the app displays timestamped transcript lines.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: first_transcript_search_rate
  target: ">= 60%"
  window: first transcript session
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.warnings).toContainEqual({
        code: "scope_item_fragment",
        message: "Scope item should be a complete sentence or imperative statement: search",
        path: "sections.scope.scope.in.0"
      });
    }
  });

  it("rejects duplicate sections, out-of-order required sections, and invalid custom IDs", () => {
    const duplicate = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Duplicate Spec"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot import records reliably.

## Problem

This is duplicated.

## Hypothesis

If imports expose a clear upload path, teams will trust onboarding.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: CSV upload and row-level errors.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Valid CSV files create import jobs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: imports_without_support_contact
  target: ">= 80%"
  window: per import
\`\`\`
`);
    expect(duplicate.valid).toBe(false);
    if (!duplicate.valid) expect(duplicate.errors.map((error) => error.code)).toContain("duplicate_section");

    const outOfOrder = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Out Of Order Spec"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Teams cannot import records reliably.

## Scope

In: CSV upload and row-level errors.

## Hypothesis

If imports expose a clear upload path, teams will trust onboarding.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Valid CSV files create import jobs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: imports_without_support_contact
  target: ">= 80%"
  window: per import
\`\`\`
`);
    expect(outOfOrder.valid).toBe(false);
    if (!outOfOrder.valid) expect(outOfOrder.errors.map((error) => error.code)).toContain("invalid_section_order");

    const invalidCustom = validateProductSpecMarkdown(`---
spec_format_version: "0.1"
title: "Invalid Custom Spec"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
custom_sections:
  - id: "notes"
    label: "Notes"
    after: "success_metrics"
---

## Problem

Teams cannot import records reliably.

## Hypothesis

If imports expose a clear upload path, teams will trust onboarding.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: CSV upload and row-level errors.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: Valid CSV files create import jobs.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: imports_without_support_contact
  target: ">= 80%"
  window: per import
\`\`\`

## Notes

Keep this around.
`);
    expect(invalidCustom.valid).toBe(false);
    if (!invalidCustom.valid) expect(invalidCustom.errors.map((error) => error.code)).toContain("invalid_custom_section_id");
  });

  it("provides a CLI validator with success and failure exit codes", () => {
    const valid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate",
      `${root}/conformance/valid/minimal.product-spec.md`
    ], { encoding: "utf8" });

    expect(valid.status).toBe(0);
    expect(valid.stdout).toContain("valid");

    const invalid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate",
      `${root}/conformance/invalid/missing-required-section.product-spec.md`
    ], { encoding: "utf8" });

    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("missing_required_section");
  }, 30000);

  it("provides a CLI validator for Decision Trace files", () => {
    const valid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate-trace",
      `${root}/examples/decision-traces/transcript-search.decision-trace.json`
    ], { encoding: "utf8" });

    expect(valid.status).toBe(0);
    expect(valid.stdout).toContain("valid");

    const invalid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate-trace",
      `${root}/conformance/invalid/missing-required-decision-trace-field.decision-trace.json`
    ], { encoding: "utf8" });

    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("missing_required_trace_field");
  }, 30000);

  it("validates Agent Run files", () => {
    const run = {
      agent_run_format_version: "0.1",
      run_id: "transcript-search-run",
      agent: {
        name: "Codex",
        version: "cli"
      },
      product_spec: {
        path: "docs/product-specs/transcript-search.product-spec.md",
        spec_revision: 1,
        content_hash: "sha256:abc123"
      },
      started_at: "2026-07-13T00:00:00Z",
      completed_at: "2026-07-13T00:15:00Z",
      status: "completed",
      checked_items: [
        {
          item_id: "AC-1",
          status: "passed",
          evidence: [
            {
              type: "github_pr",
              url: "https://github.com/example/transcript-search/pull/18",
              title: "Implement transcript search"
            }
          ]
        },
        {
          item_id: "EVAL-1",
          status: "passed",
          evidence: [
            {
              type: "eval_run",
              url: "./evidence/transcript-search-eval-run.json"
            }
          ]
        }
      ],
      drift: {
        detected: false
      },
      completion_claim: "AC-1 and EVAL-1 are satisfied."
    };

    const result = validateAgentRunJson(JSON.stringify(run));

    expect(result.valid).toBe(true);
    if (result.valid) expect(result.document.checked_items[0].item_id).toBe("AC-1");
  });

  it("validates Agent Run conformance fixtures", () => {
    const valid = validateAgentRunJson(
      readFileSync(`${root}/conformance/valid/minimal.agent-run.json`, "utf8")
    );
    expect(valid.valid).toBe(true);

    const invalid = validateAgentRunJson(
      readFileSync(`${root}/conformance/invalid/invalid-agent-run-status.agent-run.json`, "utf8")
    );
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) expect(invalid.errors.map((error) => error.code)).toContain("invalid_agent_run_status");
  });

  it("rejects Agent Run files with invalid item ids", () => {
    const result = validateAgentRunJson(JSON.stringify({
      agent_run_format_version: "0.1",
      run_id: "bad-run",
      agent: { name: "Codex" },
      product_spec: {
        path: "docs/product-specs/transcript-search.product-spec.md",
        spec_revision: 1
      },
      started_at: "2026-07-13T00:00:00Z",
      status: "completed",
      checked_items: [
        { item_id: "TASK-1", status: "passed" }
      ],
      drift: { detected: false }
    }));

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.map((error) => error.code)).toContain("invalid_agent_run_item");
  });

  it("provides a CLI validator for Agent Run files", () => {
    const valid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate-run",
      `${root}/examples/agent-ready-repo/docs/agent-runs/transcript-search.agent-run.json`
    ], { encoding: "utf8" });

    expect(valid.status).toBe(0);
    expect(valid.stdout).toContain("valid");

    const invalid = spawnSync("node", [
      fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
      "validate-run",
      `${root}/conformance/invalid/missing-required-agent-run-field.agent-run.json`
    ], { encoding: "utf8" });

    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("missing_required_agent_run_field");
  }, 30000);

  it("generates an Agent Handoff from a Product Spec", () => {
    const handoff = generateAgentHandoff({
      root,
      path: "examples/harness-demo/checkout-notifications.product-spec.md"
    });

    expect(handoff.spec_valid).toBe(true);
    expect(handoff.markdown).toContain("# Agent Handoff: Checkout Failure Notifications");
    expect(handoff.markdown).toContain("## Build Contract");
    expect(handoff.markdown).toContain("## Product Summary");
    expect(handoff.markdown).toContain("- In:");
    expect(handoff.markdown).toContain("- AC-1:");
    expect(handoff.markdown).toContain("- EVAL-1:");
    expect(handoff.markdown).toContain("- SM-1:");
    expect(handoff.markdown).toContain("## Existing Evidence And Links");
    expect(handoff.markdown).toContain("- github_issue for AC-1:");
    expect(handoff.markdown).toContain("- Decision Trace if implementation changes product intent.");
  });

  it("generates an Agent Handoff from the CLI", () => {
    const build = spawnSync("npm", ["run", "build"], { cwd: packageRoot, encoding: "utf8" });
    expect(build.status, build.stderr).toBe(0);

    const dir = mkdtempSync(join(tmpdir(), "productspec-handoff-"));
    const specPath = join(dir, "search.product-spec.md");
    const handoffPath = join(dir, "search.agent-handoff.md");

    try {
      writeFileSync(specPath, readFileSync(`${root}/examples/harness-demo/checkout-notifications.product-spec.md`, "utf8"), "utf8");

      const stdoutHandoff = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "handoff",
        "search.product-spec.md"
      ], { cwd: dir, encoding: "utf8" });

      expect(stdoutHandoff.status).toBe(0);
      expect(stdoutHandoff.stdout).toContain("# Agent Handoff: Checkout Failure Notifications");
      expect(stdoutHandoff.stdout).toContain("## Evidence The Agent Must Produce");
      expect(stdoutHandoff.stdout).toContain("## Evidence To Return");

      const fileHandoff = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "handoff",
        "search.product-spec.md",
        "search.agent-handoff.md"
      ], { cwd: dir, encoding: "utf8" });

      expect(fileHandoff.status).toBe(0);
      expect(fileHandoff.stdout).toContain("created");
      expect(readFileSync(handoffPath, "utf8")).toContain("## Scope Guardrails");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it("exposes Agent Handoff through MCP", () => {
    const listResponse = handleRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" }) as any;
    expect(listResponse.result.tools.map((tool: { name: string }) => tool.name)).toContain("get_agent_handoff");

    const callResponse = handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_agent_handoff",
        arguments: {
          root,
          path: "examples/harness-demo/checkout-notifications.product-spec.md"
        }
      }
    }) as any;

    expect(callResponse.result.content[0].text).toContain("# Agent Handoff: Checkout Failure Notifications");
    expect(callResponse.result.content[0].text).toContain("## Must Satisfy");
  });

  it("prints MCP client configs from the CLI", () => {
    const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const claude = spawnSync("node", [cli, "mcp-config", "claude"], { encoding: "utf8" });
    const cursor = spawnSync("node", [cli, "mcp-config", "cursor"], { encoding: "utf8" });
    const unsupported = spawnSync("node", [cli, "mcp-config", "not-a-client"], { encoding: "utf8" });

    expect(claude.status).toBe(0);
    expect(cursor.status).toBe(0);
    expect(unsupported.status).toBe(1);
    expect(unsupported.stderr).toContain("supported targets");

    for (const output of [claude.stdout, cursor.stdout]) {
      const config = JSON.parse(output);
      expect(config.mcpServers.productspec.command).toBe("npx");
      expect(config.mcpServers.productspec.args).toEqual([
        "--yes",
        "--package",
        "@productspec/parser@latest",
        "productspec",
        "mcp"
      ]);
    }
  }, 30000);

  it("initializes a draft Agent Run from the CLI", () => {
    const dir = mkdtempSync(join(tmpdir(), "productspec-init-run-"));
    const specPath = join(dir, "search.product-spec.md");
    const runPath = join(dir, "search.agent-run.json");

    try {
      writeFileSync(specPath, readFileSync(`${root}/examples/minimal.product-spec.md`, "utf8"), "utf8");

      const initRun = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "init-run",
        "search.product-spec.md",
        "search.agent-run.json"
      ], { cwd: dir, encoding: "utf8" });

      expect(initRun.status).toBe(0);
      expect(initRun.stdout).toContain("created");
      expect(existsSync(runPath)).toBe(true);

      const result = validateAgentRunJson(readFileSync(runPath, "utf8"));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.document.status).toBe("draft");
        expect(result.document.product_spec.path).toBe("search.product-spec.md");
        expect(result.document.checked_items).toContainEqual({ item_id: "AC-1", status: "not_checked" });
        expect(result.document.checked_items).toContainEqual({ item_id: "SM-1", status: "not_checked" });
      }

      const secondInitRun = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "init-run",
        "search.product-spec.md",
        "search.agent-run.json"
      ], { cwd: dir, encoding: "utf8" });

      expect(secondInitRun.status).toBe(1);
      expect(secondInitRun.stderr).toContain("already exists");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it("initializes a starter Product Spec from the CLI", () => {
    const dir = mkdtempSync(join(tmpdir(), "productspec-init-"));
    const target = join(dir, "starter.product-spec.md");

    try {
      const init = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "init",
        target
      ], { encoding: "utf8" });

      expect(init.status).toBe(0);
      expect(init.stdout).toContain("created");
      expect(existsSync(target)).toBe(true);

      const markdown = readFileSync(target, "utf8");
      const result = validateProductSpecMarkdown(markdown);
      expect(result.valid).toBe(true);
      expect(markdown).toContain("## Problem");
      expect(markdown).toContain("## Success Metrics");

      const secondInit = spawnSync("node", [
        fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
        "init",
        target
      ], { encoding: "utf8" });

      expect(secondInit.status).toBe(1);
      expect(secondInit.stderr).toContain("already exists");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it("keeps every example valid", () => {
    const exampleDir = `${root}/examples`;
    const examples = productSpecFiles(exampleDir);

    expect(examples).toContain(`${exampleDir}/minimal.product-spec.md`);
    expect(examples).toContain(`${exampleDir}/revisions/support-triage-v1.product-spec.md`);
    expect(examples).toContain(`${exampleDir}/revisions/support-triage-v2.product-spec.md`);
    expect(examples.length).toBeGreaterThanOrEqual(5);

    for (const example of examples) {
      const markdown = readFileSync(example, "utf8");
      const result = validateProductSpecMarkdown(markdown);
      expect(markdown, example).toMatch(/^## Product Summary\s*$/m);
      expect(result.valid, example).toBe(true);
      if (result.valid) {
        expect(result.warnings.filter((warning) => warning.code === "scope_item_fragment"), example).toEqual([]);
      }
    }
  });

  it("validates Decision Trace examples and fixtures", () => {
    const validTraceFiles = [
      `${root}/examples/decision-traces/transcript-search.decision-trace.json`,
      `${root}/starter-kit/docs/decision-traces/example.decision-trace.json`
    ];

    for (const traceFile of validTraceFiles) {
      const result = validateDecisionTraceJson(readFileSync(traceFile, "utf8"));
      expect(result.valid, traceFile).toBe(true);
    }

    const invalid = validateDecisionTraceJson(
      readFileSync(`${root}/conformance/invalid/missing-required-decision-trace-field.decision-trace.json`, "utf8")
    );
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) expect(invalid.errors.map((error) => error.code)).toContain("missing_required_trace_field");
  });

  it("rejects invalid Decision Trace date-times and duplicate event ids", () => {
    const trace = {
      decision_trace_format_version: "0.1",
      trace_id: "bad-trace",
      title: "Bad Trace",
      created_at: "NOT-A-DATE",
      updated_at: "2026-07-13T00:00:00Z",
      subject: {
        type: "product_spec",
        id: "specs/search.product-spec.md"
      },
      events: [
        {
          event_id: "same-event",
          event_type: "intent_decision",
          occurred_at: "ALSO-NOT-A-DATE",
          summary: "First event.",
          decision: { outcome: "record_learning", rationale: "Recorded." }
        },
        {
          event_id: "same-event",
          event_type: "outcome_review",
          occurred_at: "2026-07-13T00:00:00Z",
          summary: "Duplicate event.",
          decision: { outcome: "record_learning", rationale: "Recorded." }
        }
      ]
    };

    const result = validateDecisionTraceJson(JSON.stringify(trace));

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            code: "invalid_datetime",
            message: "Invalid Decision Trace date-time: created_at must be ISO 8601.",
            path: "created_at"
          },
          {
            code: "invalid_datetime",
            message: "Invalid Decision Trace date-time: occurred_at must be ISO 8601.",
            path: "events.0.occurred_at"
          },
          {
            code: "duplicate_trace_event_id",
            message: "Duplicate Decision Trace event_id: same-event.",
            path: "events.1.event_id"
          }
        ])
      );
    }
  });

  it("keeps Decision Trace link types aligned with ProductSpec evidence types", () => {
    const schema = JSON.parse(readFileSync(`${root}/schema/decision-trace.schema.json`, "utf8"));
    const traceLinkTypes = schema.$defs.link.properties.type.enum;

    expect(traceLinkTypes).toEqual(expect.arrayContaining(["code", "dashboard"]));
    expect(validateDecisionTraceJson(JSON.stringify({
      decision_trace_format_version: "0.1",
      trace_id: "linked-trace",
      title: "Linked Trace",
      created_at: "2026-07-13T00:00:00Z",
      updated_at: "2026-07-13T00:00:00Z",
      subject: {
        type: "product_spec",
        id: "specs/search.product-spec.md"
      },
      events: [
        {
          event_id: "link-review",
          event_type: "outcome_review",
          occurred_at: "2026-07-13T00:00:00Z",
          summary: "Reviewed evidence.",
          source: {
            links: [
              { type: "code", url: "apps/search/index.ts" },
              { type: "dashboard", url: "https://analytics.example.com/search" }
            ]
          },
          decision: { outcome: "record_learning", rationale: "Evidence linked." }
        }
      ]
    })).valid).toBe(true);
  });

  it("ships a GitHub Action that can validate Product Specs, Decision Traces, and Agent Runs", () => {
    const action = readFileSync(`${root}/action.yml`, "utf8");
    expect(action).toContain("decision_traces:");
    expect(action).toContain("validate-trace");
    expect(action).toContain("agent_runs:");
    expect(action).toContain("validate-run");
  });
  it("parses and round-trips product_spec related artifacts", () => {
    const markdown = readFileSync(
      fileURLToPath(
        new URL("../../../conformance/valid/with-spec-dependency.product-spec.md", import.meta.url)
      ),
      "utf8"
    );
    const parsed = parseProductSpecMarkdown(markdown);
    const section = parsed.sections.find((entry) => entry.id === "related_artifacts");

    expect(section?.related_artifacts?.[0]).toMatchObject({
      type: "product_spec",
      product_spec_path: "../library/citation-library.product-spec.md",
      product_spec_revision: 2,
      relation: "depends_on",
      section_id: "acceptance_criteria",
      item_id: "AC-1"
    });
    expect(validateProductSpecMarkdown(markdown).errors).toEqual([]);
    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);

    const wrongType = validateProductSpecMarkdown(
      markdown.replace('url: "https://github.com/acme/app/issues/123"', 'url: "https://github.com/acme/app/issues/123"\n  product_spec_revision: 2')
    );
    expect(wrongType.valid).toBe(false);
    if (!wrongType.valid) {
      expect(wrongType.errors.map((error) => error.code)).toContain("invalid_related_artifact");
    }

    const wrongRelationType = validateProductSpecMarkdown(
      markdown.replace('url: "https://github.com/acme/app/issues/123"', 'url: "https://github.com/acme/app/issues/123"\n  relation: depends_on')
    );
    expect(wrongRelationType.valid).toBe(false);
    if (!wrongRelationType.valid) {
      expect(wrongRelationType.errors.map((error) => error.message)).toContain(
        "Invalid related artifact: relation only applies to type product_spec."
      );
    }

    const defaultRelation = parseProductSpecMarkdown(markdown.replace("  relation: depends_on\n", ""));
    const defaultSection = defaultRelation.sections.find((entry) => entry.id === "related_artifacts");
    expect(defaultSection?.related_artifacts?.[0].relation).toBe("relates_to");
  });

  it("validates related artifact item_id references and warns on unusual evidence pairings", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "Evidence Links"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
---

## Problem

Researchers lose source context.

## Hypothesis

If copied passages include timestamps, researchers cite sources faster.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: timestamped copy.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: User can copy a timestamped passage.
\`\`\`

\`\`\`productspec-ai-evals
- id: EVAL-1
  type: contains
  cases:
    - input: "Find product judgment quote"
      expected: "product judgment"
  evaluator: deterministic
  pass_threshold: 1
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: timestamped_quote_copy_rate
  target: ">= 35%"
  target_status: committed
  window: first 14 days after launch
\`\`\`

## Related Artifacts

\`\`\`productspec-related-artifacts
- type: github_pr
  url: "https://github.com/acme/app/pull/1"
  item_id: AC-1
- type: eval_run
  url: "./evidence/eval-run.json"
  item_id: EVAL-1
- type: dashboard
  url: "./evidence/day-14-dashboard.png"
  item_id: SM-1
- type: eval_run
  url: "https://evals.example.com/wrong-target"
  item_id: SM-1
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.warnings).toContainEqual({
        code: "unusual_related_artifact_target",
        message: "Related artifact type eval_run usually attaches to EVAL-<number>.",
        path: "sections.related_artifacts.related_artifacts.3"
      });
    }

    const missingTarget = validateProductSpecMarkdown(markdown.replace("item_id: AC-1", "item_id: AC-99"));

    expect(missingTarget.valid).toBe(false);
    if (!missingTarget.valid) {
      expect(missingTarget.errors).toContainEqual({
        code: "invalid_related_artifact",
        message: "Invalid related artifact: item_id AC-99 does not match any Acceptance Criterion, Success Metric, or AI Eval.",
        path: "sections.related_artifacts.related_artifacts.0"
      });
    }
  });

  it("ignores ## headings inside fenced code blocks", () => {
    const markdown = readFileSync(
      fileURLToPath(
        new URL("../../../conformance/valid/with-fenced-heading.product-spec.md", import.meta.url)
      ),
      "utf8"
    );
    const parsed = parseProductSpecMarkdown(markdown);

    expect(parsed.sections.map((section) => section.id)).toEqual([
      "problem",
      "hypothesis",
      "product_summary",
      "scope",
      "acceptance_criteria",
      "success_metrics"
    ]);

    const scope = parsed.sections.find((section) => section.id === "scope");
    expect(scope?.content).toContain("Who is hurting.");
    expect(scope?.content).toContain("Do not build a generator CLI in this version.");
    expect(validateProductSpecMarkdown(markdown).errors).toEqual([]);
  });

  it("parses and validates specs with CRLF line endings", () => {
    const markdown = `---
spec_format_version: "0.1"
title: "CRLF Spec"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-05T00:00:00Z"
updated_at: "2026-07-05T00:00:00Z"
---

## Problem

Windows-authored specs use carriage returns and must still parse.

## Hypothesis

If CRLF is normalized, cross-platform specs validate identically.

## Product Summary

This Product Spec describes the product behavior being validated by this parser test.

## Scope

In: CRLF normalization before frontmatter parsing.

## Acceptance Criteria

\`\`\`productspec-acceptance-criteria
- id: AC-1
  criterion: A CRLF spec produces the same sections as its LF form.
\`\`\`

## Success Metrics

\`\`\`productspec-success-metrics
- id: SM-1
  metric: crlf_specs_parse
  target: ">= 100%"
  window: per validation
\`\`\`
`;

    const result = validateProductSpecMarkdown(markdown.replace(/\n/g, "\r\n"));

    expect(result.valid).toBe(true);
    expect(parseProductSpecMarkdown(markdown.replace(/\n/g, "\r\n")).sections.map((section) => section.id)).toEqual([
      "problem",
      "hypothesis",
      "product_summary",
      "scope",
      "acceptance_criteria",
      "success_metrics"
    ]);
  });

});

function productSpecFiles(directory: string): string[] {
  const entries = readdirSync(directory).map((entry) => `${directory}/${entry}`);
  return entries.flatMap((entry) => {
    if (statSync(entry).isDirectory()) return productSpecFiles(entry);
    return entry.endsWith(".product-spec.md") ? [entry] : [];
  });
}

describe("resolveProductSpecGraph", () => {
  function graphInput(
    path: string,
    links: Array<{ to: string; relation?: "depends_on" | "blocks" | "supersedes" | "relates_to"; revision?: number }> = [],
    revision?: number
  ): ProductSpecGraphInput {
    return {
      path,
      document: {
        frontmatter: {
          spec_format_version: "0.1",
          title: path,
          artifact_type: "prd",
          ...(revision !== undefined ? { spec_revision: revision } : {}),
          author: "ProductSpec",
          created_at: "2026-07-11T00:00:00Z",
          updated_at: "2026-07-11T00:00:00Z"
        },
        sections: [
          {
            id: "related_artifacts",
            label: "Related Artifacts",
            content: "",
            related_artifacts: links.map((link) => ({
              type: "product_spec" as const,
              product_spec_path: link.to,
              ...(link.relation ? { relation: link.relation } : {}),
              ...(link.revision !== undefined ? { product_spec_revision: link.revision } : {})
            }))
          }
        ]
      }
    };
  }

  it("orders a linear depends_on chain and splits buildable from blocked", () => {
    const graph = resolveProductSpecGraph([
      graphInput("specs/inbox.product-spec.md", [{ to: "./handoff.product-spec.md", relation: "depends_on" }]),
      graphInput("specs/handoff.product-spec.md", [{ to: "./signals.product-spec.md", relation: "depends_on" }]),
      graphInput("specs/signals.product-spec.md")
    ]);

    expect(graph.buildable).toEqual(["specs/signals.product-spec.md"]);
    expect(graph.blocked).toEqual([
      { path: "specs/inbox.product-spec.md", waits_on: ["specs/handoff.product-spec.md"] },
      { path: "specs/handoff.product-spec.md", waits_on: ["specs/signals.product-spec.md"] }
    ]);
    expect(graph.order).toEqual([
      "specs/signals.product-spec.md",
      "specs/handoff.product-spec.md",
      "specs/inbox.product-spec.md"
    ]);
    expect(graph.warnings).toEqual([]);
  });

  it("inverts blocks so the target waits on the declaring spec", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "b.product-spec.md", relation: "blocks" }]),
      graphInput("b.product-spec.md")
    ]);

    expect(graph.buildable).toEqual(["a.product-spec.md"]);
    expect(graph.blocked).toEqual([{ path: "b.product-spec.md", waits_on: ["a.product-spec.md"] }]);
  });

  it("records supersedes and relates_to edges without gating", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [
        { to: "b.product-spec.md", relation: "supersedes" },
        { to: "c.product-spec.md" }
      ]),
      graphInput("b.product-spec.md"),
      graphInput("c.product-spec.md")
    ]);

    expect(graph.buildable).toHaveLength(3);
    expect(graph.blocked).toEqual([]);
    expect(graph.edges.map((edge) => edge.relation)).toEqual(["supersedes", "relates_to"]);
  });

  it("blocks the declaring spec on a missing depends_on target and keeps the warning", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "gone.product-spec.md", relation: "depends_on" }])
    ]);

    expect(graph.buildable).toEqual([]);
    expect(graph.blocked).toEqual([
      { path: "a.product-spec.md", waits_on: ["gone.product-spec.md"] }
    ]);
    expect(graph.order).toEqual([]);
    expect(graph.warnings).toEqual([
      {
        code: "missing_link_target",
        message: "a.product-spec.md declares depends_on on gone.product-spec.md, which is not in the graph.",
        path: "a.product-spec.md"
      }
    ]);
  });

  it("keeps a missing blocks target warning-only", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "gone.product-spec.md", relation: "blocks" }])
    ]);

    expect(graph.buildable).toEqual(["a.product-spec.md"]);
    expect(graph.blocked).toEqual([]);
    expect(graph.warnings[0].code).toBe("missing_link_target");
  });

  it("detects dependency cycles and keeps cycle members out of the order", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "b.product-spec.md", relation: "depends_on" }]),
      graphInput("b.product-spec.md", [{ to: "a.product-spec.md", relation: "depends_on" }]),
      graphInput("c.product-spec.md")
    ]);

    expect(graph.order).toEqual(["c.product-spec.md"]);
    expect(graph.warnings).toEqual([
      {
        code: "dependency_cycle",
        message: "Dependency cycle among: a.product-spec.md, b.product-spec.md.",
        path: "a.product-spec.md"
      }
    ]);
  });

  it("ignores self links with a warning", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "./a.product-spec.md", relation: "depends_on" }])
    ]);

    expect(graph.buildable).toEqual(["a.product-spec.md"]);
    expect(graph.edges).toEqual([]);
    expect(graph.warnings[0].code).toBe("self_dependency");
  });

  it("keeps the first spec and warns when two inputs share a path", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md"),
      graphInput("./a.product-spec.md")
    ]);

    expect(graph.buildable).toEqual(["a.product-spec.md"]);
    expect(graph.warnings[0].code).toBe("duplicate_spec_path");
  });

  it("resolves relative links across folders", () => {
    const graph = resolveProductSpecGraph([
      graphInput("docs/channels/inbox.product-spec.md", [
        { to: "../foundation/contacts.product-spec.md", relation: "depends_on" }
      ]),
      graphInput("docs/foundation/contacts.product-spec.md")
    ]);

    expect(graph.blocked).toEqual([
      {
        path: "docs/channels/inbox.product-spec.md",
        waits_on: ["docs/foundation/contacts.product-spec.md"]
      }
    ]);
  });

  it("carries revision pins through to edges", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "b.product-spec.md", relation: "depends_on", revision: 2 }]),
      graphInput("b.product-spec.md")
    ]);

    expect(graph.edges).toEqual([
      {
        from: "a.product-spec.md",
        to: "b.product-spec.md",
        relation: "depends_on",
        product_spec_revision: 2
      }
    ]);
  });

  it("warns when a dependency revision pin does not match the target spec revision", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "b.product-spec.md", relation: "depends_on", revision: 2 }]),
      graphInput("b.product-spec.md", [], 3)
    ]);

    expect(graph.warnings).toContainEqual({
      code: "revision_pin_mismatch",
      message: "a.product-spec.md pins b.product-spec.md at revision 2, but the target spec is revision 3.",
      path: "a.product-spec.md"
    });
  });

  it("reports each dependency cycle separately and leaves downstream specs out of it", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "b.product-spec.md", relation: "depends_on" }]),
      graphInput("b.product-spec.md", [{ to: "a.product-spec.md", relation: "depends_on" }]),
      graphInput("d.product-spec.md", [{ to: "e.product-spec.md", relation: "depends_on" }]),
      graphInput("e.product-spec.md", [{ to: "d.product-spec.md", relation: "depends_on" }]),
      graphInput("downstream.product-spec.md", [{ to: "a.product-spec.md", relation: "depends_on" }])
    ]);

    const cycleWarnings = graph.warnings.filter((warning) => warning.code === "dependency_cycle");
    expect(cycleWarnings).toHaveLength(2);
    expect(cycleWarnings[0].message).toBe("Dependency cycle among: a.product-spec.md, b.product-spec.md.");
    expect(cycleWarnings[1].message).toBe("Dependency cycle among: d.product-spec.md, e.product-spec.md.");
    expect(cycleWarnings.some((warning) => warning.message.includes("downstream"))).toBe(false);
    expect(graph.order).toEqual([]);
  });

  it("warns on absolute link paths and drops the edge", () => {
    const graph = resolveProductSpecGraph([
      graphInput("a.product-spec.md", [{ to: "/specs/b.product-spec.md", relation: "depends_on" }]),
      graphInput("specs/b.product-spec.md")
    ]);

    expect(graph.edges).toEqual([]);
    expect(graph.buildable).toHaveLength(2);
    expect(graph.warnings[0].code).toBe("unsupported_link_path");
  });

  it("normalizes backslash separators in input paths", () => {
    const graph = resolveProductSpecGraph([
      graphInput("docs\\channels\\inbox.product-spec.md", [
        { to: "../foundation/contacts.product-spec.md", relation: "depends_on" }
      ]),
      graphInput("docs/foundation/contacts.product-spec.md")
    ]);

    expect(graph.blocked).toEqual([
      {
        path: "docs/channels/inbox.product-spec.md",
        waits_on: ["docs/foundation/contacts.product-spec.md"]
      }
    ]);
  });

  it("resolves the shipped graph fixtures end to end", () => {
    const fixtureDir = `${root}/conformance/graph`;
    const inputs = productSpecFiles(fixtureDir).map((file) => {
      const result = validateProductSpecMarkdown(readFileSync(file, "utf8"));
      expect(result.valid).toBe(true);
      return { path: file.slice(root.length), document: result.document! };
    });

    const graph = resolveProductSpecGraph(inputs);

    expect(graph.buildable).toEqual([
      "conformance/graph/contact-profiles.product-spec.md",
      "conformance/graph/signals.product-spec.md"
    ]);
    expect(graph.blocked.map((node) => node.path)).toEqual([
      "conformance/graph/human-handoff.product-spec.md",
      "conformance/graph/unified-inbox.product-spec.md"
    ]);
    expect(graph.order[graph.order.length - 1]).toBe("conformance/graph/unified-inbox.product-spec.md");
    expect(graph.warnings).toEqual([]);
  });

  it("provides a CLI graph command with table and JSON output", () => {
    const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

    const table = spawnSync("node", [cli, "graph", `${root}/conformance/graph`], { encoding: "utf8" });
    expect(table.status).toBe(0);
    expect(table.stdout).toContain("buildable:");
    expect(table.stdout).toContain("order:");

    const json = spawnSync("node", [cli, "graph", "--json", `${root}/conformance/graph`], { encoding: "utf8" });
    expect(json.status).toBe(0);
    const graph = JSON.parse(json.stdout);
    expect(graph.buildable).toHaveLength(2);
    expect(graph.blocked).toHaveLength(2);

    const missing = spawnSync("node", [cli, "graph", `${root}/conformance/definitely-missing`], { encoding: "utf8" });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("not a directory");
  }, 30000);

  it("surfaces skipped invalid specs in graph JSON output and fails when nothing is valid", () => {
    const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

    const mixedDir = mkdtempSync(join(tmpdir(), "productspec-graph-"));
    const validSpec = readFileSync(`${root}/conformance/graph/signals.product-spec.md`, "utf8");
    writeFileSync(join(mixedDir, "valid.product-spec.md"), validSpec, "utf8");
    writeFileSync(join(mixedDir, "broken.product-spec.md"), "no frontmatter here", "utf8");

    const json = spawnSync("node", [cli, "graph", mixedDir, "--json"], { encoding: "utf8" });
    expect(json.status).toBe(0);
    const graph = JSON.parse(json.stdout);
    expect(graph.warnings.some((warning: { code: string }) => warning.code === "skipped_invalid_spec")).toBe(true);

    const brokenDir = mkdtempSync(join(tmpdir(), "productspec-graph-"));
    writeFileSync(join(brokenDir, "broken.product-spec.md"), "no frontmatter here", "utf8");
    const failed = spawnSync("node", [cli, "graph", brokenDir], { encoding: "utf8" });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("no valid .product-spec.md files");

    rmSync(mixedDir, { recursive: true, force: true });
    rmSync(brokenDir, { recursive: true, force: true });
  });
});
