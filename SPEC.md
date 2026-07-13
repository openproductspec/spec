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
- `applies_to`: array of `{ path }` or `{ component }` entries for broad code or component scope
- `custom_sections`: array of `{ id, label, after }`
- `tool_metadata`: map of tool-specific fields

`spec_format_version` describes the version of the ProductSpec standard used by the file. `spec_revision` describes the revision of this particular product decision. Tools may display `spec_revision: 3` as `v3`.

`spec_revision` should start at `1` and increment when product intent materially changes. It does not need to increment for typo fixes or formatting-only edits. Git remains the detailed history.

Exports intended for public sharing should strip `tool_metadata` by default.

`custom_sections[].after` is advisory metadata for authoring tools. The reference parser preserves it, but section order follows the physical order of `##` headings in the Markdown body.

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
- `related_artifacts`

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

Put a rejected user-visible capability, channel, or workflow in `cut`. Put a rejected way of building the same user-visible behavior in `solution_alternatives`. A practical test: would a user notice the difference? If yes, it is scope. If no, it is usually a solution alternative.

ProductSpec structured fenced blocks may use CommonMark backtick fences or tilde fences.

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
  target_status: committed
  window: within 7 days of transcript creation
```
````

Each success metric item requires:

- `id`: generated durable identifier using `SM-<number>`.
- `metric`: metric name.
- `target`: threshold or target value.
- `window`: time window for reading the metric.

Optional fields:

- `target_status`: `committed` or `provisional`; omitted values are interpreted as `committed`.
- `target_owner`: required when `target_status` is `provisional`.

Use `provisional` when the metric is known but the target depends on a post-launch baseline or calibration step. This keeps the spec honest without recording a guessed number as committed intent.

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

Compliance, privacy, security, or legal content belongs in Acceptance Criteria when it is a concrete pre-launch pass/fail gate. Ongoing obligations, standing policy, or background context belong in a custom section.

## Traceability

ProductSpec uses two traceability shapes.

Stable document-level relationships belong in frontmatter. Use `linked_github_repo` for the main repository and `applies_to` for broad code or component scope:

```yaml
linked_github_repo: "acme/app"
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
```

Item-level traceability belongs in the optional `related_artifacts` section with a structured `productspec-related-artifacts` block:

````markdown
## Related Artifacts

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

Each related artifact requires:

- `type`: one of `github_issue`, `github_pr`, `jira_issue`, `linear_issue`, `figma`, `engineering_spec`, `eval_run`, `dashboard`, `analytics_snapshot`, `experiment`, `release`, `code`, `product_spec`, or `other`.
- `url`: the linked artifact URL or durable external reference. When `type` is `product_spec`, `product_spec_path` replaces `url`.

Optional fields:

- `title`: human-readable label.
- `section_id`: canonical section ID or `custom-<kebab-name>`.
- `item_id`: `AC-<number>`, `SM-<number>`, or `EVAL-<number>`.
- `product_spec_path`: repo-relative path to another Product Spec in the same repository. Required when `type` is `product_spec`, and `url` is not allowed alongside it. Follows the shape of Decision Trace's `subject`.
- `product_spec_revision`: positive integer pinning the referenced spec's `spec_revision`.
- `relation`: one of four values, defaulting to `relates_to`.
  - `depends_on`: this spec cannot ship until the referenced spec ships.
  - `blocks`: the referenced spec cannot ship until this spec ships.
  - `supersedes`: this spec replaces the referenced spec.
  - `relates_to`: association with no ordering meaning.

A `product_spec` artifact makes a library of specs traversable: a tool can resolve `depends_on` edges across files and order the buildable set.

```productspec-related-artifacts
- type: product_spec
  product_spec_path: "../library/citation-library.product-spec.md"
  product_spec_revision: 2
  relation: depends_on
  title: "Citation Library"
```

Related Artifacts also connect ProductSpec IDs to evidence:

- `AC-<number>` links to implementation evidence such as pull requests, tests, code links, release notes, or engineering specs.
- `EVAL-<number>` links to eval evidence such as eval runs, test reports, or human review records.
- `SM-<number>` links to post-launch outcome evidence such as dashboards, analytics snapshots, experiments, or metric reviews.

ProductSpec does not collect evidence. It gives evidence a durable item ID to attach to.

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
