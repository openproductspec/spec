# Validator Reference

ProductSpec ships a TypeScript reference validator and CLI.

```bash
npm exec --package @productspec/parser -- productspec validate path/to/file.product-spec.md
```

Validate a Decision Trace:

```bash
npm exec --package @productspec/parser -- productspec validate-trace path/to/file.decision-trace.json
```

Validate an Agent Run:

```bash
npm exec --package @productspec/parser -- productspec validate-run path/to/file.agent-run.json
```

Scan a repo for ProductSpec health:

```bash
npm exec --package @productspec/parser -- productspec garden path/to/repo
```

Reconcile one Product Spec against one Agent Run:

```bash
npm exec --package @productspec/parser -- productspec reconcile path/to/file.product-spec.md --against path/to/file.agent-run.json
```

Serve a local read-only dashboard over the same garden report:

```bash
npm exec --package @productspec/parser -- productspec serve path/to/repo --port 4317
```

The validator returns errors for structurally invalid Product Specs and warnings for weak-but-parseable specs. Decision Trace and Agent Run validation return errors for structurally invalid JSON files. Repo maintenance commands are read-only and report graph health, evidence gaps, stale revision pins, and run gaps.

## Schema Parity

`schema/product-spec.schema.json` mirrors the parser's structural contract where JSON Schema can express it:

- required frontmatter fields
- optional `spec_revision` positive integer
- supported `artifact_type` values
- optional `applies_to` frontmatter
- canonical section IDs
- `custom-<kebab-name>` section IDs
- presence of mandatory sections
- structured scope inside Scope
- structured AI evals inside Acceptance Criteria
- structured success metrics inside Success Metrics
- structured related artifacts inside Related Artifacts

Some parser behavior is intentionally outside the JSON Schema:

- duplicate section IDs
- required-section relative ordering
- warning heuristics for empty or thin required sections

Use the TypeScript validator as the reference implementation when behavior differs.

## Errors

Errors fail validation.

## Agent Run Errors

### `invalid_agent_run`

The Agent Run file is not a JSON object.

Fix: make the file valid JSON and run `productspec validate-run` again.

### `missing_required_agent_run_field`

A required Agent Run field is absent or empty.

Required top-level fields:

- `agent_run_format_version`
- `run_id`
- `agent`
- `product_spec`
- `started_at`
- `status`
- `checked_items`
- `drift`

Checked items require:

- `item_id`
- `status`

Fix: add the missing field.

### `unsupported_agent_run_version`

`agent_run_format_version` is not supported by this validator.

Fix: use `"0.1"` or upgrade the validator when newer versions exist.

### `invalid_agent_run_id`

`run_id` does not use the portable ID shape.

Fix: use lowercase words separated by hyphens or underscores, such as `checkout-redesign-run`.

### `invalid_agent_run_status`

`status` is not one of the supported Agent Run statuses.

Supported values:

- `draft`
- `completed`
- `blocked`
- `failed`

`productspec init-run` creates `draft` receipts. Change the status after the agent records checked items, evidence, drift, and completion claim.

### `invalid_agent_run_item`

A checked item is malformed, uses an unsupported status, or references an invalid item ID.

Valid item IDs reference durable ProductSpec items:

- `AC-<number>`
- `EVAL-<number>`
- `SM-<number>`

Supported checked item statuses:

- `passed`
- `failed`
- `not_checked`
- `blocked`

### `duplicate_agent_run_item_id`

Two checked items reference the same durable ProductSpec item ID.

Fix: merge the evidence into one checked item.

### `invalid_agent_run_revision`

The referenced Product Spec revision is not a positive integer.

Fix: use `1` or higher.

### `invalid_agent_run_agent`, `invalid_agent_run_product_spec`, `invalid_agent_run_drift`

One of the Agent Run nested objects is malformed.

Fix: follow [`docs/agent-run.md`](agent-run.md) and [`schema/agent-run.schema.json`](../schema/agent-run.schema.json).

## Decision Trace Errors

### `invalid_json`

The Decision Trace file is not valid JSON.

Fix: make the file valid JSON and run `productspec validate-trace` again.

### `missing_required_trace_field`

A required Decision Trace field is absent or empty.

Required top-level fields:

- `decision_trace_format_version`
- `trace_id`
- `title`
- `created_at`
- `updated_at`
- `subject`
- `events`

Events require:

- `event_id`
- `event_type`
- `occurred_at`
- `summary`
- `decision`

Decisions require:

- `outcome`
- `rationale`

Fix: add the missing field.

### `unsupported_trace_version`

`decision_trace_format_version` is not supported by this validator.

Fix: use `"0.1"` or upgrade the validator when newer versions exist.

### `invalid_trace_id`

`trace_id` does not use the portable ID shape.

Fix: use lowercase words separated by hyphens or underscores, such as `checkout-redesign-trace`.

### `invalid_datetime`

A Product Spec, Decision Trace, or Agent Run date-time field is not an ISO 8601 date-time.

Product Spec fields:

- `created_at`
- `updated_at`

Decision Trace fields:

- `created_at`
- `updated_at`
- `events[].occurred_at`

Agent Run fields:

- `started_at`
- `completed_at`

Fix: use a full date-time such as `2026-07-13T00:00:00Z`.

### `duplicate_trace_event_id`

Two Decision Trace events use the same `event_id`.

Fix: give each event a unique durable ID.

### `invalid_trace_subject`

The Decision Trace subject is malformed or uses an unsupported type.

Supported subject types:

- `product_spec`
- `engineering_spec`
- `design`
- `implementation`
- `eval`
- `experiment`
- `incident`
- `other`

### `invalid_trace_events`

