# From Product Spec To Jira Or Linear Tickets

ProductSpec sits upstream of work trackers. A Product Spec records the intent; Jira or Linear records the execution. This guide shows how to project a Product Spec into tickets without forking the intent into two competing copies.

Vocabulary note: Jira and Linear use different nouns for the same shapes. This guide uses both where they diverge.

| Shape | Jira | Linear |
| --- | --- | --- |
| Container for one delivery effort | Epic | Project |
| Unit of work | Story / Task | Issue |
| Grouping above delivery efforts | Initiative | Initiative |

## The One Rule

> Tickets reference the spec. They do not copy it.

The naive mapping — paste `AC-1` into the ticket's acceptance-criteria field — duplicates intent into the tracker. The two copies fork within a sprint: someone edits the ticket, the spec does not change, and there are now two versions of the truth. Downstream readers, including AI agents, cannot tell which one is binding.

A ticket needs four things, all of them pointers or status:

1. A one-line summary in plain language.
2. A link to the Product Spec file, plus the `spec_revision` being implemented.
3. The IDs of the items it implements, cited, not pasted: `Implements AC-1, AC-3 of revision 2`.
4. Live execution state: assignee, status, cycle or sprint.

Everything else — the criteria text, the scope boundaries, the metric definitions — stays in the spec, which is the point. When a ticket-level scope question comes up, the answer is a link, not a rewrite.

## Direction Of Change

The mapping is one-way. Requirement changes go spec-first, tracker-second:

1. Intent changes → update the Product Spec, increment `spec_revision`, optionally record a Decision Trace.
2. Then update or re-cut the affected tickets, citing the new revision.

Because every ticket cites the `spec_revision` it was cut from, stale tickets are mechanically detectable after a revision — any open ticket citing revision 1 after the spec moves to revision 2 needs review. A tool or a person can find them; nobody has to remember.

Avoid bidirectional sync tools that write ticket edits back into the spec. They automate the fork instead of preventing it.

## Element-By-Element Mapping

| ProductSpec element | Tracker object | What goes in the ticket |
| --- | --- | --- |
| Product Spec (whole document) | Epic (Jira) / Project (Linear) | One-line summary, spec link, `spec_revision`, launch gate as the milestone |
| `scope` (`in` / `out` / `cut`) | Nothing directly | Scope stays in the spec. `in` items suggest the ticket breakdown; `out` and `cut` answer "why is there no ticket for X" by link |
| `AC-<number>` | Cited in ticket descriptions | `Implements AC-2` — an ID reference, never the criterion text |
| `EVAL-<number>` | Pre-launch testing or eval task | A task that runs the eval and records the result, citing the ID |
| `SM-<number>` | Post-launch follow-up work and dashboard links | A task to instrument or read the metric; for `provisional` targets, a task owned by the `target_owner` to commit the target |
| `related_artifacts` | The return path | `jira_issue` / `linear_issue` entries in the spec link back to the tickets, closing the loop in the durable record |

## Worked Example

[`examples/lending-covenant-monitoring.product-spec.md`](../examples/lending-covenant-monitoring.product-spec.md) is a lending-workflow spec at `spec_revision: 2` with committed and provisional metrics and a `Related Artifacts` block.

A Linear Project (Jira Epic) description projected from it:

```text
Covenant Monitoring — automatic covenant compliance from live portfolio data.

Spec: treasury-platform/docs/product-specs/lending-covenant-monitoring.product-spec.md (revision 2)
Implements: AC-1 through AC-5
Launch gate: treasury lead reviews one full covenant cycle on production data
Post-launch: SM-1, SM-3 committed; SM-2 baseline owned by Treasury operations lead
```

An individual issue under it:

```text
Reviewer confirmation step for computed covenant values

Implements AC-3, AC-4 of revision 2.
Spec: lending-covenant-monitoring.product-spec.md
```

The spec's `Related Artifacts` block then links back:

```yaml
- type: linear_issue
  url: "https://linear.app/example-lender/project/covenant-monitoring"
  title: "Covenant Monitoring delivery project"
  section_id: acceptance_criteria
  item_id: AC-1
```

Ticket links live in the spec, spec links live in the tickets, and each system holds only what it is the system of record for.

## If Agents Implement The Spec

When a coding agent consumes the Product Spec directly, the ticket layer usually thins out. The agent's implementation plan becomes the real decomposition of the work, and fine-grained tickets stop being the unit of execution. Teams working this way tend to keep roadmap-level objects — the Epic or Project with its spec link and milestone — and generate or skip the ticket layer beneath it, reserving individual tickets for reactive work such as bugs and incidents that has no spec behind it.

The mapping above still holds; there is simply less of it. The Epic or Project remains the projection of the spec, and `related_artifacts` still closes the loop to whatever tracking objects exist.

## What Not To Do

- Do not paste acceptance-criteria text into tickets. Cite `AC-<number>` and link.
- Do not maintain scope in two places. The spec's `scope` block is the only scope.
- Do not let ticket edits change intent silently. Intent changes are spec revisions.
- Do not bulk-sync bidirectionally. The spec is the record of intent; the tracker is the record of execution.
- Do not cut tickets from an unmerged or unreviewed spec. Project from the spec revision your team actually committed to.
