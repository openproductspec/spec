# Product Spec Standard

The Product Spec Standard is an open Markdown format for product specs that need to be read by humans and executed by AI agents.

ProductSpec.io is one implementation of the Standard. The Standard itself is neutral: it defines structure, section IDs, portable review annotations, and calibration-example serialization. It does not define what makes a Product Spec good.

## Where This Sits

OpenProductSpec operates at the product spec layer: the what and why that come before engineering specs are written. This is where a team commits to the problem, hypothesis, scope, user experience, acceptance criteria, and success metrics.

OpenSpec and Spec Kit operate at the engineering spec layer. OpenSpec's flow is propose -> apply -> archive. Spec Kit's flow is constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement. Those artifacts live in the repo and are consumed by AI agents to build code.

```text
Product Spec (OpenProductSpec) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                       how / plan / tasks                         implementation
strategic intent                 technical decomposition                    running system
```

Both layers are SDD. Both use the spec as a control system. They serve different roles with different artifacts.

## What Is Included

- `SPEC.md`: the canonical v0.1 format.
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
