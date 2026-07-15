# Delivery Slices: The Intra-Bet Delivery Unit

`docs/productspec-to-tickets.md` maps one Product Spec to one delivery-tracker container: one Epic, one Project. That mapping holds when the spec is a single launch-worthy bet.

It does not hold when a bet has to ship as several pieces that individually demo but jointly launch. This doc names that shape — the **Delivery Slice** — and shows how it projects into the same ticket layer without changing the Product Spec format.

## The Gap

A Product Spec's `acceptance_criteria` are pre-launch build gates for the whole bet. `success_metrics` are post-launch outcomes for the whole bet. Both assume the bet ships as one unit that a user can actually use.

Some bets cannot ship as one unit inside a single delivery cycle. A compliant lending flow, for example, is not usable to a borrower until both a borrower-facing surface and a back-office origination surface exist — half the flow has no independent value. Teams still want to build and demo each surface on a weekly cadence, because a multi-week undemoed build is a different (and worse) kind of risk. What they need is a unit smaller than the spec, with its own build gate and its own weekly demo, that does not pretend to be its own launch-worthy bet.

Without a name for this unit, teams reach for one of two workarounds:

- **Fake independence.** Give each piece its own Product Spec, its own `acceptance_criteria`, its own launch gate. This is a fiction: the piece cannot launch alone, and a reviewer reading the spec in isolation cannot tell that.
- **Hide the decomposition.** Fold all the pieces into one Engineering Spec or plan with no spec-level visibility. This loses the weekly-demo discipline and the PM-legible slicing that made a plan reviewable.

## The Unit

A **Delivery Slice** is a build-gated, weekly-demoed unit of work that implements a subset of one Product Spec's `acceptance_criteria` (or unwritten). Properties:

- It sits *below* exactly one Product Spec. It is never a spec of its own.
- It carries build gates (pass/fail, pre-demo), not a launch gate. It does not get its own `success_metrics`.
- It has a mandatory demo, at a fixed cadence (commonly weekly), to a named validator — a person who can say "this slice does what it claims" without shipping it to a customer.
- Several Delivery Slices under the same Product Spec share that spec's launch gate and `success_metrics`. No single slice satisfies either; the set does.
- It is ordered relative to its sibling slices by the engineering plan, not by the spec graph (see Reconciliation, below).

A Delivery Slice is not a new canonical section, frontmatter field, or `related_artifacts` type. It is a documented pattern for the existing ticket-projection layer.

## Projecting Delivery Slices Into Tickets

Apply `productspec-to-tickets.md`'s element-by-element mapping once per slice instead of once per spec:

| ProductSpec element | Tracker object (per slice) |
| --- | --- |
| One Product Spec | N Epics/Projects, one per Delivery Slice |
| Subset of `AC-<number>` implemented by this slice | Cited in the slice's Epic/Project description: `Implements AC-1, AC-2 of revision 3` |
| This slice's demo gate | The Epic/Project's own milestone — a named validator, a real dataset, a pass condition. Not the spec's launch gate. |
| The spec's launch gate | Recorded once, on whichever slice's Epic/Project is expected to complete last, or in a lightweight parent tracker object if the tracker supports one. Never duplicated onto every slice. |
| `success_metrics` | Cited once, on the spec, same as today. Not attached to any single slice. |

A Linear Project description for one slice, in the existing style:

```text
Origination system — case creation and document capture for the compliant lending flow.

Spec: lending-platform/docs/product-specs/compliant-origination.product-spec.md (revision 3)
Implements: AC-1, AC-2, AC-4
Delivery Slice 1 of 2. Demo gate: ops lead reviews one full case walkthrough on staging data, weekly.
Not independently launchable — ships jointly with Delivery Slice 2 (borrower app).
```

The sibling slice cites the same spec revision and the remaining criteria:

```text
Borrower app — application intake and status view for the compliant lending flow.

Spec: lending-platform/docs/product-specs/compliant-origination.product-spec.md (revision 3)
Implements: AC-3, AC-5
Delivery Slice 2 of 2. Demo gate: product lead reviews one full application walkthrough, weekly.
Not independently launchable — ships jointly with Delivery Slice 1 (origination system).
```

The spec's `related_artifacts` block links back to both, the same way it would link to a single Epic/Project today — no new `type` or `relation` value required:

```yaml
- type: linear_issue
  url: "https://linear.app/example-lender/project/origination-system"
  title: "Delivery Slice 1 of 2 — origination system"
  section_id: acceptance_criteria
  item_id: AC-1
- type: linear_issue
  url: "https://linear.app/example-lender/project/borrower-app"
  title: "Delivery Slice 2 of 2 — borrower app"
  section_id: acceptance_criteria
  item_id: AC-3
```

The convention is entirely in the free-text ticket description (`Delivery Slice N of M`, `Not independently launchable`) and in which AC subset each slice cites. Nothing about the Product Spec file changes.

## What Not To Do

- Do not give a Delivery Slice its own Product Spec. If it needs `acceptance_criteria` of its own that stand outside the parent bet, it is not a slice — it is a separate bet, and belongs in the graph as its own spec.
- Do not attach `success_metrics` to a single slice. Metrics belong to the bet, not the piece.
- Do not let a slice's demo gate substitute for the spec's launch gate. A passed demo is evidence the slice works; it is not evidence the bet is usable.
- Do not use `depends_on` / `blocks` between sibling slices of the same spec. Those relations describe ordering *between* bets. Ordering *within* one bet's slices is an engineering-plan concern — see Reconciliation, below.
- Do not skip naming the slices just because the tracker only has one container type. Even a single Epic split into two clearly-labeled milestones is better than an undifferentiated backlog.

## Reconciliation With The Graph

`docs/graph.md`'s `depends_on` / `blocks` / `supersedes` edges resolve relationships **between** Product Specs — peer bets, each independently launch-worthy, each with its own `acceptance_criteria` and `success_metrics`. That is the graph's whole job: tell you which bets are `buildable` now and which are `blocked` waiting on another bet.

A Delivery Slice is a different altitude. It is **within** one bet, not between two. Two slices of the same spec are not "peer specs that gate each other" — they are co-parts of one launch-worthy unit that happen to be demoed and built on separate cadences. Running them through the graph tool would be a category error: the graph would either (a) refuse to see them, since they are not `product_spec` artifacts, or (b) if forced in as fake specs, report them as `buildable` independently — which is exactly the fiction this doc exists to prevent.

Keep both altitudes and do not conflate them:

- **Inter-bet (the existing graph):** peer Product Specs, `depends_on` / `blocks` between files, resolved by `productspec graph`.
- **Intra-bet (Delivery Slices, this doc):** pieces of one Product Spec, ordered by the engineering plan or ticket cycle, sharing one launch gate and one set of `success_metrics`.

A bet can be blocked on another bet (inter-bet, graph-visible) while simultaneously being decomposed into slices for its own delivery (intra-bet, plan-visible). The two mechanisms answer different questions and neither should be asked to answer the other's.
