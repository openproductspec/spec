# ProductSpec Examples

Start here if you want to see ProductSpec as a working artifact rather than a schema.

`minimal.product-spec.md` shows the smallest complete Product Spec. Richer examples add structured Scope, AI eval blocks, optional sections, and revision history.

## Which Example Should I Read?

| Example | Use this when you want to see |
| --- | --- |
| [`minimal.product-spec.md`](minimal.product-spec.md) | The smallest complete Product Spec. |
| [`ai-support-triage.product-spec.md`](ai-support-triage.product-spec.md) | Structured AI evals inside Acceptance Criteria. |
| [`agent-coded-feature.product-spec.md`](agent-coded-feature.product-spec.md) | A feature intended to be handed to an AI coding agent. |
| [`conformance/valid/with-traceability.product-spec.md`](../conformance/valid/with-traceability.product-spec.md) | `applies_to` plus `Related Artifacts` traceability. |
| [`consumer-family-calendar.product-spec.md`](consumer-family-calendar.product-spec.md) | A consumer UX feature with a prototype link. |
| [`enterprise-approval-workflow.product-spec.md`](enterprise-approval-workflow.product-spec.md) | A cross-functional enterprise workflow. |
| [`internal-webhook-replay-api.product-spec.md`](internal-webhook-replay-api.product-spec.md) | A non-UI internal API. |
| [`platform-cache-migration.product-spec.md`](platform-cache-migration.product-spec.md) | Platform work with no conventional user-facing UI. |
| [`provisional-success-metric.product-spec.md`](provisional-success-metric.product-spec.md) | A realistic provisional Success Metric with `target: tbd` and `target_owner`. |
| [`converted-customer-handoff.product-spec.md`](converted-customer-handoff.product-spec.md) | A real PRD converted to a Product Spec: `applies_to`, structured scope, provisional targets, `related_artifacts`, and `tool_metadata` in one file. |
| [`full-prd.product-spec.md`](full-prd.product-spec.md) | Optional sections and a richer PRD-style artifact. |
| [`hypothesis.product-spec.md`](hypothesis.product-spec.md) | A smaller bet framed as a hypothesis artifact. |
| [`revisions/`](revisions/) | A Product Spec evolving from `spec_revision: 1` to `spec_revision: 2`. |
| [`decision-traces/`](decision-traces/) | Companion Decision Trace examples for decisions, drift, and revisions. |
| [`evidence-loop/`](evidence-loop/) | Product Spec evidence links across a PR, eval run, analytics snapshot, and Decision Trace. |
| [`../starter-kit/`](../starter-kit/) | Copyable repo setup with Product Spec, Decision Trace, agent instructions, PR template, and CI. |

## What To Notice

- `problem` and `hypothesis` explain the product bet.
- `scope` separates what ships now from what is deliberately excluded. Use `productspec-scope` when tools should parse it.
- `acceptance_criteria` defines the build contract and uses generated `AC-<number>` IDs.
- `success_metrics` defines the market contract after launch and uses generated `SM-<number>` IDs. Targets may be `committed`, or `provisional` with a named owner when the baseline is not yet known.
- AI evals use generated `EVAL-<number>` IDs; eval cases and optional checks stay un-IDed.
- `user_experience` is optional and points to the externally observable experience when one exists.
- `spec_revision` in frontmatter tracks the revision of this Product Spec's intent, separate from `spec_format_version`.
- `applies_to` and `Related Artifacts` connect Product Spec intent to code, issues, pull requests, eval runs, dashboards, designs, and other durable records.
- The evidence-loop example shows how `AC-`, `EVAL-`, and `SM-` IDs connect to implementation, eval, and post-launch evidence.

## Validate An Example

```bash
npm exec --package @productspec/parser -- productspec validate examples/minimal.product-spec.md
```

From a repo checkout:

```bash
npm run validate -- examples/minimal.product-spec.md
```
