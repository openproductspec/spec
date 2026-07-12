# Changelog

## Unreleased

No unreleased changes.

## v0.13.0 - MCP Server

Added:

- `productspec mcp` starts a lightweight stdio MCP server for coding agents.
- MCP tools expose Product Specs as structured intent: spec discovery, validation, Scope, Acceptance Criteria, AI Evals, Success Metrics, Related Artifacts, and completion-claim checklists.
- `docs/agent-mcp.md` documents MCP client configuration and agent usage.

## v0.12.0 - Product Spec Dependencies

Added:

- Related artifacts can reference another Product Spec: new `product_spec` type with required `product_spec_path`, optional `product_spec_revision` pin, and optional `relation` (`depends_on`, `blocks`, `supersedes`, `relates_to`).
- `product_spec` related artifacts make a library of specs traversable as a dependency graph.
- Conformance fixtures for valid and invalid Product Spec dependencies.

Changed:

- `url` is not allowed on `product_spec` related artifacts.
- `product_spec_path`, `product_spec_revision`, and `relation` are rejected on every other related artifact type.
- Omitted `product_spec` relations parse as `relates_to`.

## v0.11.0 - Parser Round-Trip Fixes

Fixed:

- ProductSpec structured blocks now parse CommonMark tilde fences (`~~~productspec-*`) as well as backtick fences.
- `tool_metadata` frontmatter now survives parse and serialize round-trips.
- Agent-facing ProductSpec skill docs no longer describe AI evals as a standalone section.

Clarified:

- `custom_sections[].after` is advisory metadata for authoring tools; physical Markdown section order remains authoritative.
- Scope guidance now distinguishes rejected user-visible capabilities (`cut`) from rejected implementation approaches (`solution_alternatives`).
- Compliance, privacy, security, and legal content belongs in Acceptance Criteria when it is a concrete pre-launch gate, and in a custom section when it is an ongoing obligation.

## v0.10.0 - Parser Correctness And Provisional Targets

Added:

- Fenced-code-aware section parsing, so `##` headings inside Markdown code samples no longer create duplicate or out-of-order ProductSpec sections.
- `target_status: committed | provisional` for structured Success Metrics.
- `target_owner` for provisional Success Metric targets, allowing teams to record honest post-launch target calibration without turning guesses into committed intent.

## v0.9.0 - Decision Trace Validation

ProductSpec v0.9.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and adds first-class Decision Trace validation.

Added:

- `productspec validate-trace <file>` for validating Decision Trace JSON files.
- Decision Trace validation errors for malformed JSON, missing required fields, unsupported versions, invalid event types, invalid outcomes, malformed links, and invalid revision values.
- Optional `decision_traces` input in the GitHub Action.
- Invalid conformance fixtures for malformed `applies_to`, malformed related artifacts, and missing required Decision Trace fields.
- Clearer agent installation docs for Codex, Claude Code, Cursor, and repo agents.
- README guidance for non-code contributions from product leaders and builders.

## v0.8.0 - Traceability And Agent Skill

ProductSpec v0.8.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and adds portable traceability plus a loadable agent adoption surface.

Added:

- GitHub Action wrapper for validating ProductSpec files in downstream repos.
- Adoption levels guide.
- Before-and-after ProductSpec example.
- ProductSpec comparison guide.
- Repo starter kit for teams storing Product Specs beside code.
- Additional examples for AI-agent handoff and platform migration work.
- Structured `productspec-acceptance-criteria` blocks with generated durable `AC-<number>` IDs.
- Generated durable IDs for structured Success Metrics (`SM-<number>`) and AI evals (`EVAL-<number>`).
- Optional `applies_to` frontmatter for broad path or component scope.
- Optional `related_artifacts` section with structured `productspec-related-artifacts` blocks.
- Parser and JSON Schema support for related artifacts.
- Validation for malformed `applies_to` and related artifact blocks.
- Conformance fixture for traceable Product Specs.
- `skills/productspec/SKILL.md` for agents implementing from Product Specs.
- `docs/agent-usage.md` for teams using ProductSpec as the control file for agent-led work.

Changed:

- Acceptance Criteria and Success Metrics are now represented as structured blocks in valid fixtures and examples.
- Eval cases and checks remain un-IDed; tools should cite them positionally when needed.

## v0.7.0 - Decision Trace

ProductSpec v0.7.0 adds Decision Trace as an optional companion standard.

Added:

- `schema/decision-trace.schema.json` for portable decision, drift, revision, and outcome traces.
- Example Decision Trace under `examples/decision-traces/`.
- Documentation for Decision Trace as a companion format rather than a ProductSpec section.

## v0.6.0 - Structured Scope And Success Metrics

ProductSpec v0.6.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and adds optional structured blocks for Scope and Success Metrics.

Added:

- Optional `productspec-scope` fenced blocks inside Scope.
- Optional `productspec-success-metrics` fenced blocks inside Success Metrics.
- Parser and JSON Schema support for extracting structured scope and success metrics.
- Validation for malformed structured scope and success metric blocks.

## v0.5.0 - AI Evals

ProductSpec v0.5.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and adds optional structured AI evals inside Acceptance Criteria.

Added:

- Optional structured `productspec-ai-evals` fenced blocks inside Acceptance Criteria.
- Parser and JSON Schema support for extracting AI evals as structured data.
- Validation for malformed AI eval blocks.

## v0.4.0 - Spec Revision

ProductSpec v0.4.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and adds an optional `spec_revision` frontmatter field.

Added:

- Optional `spec_revision` frontmatter for tracking the revision of one Product Spec's product intent.
- Parser and JSON Schema support for positive integer `spec_revision` values.
- Examples and conformance fixtures showing `spec_revision: 1`.

## v0.3.0 - Adoption Milestone

ProductSpec v0.3.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and improves first-run adoption.

Added:

- `productspec init <file>` for creating a starter Product Spec.
- Stronger examples for AI features, consumer UX, enterprise workflows, and internal APIs.
- A sharper README opening and expanded `docs/why-productspec.md`.

## v0.2.0 - Tooling Milestone

ProductSpec v0.2.0 keeps the Product Spec document shape at `spec_format_version:
"0.1"` and improves the tooling around it.

Added:

- TypeScript reference parser package at `parsers/ts`.
- `productspec` CLI binary in the parser package.
- Repo-local validation commands:
  - `npm run validate -- <file>`
  - `npm run cli -- validate <file>`
- Valid and invalid conformance fixtures.
- Round-trip parser tests.
- Structured validation results with stable error and warning codes.
- Errors for:
  - missing frontmatter
  - unsupported `spec_format_version`
  - missing required frontmatter fields
  - unsupported `artifact_type`
  - missing required sections
  - duplicate sections
  - invalid required-section order
  - invalid custom section IDs
- Warnings for:
  - empty required sections
  - very thin required sections
- First-run validation guide at `docs/validate-your-first-product-spec.md`.

Publishing status:

- `@productspec/parser@0.2.0` is published to npm.
- The package exposes the `productspec` CLI binary.

## v0.1.0 - Document Shape

ProductSpec v0.1.0 defines the initial Markdown document shape for software intent before implementation.

Mandatory sections:

1. `problem`
2. `hypothesis`
3. `scope`
4. `acceptance_criteria`
5. `success_metrics`

Optional sections:

`user_experience`, `customer_truth`, `solution_alternatives`, `solution`, `strategic_positioning`, `adoption`, `pricing`, `risks`, `ai`, `open_questions`, `rollout`

Custom sections use `custom-<kebab-name>`.
