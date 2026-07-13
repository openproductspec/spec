# ProductSpec MCP Server

ProductSpec includes a lightweight MCP server so coding agents can read Product Specs as structured intent, not just raw Markdown.

Use it when an agent needs to implement work from a `.product-spec.md` file and should load scope, acceptance criteria, AI evals, success metrics, and related artifacts before writing code.

In this mode, ProductSpec is the intent harness contract. Claude, Codex, Cursor, or another coding agent can still decide how to plan and edit code, but ProductSpec supplies the stable context, constraints, completion checks, evidence targets, and revision pin.

## Start The Server

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

The server uses stdio and implements the MCP `tools/list` and `tools/call` flow.

## MCP Client Config

For MCP clients that support stdio servers:

```json
{
  "mcpServers": {
    "productspec": {
      "command": "npx",
      "args": ["--yes", "--package", "@productspec/parser", "productspec", "mcp"]
    }
  }
}
```

## Tools

- `begin_spec_session`: pins a Product Spec's `spec_revision` and content hash at the start of agent work.
- `check_spec_session`: checks whether the pinned Product Spec changed before the agent continues or claims completion.
- `list_product_specs`: finds `.product-spec.md` files under a root directory.
- `get_product_spec`: returns the parsed Product Spec document.
- `validate_product_spec`: validates a Product Spec file.
- `get_scope`: returns structured scope.
- `get_acceptance_criteria`: returns Acceptance Criteria.
- `get_ai_evals`: returns AI Evals.
- `get_success_metrics`: returns Success Metrics.
- `get_related_artifacts`: returns Related Artifacts.
- `get_spec_graph`: resolves `product_spec` links across all specs under a root into buildable, blocked, and ordered work.
- `get_evidence_checklist`: returns the implementation, eval, and post-launch evidence expected for a Product Spec.
- `check_completion_claim`: returns the criteria and evals an agent must verify before claiming implementation is complete.

## Spec Sessions

Long-running agent work can outlive the Product Spec it started from. Use `begin_spec_session` before planning or coding to pin the current `spec_revision` and a SHA-256 content hash.

Before claiming done, or after any long-running pause, call `check_spec_session`.

- If `changed` is `false`, continue against the pinned Product Spec.
- If `changed` is `true`, re-read the Product Spec and re-plan before continuing.
- If `current_valid` is `false`, resolve the Product Spec validation errors before using it as the control file.

The MCP server stores session ids in memory for the life of the server process. For clients that restart MCP servers between calls, `check_spec_session` can also be called statelessly with the `path`, `started_revision`, and `started_hash` returned by `begin_spec_session`.

## Agent Prompt

```text
Implement the feature described by specs/search.product-spec.md.

Use ProductSpec MCP before coding:
1. Validate the Product Spec.
2. Call begin_spec_session and include the pinned spec_revision in your plan.
3. Load Scope, Acceptance Criteria, AI Evals, Success Metrics, and Related Artifacts.
4. Keep implementation inside Scope.
5. Resolve every `RESOLVE-IN-PLAN:` marker against the codebase with a source citation before coding.
6. Before claiming done, call check_spec_session. If the Product Spec changed, re-read and re-plan.
7. Call get_evidence_checklist to identify which pull requests, tests, eval runs, dashboards, or analytics snapshots should attach to AC-, EVAL-, and SM- IDs.
8. Call check_completion_claim and verify each returned Acceptance Criterion and AI Eval.
9. Write an Agent Run artifact if the repo wants a durable record of what the agent checked.
```

## Boundary

The MCP server is deterministic. It does not judge whether code is correct and it does not call an LLM.

It gives agents a structured control file. The agent, tests, evals, reviewer, or managed ProductSpec implementation still decides whether the work satisfies the Product Spec.
