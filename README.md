# ProductSpec

[![CI](https://github.com/gokulrajaram/ProductSpec/actions/workflows/ci.yml/badge.svg)](https://github.com/gokulrajaram/ProductSpec/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@productspec/parser.svg)](https://www.npmjs.com/package/@productspec/parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ProductSpec is an open standard for software intent before implementation.

It gives teams a portable Markdown format for the product decision that comes before tickets, engineering plans, and code.

Use it when the work is consequential enough that intent needs to survive handoff: from humans to humans, from product to engineering, and from teams to AI agents.

```text
Product Spec -> Engineering Spec -> Code -> Evaluation -> Learning
what / why      how / plan / tasks   implementation   outcome
```

ProductSpec is neutral. It defines structure, section IDs, portable review annotations, calibration-example serialization, and portable decision traces. It does not define what makes a Product Spec good.

Design principle: structure the parts machines must execute or compare. Leave the parts humans must reason about readable.

Decision Trace is the optional companion standard for recording how consequential decisions, drift, revisions, and outcomes are handled over time.

```text
Intent -> Implementation -> Drift -> Decision Trace -> Revised Intent
```

## Living Specs

Product Specs are living documents. They should change when evidence, scope, design, acceptance criteria, or success metrics change.

`spec_revision` gives each meaningful revision a portable handle:

```yaml
spec_format_version: "0.1" # ProductSpec standard version
spec_revision: 1           # initial product intent
spec_revision: 2           # scope changed after design review
spec_revision: 3           # acceptance criteria updated before implementation
```

Git keeps the detailed history. `spec_revision` lets people and tools cite the intent revision they are using: a Jira ticket, an engineering spec, an AI agent loop, a pull request, or a Decision Trace.

See `examples/revisions/` for a Product Spec that evolves from revision 1 to revision 2.

## Quick Start

Validate a Product Spec with the published CLI:

```bash
npm exec --package @productspec/parser -- productspec validate path/to/file.product-spec.md
```

Create a starter Product Spec:

```bash
npm exec --package @productspec/parser -- productspec init my-feature.product-spec.md
```

Try an included example:

```bash
npm exec --package @productspec/parser -- productspec validate examples/minimal.product-spec.md
```

Use the GitHub Action in a repository:

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

## Example

Full Product Spec files include frontmatter such as `title`, optional `spec_revision`, `author`, and timestamps. This shortened example shows the section body.

````markdown
## Problem

Support leads at B2B SaaS companies lose their morning planning window because urgent, account-risk tickets are buried among routine product questions.

## Hypothesis

If incoming tickets are automatically labeled by urgency, customer tier, and likely owner, support leads will respond to account-risk issues faster because the queue starts each day pre-sorted by consequence.

## Scope

```productspec-scope
in:
  - ticket ingestion
  - urgency labels
  - customer-tier lookup
  - owner recommendation
  - confidence score
  - reviewer override
  - audit log
out:
  - auto-replies
  - direct ticket reassignment
  - customer-visible status changes
cut:
  - custom routing rules
```

## Acceptance Criteria

```productspec-acceptance-criteria
- id: AC-1
  criterion: New tickets receive urgency, customer tier, suggested owner, confidence score, and model version within 60 seconds.
- id: AC-2
  criterion: Reviewers can override any label before it changes downstream workflow state.
```

```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.92
  checks:
    - urgency classification identifies account-risk tickets
```

## Success Metrics

```productspec-success-metrics
- id: SM-1
  metric: median_time_to_first_human_response
  target: "< 15 minutes"
  window: business hours
```
````

See [examples/ai-support-triage.product-spec.md](examples/ai-support-triage.product-spec.md) for the complete version.

## Naming

- `ProductSpec` is the open standard, project, repository, and ecosystem for software intent.
- `Product Spec` is the artifact a person writes.

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

- Git stores implementation history. A Product Spec can live beside code in Git, but code commits should not be the first durable record of why the work exists.
- Jira and Linear store work history. A Product Spec can become epics, tickets, or tasks, but it should remain the durable statement of intent behind those tasks.
- Figma stores design artifacts. A Product Spec can link to prototypes, mockups, or screenshots through `user_experience`, but it does not replace the design source of truth.
- Analytics tools store outcome data.
- OpenSpec and Spec Kit turn intent into engineering plans.
- AI coding agents execute implementation tasks.
- ProductSpec stores the software intent behind the work: the problem, hypothesis, scope, acceptance criteria, and success metrics that downstream tools should preserve.

## Ecosystem

ProductSpec is meant to be implemented by many tools.

Current repo artifacts:

- `@productspec/parser`: TypeScript parser, validator, and CLI.
- JSON Schema for parsed Product Spec documents.
- Valid and invalid conformance fixtures.
- GitHub issue and pull request templates.
- Examples for AI features, consumer UX, enterprise workflows, internal APIs, and revision history.

Durable IDs are generated for the top-level items that tools execute or compare: `AC-1` for Acceptance Criteria, `SM-1` for Success Metrics, and `EVAL-1` for AI evals. Scope bullets, eval cases, optional eval checks, and prose/custom sections remain un-IDed. Tools that need to cite eval children should use positional references like `EVAL-1.case[2]`.

Natural integration points:

- Git and GitHub for versioned Product Specs, pull requests, and review.
- Jira and Linear for work tracking that links back to Product Spec revisions.
- Figma and prototypes through `user_experience`.
- OpenSpec and Spec Kit for downstream engineering specs.
- AI coding agents that build until Acceptance Criteria pass.
- Analytics and experiment tools that measure Success Metrics after launch.

Early ecosystem contributions are welcome: examples, importer/exporter experiments, editor integrations, CI validation actions, review tools, and mappings into engineering-spec systems.

## What Is Included

- [SPEC.md](SPEC.md): the canonical v0.1 standard.
- [CHANGELOG.md](CHANGELOG.md): release history for the standard and tooling.
- [CONTRIBUTING.md](CONTRIBUTING.md): how to propose examples, validator changes, and section vocabulary changes.
- [docs/philosophy.md](docs/philosophy.md): the core beliefs behind ProductSpec.
- [docs/launch-post.md](docs/launch-post.md): a draft launch post for sharing the project.
- [docs/why-productspec.md](docs/why-productspec.md): why the intent layer needs its own artifact.
- [docs/faq.md](docs/faq.md): answers to common ProductSpec adoption questions.
- [docs/use-in-your-repo.md](docs/use-in-your-repo.md): copy-paste setup for using ProductSpec in an existing repository.
- [docs/adoption.md](docs/adoption.md): how teams can adopt ProductSpec across Git, Jira, Linear, Figma, CI, engineering specs, and agents.
- [docs/adoption-levels.md](docs/adoption-levels.md): a step-by-step maturity ladder for adopting ProductSpec.
- [docs/before-after.md](docs/before-after.md): a loose PRD transformed into ProductSpec.
- [docs/productspec-vs.md](docs/productspec-vs.md): how ProductSpec differs from PRDs, Jira, Git, Figma, engineering design docs, OpenSpec, Spec Kit, and ADRs.
- [docs/repo-starter-kit.md](docs/repo-starter-kit.md): copy-paste conventions for using ProductSpec in an existing repo.
- [docs/handoff-example.md](docs/handoff-example.md): how ProductSpec interacts with Jira, Figma, Git, OpenSpec, Spec Kit, and coding agents.
- [docs/end-to-end-handoff.md](docs/end-to-end-handoff.md): a concrete walkthrough from Product Spec to issue, design, engineering spec, agent loop, pull request, and launch learning.
- [docs/vision.md](docs/vision.md): the public vision for ProductSpec as the intent layer.
- [docs/validator.md](docs/validator.md): validator error and warning codes.
- [docs/validate-your-first-product-spec.md](docs/validate-your-first-product-spec.md): the fastest local validation path.
- [docs/field-guide.md](docs/field-guide.md): field-level guidance for writing each section.
- [docs/versioning.md](docs/versioning.md): compatibility rules before v1.0.
- [docs/decision-trace.md](docs/decision-trace.md): the optional companion standard for decisions, drift, and revisions.
- [schema/product-spec.schema.json](schema/product-spec.schema.json): JSON Schema for parsed Product Spec documents.
- [schema/decision-trace.schema.json](schema/decision-trace.schema.json): JSON Schema for Decision Trace documents.
- [schema/review-annotation.schema.json](schema/review-annotation.schema.json): JSON Schema for portable review annotations.
- [conformance/](conformance/): valid and invalid fixtures for implementers.
- [examples/README.md](examples/README.md): guide to choosing the right example.
- [examples/](examples/): minimal and expanded examples.
- [examples/decision-traces/](examples/decision-traces/): companion Decision Trace examples.
- [parsers/ts](parsers/ts): TypeScript reference parser, validator, and CLI.

Examples include AI features, consumer UX, enterprise workflows, internal APIs, and agent handoffs:

- [examples/ai-support-triage.product-spec.md](examples/ai-support-triage.product-spec.md)
- [examples/agent-coded-feature.product-spec.md](examples/agent-coded-feature.product-spec.md)
- [examples/consumer-family-calendar.product-spec.md](examples/consumer-family-calendar.product-spec.md)
- [examples/enterprise-approval-workflow.product-spec.md](examples/enterprise-approval-workflow.product-spec.md)
- [examples/internal-webhook-replay-api.product-spec.md](examples/internal-webhook-replay-api.product-spec.md)
- [examples/platform-cache-migration.product-spec.md](examples/platform-cache-migration.product-spec.md)
- [examples/full-prd.product-spec.md](examples/full-prd.product-spec.md)

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

ProductSpec distinguishes the standard version from the document revision:

- `spec_format_version` tells tools which ProductSpec format the file uses.
- `spec_revision` is an optional positive integer for this particular product decision. It starts at `1` and increments when intent materially changes.

The v0.4 milestone includes conformance fixtures, a structured validator, examples, a CLI, and optional `spec_revision` frontmatter:

```bash
npm exec --package @productspec/parser -- productspec validate examples/minimal.product-spec.md
```

To create a starter Product Spec:

```bash
npm exec --package @productspec/parser -- productspec init my-feature.product-spec.md
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

See `docs/adoption.md` for a practical team setup across Git, Jira, Linear, Figma, CI, engineering specs, and AI coding agents.
