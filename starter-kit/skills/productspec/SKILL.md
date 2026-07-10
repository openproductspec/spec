---
name: productspec
description: Use when implementing, reviewing, planning, or changing work governed by a Product Spec. Treat `.product-spec.md` files as the control file for the work.
---

# ProductSpec Agent Skill

Product Specs are the control file for consequential software work.

Before planning, coding, testing, or changing scope, look for relevant `.product-spec.md` files in the repository. Common locations include:

- `specs/`
- `product-specs/`
- `docs/product-specs/`
- paths named in the task, issue, pull request, or engineering spec

If a relevant Product Spec exists, read it before acting.

## How To Use A Product Spec

Read these sections in order:

1. `Problem`: who is hurting and why the work matters.
2. `Hypothesis`: the causal bet behind the product.
3. `Scope`: what is in, out, and deliberately cut.
4. `Acceptance Criteria`: the build contract.
5. `AI Evals`: launch gates for model behavior, when present.
6. `Success Metrics`: post-launch outcome checks.
7. `Related Artifacts`: issues, pull requests, eval runs, dashboards, designs, or engineering specs linked to the work.

Acceptance Criteria are the build contract. Plans, tasks, code changes, tests, and pull request summaries should cite the relevant `AC-<number>` IDs.

AI evals are pre-launch gates. Cite `EVAL-<number>` when implementing or changing model behavior.

Success Metrics are post-launch outcomes. Do not treat `SM-<number>` items as implementation tasks.

## Planning Rules

When creating an implementation plan:

- List which Product Spec and `spec_revision` you are implementing.
- Map each task to the relevant Acceptance Criteria.
- Name any Acceptance Criteria that are not covered by the plan.
- Treat `scope.out` and `scope.cut` as explicit non-goals.
- Use `applies_to` and `Related Artifacts` to find relevant code, issues, pull requests, designs, evals, and dashboards.

## Change Rules

Do not silently change product intent.

If implementation pressure conflicts with the Product Spec, state the conflict and propose one of:

- update the Product Spec
- update the implementation
- accept a tradeoff and record a Decision Trace
- reopen the work

If behavior changes after implementation, propose a Product Spec revision or a Decision Trace entry instead of treating code drift as intent.

## Output Rules

When reporting progress or opening a pull request:

- cite the Product Spec path and `spec_revision`
- cite the Acceptance Criteria covered
- cite AI evals added or changed
- name scope items intentionally deferred
- link related issues, pull requests, eval runs, or dashboards when available

