# Contributing

ProductSpec is an open standard for software intent before implementation.

Contributions are welcome through GitHub Issues and Pull Requests. Because ProductSpec is pre-1.0, the section vocabulary and validator behavior can still change, but changes should be explicit, discussed, and covered by examples or fixtures.

## What To Contribute

Useful contributions include:

- examples of real Product Specs
- section vocabulary proposals
- validator bugs
- parser improvements
- schema clarifications
- documentation improvements
- interop notes for Jira, Linear, Figma, Git, OpenSpec, Spec Kit, and AI coding agents

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
