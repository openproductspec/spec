---
spec_format_version: "0.1"
title: "AI Transcript Search"
artifact_type: "prd"
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

In: single-video transcript generation, transcript search, timestamp navigation, and copyable citations.

Out: team libraries, cross-video semantic search, uploaded video files, and paid usage controls.

Cut: transcript editing, speaker labels, and folder organization.

## Surface

https://example.com/transcript-search-prototype

## Acceptance Criteria

- Public YouTube URLs create transcript pages or return actionable errors.
- Transcript pages show video metadata, search, timestamped passages, and copy controls.
- Search highlights matching transcript text.
- Copied passages include source URL and timestamp.
- AI evals: on a 50-query golden set, at least 90% of returned passages include the cited text in the source transcript.

## Success Metrics

- 60% of first-time transcript creators run search.
- 35% copy at least one timestamped passage.
- 20% return within 7 days to create another transcript.

## Customer Truth

Users already solve this by manually scrubbing through video and writing timestamps in notes. The pain is not watching video; it is recovering exact evidence later.

## Research Notes

Early testers describe the product as useful when it saves them from rewatching the same section repeatedly.

## Rollout

Start with public YouTube videos under two hours, then expand length limits after reliability is clear.
