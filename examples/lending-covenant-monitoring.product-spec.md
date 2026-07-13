---
spec_format_version: "0.1"
title: "Borrowing Covenant Monitoring"
artifact_type: "prd"
spec_revision: 2
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
linked_github_repo: "example-lender/treasury-platform"
---

## Problem

Treasury teams at mid-size lenders track loan covenants — debt-service coverage, leverage, security cover — for dozens of borrowings in spreadsheets. Covenant values are retyped by hand from other reports, reviews happen days before lender deadlines, and a mistyped or missed covenant can trigger default clauses on the facility. The team that borrows the money finds out about a breach when the lender does.

## Hypothesis

If covenant compliance is computed automatically from live portfolio data instead of typed into a tracker, treasury leads will catch at-risk covenants before review deadlines because the system flags breaches when the underlying data changes, not when a person remembers to check.

## Scope

```productspec-scope
in:
  - covenant register per borrowing with type, threshold, and review cadence
  - automatic computation of covenant values from existing repayment and outstanding-balance data
  - breach and near-breach alerts ahead of lender review deadlines
  - reviewer confirmation step with a full audit trail
out:
  - lender-facing reporting portal
  - covenant negotiation or amendment workflows
  - automatic communication to lenders
cut:
  - manual entry of computed covenant values. Considered and rejected. The system already holds the source data, and typed values reintroduce the spreadsheet failure mode this work exists to remove.
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: Each borrowing displays its covenants with the current computed value, the threshold, the headroom remaining, and the timestamp of the source data used in the computation.
- id: AC-2
  criterion: When a computed covenant value crosses its configured near-breach threshold, the treasury lead receives an alert at least 10 business days before the lender review date.
- id: AC-3
  criterion: A reviewer can confirm or dispute a computed value before it enters the compliance log, and a dispute requires a written reason.
- id: AC-4
  criterion: The compliance log records the covenant, computed value, source-data timestamps, reviewer, decision, and decision time for every review cycle.
- id: AC-5
  criterion: If source data required for a computation is missing or older than 2 business days, the covenant shows a cannot-compute state naming the missing input instead of presenting a stale value.
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: covenant_reviews_completed_before_lender_deadline_rate
  target: ">= 95%"
  target_status: committed
  window: monthly
- id: SM-2
  metric: reviewer_corrections_per_review_cycle
  target: tbd
  target_status: provisional
  target_owner: Treasury operations lead
  window: monthly, baseline set within 60 days of launch
- id: SM-3
  metric: covenant_breaches_first_detected_by_lender_count
  target: "0"
  target_status: committed
  window: quarterly
```

## Related Artifacts

```productspec-related-artifacts
- type: linear_issue
  url: "https://linear.app/example-lender/project/covenant-monitoring"
  title: "Covenant Monitoring delivery project"
  section_id: acceptance_criteria
  item_id: AC-1
- type: dashboard
  url: "https://analytics.example-lender.com/covenant-compliance"
  title: "Covenant compliance dashboard"
  section_id: success_metrics
  item_id: SM-1
- type: eval_run
  url: "https://ci.example-lender.com/runs/covenant-computation-fixtures"
  title: "Covenant computation fixture run"
  section_id: acceptance_criteria
  item_id: AC-5
```
