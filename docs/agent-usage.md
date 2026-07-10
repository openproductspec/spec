# Use ProductSpec With Agents

ProductSpec gives agents a control file for the work.

A Product Spec tells an agent what should be built, why it matters, what is in scope, what must pass before launch, and how the outcome will be measured later.

## Load The ProductSpec Skill

Load `skills/productspec/SKILL.md` before asking an agent to implement from a Product Spec.

For Codex or Claude Code, reference the skill in the prompt or add it to the repository's agent instructions:

```md
Use `skills/productspec/SKILL.md` before planning or implementing work governed by a `.product-spec.md` file.
```

For repositories with an `AGENTS.md` or `CLAUDE.md`, add:

```md
# ProductSpec

Product Specs are control files for consequential software work.

Before planning, coding, testing, or changing scope, load `skills/productspec/SKILL.md` and read the relevant `.product-spec.md` file.
```

The repo also includes a complete copyable setup in [`starter-kit/`](../starter-kit/), including `AGENTS.md`, `CLAUDE.md`, and `skills/productspec/SKILL.md`.

## What Agents Should Do

Agents should:

- find relevant `.product-spec.md` files before starting implementation
- read `Problem`, `Hypothesis`, `Scope`, `Acceptance Criteria`, `AI Evals`, and `Success Metrics`
- treat Acceptance Criteria as the build contract
- cite `AC-<number>` IDs in plans, tasks, tests, and pull request summaries
- treat `scope.out` and `scope.cut` as explicit non-goals
- use `applies_to` and `Related Artifacts` to find linked code, issues, pull requests, designs, eval runs, and dashboards
- propose a Product Spec revision or Decision Trace when implementation diverges from intent

Agents should not:

- treat Success Metrics as implementation tasks
- expand scope because the implementation path makes it convenient
- silently change product intent
- treat code drift as intent without an explicit decision

## Minimal Agent Prompt

```text
Use skills/productspec/SKILL.md.

Implement the work in specs/example.product-spec.md.

Create a plan that maps tasks to Acceptance Criteria. Keep scope.out and scope.cut out of the implementation. If you need to change product intent, stop and propose a Product Spec revision or Decision Trace.
```

## Pull Request Summary Pattern

```md
Implements `specs/example.product-spec.md` at `spec_revision: 1`.

Acceptance Criteria covered:

- AC-1: implemented by this PR
- AC-2: implemented by this PR

AI evals:

- EVAL-1: added to the test suite

Out of scope:

- team workspaces
- real-time notifications
```

## Why This Matters

The Product Spec should remain the current committed intent.

Agents can write code quickly. ProductSpec keeps them attached to the product decision the team actually made.
