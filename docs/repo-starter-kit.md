# ProductSpec Repo Starter Kit

Use this setup when you want Product Specs to live beside code.

For a ready-to-copy version, use [`starter-kit/`](../starter-kit/). It includes a starter Product Spec, Decision Trace, `AGENTS.md`, `CLAUDE.md`, the ProductSpec agent skill, a pull request template, and GitHub Actions validation.

## Suggested Folders

```text
docs/
  product-specs/
    checkout-redesign.product-spec.md
  decision-traces/
    checkout-redesign.decision-trace.json
```

Use different folders if your repo already has a convention. The important part is that Product Specs are versioned, reviewable, and linkable.

## Suggested Repo Note

Create `PRODUCTSPEC.md` in your repo:

```md
# Product Specs

This repo uses ProductSpec for consequential software work where intent needs to survive handoff.

Product Specs live in `docs/product-specs/`.

Decision Traces live in `docs/decision-traces/` when intent changes, implementation drifts, or launch outcomes create a learning.

Before implementation begins, the Product Spec should answer:

- Who is hurting?
- What behavior do we expect to change?
- What is in scope, out of scope, and cut?
- What must be true before launch?
- How will we know whether the work mattered after launch?

Validate a Product Spec:

```bash
npm exec --package @productspec/parser -- productspec validate docs/product-specs/my-feature.product-spec.md
```
```

## Suggested Pull Request Text

```md
## Product Spec

Product Spec: `docs/product-specs/my-feature.product-spec.md`
Spec revision: `1`

## Acceptance Criteria Covered

- [ ] Criterion 1
- [ ] Criterion 2

## Decision Trace

Decision Trace entry needed?

- [ ] No
- [ ] Yes, because intent changed or implementation drifted
```

## Suggested CI

Use the ProductSpec GitHub Action:

```yaml
name: ProductSpec

on:
  pull_request:

jobs:
  validate-product-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gokulrajaram/ProductSpec@main
        with:
          files: "docs/product-specs/**/*.product-spec.md"
```

For stricter repositories, run this on both `pull_request` and `push`.

## Suggested Agent Setup

Copy these files from [`starter-kit/`](../starter-kit/):

```text
AGENTS.md
CLAUDE.md
skills/productspec/SKILL.md
```

This gives coding agents the same instruction: Product Specs are the control file for consequential work, Acceptance Criteria are the build contract, Success Metrics are post-launch outcomes, and Decision Traces should be proposed when implementation diverges from intent.

## Suggested Decision Trace Setup

Start with:

```text
docs/decision-traces/example.decision-trace.json
```

Create a Decision Trace when:

- product intent changes after review
- implementation drifts from the approved Product Spec
- scope is traded off during implementation
- evals or launch evidence changes the team's understanding
- success metrics create a learning after launch
