# Product Harness

ProductSpec is the open standard for product intent. It can act as a Product Harness for AI-native software work.

A coding harness helps an agent write, test, and repair code. A Product Harness keeps that work attached to the product decision: what to build, what not to build, how to prove completion, and when to stop because intent has changed.

```text
Product Harness
  Product Spec
  Related Artifacts
  Agent Run
  Decision Trace
    |
    v
Coding harnesses and agents
  Claude Code
  Codex
  Cursor
  GitHub Actions
  OpenSpec / Spec Kit
    |
    v
Code, tests, evals, evidence, learning
```

ProductSpec does not replace coding tools. It gives them a product contract.

Generate the agent-facing build contract with:

```bash
productspec handoff specs/example.product-spec.md
```

MCP-aware agents can call `get_agent_handoff` to get the same generated view.

After specs start accumulating, use the repo-level commands to operate the harness:

```bash
productspec garden .
productspec reconcile specs/example.product-spec.md --against docs/agent-runs/example.agent-run.json
productspec serve . --port 4317
```

`garden` finds missing evidence, stale revision pins, run gaps, and graph issues. `reconcile` checks whether one Agent Run actually satisfied one Product Spec revision. `serve` gives humans a local read-only dashboard over the same report.

## What the Product Harness controls

A Product Harness gives people and agents:

- Intent: `Problem`, `Hypothesis`, and `Product Summary`.
- Boundaries: structured `Scope` with `in`, `out`, and `cut`.
- Completion checks: durable `AC-<number>` acceptance criteria and `EVAL-<number>` AI evals.
- Outcome checks: durable `SM-<number>` success metrics.
- Evidence targets: `Related Artifacts` that connect pull requests, tests, eval runs, dashboards, and designs back to the spec.
- Change memory: `spec_revision`, Agent Run, and Decision Trace when implementation pressure changes intent.

## How this differs from an agent intent harness

Product Harness is the top-level frame.

When a coding agent uses ProductSpec through MCP, a skill, or an Agent Handoff, ProductSpec acts as an intent harness for that agent. The agent receives structured context, scope guardrails, completion checks, evidence expectations, and a revision pin.

That agent-specific use case is important, but the Product Harness is broader. It also serves founders, PMs, designers, engineers, reviewers, and executives who need the same product intent to survive handoff.

## What this does not do

ProductSpec does not decide whether the product is good.

ProductSpec does not tell an agent how to code.

ProductSpec does not collect production traces or run evals by itself.

It defines the product contract that downstream tools can read, validate, cite, execute against, and attach evidence to.

## Recommended language

Use this when describing the standard:

```text
ProductSpec is the open standard for product intent. It acts as a Product Harness for AI-native software work: what to build, what not to build, how to prove completion, and when intent changes.
```

Use this when describing agents:

```text
For coding agents, ProductSpec provides an intent harness: structured context, scope guardrails, acceptance criteria, evals, evidence targets, and revision checks.
```
