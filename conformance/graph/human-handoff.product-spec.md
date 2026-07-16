---
spec_format_version: "0.1"
title: "Human Handoff"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-11T00:00:00Z"
updated_at: "2026-07-11T00:00:00Z"
applies_to:
  - path: "apps/api/src/handoff/"
  - component: "handoff"
---

## Problem

Hard conversations need a human, and today nothing decides when or carries the context over.

## Hypothesis

If the handoff fires on extracted signals and carries the whole conversation, humans start warm instead of cold.

## Product Summary

This Product Spec describes the product behavior, user-facing shape, and implementation boundaries for the work.

## Scope

```productspec-scope
in:
  - Include signal-triggered handoff with full context transfer in this version.
out:
  - Do not build per-team routing rules because the inbox owns them.
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: Given a conversation crosses the handoff threshold, when a human takes over, then the full history and extracted signals are visible to them.
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: handoffs_with_full_context
  target: ">= 95%"
  window: weekly
```

## Related Artifacts

```productspec-related-artifacts
- type: product_spec
  product_spec_path: "./signals.product-spec.md"
  relation: depends_on
  title: "Signals"
```
