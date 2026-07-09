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

Support leads at B2B SaaS companies lose their morning planning window because urgent, account-risk tickets are buried among routine product questions.

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
  - training on private ticket bodies outside the customer's workspace
cut:
  - multi-language classification
  - custom team-specific routing rules
```

## User Experience

https://example.com/support-triage-dashboard

## Acceptance Criteria

- New tickets receive urgency, customer tier, suggested owner, confidence score, and model version within 60 seconds.
- Reviewers can override any label before it changes downstream workflow state.
- Labels below 0.75 confidence are marked `needs_review` and do not trigger escalation.
- Every AI-generated label stores ticket ID, model version, input redaction status, confidence, reviewer action, and timestamp.

```productspec-ai-evals
- id: account_risk_urgency
  type: rubric
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm_judge
  pass_threshold: 0.92
  checks:
    - urgency classification identifies account-risk tickets
    - owner recommendation matches the expected support queue
    - confidence below threshold is marked needs_review
- id: pii_redaction_regression
  type: deterministic
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: automated_test
  pass_threshold: 1
  checks:
    - no private customer data appears in model-visible input
    - redaction placeholders preserve enough context for classification
```

## Success Metrics

```productspec-success-metrics
- id: account_risk_response_time
  metric: median_time_to_first_human_response
  target: "< 15 minutes"
  window: business hours
- id: suggested_owner_review_rate
  metric: suggested_owner_review_rate
  target: ">= 80%"
  window: weekly
- id: false_escalation_rate
  metric: false_account_risk_escalation_rate
  target: "< 5%"
  window: weekly
- id: queue_sorting_time_reduction
  metric: support_lead_queue_sorting_time_reduction
  target: ">= 50%"
  window: weekly
```
