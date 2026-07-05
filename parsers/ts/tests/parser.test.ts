import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseProductSpecMarkdown, serializeProductSpecMarkdown } from "../src/index";

describe("@productspec/parser", () => {
  it("round-trips the minimal example", () => {
    const markdown = readFileSync(
      fileURLToPath(new URL("../../../examples/minimal.product-spec.md", import.meta.url)),
      "utf8"
    );
    const parsed = parseProductSpecMarkdown(markdown);

    expect(parseProductSpecMarkdown(serializeProductSpecMarkdown(parsed))).toEqual(parsed);
  });

  it("treats surface as canonical and does not require user experience", () => {
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

If imports expose a clear API surface, teams will trust automated onboarding.

## Scope

In: CSV upload endpoint and error response shape.

## Surface

POST /imports with a CSV file returns accepted rows, rejected rows, and actionable row-level errors.

## Acceptance Criteria

- Valid CSV files create import jobs.

## Success Metrics

- 80% of imports complete without support contact.
`;

    const parsed = parseProductSpecMarkdown(markdown);

    expect(parsed.sections.map((section) => section.id)).toEqual([
      "problem",
      "hypothesis",
      "scope",
      "surface",
      "acceptance_criteria",
      "success_metrics"
    ]);
  });
});
