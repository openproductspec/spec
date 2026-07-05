# ProductSpec

ProductSpec is an open standard for software intent before implementation.

ProductSpec is designed for Product Specs that need to be read by humans, reviewed by product tools, and executed by AI agents downstream.

ProductSpec.io is one implementation of ProductSpec. ProductSpec itself is neutral: it defines structure, section IDs, portable review annotations, calibration-example serialization, and eventually portable decision traces. It does not define what makes a Product Spec good.

## Naming

- `ProductSpec` is the open standard, project, repository, and ecosystem for software intent.
- `Product Spec` is the artifact a person writes.
- `ProductSpec.io` is a managed implementation of ProductSpec.

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
- `ROADMAP.md`: the planned path from v0.1 to a stable semantic model.
- `docs/vision.md`: the public vision for ProductSpec as the intent layer.
- `docs/decision-trace.md`: the future optional reasoning-trail extension.
- `schema/product-spec.schema.json`: JSON Schema for parsed Product Spec documents.
- `schema/review-annotation.schema.json`: JSON Schema for portable review annotations.
- `examples/*.product-spec.md`: minimal and expanded examples.
- `parsers/ts`: dependency-free TypeScript reference parser.

## Canonical Sections

Mandatory sections, in order:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

Optional sections:

`surface`, `user_experience`, `customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`

`surface` describes the externally observable interface of the work. Examples include a user-facing flow URL, API endpoint shape, CLI command, admin workflow, webhook payload, dashboard, config interface, internal tool screen, or agent/tool interface. `user_experience` is a narrower section for user-facing product flows.

Custom sections use `custom-<kebab-name>`.

## Status

Version `0.1` is intentionally small. It is stable enough for tooling experiments, but still pre-1.0 while implementers learn what needs to change.

The next milestone is `0.2`: validator CLI, conformance fixtures, review-annotation examples, and clearer versioning rules.
