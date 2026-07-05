---
spec_format_version: "0.1"
title: "YouTube Transcription Search"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-04T00:00:00Z"
updated_at: "2026-07-04T00:00:00Z"
---

## Problem

Researchers using YouTube videos as source material spend too much time scrubbing through long videos to find exact quotes they can cite.

## Hypothesis

If we provide searchable transcripts with timestamped passages, researchers will treat YouTube videos as usable source material because they can find, verify, and cite the right moment quickly.

## Scope

In: paste a YouTube URL, generate a transcript, search within it, jump to timestamps, and copy passages with citations.

Out: multi-video projects, team workspaces, non-YouTube video imports, and automated citation-format switching.

Cut from this version: speaker diarization and transcript editing.

## Surface

https://example.com/transcript-search-prototype

## Acceptance Criteria

- Given a valid public YouTube URL, the user can create a transcript page.
- Search returns matching transcript passages with timestamps.
- Clicking a result jumps the video to the matching timestamp.
- Copy passage copies transcript text plus the video URL and timestamp.
- Empty, private, or unsupported videos return a clear error.

## Success Metrics

- 60% of first-time users who create a transcript run at least one search.
- 35% of first-time users copy at least one timestamped passage.
- Median time from URL paste to first copied passage is under 3 minutes.
