# Changelog

## Unreleased

Added:

- `graph` resolves `contention`, `waves`, and `unscoped` so a fleet can dispatch agents in parallel without two of them landing on one surface.
- `graph` warns with `supersedes_cycle` when specs supersede each other in a loop, and keeps all of them, since none can be the replacement.
- `graph` warns with `unschedulable_dependency` and names the dependency, when a spec waits on work that cannot be built and therefore lands in no wave.
- `graph` treats an `applies_to` path of `.` or `/` as a claim on the whole repository, so a spec scoped to the repo contends with every spec scoped inside it.

## v0.26.0 - Product Harness And Agent Handoff

Added:

- `productspec handoff <spec.product-spec.md> [handoff.md]` generates an Agent Handoff Markdown build contract from a Product Spec.
- `get_agent_handoff` MCP tool returns the same generated handoff for MCP-aware agents.
- Product Harness explainer doc.
- Product Harness example folder with Product Spec, generated Agent Handoff, Agent Run, and Decision Trace.

Changed:

- README, agent docs, skills, starter kit, and examples now use Product Harness as the top-level frame and reserve intent harness for the coding-agent use case.

## v0.25.0 - Product Summary And Executable Scope

Changed:

- Product Specs now require `product_summary` between `hypothesis` and `scope`.
- Structured Scope examples now use complete sentences or imperative statements instead of terse tags.
- Validator now warns on fragment-like structured Scope items with `scope_item_fragment`.
- MCP server now exposes `get_product_summary` so agents can load the product shape before Scope and Acceptance Criteria.

## v0.24.0 - MCP Install And Showcase Examples

Added:

- `productspec mcp-config claude|cursor` prints a copy-pasteable MCP client config.
- Claude Desktop and Cursor MCP install guide.
- Showcase examples for checkout 3DS recovery, RAG answer quality, and realtime collaborative cursors.
- Agentic drift post draft for announcing spec revision, MCP sessions, Agent Run, and Decision Trace.
- Support SLA analytics pipeline example.
- README section showing what agents can do today with ProductSpec.
- FAQ entry explaining how ProductSpec differs from a Markdown template.
- README hero and Quick Start now lead with the agent harness payoff.
- 60-second demo script for recording the ProductSpec loop.
- Factual status badge spec for validation, revision, evidence, graph, and Agent Run receipts.

## v0.23.0 - Parser Fidelity And Harness Demo

Changed:

- README Quick Start now leads with the ProductSpec intent harness flow: validate intent, expose specs through MCP, run the agent, validate Agent Run, and trace drift.
- GitHub Action now accepts optional `agent_runs` globs and validates Agent Run files.
- Starter kit now includes an Agent Run example and validates it in CI.

Added:

- 5-minute agent harness demo.
- Harness demo example with Product Spec, Agent Run, and Decision Trace.
- Contributor guidance for adding example Product Specs.

Fixed:

- Unknown frontmatter preservation now covers all key shapes, not only snake_case keys. Kebab-case keys (`code-fold`), keys with spaces (`review date`), quoted keys (`"due-date"`), and non-ASCII keys are preserved under `parser_metadata.unknown_frontmatter` instead of being silently dropped on serialize.

## v0.22.0 - Agent Run Drafting

Added:

- `productspec init-run <spec.product-spec.md> [run.agent-run.json]` drafts an Agent Run receipt from a Product Spec.
- `draft_agent_run` MCP tool drafts the same receipt for agents using the stdio MCP server.
- Agent Run `status` now accepts `draft`.
- Agent Run conformance fixtures for valid draft receipts and invalid statuses.

## v0.21.0 - Agent Harness Records

Added:

- Agent Run companion artifact for recording an agent's ProductSpec harness run: pinned spec revision, checked `AC-`, `EVAL-`, and `SM-` IDs, evidence links, drift state, and completion claim.
- `productspec validate-run path/to/file.agent-run.json`.
- `schema/agent-run.schema.json`.
- Agent-ready repo example now includes an Agent Run file.

Changed:

- README and agent docs now position ProductSpec as the intent harness contract for AI coding agents.

## v0.20.0 - Parser Preservation And Agent Examples

Added:

