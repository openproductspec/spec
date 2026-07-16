---
spec_format_version: "0.1"
title: "Signals"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-11T00:00:00Z"
updated_at: "2026-07-11T00:00:00Z"
applies_to:
  - path: "apps/api/src/conversations/signals/"
  - component: "signals"
---

## Problem

Conversations carry intent the system never captures, so nothing downstream can react to it.

## Hypothesis

If intent is extracted while the conversation is still open, downstream features can act before the customer is gone.

## Product Summary

This Product Spec describes the product behavior, user-facing shape, and implementation boundaries for the work.

## Scope

```productspec-scope
in:
  - Extract intent from live conversations with a confidence score per signal.
out:
  - Do not act on extracted intent because later specs own that behavior.
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: Given a customer states an intent, when the conversation is processed, then the intent attaches to it with a confidence score.
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: conversations_with_extracted_intent
  target: ">= 70%"
  window: weekly
```
