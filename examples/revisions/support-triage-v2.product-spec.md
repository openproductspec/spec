---
spec_format_version: "0.1"
title: "AI Support Triage"
artifact_type: "prd"
spec_revision: 2
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-07T00:00:00Z"
linked_github_repo: "productspec/example-support-triage"
---

## Problem

Support leads at B2B SaaS companies lose their morning planning window because account-risk tickets are buried among routine product questions.

## Hypothesis

If incoming tickets are automatically labeled by urgency, customer tier, and likely owner, support leads will respond to account-risk issues faster because the queue starts each day pre-sorted by consequence.

## Scope

```productspec-scope
in:
  - ticket ingestion from the helpdesk API
  - urgency labels
  - customer-tier lookup
  - owner recommendation
  - confidence score
  - reviewer override
  - audit log
out:
  - auto-replies
  - direct ticket reassignment
  - customer-visible status changes
  - custom routing rules
cut:
  - multi-language classification
  - customer-specific routing policy configuration
```

## User Experience

https://example.com/support-triage-dashboard

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: New tickets receive urgency, customer tier, suggested owner, confidence score, and model version within 60 seconds.
- id: AC-2
  criterion: Reviewers can override any label before it changes downstream workflow state.
- id: AC-3
  criterion: Labels below 0.75 confidence are marked `needs_review` and do not trigger escalation.
- id: AC-4
  criterion: Every AI-generated label stores ticket ID, model version, input redaction status, confidence, reviewer action, and timestamp.
```

```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.92
  checks:
    - urgency classification identifies account-risk tickets
    - recall for account-risk tickets is at least 90%
    - owner recommendation matches the expected support queue
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: median_time_to_first_human_response
  target: "< 15 minutes"
  window: business hours
- id: SM-2
  metric: suggested_owner_review_rate
  target: ">= 80%"
  window: weekly
- id: SM-3
  metric: false_account_risk_escalation_rate
  target: "< 5%"
  window: weekly
- id: SM-4
  metric: support_lead_queue_sorting_time_reduction
  target: ">= 50%"
  window: weekly
```
