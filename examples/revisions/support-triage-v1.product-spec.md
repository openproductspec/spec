---
spec_format_version: "0.1"
title: "AI Support Triage"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
linked_github_repo: "productspec/example-support-triage"
---

## Problem

Support leads at B2B SaaS companies lose their morning planning window because urgent tickets are buried among routine product questions.

## Hypothesis

If incoming tickets are automatically labeled by urgency and likely owner, support leads will respond to urgent customer issues faster because the queue starts each day pre-sorted by consequence.

## Scope

```productspec-scope
in:
  - ticket ingestion from the helpdesk API
  - urgency labels
  - owner recommendation
  - confidence score
  - reviewer override
out:
  - auto-replies
  - direct ticket reassignment
  - customer-visible status changes
  - custom routing rules
cut:
  - customer-tier lookup
  - audit-log export
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: New tickets receive urgency, suggested owner, confidence score, and model version within 60 seconds.
- id: AC-2
  criterion: Reviewers can override any urgency label before it changes downstream workflow state.
- id: AC-3
  criterion: Labels below 0.70 confidence are marked `needs_review` and do not trigger escalation.
```

```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.88
  checks:
    - urgency classification identifies urgent tickets
    - non-urgent tickets are not escalated
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: median_time_to_first_human_response
  target: "< 30 minutes"
  window: business hours
- id: SM-2
  metric: suggested_owner_review_rate
  target: ">= 60%"
  window: weekly
- id: SM-3
  metric: false_urgent_escalation_rate
  target: "< 8%"
  window: weekly
```
