---
name: productspec
description: Use when implementing, reviewing, planning, or changing work governed by a Product Spec. Treat `.product-spec.md` files as the product contract for the work.
---

# ProductSpec Agent Skill

Product Specs are the product contract for consequential software work.

When a repo uses Agent Run files, treat them as the receipt for one agent execution against a pinned Product Spec revision.

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
3. `Product Summary`: what should exist when the work is done.
4. `Scope`: what is in, out, and deliberately cut.
5. `Acceptance Criteria`: the build contract, including AI evals when present.
6. `Success Metrics`: post-launch outcome checks.
7. `Related Artifacts`: issues, pull requests, eval runs, dashboards, designs, engineering specs, or other Product Specs the work depends on.

Acceptance Criteria are the build contract. Plans, tasks, code changes, tests, and pull request summaries should cite the relevant `AC-<number>` IDs.

AI evals are pre-launch gates inside Acceptance Criteria, not a separate `## AI Evals` section. Cite `EVAL-<number>` when implementing or changing model behavior.

Success Metrics are post-launch outcomes. Do not treat `SM-<number>` items as implementation tasks.

## Planning Rules

When creating an implementation plan:

- List which Product Spec and `spec_revision` you are implementing.
- If ProductSpec MCP is available, call `begin_spec_session` before planning and include the returned `spec_revision` and session id in your plan.
- Map each task to the relevant Acceptance Criteria.
- Name any Acceptance Criteria that are not covered by the plan.
- Treat `scope.out` and `scope.cut` as explicit non-goals.
- Use `applies_to` and `Related Artifacts` to find relevant code, issues, pull requests, designs, evals, and dashboards.
- Resolve `product_spec` related artifacts before planning. A spec whose `depends_on` target is not built yet is blocked, not buildable, and the plan should say what it waits for.
- For a folder of specs, run `productspec graph <dir> --json` (or the `get_spec_graph` MCP tool) to get the buildable set, the blocked set with what each spec waits for, and a dependency-respecting build order in one call, instead of re-reading every spec to derive it.
- If another agent may be working the same folder, read `contention` and `waves` from that same call. Two specs that touch one surface must not be built at the same time, even when both are buildable. Take work from the current wave, and treat a spec listed in `unscoped` as unknown scope rather than safe scope.
- Treat `RESOLVE-IN-PLAN:` markers as unresolved technical bindings. Resolve each marker against the codebase with a source citation before coding.
- Do not implement guessed table names, fields, endpoints, services, or file paths as if they were binding instructions.

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

- If ProductSpec MCP is available, call `check_spec_session` first. If the Product Spec changed, re-read it and re-plan before claiming done.
- If ProductSpec MCP is available, call `get_evidence_checklist` and attach or name evidence for covered `AC-` and `EVAL-` IDs.
- If the repo uses Agent Run files, call `draft_agent_run` or run `productspec init-run <spec> <agent-run>` to create a receipt, then fill in checked `AC-`, `EVAL-`, and `SM-` IDs, evidence links, drift state, and completion claim. Validate it with `productspec validate-run`.
- cite the Product Spec path and `spec_revision`
- cite the Acceptance Criteria covered
- cite AI evals added or changed
- name scope items intentionally deferred
- link related issues, pull requests, eval runs, or dashboards when available
