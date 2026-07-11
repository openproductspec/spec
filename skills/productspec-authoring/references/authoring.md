# Authoring a Product Spec

## Skeleton

```markdown
---
spec_format_version: "0.1"
title: "Feature Name"
artifact_type: "prd"
spec_revision: 1
author: "Name"
created_at: "2026-01-01T00:00:00Z"
updated_at: "2026-01-01T00:00:00Z"
linked_github_repo: "acme/app"
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
---

## Problem

Who is hurting, what pain they feel, and why it matters now.

## Hypothesis

The causal bet: if we ship this, this specific user changes this observable behavior.

## Scope

What is in, what is out, what was considered and deliberately cut.

## Acceptance Criteria

Pass/fail build checks before launch, in a productspec-acceptance-criteria block.

## Success Metrics

Real-user behavior after launch, in a productspec-success-metrics block.
```

Required: `spec_format_version`, `title`, `artifact_type`, `author`, `created_at`, `updated_at`.

Optional: `spec_revision` (start at `1`), `linked_github_repo`, `applies_to`, `custom_sections`, `tool_metadata`.

Each `applies_to` entry carries exactly one of `path` or `component`. Two keys in one entry, or neither, fails with `invalid_applies_to`.

## Section rules that trip people

- `problem` names a person and a pain, not a solution. If the first draft describes the feature, rewrite it.
- `hypothesis` must be falsifiable. "Users will like it" is not a hypothesis. "Support leads respond to account-risk tickets faster because the queue is pre-sorted" is.
- The hypothesis carries the same persona the problem names and predicts an observable behavior change. A mental state ("writers will trust it") cannot be read from a usage log. A behavior can ("writers route edits through integrations they previously avoided").
- The acceptance/success split: acceptance criteria are checkable before launch, success metrics are observable only after real users arrive. AI eval thresholds are acceptance criteria, never success metrics.

## Required blocks

`acceptance_criteria` and `success_metrics` each need a fenced block. Prose alone fails validation.

Acceptance criteria, each item needs `id` in the form `AC-<number>` and `criterion`:

````markdown
```productspec-acceptance-criteria
- id: AC-1
  criterion: User can search a transcript by phrase and get timestamped results.
- id: AC-2
  criterion: Copy passage includes transcript text, video URL, and timestamp.
```
````

Success metrics, each item needs `id` in the form `SM-<number>`, plus `metric`, `target`, `window`:

````markdown
```productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  target_status: committed
  window: within 7 days of transcript creation
```
````

`target` is a free-form string. The convention is a comparison such as `">= 35%"` or `"= 0"`. Units are allowed.

`target_status` is optional and defaults to `committed`. When the metric is known but the number depends on a baseline that only exists after launch, mark the target provisional and name the person who owns setting it:

````markdown
```productspec-success-metrics
- id: SM-1
  metric: baseline_calibrated_metric_rate
  target: tbd
  target_status: provisional
  target_owner: Data lead
  window: within 14 days after launch
```
````

`target_owner` is required when `target_status` is `provisional`, and omitting it fails with `invalid_success_metric`. A `target_status` other than `committed` or `provisional` fails the same way.

Reach for `provisional` instead of inventing a number. A guessed target that validates is indistinguishable from a researched one, and the file cannot tell the next reader which it holds.

## Optional blocks

Structured scope inside `## Scope`. Prose scope is also valid:

````markdown
```productspec-scope
in:
  - what ships in this version
out:
  - explicitly outside this version
cut:
  - considered and deliberately removed
```
````

No individual key is required. The block needs at least one non-empty item across `in`, `out`, and `cut` combined. Omit a category that has nothing in it.

AI evals inside `## Acceptance Criteria`, only when the feature has AI behavior:

````markdown
```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Find where the speaker commits to the Q3 date."
      expected: "Returns the passage containing the commitment with its timestamp."
  evaluator: llm
  pass_threshold: 0.85
  checks:
    - returned passage answers the query
```
````

Each eval item needs:

- `id`: `EVAL-<number>`.
- `type`: one of `exact_match`, `contains`, `regex`, `llm_judge`, `human_review`.
- `cases`: one or more inline cases, each with `input` and `expected`.
- `evaluator`: one of `deterministic`, `llm`, `human`.
- `pass_threshold`: a number greater than 0 and at most 1.
- `checks`: optional. Add them when `input` and `expected` are not specific enough on their own.

Eval cases and checks have no ids of their own. Cite them positionally, as `EVAL-1.case[2]`.

The block belongs inside `## Acceptance Criteria`. There is no `## AI Evals` section. Putting the block under its own heading fails with `invalid_ai_eval`.

Deterministic features do not need an ai-evals block. Do not fake one.

Related artifacts inside `## Related Artifacts`, for item-level traceability:

````markdown
```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/acme/app/issues/123"
  title: "Build transcript search"
  section_id: acceptance_criteria
  item_id: AC-1
- type: dashboard
  url: "https://analytics.example.com/transcript-search"
  section_id: success_metrics
  item_id: SM-1
```
````

Each item requires `type`, plus `url` for every type except `product_spec`, which requires `product_spec_path` instead. `title`, `section_id`, and `item_id` are optional. `type` is one of `github_issue`, `github_pr`, `jira_issue`, `linear_issue`, `figma`, `engineering_spec`, `eval_run`, `dashboard`, `analytics_snapshot`, `experiment`, `release`, `code`, `product_spec`, `other`. The block belongs inside `## Related Artifacts`, and `item_id` is where a durable `AC-`, `SM-`, or `EVAL-` id earns its keep.

A `product_spec` item points at another spec in the same repo and makes dependencies traversable:

````markdown
```productspec-related-artifacts
- type: product_spec
  product_spec_path: "../library/citation-library.product-spec.md"
  product_spec_revision: 2
  relation: depends_on
```
````

`product_spec_revision` is an optional positive integer pinning the referenced spec's `spec_revision`. `relation` is one of `depends_on`, `blocks`, `supersedes`, `relates_to`, defaulting to `relates_to`. `product_spec_path`, `product_spec_revision`, and `relation` are rejected on any other type.

Frontmatter `applies_to` carries document-level scope. `related_artifacts` carries item-level links. They are not alternatives.

## Optional sections

`user_experience`, `customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`, `related_artifacts`. Write them as title-case headings: `open_questions` is `## Open Questions`. Add a section only when it sharpens the document.

Any non-canonical `## Heading` becomes a custom section with a derived `custom-<kebab-name>` id. Declare it in frontmatter `custom_sections` (entries of `{ id, label, after }`) when you want to pin the id and label. Declared ids must match `custom-<kebab-name>` or validation fails with `invalid_custom_section_id`. `after` is advisory metadata for authoring tools. It is preserved on round-trip, but the reference parser orders sections by their physical position in the file. A misspelled optional-section heading silently becomes a custom section, so check spelling yourself.

Full vocabulary and field definitions: https://github.com/gokulrajaram/ProductSpec/blob/main/SPEC.md. Worked example: https://github.com/gokulrajaram/ProductSpec/blob/main/examples/ai-support-triage.product-spec.md.
