# ProductSpec Versioning

ProductSpec is currently pre-1.0.

These versioning rules apply to ProductSpec as the open standard for software intent before implementation.

v0.x is experimental. The standard is stable enough for tooling experiments, examples, imports, exports, and early integrations, but the section vocabulary and compatibility rules may still change while implementers learn what the standard needs to support.

## Compatibility Promise

Breaking changes are allowed before v1.0.

Examples of pre-1.0 breaking changes include:

- Moving a section from mandatory to optional.
- Adding, renaming, or removing canonical section IDs.
- Changing schema namespace URLs.
- Tightening parser or validator expectations.
- Changing how optional metadata should be preserved.

These changes should still be documented clearly in the repo when they happen.

## Tool Requirements

Tools should check `spec_format_version`.

Tools may also read `spec_revision` when present. `spec_revision` is separate from `spec_format_version`: it tracks the revision of one Product Spec's product intent, not the standard format. It should start at `1` and increment when product intent materially changes. It does not need to increment for typo fixes or formatting-only edits. Git remains the detailed history.

At minimum, tools should:

- Reject unsupported versions with a clear error.
- Preserve unknown custom sections when possible.
- Preserve `tool_metadata` without treating it as portable standard behavior.
- Avoid assuming v0.x compatibility beyond what the current repo documents.

## Current Version

The current version is `0.1`.

In v0.1, the mandatory sections are:

1. `problem`
2. `hypothesis`
3. `product_summary`
4. `scope`
5. `acceptance_criteria`
6. `success_metrics`

`user_experience` is optional.

The v0.1 shape in this repository is the current canonical v0.1 shape. Earlier experimental commits may have different v0.1 section requirements; implementers should follow the current `SPEC.md`, schema, parser, and examples.

## v0.2 Tooling Milestone

v0.2 focuses on validation and conformance:

- Validator CLI.
- Local CLI wrappers: `npm run validate -- <file>` and `npm run cli -- validate <file>`.
- Valid and invalid fixture corpus.
- Round-trip conformance tests.
- Structured validator results with stable error and warning codes.
- Stable errors for missing frontmatter, unsupported versions, missing required frontmatter, unsupported artifact types, missing required sections, duplicate sections, invalid required-section order, and invalid custom section IDs.
- Non-failing warnings for empty or very thin required sections.

This does not change `spec_format_version`, which remains `"0.1"` for the current Product Spec document shape.

The v0.2 CLI package is published as `@productspec/parser`, with the `productspec` binary. Use `npm exec --package @productspec/parser -- productspec validate <file>` to run the published CLI without installing it globally.

## v0.3 Adoption Milestone

v0.3 keeps the document shape at `spec_format_version: "0.1"` and improves adoption:

- `productspec init <file>` creates a starter Product Spec.
- Additional examples show AI features, consumer UX, enterprise workflows, and internal APIs.
- The README and "Why ProductSpec?" docs explain the intent layer more directly.

## v0.4 Spec Revision Milestone

v0.4 keeps the document shape at `spec_format_version: "0.1"` and adds optional document-level revision metadata:

- `spec_revision` is an optional positive integer in frontmatter.
- It starts at `1` and increments when product intent materially changes.
- Downstream artifacts can reference the Product Spec revision they implement.

## v0.8 Traceability And Agent Skill Milestone

v0.8 keeps the document shape at `spec_format_version: "0.1"` and adds portable traceability plus an agent adoption surface:

- `applies_to` is optional frontmatter for broad path or component scope.
- `related_artifacts` is an optional section for links from Product Spec sections or item IDs to issues, pull requests, eval runs, dashboards, design artifacts, releases, engineering specs, or other durable records.
- `skills/productspec/SKILL.md` gives agents a loadable instruction file for using a Product Spec as the product contract for the work.
- `docs/agent-usage.md` explains how teams can load the skill and ask agents to cite Acceptance Criteria.
- `starter-kit/` gives teams a copyable repo setup with Product Specs, Agent Runs, Decision Traces, AGENTS/CLAUDE instructions, a pull request template, and CI validation.

## v0.9 Decision Trace Validation Milestone

v0.9 keeps the document shape at `spec_format_version: "0.1"` and makes Decision Trace a first-class validated companion format:

- `productspec validate-trace <file>` validates Decision Trace JSON files.
- The GitHub Action accepts optional `decision_traces` globs.
- Later v0.x tooling also accepts optional `agent_runs` globs for Agent Run validation.
- Invalid conformance fixtures cover malformed traceability and Decision Trace files.
- Agent setup docs explain Codex, Claude Code, Cursor, and repo-agent installation paths.

## v0.10 Parser Correctness And Provisional Targets Milestone

v0.10 keeps the document shape at `spec_format_version: "0.1"` and tightens parser correctness while allowing honest post-launch metric calibration:

- Section parsing ignores `##` headings inside fenced code blocks.
- Structured Success Metrics may include `target_status: committed | provisional`.
- Provisional Success Metric targets require `target_owner`.

## v0.21 Product Harness Milestone

v0.21 keeps the Product Spec document shape at `spec_format_version: "0.1"` and adds a validated companion artifact for agent execution:

- ProductSpec is positioned as the Product Harness for AI-native software work.
- `productspec validate-run <file>` validates Agent Run JSON files.
- Agent Run records the pinned Product Spec revision, checked `AC-`, `EVAL-`, and `SM-` IDs, evidence links, drift state, and completion claim.
- The GitHub Action accepts optional `agent_runs` globs.

## v0.22 Agent Run Drafting Milestone

v0.22 keeps the Product Spec document shape at `spec_format_version: "0.1"` and makes Agent Run receipts easier for agents and humans to create:

- `productspec init-run <spec.product-spec.md> [run.agent-run.json]` drafts an Agent Run receipt from a Product Spec.
- `draft_agent_run` exposes the same draft receipt through MCP.
- Agent Run accepts `status: "draft"` until the agent records checked items, evidence, drift, and a completion claim.

## v0.26 Agent Handoff Milestone

v0.26 keeps the Product Spec document shape at `spec_format_version: "0.1"` and adds generated Agent Handoff views:

- `productspec handoff <spec.product-spec.md> [handoff.md]` generates an Agent Handoff Markdown build contract.
- `get_agent_handoff` exposes the same build contract through MCP.
- Agent Handoff remains generated from Product Spec. It is not a canonical ProductSpec section.

## v0.27 Repo Maintenance Milestone

v0.27 keeps the Product Spec document shape at `spec_format_version: "0.1"` and adds repository-level harness operations:

- `productspec garden <repo> [--json]` scans a repo for Product Specs, Agent Runs, Decision Traces, graph health, missing evidence, stale revision pins, Agent Run gaps, and Decision Trace gaps.
- `productspec reconcile <spec.product-spec.md> [--against run.agent-run.json] [--json]` checks whether one Agent Run satisfies one Product Spec revision before completion is claimed.
- `productspec serve <repo> [--port 4317]` serves a local read-only dashboard over the garden report.
- These commands are read-only. They do not change the Product Spec format or rewrite repo artifacts.

## v1.0 Bar

v1.0 is the first compatibility promise.

Before v1.0, ProductSpec should have:

- A stable semantic model.
- A stable canonical section vocabulary.
- A conformance suite.
- Clear migration rules from prior v0.x documents.
- Enough independent implementation feedback to know the format is not only one product's export shape.
