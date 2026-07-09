# ProductSpec v0.1

## Intent

ProductSpec defines a portable format for Product Specs.

It is meant for documents that should be readable by humans, reviewable by product tools, and executable by AI agents downstream.

ProductSpec defines structure and interoperability. It does not define taste, quality, or reviewer behavior.

## File Format

A Product Spec file uses the extension `.product-spec.md`.

Each file has:

1. YAML-like frontmatter between `---` markers.
2. Markdown sections headed by `## Section Label`.

Tools should preserve Markdown body content inside each section.

## Frontmatter

Required fields:

- `spec_format_version`: `"0.1"`
- `title`: string
- `artifact_type`: `"hypothesis"`, `"prd"`, or `"openspec_proposal"`
- `author`: string
- `created_at`: ISO 8601 datetime string
- `updated_at`: ISO 8601 datetime string

Optional fields:

- `spec_revision`: positive integer for this Product Spec's own intent revision
- `linked_github_repo`: string, such as `"owner/repo"`
- `custom_sections`: array of `{ id, label, after }`
- `tool_metadata`: map of tool-specific fields

`spec_format_version` describes the version of the ProductSpec standard used by the file. `spec_revision` describes the revision of this particular product decision. Tools may display `spec_revision: 3` as `v3`.

`spec_revision` should start at `1` and increment when product intent materially changes. It does not need to increment for typo fixes or formatting-only edits. Git remains the detailed history.

Exports intended for public sharing should strip `tool_metadata` by default.

## Canonical Section Vocabulary

Mandatory sections, in order:

1. `problem`: who is hurting, what pain they feel, and why it matters.
2. `hypothesis`: the causal bet behind the product.
3. `scope`: what is in, what is out, and what is deliberately cut.
4. `acceptance_criteria`: pass/fail build checks before launch.
5. `success_metrics`: real-user behavior after launch.

Optional sections:

- `user_experience`
- `customer_truth`
- `solution_alternatives`
- `solution`
- `strategic_positioning`
- `adoption`
- `pricing`
- `risks`
- `ai`
- `open_questions`
- `rollout`

Display labels are implementation-specific, except that tools should render `ai` as "AI Details".

`user_experience` describes the externally observable experience of the work when there is one, without prescribing implementation. Examples include:

- User-facing prototype URL or mockup.
- Design link.
- Public deploy or walkthrough.
- API documentation page.
- CLI demo.
- Admin workflow.
- Dashboard or report.
- Internal tool screen.

Structured scope may be included in `scope` with a fenced `productspec-scope` block:

````markdown
```productspec-scope
in:
  - transcript search
  - timestamped quote copy
out:
  - team libraries
cut:
  - speaker labels
```
````

Structured scope supports:

- `in`: what ships in this version.
- `out`: what is explicitly outside this version.
- `cut`: what was considered and deliberately removed.

Acceptance criteria are written in `acceptance_criteria` with a fenced `productspec-acceptance-criteria` block:

````markdown
```productspec-acceptance-criteria
- id: AC-1
  criterion: User can search a transcript by phrase and get timestamped results.
- id: AC-2
  criterion: Copy passage includes transcript text, video URL, and timestamp.
```
````

Each acceptance criterion item requires:

- `id`: generated durable identifier using `AC-<number>`.
- `criterion`: pass/fail build condition before launch.

Success metrics are written in `success_metrics` with a fenced `productspec-success-metrics` block:

````markdown
```productspec-success-metrics
- id: SM-1
  metric: copied_timestamped_quote_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
```
````

Each success metric item requires:

- `id`: generated durable identifier using `SM-<number>`.
- `metric`: metric name.
- `target`: threshold or target value.
- `window`: time window for reading the metric.

For products with AI features, AI eval thresholds belong in `acceptance_criteria`, not `success_metrics`. Success metrics are post-launch product and business outcomes. Acceptance criteria are pre-launch build gates.

Structured AI evals may also be included in `acceptance_criteria` with a fenced `productspec-ai-evals` block:

````markdown
```productspec-ai-evals
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.85
  checks:
    - returned passage answers the query
    - citation links to the correct timestamp
    - answer does not invent content outside the transcript
```
````

Each AI eval item requires:

- `id`: generated durable identifier using `EVAL-<number>`.
- `type`: eval type, for example `exact_match`, `contains`, `regex`, `llm_judge`, or `human_review`.
- `cases`: one or more inline test cases, each with `input` and `expected`.
- `evaluator`: who or what grades the eval: `deterministic`, `llm`, or `human`.
- `pass_threshold`: number greater than `0` and less than or equal to `1`.
- `checks`: optional extra pass/fail grading rules when `input` and `expected` are not specific enough on their own.

Eval cases and optional checks do not get standalone IDs. If a tool needs to cite them, it should use positional references such as `EVAL-1.case[2]` or `EVAL-1.check[1]`.

Tools should preserve fenced blocks in Markdown and may expose parsed criteria, metrics, and evals as structured data.

## Custom Sections

Custom section IDs use `custom-<kebab-name>`.

Tools must preserve custom sections on round-trip.

## Review Annotation Format

Portable review annotations may be attached to a Product Spec:

```yaml
review_id: "review_123"
reviewer_tool: "example-reviewer/v1"
reviewed_at: "2026-07-04T00:00:00Z"
sections:
  - section_id: "problem"
    axes:
      - axis_key: "clarity"
        verdict: "pass"
        suggestion: "Clear enough to build from."
```

`verdict` is one of `pass`, `fail`, or `warn`.

## Calibration Example Format

Portable calibration examples describe a workspace-specific bar:

```yaml
workspace_id: "workspace_123"
example_id: "example_123"
artifact_type: "prd"
source: "upload"
label: "good"
section_id: "problem"
axis_key: null
content: "Markdown content"
created_at: "2026-07-04T00:00:00Z"
```

## Compliance Levels

- L1: reads and writes `.product-spec.md` files.
- L2: implements portable review annotations.
- L3: implements portable calibration serialization.

## Versioning

ProductSpec is pre-1.0. Tools should check `spec_format_version` and should not assume v0.x documents have the same compatibility guarantees as v1.0. See `docs/versioning.md`.

## Tooling And Conformance

The ProductSpec repo includes a reference parser, validator, CLI, JSON Schemas, and conformance fixtures.

Validators check structure and portability. They do not judge product quality.

Decision Trace is defined as an optional companion standard for recording decisions, drift, revisions, outcomes, and learnings over time.
