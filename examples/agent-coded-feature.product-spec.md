---
spec_format_version: "0.1"
title: "Agent-Coded Saved Search Alerts"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-08T00:00:00Z"
updated_at: "2026-07-08T00:00:00Z"
---

## Problem

Researchers who repeatedly search the same transcript library miss newly uploaded videos that match their topic because the product requires them to remember and rerun searches manually.

## Hypothesis

If researchers can save a transcript search and receive a weekly alert when new matching passages appear, they will return to the library more often because the product remembers their research thread for them.

## Scope

```productspec-scope
in:
  - saved search creation from the search results page
  - weekly email alert
  - alert unsubscribe link
  - account-level saved search list
  - agent-generated implementation plan
out:
  - real-time alerts
  - team-shared saved searches
  - Slack notifications
cut:
  - custom alert schedules
```

## User Experience

https://example.com/saved-search-alerts-prototype

## Acceptance Criteria

- Users can save the current query from the transcript search results page.
- Saved searches appear in account settings with created date, last run date, and unsubscribe control.
- The weekly alert includes matching video title, passage excerpt, timestamp link, and query text.
- Unsubscribed searches stop sending alerts within one hour.
- The implementation pull request links back to this Product Spec revision.

```productspec-ai-evals
- id: passage_match_quality
  type: rubric
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm_judge
  pass_threshold: 0.86
  checks:
    - returned passage is relevant to the saved query
    - passage excerpt is grounded in transcript content
    - timestamp link points to the cited passage
```

## Success Metrics

```productspec-success-metrics
- id: alert_return_rate
  metric: weekly_alert_clickthrough_rate
  target: ">= 18%"
  window: first 4 weeks after saved search creation
- id: repeat_search_reduction
  metric: repeated_manual_search_rate
  target: "<= 60% of baseline"
  window: 30 days after launch
```
