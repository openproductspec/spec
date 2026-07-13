# Get Started With Agents

This is the shortest path from a repo with product docs to agents using ProductSpec as the control file for consequential work.

Use this when you want to:

- convert an existing PRD or feature doc into ProductSpec
- validate Product Specs in CI
- ask an agent to implement from a Product Spec
- record drift when implementation changes intent
- record an agent run against a pinned Product Spec revision

## 1. Install the skills

ProductSpec ships two loadable skills:

- `productspec-authoring`: write, convert, and validate Product Specs.
- `productspec`: implement from an existing Product Spec.

List both skills:

```bash
npx skills add gokulrajaram/ProductSpec --list --full-depth
```

Install both:

```bash
npx skills add gokulrajaram/ProductSpec --all --full-depth
```

Install one:

```bash
npx skills add gokulrajaram/ProductSpec --skill productspec-authoring --full-depth
npx skills add gokulrajaram/ProductSpec --skill productspec --full-depth
```

## 2. Convert an existing PRD

Ask your agent:

```text
Use the productspec-authoring skill.

Convert docs/old-prd.md into docs/product-specs/checkout-redesign.product-spec.md.
Preserve the author's intent, split pre-launch checks into Acceptance Criteria, split post-launch outcomes into Success Metrics, and validate the file.
If a success metric target depends on a launch baseline, use target_status: provisional and name target_owner instead of inventing a number.
```

Then validate directly:

```bash
npm exec --yes --package @productspec/parser -- productspec validate docs/product-specs/checkout-redesign.product-spec.md
```

If you prefer a guided editor before committing Markdown to Git, use the free editor at [ProductSpec.io](https://productspec.io), then export or publish the resulting Product Spec.

## 3. Validate in CI

Add the GitHub Action:

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
          decision_traces: "docs/decision-traces/**/*.decision-trace.json"
```

Use `@main` if you want the newest pre-1.0 validator behavior. Pin a release tag when you want repeatable CI behavior.

## 4. Build from the Product Spec

Ask your agent:

```text
Use the productspec skill.

Implement docs/product-specs/checkout-redesign.product-spec.md.
Read the Product Spec before planning.
Map each implementation task to the relevant AC- ids.
Treat scope.out and scope.cut as non-goals.
Cite the Product Spec path, spec_revision, and covered AC- ids in the pull request summary.
```

Acceptance Criteria are the build contract. Success Metrics are not implementation tasks; they are post-launch outcome checks.

## 5. Record the agent run

An Agent Run records what happened when Claude, Codex, Cursor, or another agent used a Product Spec as its harness.

It should include:

- the Product Spec path and `spec_revision`
- the checked `AC-`, `EVAL-`, and `SM-` IDs
- evidence links such as PRs, test reports, and eval runs
- whether drift was detected
- the agent's completion claim

Validate the run:

```bash
npm exec --yes --package @productspec/parser -- productspec validate-run docs/agent-runs/checkout-redesign.agent-run.json
```

## 6. Record drift

Do not silently let implementation redefine intent.

When implementation, evidence, or launch outcomes challenge the Product Spec, ask your agent:

```text
Use the productspec-authoring skill.

Create or update docs/decision-traces/checkout-redesign.decision-trace.json.
Record the implementation drift, the decision made, who approved it, and whether the Product Spec should be revised.
If the Product Spec intent changes, bump spec_revision in the Product Spec.
Validate both the Product Spec and the Decision Trace.
```

Validate the trace:

```bash
npm exec --yes --package @productspec/parser -- productspec validate-trace docs/decision-traces/checkout-redesign.decision-trace.json
```

## Related docs

- [ProductSpec authoring skill](../skills/productspec-authoring/SKILL.md)
- [ProductSpec implementation skill](../skills/productspec/SKILL.md)
- [Use ProductSpec in your repo](use-in-your-repo.md)
- [Agent usage](agent-usage.md)
- [Agent Run](agent-run.md)
- [Decision Trace](decision-trace.md)
