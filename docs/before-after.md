# Before And After ProductSpec

ProductSpec is easiest to understand by comparing it to the kind of product document many teams already write.

## Before: Loose PRD Excerpt

```md
# AI Support Triage

We need to make support more efficient with AI. The support queue is noisy and people are spending too much time figuring out what matters. The system should classify tickets, route them better, and help agents respond quickly.

Success means faster response times and better customer experience. We should use AI safely and make sure it works well before launch.

Phase 1 should include ticket classification and routing. We can add auto-replies later.
```

This is readable, but hard for downstream tools or agents to execute:

- The user is vague.
- Scope is mixed with solution ideas.
- Acceptance criteria are not pass/fail.
- AI evals are implied but not specified.
- Success metrics are not measurable.

## After: ProductSpec Version

````markdown
---
spec_format_version: "0.1"
title: "AI Support Triage"
artifact_type: "prd"
spec_revision: 1
author: "Support Product"
created_at: "2026-07-08T00:00:00Z"
updated_at: "2026-07-08T00:00:00Z"
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
  - audit log
out:
  - auto-replies
  - direct ticket reassignment
  - customer-visible status changes
cut:
  - custom routing rules
```

## Acceptance Criteria

- Every ingested ticket receives urgency, customer tier, likely owner, confidence score, and rationale fields.
- Low-confidence classifications require human review before they affect queue priority.
- Reviewer overrides are written to the audit log.

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
    - rationale cites ticket content without inventing facts
```

## Success Metrics

```productspec-success-metrics
- id: account_risk_response_time
  metric: median_time_to_first_human_response
  target: "< 15 minutes"
  window: business hours
```
````

The ProductSpec version keeps the document readable while making the parts that machines must execute or compare explicit.
