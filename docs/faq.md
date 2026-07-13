# ProductSpec FAQ

## Is ProductSpec just a PRD?

No. A classic PRD is mostly a human handoff. A Product Spec is a human-readable, machine-parseable intent document that can be used by teams, review tools, engineering-spec systems, and AI agents.

ProductSpec keeps the useful parts of a PRD: problem, hypothesis, scope, acceptance criteria, and success metrics. It adds enough structure for downstream tools to preserve intent.

## How is ProductSpec different from OpenSpec or Spec Kit?

ProductSpec sits one layer earlier.

```text
Product Spec -> Engineering Spec -> Code
what / why      how / plan / tasks   implementation
```

OpenSpec and Spec Kit help turn intent into technical plans and tasks. ProductSpec captures the software intent before that planning starts.

## Why Markdown?

Markdown works in Git, pull requests, issues, docs, editors, and agent workflows. It is readable without a special app, easy to diff, and simple for tools to parse.

## Is ProductSpec just a Markdown template?

No. Markdown is the container.

ProductSpec adds the parts that make a spec portable across people, tools, and agents:

- canonical sections
- structured Scope, Acceptance Criteria, AI Evals, Success Metrics, and Related Artifacts
- durable `AC-`, `EVAL-`, and `SM-` IDs
- validation and conformance fixtures
- `spec_revision` for meaningful intent changes
- MCP tools for agents
- graph resolution across dependent specs
- Agent Run receipts for what an agent checked
- Decision Trace for drift, decisions, and learning

A plain Markdown spec can be read by an agent. A Product Spec can be validated, cited, pinned, checked, linked to evidence, and used as a harness contract.

## Do I need ProductSpec.io to use ProductSpec?

No. ProductSpec is an open standard. You can write `.product-spec.md` files by hand, validate them with the CLI, and store them in Git.

[ProductSpec.io](https://productspec.io) provides a free browser editor for teams that prefer a guided authoring experience. The editor is optional.

## Why not just use Jira or Linear?

Jira and Linear are excellent work trackers. They are not the durable source of product intent.

A Product Spec can become epics, issues, or tasks, but the spec should remain the record of the problem, hypothesis, scope, acceptance criteria, and success metrics those tasks serve.

## Where do AI evals live?

AI eval thresholds belong in `acceptance_criteria`.

Acceptance Criteria are the build contract: what must be true before launch. Success Metrics are the market contract: what user or business behavior proves the shipped product mattered after launch.

If the metric is known but the threshold depends on a launch baseline, keep the metric and mark the target as provisional with an owner. That records the open calibration work without pretending a guessed target is committed intent.

When an AI eval should be parsed by tools, write it as a fenced `productspec-ai-evals` block inside Acceptance Criteria. Keep post-launch usage, retention, revenue, or quality outcomes in Success Metrics.

Acceptance Criteria, Success Metrics, and AI evals get durable generated IDs (`AC-1`, `SM-1`, `EVAL-1`) because downstream tools may cite them. Eval cases and optional checks stay un-IDed; cite them positionally if needed.

## What is `spec_revision`?

`spec_revision` is an optional positive integer in frontmatter:

```yaml
spec_revision: 2
```

It tracks the revision of this specific Product Spec's intent. It is separate from `spec_format_version`, which tracks the ProductSpec standard version.

Use `spec_revision` when scope, user experience, acceptance criteria, or success metrics materially change. Git remains the detailed history.

## When should I not use ProductSpec?

Do not use ProductSpec for every act of building.

For a quick solo script, throwaway prototype, or tiny internal tweak, it may be faster to build directly. ProductSpec is for consequential software work where intent needs to survive handoff across people, tools, or AI agents.

## Does ProductSpec define product quality?

No. ProductSpec defines a portable structure. It does not define product taste or decide whether a spec is good.

Teams and products can build opinionated review layers on top of the standard.

## Can ProductSpec live in Git?

Yes. That is one of the best starting points.

Put Product Specs in a `specs/` directory, validate them in CI, and link issues, engineering specs, and pull requests back to the Product Spec revision they implement.
