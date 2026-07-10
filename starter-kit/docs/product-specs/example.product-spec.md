---
spec_format_version: "0.1"
title: "Example Product Spec"
artifact_type: "prd"
spec_revision: 1
author: "Your team"
created_at: "2026-07-09T00:00:00Z"
updated_at: "2026-07-09T00:00:00Z"
linked_github_repo: "your-org/your-repo"
applies_to:
  - path: "apps/web/src/example/"
  - component: "example-feature"
---

## Problem

Support leads at B2B SaaS companies lose their morning planning window because urgent, account-risk tickets are buried among routine product questions.

## Hypothesis

If incoming tickets are automatically labeled by urgency, customer tier, and likely owner, support leads will respond to account-risk issues faster because the queue starts each day pre-sorted by consequence.

## Scope

```productspec-scope
in:
  - ticket ingestion
  - urgency labels
  - customer-tier lookup
  - owner recommendation
  - confidence score
  - reviewer override
out:
  - auto-replies
  - direct ticket reassignment
cut:
  - custom routing rules
```

## User Experience

Reviewer console showing each new ticket with urgency, customer tier, suggested owner, confidence score, and an override control.

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: New tickets receive urgency, customer tier, suggested owner, confidence score, and model version within 60 seconds.
- id: AC-2
  criterion: Reviewers can override urgency, customer tier, or suggested owner before downstream workflow state changes.
```

```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Customer says their renewal is blocked because SSO has been down for two days."
      expected: "Classify as high urgency with account-risk rationale."
    - input: "Customer asks where to find the invoice export setting."
      expected: "Classify as normal urgency unless customer tier or context indicates account risk."
  evaluator: llm
  pass_threshold: 0.9
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: median_time_to_first_human_response_for_account_risk_tickets
  target: "< 15 minutes"
  window: business hours during first 30 days after launch
- id: SM-2
  metric: reviewer_label_override_rate
  target: "< 20%"
  window: first 30 days after launch
```

## Related Artifacts

```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/your-org/your-repo/issues/1"
  title: "Build ticket triage labels"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "https://evals.example.com/runs/ticket-triage-baseline"
  title: "Ticket triage baseline eval"
  section_id: acceptance_criteria
  item_id: EVAL-1
- type: dashboard
  url: "https://analytics.example.com/dashboards/ticket-triage"
  title: "Ticket triage launch metrics"
  section_id: success_metrics
  item_id: SM-1
```
