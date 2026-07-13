---
spec_format_version: "0.1"
title: "Checkout Failure Notifications"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
linked_github_repo: "example/checkout"
applies_to:
  - path: "apps/web/src/checkout/"
  - path: "apps/worker/src/payments/"
---

## Problem

Store operators lose recoverable orders because checkout failures are visible only in logs, not in the operator workflow where they can respond quickly.

## Hypothesis

If store operators receive a clear notification when a payment failure blocks checkout, they will recover more orders because they can contact the buyer or fix configuration issues before the buyer abandons the purchase.

## Scope

```productspec-scope
in:
  - payment failure detection from checkout worker events
  - operator notification in the admin order timeline
  - retry payment action link
  - email notification for high-value failed orders
out:
  - SMS notifications
  - automatic discount offers
  - fraud review changes
cut:
  - multi-store notification routing
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: A failed payment event creates one admin timeline notification for the affected order.
- id: AC-2
  criterion: The notification includes failure reason, buyer email, order value, and retry payment link.
- id: AC-3
  criterion: Orders above $500 also send one operator email within 5 minutes.
- id: AC-4
  criterion: Duplicate payment failure events for the same order do not create duplicate notifications within 30 minutes.
```

```productspec-ai-evals
- id: EVAL-1
  type: contains
  cases:
    - input: "payment_failed reason=card_declined order_total=742 buyer=buyer@example.com"
      expected: "Notification includes card_declined, $742, buyer@example.com, and retry payment."
    - input: "payment_failed reason=insufficient_funds order_total=42 buyer=buyer@example.com"
      expected: "Timeline notification is created, but high-value email is not sent."
  evaluator: deterministic
  pass_threshold: 1
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: failed_checkout_recovery_rate
  target: ">= 12%"
  target_status: provisional
  target_owner: "Checkout product lead"
  window: 14 days after payment failure
- id: SM-2
  metric: duplicate_operator_notifications
  target: "<= 1% of failed orders"
  target_status: committed
  window: weekly
```

## Related Artifacts

```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/example/checkout/issues/41"
  title: "Build checkout failure notifications"
  section_id: acceptance_criteria
  item_id: AC-1
- type: github_pr
  url: "https://github.com/example/checkout/pull/58"
  title: "Add checkout failure notifications"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "./checkout-notifications.eval-run.json"
  title: "Checkout notification deterministic eval"
  section_id: acceptance_criteria
  item_id: EVAL-1
- type: dashboard
  url: "https://analytics.example.com/checkout/failure-recovery"
  title: "Checkout failure recovery dashboard"
  section_id: success_metrics
  item_id: SM-1
```
