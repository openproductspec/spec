# Validating Product Specs

## Commands

Validate one Product Spec:

```bash
npm exec --yes --package @productspec/parser -- productspec validate path/to/file.product-spec.md
```

Validate one Decision Trace:

```bash
npm exec --yes --package @productspec/parser -- productspec validate-trace path/to/file.decision-trace.json
```

Create a starter file:

```bash
npm exec --yes --package @productspec/parser -- productspec init my-feature.product-spec.md
```

`--yes` suppresses npm's interactive install prompt on machines without the package cached. Without it, `npm exec` hangs in CI and non-interactive agent runs.

CI, via the GitHub Action:

```yaml
- uses: gokulrajaram/ProductSpec@main
  with:
    files: "docs/product-specs/**/*.product-spec.md"
    decision_traces: "docs/decision-traces/**/*.decision-trace.json"
```

`decision_traces` is optional and defaults to empty. Pin a commit SHA in place of `@main` when CI needs to be reproducible.

## Reading validator output

Errors block. Warnings do not. Full taxonomy: https://github.com/gokulrajaram/ProductSpec/blob/main/docs/validator.md.

Product Spec errors:

| Error | Cause |
|---|---|
| `missing_frontmatter` | No `---` frontmatter block |
| `missing_required_frontmatter` | One of the six required fields absent |
| `unsupported_version` | `spec_format_version` is not `"0.1"` |
| `unsupported_artifact_type` | `artifact_type` is not `hypothesis`, `prd`, or `openspec_proposal` |
| `invalid_spec_revision` | `spec_revision` is not a positive integer |
| `invalid_applies_to` | An `applies_to` entry lacks exactly one of `path` or `component` |
| `missing_required_section` | One of the five mandatory sections absent |
| `duplicate_section` | Two sections resolve to the same id |
| `invalid_section_order` | Mandatory sections out of order |
| `invalid_acceptance_criterion` | Block missing, or an item without `id` in `AC-<number>` form and a `criterion` |
| `invalid_success_metric` | Block missing, an item without `id` in `SM-<number>` form, `metric`, `target`, `window`, a `target_status` other than `committed` or `provisional`, or a provisional target with no `target_owner` |
| `invalid_ai_eval` | Bad field in a `productspec-ai-evals` item, or the block sits outside Acceptance Criteria |
| `invalid_structured_scope` | `productspec-scope` block with no non-empty item across `in`, `out`, `cut` |
| `invalid_related_artifact` | Item missing `type` or `url` (`product_spec_path` for `type: product_spec`), an unsupported `type` or `relation`, a non-positive `product_spec_revision`, spec fields on a non-spec type, or the block sits outside Related Artifacts |
| `invalid_custom_section_id` | A declared custom section id is not `custom-<kebab-name>` |
| `invalid_product_spec` | The document could not be parsed at all |

Warnings, which never block:

| Warning | Cause |
|---|---|
| `thin_required_section` | A mandatory section is very short. Fine for drafts |
| `empty_required_section` | A mandatory section has no body |

Decision Trace errors, from `validate-trace`: `invalid_json`, `unsupported_trace_version`, `missing_required_trace_field`, `invalid_trace_id`, `invalid_trace_subject`, `invalid_trace_events`, `invalid_trace_event`, `invalid_trace_decision`, `invalid_trace_link`, `invalid_trace_revision`.

## Fixing without distorting

Acceptance criteria and success metrics are required blocks, so a spec cannot ship the number in prose and still validate. When the target depends on a baseline that arrives with the launch, do not quietly write a plausible one. Set `target: tbd`, `target_status: provisional`, and name the owner in `target_owner`. The spec validates, and the file says out loud that the number is not committed yet.

Use `target_status: committed` only for a number someone actually agreed to. A guessed target that validates is indistinguishable from a researched one, and downstream tools cannot tell them apart.

When the metric itself is undecided, that is a different problem. Ask the author, and record the open decision under `## Open Questions` where a reviewer will see it.
