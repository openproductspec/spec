# ProductSpec Versioning

ProductSpec is currently pre-1.0.

These versioning rules apply to ProductSpec as the open standard for software intent before implementation.

v0.x is experimental. The standard is stable enough for tooling experiments, examples, imports, exports, and early integrations, but the section vocabulary and compatibility rules may still change while implementers learn what the standard needs to support.

## Compatibility Promise

Breaking changes are allowed before v1.0.

Examples of pre-1.0 breaking changes include:

- Moving a section from mandatory to optional.
- Adding, renaming, or removing canonical section IDs.
- Changing schema namespace URLs.
- Tightening parser or validator expectations.
- Changing how optional metadata should be preserved.

These changes should still be documented clearly in the repo when they happen.

## Tool Requirements

Tools should check `spec_format_version`.

At minimum, tools should:

- Reject unsupported versions with a clear error.
- Preserve unknown custom sections when possible.
- Preserve `tool_metadata` without treating it as portable standard behavior.
- Avoid assuming v0.x compatibility beyond what the current repo documents.

## Current Version

The current version is `0.1`.

In v0.1, the mandatory sections are:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

`user_experience` is optional.

The v0.1 shape in this repository is the current canonical v0.1 shape. Earlier experimental commits may have different v0.1 section requirements; implementers should follow the current `SPEC.md`, schema, parser, and examples.

## v0.2 Tooling Milestone

v0.2 focuses on validation and conformance:

- Validator CLI.
- Local CLI wrappers: `npm run validate -- <file>` and `npm run cli -- validate <file>`.
- Valid and invalid fixture corpus.
- Round-trip conformance tests.
- Structured validator results with stable error and warning codes.
- Stable errors for missing frontmatter, unsupported versions, missing required frontmatter, unsupported artifact types, missing required sections, duplicate sections, invalid required-section order, and invalid custom section IDs.
- Non-failing warnings for empty or very thin required sections.

This does not change `spec_format_version`, which remains `"0.1"` for the current Product Spec document shape.

The v0.2 CLI package is ready to publish as `@productspec/parser`, with the `productspec` binary. Publishing requires npm authentication and package-owner access; until then, `npm run cli -- validate <file>` is the supported local path.

## v1.0 Bar

v1.0 is the first compatibility promise.

Before v1.0, ProductSpec should have:

- A stable semantic model.
- A stable canonical section vocabulary.
- A conformance suite.
- Clear migration rules from prior v0.x documents.
- Enough independent implementation feedback to know the format is not only one product's export shape.
