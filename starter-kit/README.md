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
  decision-traces/
    example.decision-trace.json
skills/
  productspec/
    SKILL.md
```

## Setup

1. Copy the contents of this folder into your repository.
2. Rename `docs/product-specs/example.product-spec.md`.
3. Rename `docs/decision-traces/example.decision-trace.json` when you record the first decision.
4. Update `linked_github_repo`, `applies_to`, and Related Artifacts in the Product Spec.
5. Keep `AGENTS.md`, `CLAUDE.md`, and `skills/productspec/SKILL.md` together so coding agents know how to treat Product Specs as control files.

Validate the starter Product Spec:

```bash
npm exec --package @productspec/parser -- productspec validate docs/product-specs/example.product-spec.md
```

## Working Pattern

1. Write or revise a Product Spec before consequential implementation.
2. Open a pull request with the Product Spec or with code that cites the Product Spec.
3. Map code, tests, issues, eval runs, and dashboards back to Acceptance Criteria, AI Evals, and Success Metrics.
4. Record a Decision Trace when intent changes, implementation drifts, or outcomes create a learning.

