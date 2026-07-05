# Product Spec Standard

The Product Spec Standard is an open format for product intent before implementation.

It is designed for product specs that need to be read by humans, reviewed by product tools, and executed by AI agents downstream.

ProductSpec.io is one implementation of the Standard. The Standard itself is neutral: it defines structure, section IDs, portable review annotations, calibration-example serialization, and eventually portable decision traces. It does not define what makes a Product Spec good.

## Where This Sits

Product Spec Standard operates at the intent layer: the what and why that come before engineering specs are written. This is where a team commits to the problem, hypothesis, scope, user experience, acceptance criteria, and success metrics.

OpenSpec and Spec Kit operate at the engineering spec layer. OpenSpec's flow is propose -> apply -> archive. Spec Kit's flow is constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement. Those artifacts live in the repo and are consumed by AI agents to build code.

```text
Product Spec (Product Spec Standard) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                       how / plan / tasks                         implementation
strategic intent                 technical decomposition                    running system
```

Both layers are SDD. Both use the spec as a control system. They serve different roles with different artifacts.

## What Is Included

- `SPEC.md`: the canonical v0.1 format.
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
4. `user_experience`
5. `acceptance_criteria`
6. `success_metrics`

Optional sections:

`customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`

Custom sections use `custom-<kebab-name>`.

## Status

Version `0.1` is intentionally small. It is stable enough for tooling experiments, but still pre-1.0 while implementers learn what needs to change.

The next milestone is `0.2`: validator CLI, conformance fixtures, review-annotation examples, and clearer versioning rules.
