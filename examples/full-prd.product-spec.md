---
spec_format_version: "0.1"
title: "AI Transcript Search"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-04T00:00:00Z"
updated_at: "2026-07-04T00:00:00Z"
linked_github_repo: "productspec/example"
custom_sections:
  - id: "custom-research-notes"
    label: "Research Notes"
    after: "customer_truth"
---

## Problem

Researchers, analysts, and students use video as primary source material, but long-form video is hard to search, quote, and cite.

## Hypothesis

If transcript search turns video into timestamped source text, researchers will use video more often in written work because the evidence becomes easy to find and verify.

## Scope

```productspec-scope
in:
  - single-video transcript generation
  - transcript search
  - timestamp navigation
  - copyable citations
out:
  - team libraries
  - cross-video semantic search
  - uploaded video files
  - paid usage controls
cut:
  - transcript editing
  - speaker labels
  - folder organization
```

## User Experience

https://example.com/transcript-search-prototype

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: Public YouTube URLs create transcript pages or return actionable errors.
- id: AC-2
  criterion: Transcript pages show video metadata, search, timestamped passages, and copy controls.
- id: AC-3
  criterion: Search highlights matching transcript text.
- id: AC-4
  criterion: Copied passages include source URL and timestamp.
```

```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.9
  checks:
    - returned passage includes the cited text in the source transcript
    - citation timestamp resolves to the source video
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: first_session_transcript_search_rate
  target: ">= 60%"
  window: first session
- id: SM-2
  metric: timestamped_quote_copy_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
- id: SM-3
  metric: seven_day_return_to_create_another_transcript_rate
  target: ">= 20%"
  window: within 7 days of first transcript creation
```

## Customer Truth

Users already solve this by manually scrubbing through video and writing timestamps in notes. The pain is not watching video; it is recovering exact evidence later.

## Research Notes

Early testers describe the product as useful when it saves them from rewatching the same section repeatedly.

## Rollout

Start with public YouTube videos under two hours, then expand length limits after reliability is clear.
