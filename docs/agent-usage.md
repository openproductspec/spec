# Use ProductSpec With Agents

ProductSpec is the Product Harness for the work. For coding agents, it provides an intent harness.

A Product Spec tells an agent what should be built, why it matters, what is in scope, what must pass before launch, and how the outcome will be measured later.

## Load The ProductSpec Skill

Load `skills/productspec/SKILL.md` before asking an agent to implement from a Product Spec.

For Codex, reference the skill directly in the prompt or keep it in the repo:

```md
Use `skills/productspec/SKILL.md` before planning or implementing work governed by a `.product-spec.md` file.
```

For Claude Code, copy the same instruction into `CLAUDE.md`.

For Cursor or other repo agents, copy the same instruction into the repository's agent rules or project instructions.

For repositories with an `AGENTS.md`, add:

```md
# ProductSpec

Product Specs are the product contract for consequential software work.

Before planning, coding, testing, or changing scope, load `skills/productspec/SKILL.md` and read the relevant `.product-spec.md` file.
```

The repo also includes a complete copyable setup in [`starter-kit/`](../starter-kit/), including `AGENTS.md`, `CLAUDE.md`, and `skills/productspec/SKILL.md`.

## What Agents Should Do

Agents should:

- find relevant `.product-spec.md` files before starting implementation
- read `Problem`, `Hypothesis`, `Product Summary`, `Scope`, `Acceptance Criteria`, and `Success Metrics`
- treat Acceptance Criteria as the build contract
- cite `AC-<number>` IDs in plans, tasks, tests, and pull request summaries
- treat `scope.out` and `scope.cut` as explicit non-goals
- use `applies_to` and `Related Artifacts` to find linked code, issues, pull requests, designs, eval runs, and dashboards
- resolve `product_spec` related artifacts across the repo before planning, so build order follows the dependency graph. `productspec graph <dir> --json` resolves a whole folder in one call: buildable set, blocked set with reasons, and build order
- run `productspec garden <repo> --json` when choosing work from a repo of specs, so missing evidence, stale revision pins, run gaps, unscoped specs, contention, and waves are visible before implementation starts
- treat `RESOLVE-IN-PLAN:` markers as planning questions to answer against the codebase before coding
- propose a Product Spec revision or Decision Trace when implementation diverges from intent
- leave an Agent Run receipt when the repo uses `*.agent-run.json` files
- run `productspec reconcile <spec> --against <agent-run>` before claiming completion when the local CLI is available

Agents should not:

- treat Success Metrics as implementation tasks
- expand scope because the implementation path makes it convenient
- treat unresolved technical bindings as implementation instructions
- silently change product intent
- treat code drift as intent without an explicit decision

## Minimal Agent Prompt

```text
Use skills/productspec/SKILL.md.

Implement the work in specs/example.product-spec.md.

If ProductSpec MCP is available, call begin_spec_session before planning and check_spec_session before claiming done. If a local CLI is available, run productspec garden before choosing repo work and productspec reconcile before claiming implementation complete.

Create a plan that maps tasks to Acceptance Criteria. Keep scope.out and scope.cut out of the implementation. If you need to change product intent, stop and propose a Product Spec revision or Decision Trace. If the repo uses Agent Run files, leave a run receipt before claiming done.

Resolve every `RESOLVE-IN-PLAN:` marker with a source citation before coding. Do not implement guessed table names, fields, endpoints, services, or file paths as if they were binding.
```

## Agent Handoff

Agent Handoff is a generated implementation brief, not a required ProductSpec section.

Use it when an execution environment needs a compact build contract compiled from the Product Spec: Product Summary, Scope guardrails, Acceptance Criteria, AI Evals, evidence expectations, and revision pin.

Do not add `## Agent Handoff` to the Product Spec itself. If the handoff needs product intent that is not already in the Product Spec, update the Product Spec or add a Decision Trace first.

See [Agent Handoff](agent-handoff.md) for the recommended generated shape.

Generate one locally:

```bash
productspec handoff specs/example.product-spec.md
```

## Pull Request Summary Pattern

```md
Implements `specs/example.product-spec.md` at `spec_revision: 1`.

Acceptance Criteria covered:

- AC-1: implemented by this PR
- AC-2: implemented by this PR

AI evals inside Acceptance Criteria:

- EVAL-1: added to the test suite

Out of scope:

- team workspaces
- real-time notifications
```

## Why This Matters

The Product Spec should remain the current committed intent.

Agents can write code quickly. ProductSpec keeps them attached to the product decision the team actually made, and Agent Run records what they checked against it.
