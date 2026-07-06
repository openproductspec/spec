# ProductSpec Roadmap

ProductSpec starts as a small Markdown serialization and grows toward a stable semantic model for software intent.

## v0.1: Document Format

Status: current.

Includes:

- `.product-spec.md` file format.
- Required frontmatter.
- Canonical section vocabulary.
- Optional and custom sections.
- JSON Schema for parsed Product Specs.
- JSON Schema for portable review annotations.
- Reference TypeScript parser.
- Minimal and expanded examples.

## v0.2: Validation And Conformance

Status: current.

Goal: make ProductSpec easier for other tools to adopt correctly.

Includes:

- Validator CLI for `.product-spec.md` files.
- Valid and invalid fixture corpus.
- Round-trip conformance tests.
- Custom-section preservation tests.
- Structured validator result with stable error codes.

Remaining:

- Review-annotation fixture examples.
- Formatter expectations for stable Markdown output.

## v0.3: Decision Trace

Goal: add an optional portable reasoning trail.

Planned additions:

- Decision Trace schema.
- Examples linking evidence, alternatives, decisions, implementation, outcomes, and learnings.
- File naming conventions for trace files stored beside specs.
- Link conventions for GitHub, issue trackers, engineering specs, experiments, and evals.

Decision Trace should remain optional so the core ProductSpec document format stays easy to adopt.

## v0.4: Outcomes And Tool Links

Goal: let Product Specs connect cleanly to downstream systems.

Planned additions:

- Standard link types for engineering specs, tasks, code, experiments, evals, and product metrics.
- Outcome summary format.
- Compatibility fixtures for older v0.x documents.

## v1.0: Stable Semantic Model

Goal: make the semantic model the standard, with Markdown as one serialization.

Possible serializations:

- Markdown.
- JSON.
- YAML.
- AST.
- Protocol Buffers.

The v1.0 bar is ecosystem confidence: tools can exchange Product Specs without treating one implementation's export format as the standard.
