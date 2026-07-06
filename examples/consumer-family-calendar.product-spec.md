---
spec_format_version: "0.1"
title: "Family Calendar Conflict Alerts"
artifact_type: "prd"
author: "ProductSpec"
created_at: "2026-07-06T00:00:00Z"
updated_at: "2026-07-06T00:00:00Z"
---

## Problem

Parents coordinating shared family calendars miss school pickups, practices, and appointments because conflicts are only visible after someone opens the calendar.

## Hypothesis

If the calendar warns parents when a new event conflicts with an existing family obligation, families will resolve schedule conflicts earlier because the issue appears at the moment of planning.

## Scope

In: shared calendar conflict detection, mobile push alert, conflict detail view, one-tap "ask partner" message, and dismiss state.

Out: automatic rescheduling, childcare booking, school calendar import, and recurring-event cleanup.

Cut from this version: location-aware travel-time conflicts.

## User Experience

https://example.com/family-calendar-conflict-prototype

## Acceptance Criteria

- Creating or editing an event checks for overlapping events on selected family calendars.
- A detected conflict shows the conflicting event title, owner, time, and calendar.
- Parents can send a prefilled message to the other event owner from the conflict detail view.
- Dismissing a conflict suppresses duplicate alerts for the same event pair unless either event time changes.
- Private event titles remain hidden unless the viewer already has access to that calendar.

## Success Metrics

- 45% of detected conflicts receive an action: message partner, edit event, or dismiss.
- Missed-event self-reports among weekly active families decline by 20%.
- Fewer than 3% of weekly active users disable conflict alerts.
- Median time from conflict creation to first action is under 30 minutes.
