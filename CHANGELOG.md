# Changelog

## v0.2.0 - Tooling Milestone

ProductSpec v0.2.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and improves the tooling around it.

Added:

- TypeScript reference parser package at `parsers/ts`.
- `productspec` CLI binary in the parser package.
- Repo-local validation commands:
  - `npm run validate -- <file>`
  - `npm run cli -- validate <file>`
- Valid and invalid conformance fixtures.
- Round-trip parser tests.
- Structured validation results with stable error and warning codes.
- Errors for:
  - missing frontmatter
  - unsupported `spec_format_version`
  - missing required frontmatter fields
  - unsupported `artifact_type`
  - missing required sections
  - duplicate sections
  - invalid required-section order
  - invalid custom section IDs
- Warnings for:
  - empty required sections
  - very thin required sections
- First-run validation guide at `docs/validate-your-first-product-spec.md`.

Publishing status:

- `@productspec/parser@0.2.0` is published to npm.
- The package exposes the `productspec` CLI binary.

## v0.1.0 - Document Shape

ProductSpec v0.1.0 defines the initial Markdown document shape for software intent before implementation.

Mandatory sections:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

Optional sections:

`user_experience`, `customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`

Custom sections use `custom-<kebab-name>`.
