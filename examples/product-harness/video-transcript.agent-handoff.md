# Agent Handoff: Video Transcript Search

## Build Contract

Implement ProductSpec revision 1.
Source Product Spec: `examples/product-harness/video-transcript.product-spec.md`.
Satisfy every acceptance criterion before claiming the work is done.
Stay inside scope. If implementation pressure changes product intent, stop and propose a Product Spec update or Decision Trace.

## Product Summary

A video transcript search product lets a researcher submit one video URL, generate a transcript, and search within that transcript for matching passages with timestamps.

## Scope Guardrails

- In: Accept one public video URL and create a transcript job.
- In: Show transcript generation status until the transcript is ready.
- In: Let the researcher search the generated transcript by keyword.
- In: Return matching transcript passages with timestamps and source links.
- Out: Do not build team transcript libraries in this version.
- Out: Do not build semantic search or summarization in this version.
- Out: Do not build private video authentication in this version.
- Cut if needed: Cut transcript export from the first version if transcript search is not complete.

## Must Satisfy

- AC-1: When a researcher submits a supported public video URL, the system creates one transcript job and shows a pending status.
- AC-2: When transcript generation completes, the transcript page shows searchable transcript text.
- AC-3: When the researcher searches for a keyword that appears in the transcript, the page returns matching passages with timestamps.
- AC-4: When the researcher searches for a keyword that does not appear in the transcript, the page shows an empty state instead of an error.

## Evidence The Agent Must Produce

- Verification for AC-1: prove that "When a researcher submits a supported public video URL, the system creates one transcript job and shows a pending status." is true in the built product.
- Verification for AC-2: prove that "When transcript generation completes, the transcript page shows searchable transcript text." is true in the built product.
- Verification for AC-3: prove that "When the researcher searches for a keyword that appears in the transcript, the page returns matching passages with timestamps." is true in the built product.
- Verification for AC-4: prove that "When the researcher searches for a keyword that does not appear in the transcript, the page shows an empty state instead of an error." is true in the built product.

## AI Evals

- EVAL-1: contains, evaluator deterministic, pass threshold 1
  - Case 1
    - Input: Search transcript for renewal pricing
    - Expected: Results include transcript passages containing renewal pricing and timestamps.
  - Case 2
    - Input: Search transcript for a phrase that is absent
    - Expected: Results show no matches without a system error.

## Success Metrics

- SM-1: transcript_search_success_rate targets >= 70% of first transcript searches return at least one clicked result over 14 days after first transcript creation (provisional).
- SM-2: transcript_job_failure_rate targets <= 5% of supported public video URLs fail transcript generation over weekly (committed).

## Existing Evidence And Links

- github_issue for AC-1: Build video transcript search
- github_pr for AC-3: Implement transcript jobs and search
- eval_run for EVAL-1: Transcript search deterministic eval
- dashboard for SM-1: Transcript search success dashboard

## Evidence To Return

- Pull request URL.
- Verification result for each acceptance criterion.
- Eval run result for each AI eval.
- Screenshots or demo link if UI changed.
- Decision Trace if implementation changes product intent.
