# ProductSpec MCP Server

ProductSpec includes a lightweight MCP server so coding agents can read Product Specs as structured intent, not just raw Markdown.

Use it when an agent needs to implement work from a `.product-spec.md` file and should load product summary, scope, acceptance criteria, AI evals, success metrics, and related artifacts before writing code.

In this mode, ProductSpec is the Product Harness exposing an intent harness to the agent. Claude, Codex, Cursor, or another coding agent can still decide how to plan and edit code, but ProductSpec supplies the stable context, constraints, completion checks, evidence targets, and revision pin.

## Start The Server

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

The server uses stdio and implements the MCP `tools/list` and `tools/call` flow.

## MCP Client Config

Generate a copy-pasteable Claude or Cursor config:

```bash
npx --yes -p @productspec/parser@latest productspec mcp-config claude
npx --yes -p @productspec/parser@latest productspec mcp-config cursor
```

For MCP clients that support stdio servers, the config shape is:

```json
{
  "mcpServers": {
    "productspec": {
      "command": "npx",
      "args": ["--yes", "--package", "@productspec/parser@latest", "productspec", "mcp"]
    }
  }
}
```

See [`docs/mcp-install.md`](mcp-install.md) for Claude Desktop and Cursor install notes.

## Tools

- `begin_spec_session`: pins a Product Spec's `spec_revision` and content hash at the start of agent work.
- `check_spec_session`: checks whether the pinned Product Spec changed before the agent continues or claims completion.
- `list_product_specs`: finds `.product-spec.md` files under a root directory.
- `get_product_spec`: returns the parsed Product Spec document.
- `validate_product_spec`: validates a Product Spec file.
- `get_product_summary`: returns the plain-English product shape.
- `get_scope`: returns structured scope.
- `get_acceptance_criteria`: returns Acceptance Criteria.
- `get_ai_evals`: returns AI Evals.
- `get_success_metrics`: returns Success Metrics.
- `get_related_artifacts`: returns Related Artifacts.
- `get_spec_graph`: resolves `product_spec` links across all specs under a root into buildable, blocked, and ordered work. It also returns `contention` (the surfaces more than one live spec touches), `waves` (the sets of specs that are safe to run at the same time), and `unscoped` (live specs that declare no `applies_to`, so their surface is unknown). An agent that reads the graph before it starts can tell whether another agent is already on its surface, which a spec session cannot: a session pins one spec against drift, and contention is about two specs colliding.
- `get_evidence_checklist`: returns the implementation, eval, and post-launch evidence expected for a Product Spec.
- `get_agent_handoff`: returns a generated Agent Handoff Markdown build contract for a Product Spec.
- `draft_agent_run`: drafts an Agent Run receipt with every `AC-`, `EVAL-`, and `SM-` item marked `not_checked`.
- `check_completion_claim`: returns the criteria and evals an agent must verify before claiming implementation is complete.

## Spec Sessions

Long-running agent work can outlive the Product Spec it started from. Use `begin_spec_session` before planning or coding to pin the current `spec_revision` and a SHA-256 content hash.

Before claiming done, or after any long-running pause, call `check_spec_session`.

- If `changed` is `false`, continue against the pinned Product Spec.
- If `changed` is `true`, re-read the Product Spec and re-plan before continuing.
- If `current_valid` is `false`, resolve the Product Spec validation errors before using it as the agent's intent harness.

The MCP server stores session ids in memory for the life of the server process. For clients that restart MCP servers between calls, `check_spec_session` can also be called statelessly with the `path`, `started_revision`, and `started_hash` returned by `begin_spec_session`.

## Agent Prompt

```text
Implement the feature described by specs/search.product-spec.md.

Use ProductSpec MCP before coding:
1. Validate the Product Spec.
2. Call begin_spec_session and include the pinned spec_revision in your plan.
3. Load Product Summary, Scope, Acceptance Criteria, AI Evals, Success Metrics, and Related Artifacts.
4. Keep implementation inside Scope.
5. Resolve every `RESOLVE-IN-PLAN:` marker against the codebase with a source citation before coding.
6. Call get_agent_handoff if you need a compact build contract.
7. Before claiming done, call check_spec_session. If the Product Spec changed, re-read and re-plan.
8. Call get_evidence_checklist to identify which pull requests, tests, eval runs, dashboards, or analytics snapshots should attach to AC-, EVAL-, and SM- IDs.
9. Call check_completion_claim and verify each returned Acceptance Criterion and AI Eval.
10. Call draft_agent_run, fill in checked statuses and evidence, and write an Agent Run artifact if the repo wants a durable record of what the agent checked.
```

## Boundary

The MCP server is deterministic. It does not judge whether code is correct and it does not call an LLM.

It gives agents a structured intent harness inside the broader Product Harness. The agent, tests, evals, reviewer, or managed ProductSpec implementation still decides whether the work satisfies the Product Spec.