The `events` array is absent, empty, or malformed.

Fix: include at least one event.

### `invalid_trace_event`

An event is malformed or uses an unsupported `event_type`.

Supported event types:

- `intent_decision`
- `scope_drift`
- `acceptance_criteria_drift`
- `ux_drift`
- `ai_eval_drift`
- `success_metric_review`
- `implementation_tradeoff`
- `spec_revision`
- `outcome_review`

### `invalid_trace_decision`

An event's `decision` object is malformed or uses an unsupported `outcome`.

Supported outcomes:

- `update_spec`
- `update_implementation`
- `accept_tradeoff`
- `reopen_work`
- `record_learning`
- `no_action`

### `invalid_trace_link`

A Decision Trace link is malformed or uses an unsupported type.

Fix: include `type` and `url`, and use one of the ProductSpec related artifact types or `product_spec`.

### `invalid_trace_revision`

A Product Spec revision field is present but is not a positive integer.

Fix: use `1` or higher.

## Product Spec Errors

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

### `duplicate_item_id`

Two Acceptance Criteria, AI Evals, or Success Metrics use the same durable item ID.

Fix: keep `AC-`, `EVAL-`, and `SM-` IDs unique within a Product Spec.

### `invalid_ai_eval`

A `productspec-ai-evals` block is malformed or incomplete.

Required fields:

- `id`
- `type`
- `evaluator`
- `pass_threshold`
- `cases`

Optional fields:

- `checks`

Fix: place the block inside Acceptance Criteria, include every required field, use an ID in the form `EVAL-<number>`, use one of the supported `type` values (`exact_match`, `contains`, `regex`, `llm_judge`, `human_review`), use one of the supported `evaluator` values (`deterministic`, `llm`, `human`), set `pass_threshold` to a number greater than `0` and less than or equal to `1`, and include at least one inline case with `input` and `expected`. Add `checks` only when the input/expected cases need extra grading rules.

Eval cases and optional checks do not have their own IDs. If a tool needs to cite them, use positional references such as `EVAL-1.case[2]` or `EVAL-1.check[1]`.

### `invalid_acceptance_criterion`

A `productspec-acceptance-criteria` block is malformed, incomplete, missing from Acceptance Criteria, or placed outside Acceptance Criteria.

Required fields:

- `id`
- `criterion`

Fix: place the block inside Acceptance Criteria, include at least one item, include every required field, and use an ID in the form `AC-<number>`.

### `invalid_structured_scope`

A `productspec-scope` block is malformed or placed outside Scope.

Supported fields:

- `in`
- `out`
- `cut`

Fix: place the block inside Scope, use only supported fields, and include at least one non-empty item.

Structured ProductSpec blocks may use either CommonMark backtick fences or tilde fences. For example, both ```productspec-scope and ~~~productspec-scope are valid fence openers.

### `invalid_success_metric`

A `productspec-success-metrics` block is malformed, incomplete, missing from Success Metrics, or placed outside Success Metrics.

Required fields:

- `id`
- `metric`
- `target`
- `window`

Optional fields:

- `target_status`: `committed` or `provisional`; omitted values default to `committed` in the parser.
- `target_owner`: required when `target_status` is `provisional`.

Fix: place the block inside Success Metrics, include at least one item, include every required field, use an ID in the form `SM-<number>`, and include `target_owner` for provisional targets.

### `invalid_applies_to`

An `applies_to` frontmatter entry is malformed.

Each item must include exactly one of:

- `path`
- `component`

Fix:

```yaml
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
```

### `invalid_related_artifact`

A `productspec-related-artifacts` block is malformed or placed outside `Related Artifacts`.

Required fields:

- `type`
- `url`, or `product_spec_path` when `type` is `product_spec`

`url` can be an external URL or a repo-relative path to an inspectable artifact, such as `./evidence/eval-run.json` or `./evidence/day-14-dashboard.png`.

Optional fields:

- `title`
- `section_id`
- `item_id`
- `product_spec_path` (only on `type: product_spec`, which does not take `url`)
- `product_spec_revision` (positive integer)
- `relation` (`depends_on`, `blocks`, `supersedes`, `relates_to`; only on `type: product_spec`)

Supported `type` values:

- `github_issue`
- `github_pr`
- `jira_issue`
- `linear_issue`
- `figma`
- `engineering_spec`
- `eval_run`
- `dashboard`
- `analytics_snapshot`
- `experiment`
- `release`
- `code`
- `product_spec`
- `other`

Fix: place the block inside `Related Artifacts`, include every required field, and use `item_id` only for an existing `AC-<number>`, `SM-<number>`, or `EVAL-<number>`.

The validator warns when the evidence type usually points at a different item family. For example, `eval_run` usually attaches to `EVAL-<number>`, while `dashboard`, `analytics_snapshot`, and `experiment` usually attach to `SM-<number>`.

### `missing_required_section`

One or more mandatory sections are absent.

Mandatory sections:

1. `problem`
2. `hypothesis`
3. `product_summary`
4. `scope`
5. `acceptance_criteria`
6. `success_metrics`

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

### `unusual_related_artifact_target`

A Related Artifact points at a valid item ID, but the artifact type usually attaches to a different item family.

Examples:

- `eval_run` usually attaches to `EVAL-<number>`.
- `dashboard`, `analytics_snapshot`, and `experiment` usually attach to `SM-<number>`.

Fix: either retarget the artifact or keep it if the unusual pairing is intentional.

### `revision_pin_mismatch`

A `product_spec` related artifact pins `product_spec_revision`, but the target Product Spec in the graph has a different `spec_revision`.

Fix: update the pin, update the target spec, or review whether the dependency still points at the intended revision.
