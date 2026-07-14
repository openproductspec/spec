# ProductSpec Starter Kit

Copy this folder into a repository when Product Specs should live beside code.

## What This Adds

```text
AGENTS.md
CLAUDE.md
PRODUCTSPEC.md
.github/
  pull_request_template.md
  workflows/
    productspec.yml
docs/
  product-specs/
    example.product-spec.md
  agent-runs/
    example.agent-run.json
  decision-traces/
    example.decision-trace.json
skills/
  productspec/
    SKILL.md
  productspec-upgrade/
    SKILL.md
```

## Setup

1. Copy the contents of this folder into your repository.
2. Rename `docs/product-specs/example.product-spec.md`.
3. Rename `docs/agent-runs/example.agent-run.json` when an agent leaves the first run receipt.
4. Rename `docs/decision-traces/example.decision-trace.json` when you record the first decision.
5. Update `linked_github_repo`, `applies_to`, and Related Artifacts in the Product Spec.
6. Keep `AGENTS.md`, `CLAUDE.md`, and `skills/productspec/SKILL.md` together so coding agents know how to treat Product Specs as intent harnesses.
7. When a new ProductSpec release ships, refresh the vendored skills with `npm exec --yes --package @productspec/parser@latest -- productspec upgrade-skills` (the `skills/productspec-upgrade` skill walks agents through this and reports what changed).

Validate the starter Product Spec:

```bash
npm exec --package @productspec/parser -- productspec validate docs/product-specs/example.product-spec.md
```

Draft and validate a new Agent Run:

```bash
npm exec --package @productspec/parser -- productspec init-run docs/product-specs/my-feature.product-spec.md docs/agent-runs/my-feature.agent-run.json
npm exec --package @productspec/parser -- productspec validate-run docs/agent-runs/my-feature.agent-run.json
```

## Working Pattern

1. Write or revise a Product Spec before consequential implementation.
2. Open a pull request with the Product Spec or with code that cites the Product Spec.
3. Map code, tests, issues, eval runs, and dashboards back to Acceptance Criteria, AI Evals, and Success Metrics.
4. Record an Agent Run when an agent implements against a pinned Product Spec revision.
5. Record a Decision Trace when intent changes, implementation drifts, or outcomes create a learning.
