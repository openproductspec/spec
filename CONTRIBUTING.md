# Contributing

ProductSpec is an open standard for software intent before implementation.

Contributions are welcome through GitHub Issues and Pull Requests. Because ProductSpec is pre-1.0, the section vocabulary and validator behavior can still change, but changes should be explicit, discussed, and covered by examples or fixtures.

## What To Contribute

Useful contributions include:

- examples of real Product Specs
- product-leader feedback on which sections belong in the standard
- before-and-after revisions showing how a Product Spec changed through review
- section vocabulary proposals
- validator bugs
- parser improvements
- schema clarifications
- documentation improvements
- interop notes for Jira, Linear, Figma, Git, OpenSpec, Spec Kit, and AI coding agents

## Product Leaders And PMs

You do not need to write parser code to shape ProductSpec.

The most useful product-leader contributions are:

- real Product Spec examples with sensitive details removed
- comments on whether the default sections match how strong teams make product decisions
- examples of Product Specs changing from `spec_revision: 1` to `spec_revision: 2`
- proposed section vocabulary changes
- notes on how Product Specs should connect to Jira, Linear, Figma, Git, OpenSpec, Spec Kit, and AI coding agents
- critiques of Acceptance Criteria and Success Metrics semantics

Good issues from PMs and product leaders often start with:

- "Here is a Product Spec shape my team uses today."
- "This section is missing from consequential product work because..."
- "This field is too heavyweight for real teams because..."
- "This example would fail in my org because..."

Use `Discussion`, `Example request`, or `Section vocabulary proposal` issues. Pull requests are welcome, but a clear issue with a real example is enough to move the standard forward.

## Change Process

Use the lightweight ProductSpec process:

1. Propose the change in an issue.
2. Discuss the intent and compatibility impact.
3. Add or update an example or conformance fixture.
4. Update schema, parser, docs, and validator behavior if needed.
5. Add a changelog entry for user-visible changes.
6. Open a pull request.

For small documentation fixes, a pull request without a prior issue is fine.

## Section Vocabulary Changes

Section vocabulary changes require extra care because they affect interoperability.

When proposing a section change, include:

- the proposed section ID
- whether it is mandatory or optional
- what existing section cannot cover
- how it should be validated
- one example Product Spec using it
- migration impact for existing Product Specs

Before v1.0, breaking vocabulary changes are allowed, but they should be documented in `docs/versioning.md` and `CHANGELOG.md`.

## Validator Changes

Validator changes should include:

- a stable error or warning code
- a failing or passing fixture that demonstrates the behavior
- parser tests
- documentation in `docs/validator.md`

Warnings should help authors improve a valid Product Spec. Errors should be reserved for structural issues that make the document invalid or unsafe for tooling to consume.

## Example Contributions

Examples should be realistic, specific, and valid.

Run:

```bash
npm run validate -- examples/your-example.product-spec.md
```

Good examples show how ProductSpec works beyond classic product UI: APIs, internal tools, infrastructure changes, agent workflows, data pipelines, and operational systems are all welcome.

## Development

Install dependencies:

```bash
npm ci
npm ci --prefix parsers/ts
```

Run tests:

```bash
npm test
```

Validate fixtures:

```bash
npm run validate -- conformance/valid/minimal.product-spec.md
npm run validate -- conformance/valid/with-user-experience.product-spec.md
npm run validate -- conformance/valid/with-custom-section.product-spec.md
```

Run a package dry-run:

```bash
cd parsers/ts
npm run build
npm publish --dry-run
```
