# Validator Reference

ProductSpec v0.6.0 ships a TypeScript reference validator and CLI.

```bash
npm exec --package @productspec/parser -- productspec validate path/to/file.product-spec.md
```

The validator returns errors for structurally invalid Product Specs and warnings for weak-but-parseable specs.

## Schema Parity

`schema/product-spec.schema.json` mirrors the parser's structural contract where JSON Schema can express it:

- required frontmatter fields
- optional `spec_revision` positive integer
- supported `artifact_type` values
- canonical section IDs
- `custom-<kebab-name>` section IDs
- presence of mandatory sections
- structured scope inside Scope
- structured AI evals inside Acceptance Criteria
- structured success metrics inside Success Metrics

Some parser behavior is intentionally outside the JSON Schema:

- duplicate section IDs
- required-section relative ordering
- warning heuristics for empty or thin required sections

Use the TypeScript validator as the reference implementation when behavior differs.

## Errors

Errors fail validation.

### `missing_frontmatter`

The document does not start with ProductSpec frontmatter.

Fix: add a YAML-style frontmatter block at the top of the file.

### `unsupported_version`

`spec_format_version` is not supported by this validator.

Fix: use the current supported version, `"0.1"`, or upgrade the validator when newer versions exist.

### `missing_required_frontmatter`

One or more required frontmatter fields are missing.

Required fields:

- `spec_format_version`
- `title`
- `artifact_type`
- `author`
- `created_at`
- `updated_at`

Fix: add the missing fields.

### `unsupported_artifact_type`

`artifact_type` is not one of the supported values.

Supported values:

- `hypothesis`
- `prd`
- `openspec_proposal`

Fix: choose one of the supported values.

### `invalid_spec_revision`

`spec_revision` is present but is not a positive integer.

Fix: remove `spec_revision` or set it to `1` or higher.

### `invalid_ai_eval`

A `productspec-ai-evals` block is malformed or incomplete.

Required fields:

- `id`
- `type`
- `evaluator`
- `pass_threshold`
- `cases`
- `checks`

Fix: place the block inside Acceptance Criteria, include every required field, set `pass_threshold` to a number greater than `0` and less than or equal to `1`, include at least one inline case with `input` and `expected`, and include at least one check.

### `invalid_structured_scope`

A `productspec-scope` block is malformed or placed outside Scope.

Supported fields:

- `in`
- `out`
- `cut`

Fix: place the block inside Scope, use only supported fields, and include at least one non-empty item.

### `invalid_success_metric`

A `productspec-success-metrics` block is malformed or incomplete.

Required fields:

- `id`
- `metric`
- `target`
- `window`

Fix: place the block inside Success Metrics, include every required field, and use snake_case for `id`.

### `missing_required_section`

One or more mandatory sections are absent.

Mandatory sections:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

Fix: add the missing section with its canonical heading.

### `duplicate_section`

The same section appears more than once.

Fix: merge duplicate content into one section.

### `invalid_section_order`

Mandatory sections are present but appear in the wrong relative order.

Fix: reorder mandatory sections to match the canonical sequence. Optional sections may appear between mandatory sections.

### `invalid_custom_section_id`

A custom section ID does not use the required `custom-<kebab-name>` shape.

Fix: rename the custom section ID. For example, use `custom-legal-review`, not `legal_review` or `legal`.

### `invalid_product_spec`

The document could not be parsed, but the validator could not classify the failure more specifically.

Fix: inspect the message and compare the document against `examples/minimal.product-spec.md`.

## Warnings

Warnings do not fail validation.

### `empty_required_section`

A required section exists but has no meaningful content, or only placeholder text such as `TBD`.

Fix: add enough content for a reader or downstream tool to understand the intent.

### `thin_required_section`

A required section is present but very short.

Fix: add enough detail to make the section useful for human review and AI handoff.
