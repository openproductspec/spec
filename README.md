# ProductSpec

ProductSpec is an open standard for software intent before implementation.

ProductSpec is designed for Product Specs that need to be read by humans, reviewed by product tools, and executed by AI agents downstream.

ProductSpec.io is one implementation of ProductSpec. ProductSpec itself is neutral: it defines structure, section IDs, portable review annotations, calibration-example serialization, and eventually portable decision traces. It does not define what makes a Product Spec good.

## Naming

- `ProductSpec` is the open standard, project, repository, and ecosystem for software intent.
- `Product Spec` is the artifact a person writes.
- `ProductSpec.io` is a managed implementation of ProductSpec.

## When To Use ProductSpec

ProductSpec is not for every act of building. It is for consequential software work where intent needs to survive handoff.

For an individual builder, a Product Spec is useful when the work is complex, risky, long-lived, or being handed to an AI agent loop. For quick experiments, one-off scripts, or throwaway prototypes, it may be faster to brainstorm, build, and iterate directly.

For a team or organization, ProductSpec is most useful when coordination cost appears: multiple people, multiple agents, design and engineering handoffs, customer-facing launches, AI features with evals, or decisions that will need to be revisited later.

## Where This Sits

ProductSpec operates at the software intent layer: the what and why that come before engineering specs are written. This is where a team commits to the problem, hypothesis, scope, user experience, acceptance criteria, and success metrics.

OpenSpec and Spec Kit operate at the engineering spec layer. OpenSpec's flow is propose -> apply -> archive. Spec Kit's flow is constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement. Those artifacts live in the repo and are consumed by AI agents to build code.

```text
Product Spec (ProductSpec) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                       how / plan / tasks                         implementation
strategic intent                 technical decomposition                    running system
```

Both layers are SDD. Both use the spec as a control system. They serve different roles with different artifacts.

## Where ProductSpec Fits

ProductSpec does not replace Git, Jira, Linear, Figma, analytics tools, OpenSpec, Spec Kit, or AI coding agents.

It sits upstream of them.

```text
ProductSpec -> Engineering Spec -> Tasks -> Code -> Evaluation -> Learning
```

- Git stores implementation history.
- Jira and Linear store work history.
- Figma stores design artifacts.
- Analytics tools store outcome data.
- OpenSpec and Spec Kit turn intent into engineering plans.
- AI coding agents execute implementation tasks.
- ProductSpec stores the software intent behind the work.

## What Is Included

- `SPEC.md`: the canonical v0.1 standard.
- `CHANGELOG.md`: release history for the standard and tooling.
- `ROADMAP.md`: the planned path from v0.1 to a stable semantic model.
- `docs/vision.md`: the public vision for ProductSpec as the intent layer.
- `docs/validate-your-first-product-spec.md`: the fastest local validation path.
- `docs/field-guide.md`: field-level guidance for writing each section.
- `docs/versioning.md`: compatibility rules before v1.0.
- `docs/decision-trace.md`: the future optional reasoning-trail extension.
- `schema/product-spec.schema.json`: JSON Schema for parsed Product Spec documents.
- `schema/review-annotation.schema.json`: JSON Schema for portable review annotations.
- `conformance/*`: valid and invalid fixtures for implementers.
- `examples/*.product-spec.md`: minimal and expanded examples.
- `parsers/ts`: TypeScript reference parser, validator, and CLI.

## Canonical Sections

Mandatory sections, in order:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

Optional sections:

`user_experience`, `customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`

`user_experience` describes the externally observable experience of the work when there is one: for example, a prototype URL, mockup, design link, public deploy, Loom walkthrough, API documentation page, CLI demo, dashboard, or internal tool screen.

Custom sections use `custom-<kebab-name>`.

## Status

Version `0.1` is intentionally small. It is stable enough for tooling experiments, but still pre-1.0 while implementers learn what needs to change. See `docs/versioning.md` for compatibility expectations.

The v0.2 tooling milestone adds conformance fixtures, a structured validator, and a CLI:

```bash
npm exec --package @productspec/parser -- productspec validate examples/minimal.product-spec.md
```

For local development from this repository:

```bash
npm install
npm run build
node dist/cli.js validate examples/minimal.product-spec.md
```

Or use the shortcut:

```bash
npm run validate -- examples/minimal.product-spec.md
```

To run the local `productspec` CLI without a global install:

```bash
npm run cli -- validate examples/minimal.product-spec.md
```

To link the CLI during development:

```bash
npm run link:cli
```

After linking, `productspec validate examples/minimal.product-spec.md` works if your npm
global binary directory is on `PATH`.

See `docs/validate-your-first-product-spec.md` for the first-run path and current validator checks.
