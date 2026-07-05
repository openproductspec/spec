# Product Spec Standard v0.1

## Intent

The Product Spec Standard defines a portable Markdown format for product specs.

It is meant for documents that should be readable by humans, reviewable by product tools, and executable by AI agents downstream.

The Standard defines structure and interoperability. It does not define taste, quality, or reviewer behavior.

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

- `linked_github_repo`: string, such as `"owner/repo"`
- `custom_sections`: array of `{ id, label, after }`
- `tool_metadata`: map of tool-specific fields

Exports intended for public sharing should strip `tool_metadata` by default.

## Canonical Section Vocabulary

Mandatory sections, in order:

1. `problem`: who is hurting, what pain they feel, and why it matters.
2. `hypothesis`: the causal bet behind the product.
3. `scope`: what is in, what is out, and what is deliberately cut.
4. `user_experience`: a URL to a working prototype, mockup, deploy, or walkthrough.
5. `acceptance_criteria`: pass/fail build checks before launch.
6. `success_metrics`: real-user behavior after launch.

Optional sections:

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

For products with AI features, AI eval thresholds belong in `acceptance_criteria`, not `success_metrics`. Success metrics are post-launch product and business outcomes. Acceptance criteria are pre-launch build gates.

## Custom Sections

Custom section IDs use `custom-<kebab-name>`.

Tools must preserve custom sections on round-trip.

## Review Annotation Format

Portable review annotations may be attached to a Product Spec:

```yaml
review_id: "review_123"
reviewer_tool: "productspec.io/reviewer-v3"
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

## Planned v0.2 Additions

The next compatibility milestone is validation and conformance.

Planned v0.2 additions:

- Validator behavior for `.product-spec.md` files.
- Valid and invalid fixture corpus.
- Round-trip conformance tests.
- Review-annotation examples.
- Versioning and compatibility rules.

Validators check structure and portability. They do not judge product quality.
