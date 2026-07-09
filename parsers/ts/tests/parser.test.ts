import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_SECTION_IDS,
  MANDATORY_SECTION_IDS,
  parseProductSpecMarkdown,
  serializeProductSpecMarkdown,
  validateProductSpecMarkdown
} from "../src/index";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const packageRoot = fileURLToPath(new URL("..", import.meta.url));

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
      "scope",
      "acceptance_criteria",
      "success_metrics"
    ]);
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
        window: "within 7 days of transcript creation"
      }
    ]);
    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
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
      "conformance/valid/with-custom-section.product-spec.md",
      "conformance/invalid/missing-frontmatter.product-spec.md",
      "conformance/invalid/missing-required-section.product-spec.md",
      "conformance/invalid/unsupported-version.product-spec.md"
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
      "conformance/valid/with-custom-section.product-spec.md"
    ];

    for (const fixture of validFixtures) {
      const result = validateProductSpecMarkdown(readFileSync(`${root}/${fixture}`, "utf8"));
      expect(result.valid, fixture).toBe(true);
      if (result.valid) expect(result.document.frontmatter.spec_format_version).toBe("0.1");
    }

    const invalidFixtures: Array<[string, string]> = [
      ["conformance/invalid/missing-frontmatter.product-spec.md", "missing_frontmatter"],
      ["conformance/invalid/missing-required-section.product-spec.md", "missing_required_section"],
      ["conformance/invalid/unsupported-version.product-spec.md", "unsupported_version"]
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
    expect(schema.properties.sections.items.properties.success_metrics.items.properties.id.pattern).toBe(
      "^SM-[1-9][0-9]*$"
    );
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
    const build = spawnSync("npm", ["run", "build"], { cwd: packageRoot, encoding: "utf8" });
    expect(build.status, build.stderr).toBe(0);

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
  });

  it("initializes a starter Product Spec from the CLI", () => {
    const build = spawnSync("npm", ["run", "build"], { cwd: packageRoot, encoding: "utf8" });
    expect(build.status, build.stderr).toBe(0);

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
  });

  it("keeps every example valid", () => {
    const exampleDir = `${root}/examples`;
    const examples = productSpecFiles(exampleDir);

    expect(examples).toContain(`${exampleDir}/minimal.product-spec.md`);
    expect(examples).toContain(`${exampleDir}/revisions/support-triage-v1.product-spec.md`);
    expect(examples).toContain(`${exampleDir}/revisions/support-triage-v2.product-spec.md`);
    expect(examples.length).toBeGreaterThanOrEqual(5);

    for (const example of examples) {
      const result = validateProductSpecMarkdown(readFileSync(example, "utf8"));
      expect(result.valid, example).toBe(true);
    }
  });
});

function productSpecFiles(directory: string): string[] {
  const entries = readdirSync(directory).map((entry) => `${directory}/${entry}`);
  return entries.flatMap((entry) => {
    if (statSync(entry).isDirectory()) return productSpecFiles(entry);
    return entry.endsWith(".product-spec.md") ? [entry] : [];
  });
}
