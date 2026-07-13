---
spec_format_version: "0.1"
title: "Transcript Search Evidence Loop"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
linked_github_repo: "acme/transcripts"
applies_to:
  - path: "apps/web/src/transcripts/search/"
  - component: "transcript-search"
---

## Problem

Researchers lose time finding exact quotes in long video transcripts because the current transcript page only supports browser text search inside one open page.

## Hypothesis

If researchers can search a transcript and copy timestamped passages from the result list, they will cite video sources faster because the product gives them the exact quote and source location together.

## Scope

```productspec-scope
in:
  - single-transcript keyword search
  - timestamped result links
  - copy passage with timestamp
out:
  - semantic search
  - cross-video search
cut:
  - speaker label extraction
```

## User Experience

https://example.com/transcript-search-prototype

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: User can search the current transcript by phrase and see matching passages with timestamps.
- id: AC-2
  criterion: User can copy a matching passage with the video title and timestamp included.
```

```productspec-ai-evals
- id: EVAL-1
  type: contains
  cases:
    - input: "Find the quote about product judgment."
      expected: "product judgment"
    - input: "Find the passage about compounding product experience."
      expected: "compounding product experience"
  evaluator: deterministic
  pass_threshold: 1
  checks:
    - result contains the requested phrase
    - result includes the timestamp for the passage
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: median_time_to_copy_timestamped_quote
  target: "< 2 minutes"
  target_status: committed
  window: first search session within 14 days after launch
```

## Related Artifacts

```productspec-related-artifacts
- type: github_pr
  url: "https://github.com/acme/transcripts/pull/77"
  title: "Implement transcript search result list"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "./transcript-search.eval-run.json"
  title: "Transcript search phrase containment eval"
  section_id: acceptance_criteria
  item_id: EVAL-1
- type: analytics_snapshot
  url: "https://analytics.example.com/snapshots/transcript-search-day-14"
  title: "Transcript search day 14 quote-copy snapshot"
  section_id: success_metrics
  item_id: SM-1
```
