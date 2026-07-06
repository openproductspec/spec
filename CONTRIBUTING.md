# Contributing

ProductSpec is an open standard for software intent before implementation.

Contributions are welcome through GitHub Issues and Pull Requests. Because ProductSpec is pre-1.0, the section vocabulary and validator behavior can still change, but changes should be explicit, discussed, and covered by examples or fixtures.

## What To Contribute

Useful contributions include:

- real Product Spec examples with sensitive details removed
- comments on whether the default sections match how strong teams make product decisions
- before-and-after revisions showing how a Product Spec changed through review
- section vocabulary proposals
- critiques of Acceptance Criteria and Success Metrics semantics
- notes on how Product Specs should connect to Jira, Linear, Figma, Git, OpenSpec, Spec Kit, and AI coding agents
- validator bugs
- parser improvements
- schema clarifications
- documentation improvements

You do not need to write parser code to shape ProductSpec. A clear issue with a real example is enough to move the standard forward.

Good issues from PMs and product leaders often start with:

- "Here is a Product Spec shape my team uses today."
- "This section is missing from consequential product work because..."
- "This field is too heavyweight for real teams because..."
- "This example would fail in my org because..."

Use `General spec discussion`, `Example request`, or `Section vocabulary proposal` issues. Pull requests are welcome when you want to contribute an actual file change.

## How To Comment On Default Sections

Use a `General spec discussion` issue when you want to comment on the default sections:

- `problem`
- `hypothesis`
- `scope`
- `acceptance_criteria`
- `success_metrics`

You do not need to open a pull request for this. An issue is the right starting point.

Steps:

1. Go to `https://github.com/gokulrajaram/ProductSpec/issues/new/choose`.
2. Choose `General spec discussion`.
3. Use a title like `Discussion: Acceptance Criteria and Success Metrics are unclear`.
4. In `Topic`, name the section or distinction you want to discuss.
5. In `Context`, include a real or anonymized example from product work.
6. In `Optional proposal`, say what you would change in the field guide, examples, or standard.
7. Click `Submit new issue`.

Example issue:

```md
Title: Discussion: Acceptance Criteria and Success Metrics are unclear

In my org, PMs confuse Acceptance Criteria and Success Metrics because both are written as measurable outcomes.

Example:

- Acceptance Criteria: Search returns matching transcript passages with timestamps.
- Success Metrics: 35% of first-time users copy at least one timestamped passage.

Suggested change:

The field guide should say that Acceptance Criteria are checked before launch, while Success Metrics are measured after launch.
```

Maintainers can then discuss the proposal and decide whether it should become a docs change, example change, vocabulary change, schema change, or no change.

## How To Propose A Section Vocabulary Change

Use a `Section vocabulary proposal` issue when you want to add, remove, rename, or change a canonical section.

Steps:

1. Go to `https://github.com/gokulrajaram/ProductSpec/issues/new/choose`.
2. Choose `Section vocabulary proposal`.
3. Fill in the proposed section ID, such as `constraints`.
4. Choose whether the section should be `Mandatory`, `Optional`, or a `Custom convention`.
5. Explain what current section cannot cover the idea.
6. Paste a concrete example of the section as Markdown.
7. Describe validation expectations.
8. Describe compatibility and migration impact.
9. Click `Submit new issue`.

Example issue:

```md
Title: Section proposal: add "constraints"

Proposed section ID:
constraints

Section type:
Optional

What current gap does this solve?
Some enterprise Product Specs need to name legal, compliance, operational, or migration constraints that shape the solution but do not belong in Scope.

Example usage:

## Constraints

- Must preserve existing SSO behavior.
- Must not store customer ticket bodies outside the customer's workspace.
- Must support SOC 2 audit export requirements.

Validation expectations:
No special validation in v0.x. The section should be preserved and ordered after Scope.

Compatibility and migration impact:
Existing Product Specs remain valid. Tools that do not understand `constraints` should preserve it as an unknown or custom section.
```

After discussion, a section vocabulary change usually needs a pull request because it may touch:

- `SPEC.md`
- `schema/product-spec.schema.json`
- `parsers/ts/src/index.ts`
- conformance fixtures
- examples
- `docs/field-guide.md`
- `CHANGELOG.md`

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

Running validation does not submit anything. It only checks your local file.

To contribute an example:

```bash
git clone https://github.com/<your-user>/ProductSpec.git
cd ProductSpec
npm install
npm ci --prefix parsers/ts

git checkout -b add-your-example
cp examples/minimal.product-spec.md examples/your-example.product-spec.md

npm run validate -- examples/your-example.product-spec.md

git add examples/your-example.product-spec.md
git commit -m "Add example Product Spec"
git push origin add-your-example
```

Then open a pull request against `gokulrajaram/ProductSpec`. Maintainers review the pull request before the example becomes part of the standard repo.

To open the pull request:

1. Go to your fork on GitHub: `https://github.com/<your-user>/ProductSpec`.
2. GitHub will usually show a banner for your recently pushed branch. Click `Compare & pull request`.
3. If there is no banner, go to `Pull requests`, then click `New pull request`.
4. Set `base repository` to `gokulrajaram/ProductSpec` and `base` to `main`.
5. Set `head repository` to your fork and `compare` to `add-your-example`.
6. In the PR description, explain what product-work pattern the example shows and why it belongs in the repo.
7. Click `Create pull request`.

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
