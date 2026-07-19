# Use ProductSpec In Your Repo

This is the fastest path for trying ProductSpec inside an existing software repository.

If you want a complete copyable setup, start with [`starter-kit/`](../starter-kit/). It includes Product Spec, Agent Run, and Decision Trace examples, `AGENTS.md`, `CLAUDE.md`, the ProductSpec agent skill, a pull request template, and GitHub Actions validation.

## 1. Create A Spec Directory

```bash
mkdir -p specs
```

## 2. Create A Starter Product Spec

```bash
npm exec --package @productspec/parser -- productspec init specs/my-feature.product-spec.md
```

## 3. Edit The Product Spec

Fill in the default sections:

- `problem`: who is hurting, what pain do they feel, and why does it matter?
- `hypothesis`: what behavior will change if this ships, and why?
- `scope`: what is in, what is out, and what is deliberately cut?
- `acceptance_criteria`: what must be true before launch?
- `success_metrics`: what real-world outcome would make the work worth continuing?

For visible user experiences, add an optional `User Experience` section with a prototype, mockup, API docs, CLI demo, dashboard, or workflow link.

## 4. Validate It

```bash
npm exec --package @productspec/parser -- productspec validate specs/my-feature.product-spec.md
```

## 5. Commit It

```bash
git add specs/my-feature.product-spec.md
git commit -m "Add Product Spec for my feature"
```

## 6. Link Work Back To The Spec

In GitHub Issues, Jira, Linear, OpenSpec, Spec Kit, or pull requests, link back to the Product Spec:

```md
Implements `specs/my-feature.product-spec.md` at `spec_revision: 1`.
```

When the product intent changes, update the Product Spec and increment `spec_revision`.

## 7. Optional Agent Setup

ProductSpec includes a loadable agent skill:

```text
skills/productspec/SKILL.md
```

Add this to `AGENTS.md`, `CLAUDE.md`, or your agent prompt:

```md
Use `skills/productspec/SKILL.md` before planning or implementing work governed by a `.product-spec.md` file.
```

Agents should cite Acceptance Criteria IDs in implementation plans and pull request summaries.

For a ready-to-copy agent setup, use:

```text
starter-kit/AGENTS.md
starter-kit/CLAUDE.md
starter-kit/skills/productspec/SKILL.md
```

## 8. Optional Traceability

Use frontmatter for broad scope:

```yaml
linked_github_repo: "acme/app"
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
```

Use `Related Artifacts` for item-level links:

````md
## Related Artifacts

```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/acme/app/issues/123"
  section_id: acceptance_criteria
  item_id: AC-1
```
````

## 9. Optional CI Check

Add a CI step that validates committed Product Specs:

```bash
for f in specs/*.product-spec.md; do
  npm exec --package @productspec/parser -- productspec validate "$f"
done
```

That check verifies structure and portability. It does not judge whether the product bet is good.

You can also validate Product Specs, Decision Traces, and Agent Runs with the GitHub Action:

```yaml
- uses: gokulrajaram/ProductSpec@main
  with:
    files: "docs/product-specs/**/*.product-spec.md"
    decision_traces: "docs/decision-traces/**/*.decision-trace.json"
    agent_runs: "docs/agent-runs/**/*.agent-run.json"
```

To show validation status in your README, see the [CI badge demo](ci-badge-demo.md).

## 10. Optional Repo Maintenance

Once the repo has multiple Product Specs, Agent Runs, Decision Traces, and evidence links, use the repo maintenance commands:

```bash
npm exec --package @productspec/parser -- productspec garden .
npm exec --package @productspec/parser -- productspec reconcile specs/my-feature.product-spec.md --against docs/agent-runs/my-feature.agent-run.json
npm exec --package @productspec/parser -- productspec serve . --port 4317
```

`garden` reports repo health. `reconcile` checks one implementation run against one spec revision. `serve` opens the same garden report as a local read-only dashboard.

See [Repo maintenance](repo-maintenance.md).

## Suggested Pull Request Text

```md
## Intent

Implements `specs/my-feature.product-spec.md` at `spec_revision: 1`.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Notes

Success Metrics will be measured after launch.
```