- `docs/productspec-to-tickets.md`: guide for projecting a Product Spec into Jira or Linear tickets by reference instead of by copy.
- `examples/lending-covenant-monitoring.product-spec.md`: a regulated-lending example with committed and provisional Success Metrics and ticket back-links via `Related Artifacts`.
- `examples/agent-ready-repo/`: a tiny repo layout showing a Product Spec, Decision Trace, validation commands, and MCP usage for coding agents.
- `examples/decision-traces/implementation-drift.decision-trace.json`: a focused implementation drift example.
- ProductSpec philosophy now includes a product discipline sequence: make requirements less wrong, delete before building, simplify before optimizing, accelerate after intent is clear, and automate last.

Changed:

- AI eval examples now use concrete model-behavior cases instead of placeholders.

Fixed:

- The reference parser now preserves unknown frontmatter blocks under parser-owned `parser_metadata.unknown_frontmatter` and re-emits them on serialization without treating them as portable ProductSpec frontmatter.

## v0.19.0 - Validator Semantics

Fixed:

- Product Spec and Decision Trace validators now reject invalid ISO date-time fields.
- Product Spec validation now rejects duplicate durable `AC-`, `EVAL-`, and `SM-` item IDs.
- Decision Trace validation now rejects duplicate `event_id` values.
- Decision Trace JSON Schema link types now include `code` and `dashboard`, matching the parser's evidence vocabulary.

Changed:

- Spec graph resolution now warns when a `product_spec_revision` pin does not match the target spec's `spec_revision`.
- Agent docs and `skills/productspec` now document `RESOLVE-IN-PLAN:` markers for unresolved technical bindings.

## v0.18.0 - Tooling Hardening

Fixed:

- GitHub Action inputs now pass through environment variables before shell expansion, avoiding direct interpolation into the bash script.
- MCP spec resolution now checks real paths and skips symlinks during discovery, so symlinks cannot escape the configured root.
- The parser now accepts Product Specs with CRLF line endings.
- The CLI now prints a clean one-line error when a target file cannot be read.
- The MCP server now stays silent for JSON-RPC notifications and returns `-32601` for unknown tools.

Changed:

- The root build script uses `npm ci` for the parser package when a lockfile is present.
- MCP tool schemas now mark required fields explicitly.
- The parser npm package now publishes its README and includes repository, homepage, bugs, and Node engine metadata.

## v0.17.0 - Related Artifact Evidence Validation

Changed:

- Related Artifact `url` is documented as either a durable external URL or a repo-relative path to an inspectable artifact such as an eval JSON file or dashboard screenshot.
- The validator now rejects `item_id` references that do not match an existing `AC-`, `EVAL-`, or `SM-` item in the same Product Spec.
- The validator now warns when evidence type and `item_id` family look unusual, such as `eval_run` attached to `SM-<number>`.
- The AI support triage example now includes Related Artifacts for implementation, eval, and analytics evidence.

## v0.16.0 - Evidence Loop

Added:

- Evidence loop docs and example showing ProductSpec links across implementation PRs, eval runs, analytics snapshots, and Decision Trace.
- `get_evidence_checklist` MCP tool for agents to list expected evidence for Acceptance Criteria, AI Evals, and Success Metrics.

## v0.15.0 - MCP Spec Sessions

Added:

- MCP spec sessions: `begin_spec_session` pins a Product Spec's `spec_revision` and content hash at the start of agent work, and `check_spec_session` tells agents whether to continue, re-plan, or resolve validation errors before claiming done.

## v0.14.0 - Spec Graph

Added:

- `productspec graph <dir>`: resolves a folder of Product Specs into a build graph using `product_spec` related artifacts. Reports the buildable set, the blocked set with what each spec waits on, a dependency-respecting build order, and warnings for missing link targets, dependency cycles, self links, and duplicate paths. `--json` emits the machine-readable form.
- `resolveProductSpecGraph(inputs)`: the pure resolver behind the command, exported from the parser for tools that already hold parsed documents.
- `get_spec_graph`: the same graph as an MCP tool, so agents get buildable, blocked, and ordered work in one call.
- Graph conformance fixtures under `conformance/graph/`.
- `docs/graph.md`: command, semantics, warning taxonomy, and the purity boundary.

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
