---
spec_format_version: "0.1"
title: "Internal Webhook Replay API"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
linked_github_repo: "productspec/example-webhooks"
---

## Problem

Developer support engineers cannot safely replay failed customer webhooks without asking an infrastructure engineer to run manual database queries and scripts.

## Hypothesis

If support engineers have a permissioned internal API for replaying failed webhooks, customers will recover integrations faster because the support team can resolve common delivery failures without engineering escalation.

## Scope

In: internal API endpoint for replaying one failed webhook event by ID, permission check, replay audit log, idempotency guard, and structured success or failure response.

Out: customer-facing UI, bulk replay, replay scheduling, editing payloads before replay, and replaying events older than 30 days.

Cut from this version: automatic retry policy changes and customer self-serve replay.

## Acceptance Criteria

- Given a support engineer with `webhook_replay` permission, when they call the replay endpoint with a failed webhook event ID, the system enqueues exactly one replay job.
- Given a user without `webhook_replay` permission, the endpoint returns `403` and does not enqueue a replay job.
- Given an event that has already been replayed in the last 10 minutes, the endpoint returns the existing replay job ID instead of creating a duplicate job.
- Given an event older than 30 days, the endpoint returns a clear `event_not_replayable` error.
- Every replay attempt records actor ID, event ID, customer ID, replay job ID, timestamp, and result in the audit log.
- API evals: on a fixture set covering success, permission failure, duplicate replay, expired event, and missing event, the endpoint returns the expected status code and machine-readable error code in 100% of cases.

## Success Metrics

- Median time from customer webhook escalation to replay attempt falls below 10 minutes.
- At least 70% of eligible failed webhook escalations are resolved without infrastructure engineering involvement.
- Duplicate replay jobs remain below 0.5% of replay attempts.
- No replay attempt is executed without an audit log entry.
