---
spec_format_version: "0.1"
title: "Support SLA Analytics Pipeline"
artifact_type: "prd"
spec_revision: 1
author: "ProductSpec"
created_at: "2026-07-13T00:00:00Z"
updated_at: "2026-07-13T00:00:00Z"
linked_github_repo: "example/support-analytics"
applies_to:
  - path: "pipelines/support_sla/"
  - path: "dashboards/support_lead/"
---

## Problem

Support leads at B2B SaaS companies cannot trust their daily SLA dashboard because ticket events arrive late, reopen events are counted inconsistently, and the dashboard does not show when the underlying pipeline is stale.

## Hypothesis

If support leads get a trustworthy daily SLA dataset with freshness, reopen handling, and visible data-quality status, they will make staffing and escalation decisions earlier because the morning dashboard will reflect yesterday's ticket reality.

## Scope

```productspec-scope
in:
  - daily SLA fact table for first response and resolution time
  - late-arriving ticket event handling
  - reopen event logic
  - 90-day historical backfill
  - pipeline freshness and failure status surfaced to the dashboard
out:
  - agent performance compensation rules
  - customer-facing SLA reporting
  - real-time streaming updates
cut:
  - predictive staffing recommendations
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: The pipeline produces a daily SLA fact table by 06:00 local workspace time for every active support workspace.
- id: AC-2
  criterion: Late-arriving ticket events are incorporated into the next daily run and update the affected SLA rows without duplicating tickets.
- id: AC-3
  criterion: Reopened tickets are counted against resolution SLA only when the reopen event occurs within 7 days of the original resolution.
- id: AC-4
  criterion: The backfill job rebuilds the prior 90 days and reports row counts, failed workspace count, and completion timestamp.
- id: AC-5
  criterion: Dashboard users can see whether the SLA dataset is fresh, delayed, or failed before reading the metric cards.
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: daily_sla_dataset_freshness
  target: ">= 99% of active workspaces updated by 06:00 local workspace time"
  target_status: committed
  window: trailing 30 days
- id: SM-2
  metric: support_lead_dashboard_trust
  target: ">= 80% of surveyed support leads agree the SLA dashboard is reliable for morning staffing decisions"
  target_status: provisional
  target_owner: "Support analytics PM"
  window: first 30 days after launch
- id: SM-3
  metric: manual_sla_export_requests
  target: "<= 50% of baseline"
  target_status: provisional
  target_owner: "Support analytics PM"
  window: 30 days after launch
```

## Related Artifacts

```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/example/support-analytics/issues/84"
  title: "Build support SLA analytics pipeline"
  section_id: acceptance_criteria
  item_id: AC-1
- type: github_pr
  url: "https://github.com/example/support-analytics/pull/112"
  title: "Add SLA fact table and backfill"
  section_id: acceptance_criteria
  item_id: AC-4
- type: dashboard
  url: "https://analytics.example.com/support/sla-health"
  title: "SLA dataset freshness dashboard"
  section_id: success_metrics
  item_id: SM-1
```
