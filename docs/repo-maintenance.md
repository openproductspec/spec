# Repo Maintenance

ProductSpec is useful one file at a time, but a real repo eventually has many specs, Agent Runs, Decision Traces, and evidence links. The repo maintenance commands answer the questions an agent fleet or product team asks before and after execution.

## Garden

Use `garden` to scan a repository and see what is ready, blocked, stale, or missing evidence.

```bash
npm exec --package @productspec/parser -- productspec garden .
```

Add `--json` for agents and automation:

```bash
npm exec --package @productspec/parser -- productspec garden . --json
```

The report includes:

- valid and invalid Product Specs
- Agent Run and Decision Trace files
- the spec graph, including buildable specs, blocked specs, waves, contention, and unscoped specs
- missing evidence for `AC-`, `EVAL-`, and `SM-` items
- stale `product_spec_revision` pins in `product_spec` related artifacts
- Agent Run gaps when execution evidence exists but no run receipt references the spec
- Decision Trace links that point at missing or stale Product Spec revisions

`garden` is a read-only command. It does not rewrite specs, create traces, or decide whether the product judgment is good. It tells humans and agents where the repo needs attention.

## Reconcile

Use `reconcile` after an agent run or implementation pass. It compares one Product Spec against an Agent Run receipt and returns the remaining work before completion can be claimed.

```bash
npm exec --package @productspec/parser -- productspec reconcile docs/product-specs/transcript-search.product-spec.md   --against docs/agent-runs/transcript-search.agent-run.json
```

If `--against` is omitted, the command looks for an Agent Run whose `product_spec.path` matches the spec path.

```bash
npm exec --package @productspec/parser -- productspec reconcile docs/product-specs/transcript-search.product-spec.md --json
```

The reconciliation report checks:

- whether the Product Spec validates
- whether the Agent Run validates
- whether the Agent Run pins the current `spec_revision`
- which `AC-`, `EVAL-`, and `SM-` items are missing from `checked_items`
- which checked items failed
- whether passed items have evidence links
- whether drift was detected without a Decision Trace link

`reconcile` is intentionally stricter than `validate-run`. A syntactically valid Agent Run can still be incomplete as execution evidence.

## Serve

Use `serve` when a human wants a quick local dashboard over the same repo scan.

```bash
npm exec --package @productspec/parser -- productspec serve . --port 4317
```

Then open `http://localhost:4317`.

The dashboard is read-only. It is not a hosted service and it does not upload Product Specs anywhere. It renders the same scan that `garden` returns: needs attention, ready for agents, waves, contention, evidence gaps, Agent Run gaps, and Decision Trace gaps.

## How This Fits With Graph

`graph` answers dependency planning for Product Specs.

`garden` wraps `graph` and adds repo health: validation state, evidence gaps, stale revision pins, Agent Run gaps, and Decision Trace gaps.

`reconcile` answers whether one implementation run satisfied one Product Spec revision.

`serve` gives humans a local view of the garden report.

Use them together in an agent workflow:

```bash
npm exec --package @productspec/parser -- productspec garden . --json
npm exec --package @productspec/parser -- productspec graph docs/product-specs --json
npm exec --package @productspec/parser -- productspec handoff docs/product-specs/transcript-search.product-spec.md
npm exec --package @productspec/parser -- productspec init-run docs/product-specs/transcript-search.product-spec.md docs/agent-runs/transcript-search.agent-run.json
npm exec --package @productspec/parser -- productspec reconcile docs/product-specs/transcript-search.product-spec.md --against docs/agent-runs/transcript-search.agent-run.json
```
