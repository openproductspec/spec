# ProductSpec MCP Server

ProductSpec includes a lightweight MCP server so coding agents can read Product Specs as structured intent, not just raw Markdown.

Use it when an agent needs to implement work from a `.product-spec.md` file and should load scope, acceptance criteria, AI evals, success metrics, and related artifacts before writing code.

## Start The Server

```bash
npm exec --package @productspec/parser -- productspec mcp
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

- `list_product_specs`: finds `.product-spec.md` files under a root directory.
- `get_product_spec`: returns the parsed Product Spec document.
- `validate_product_spec`: validates a Product Spec file.
- `get_scope`: returns structured scope.
- `get_acceptance_criteria`: returns Acceptance Criteria.
- `get_ai_evals`: returns AI Evals.
- `get_success_metrics`: returns Success Metrics.
- `get_related_artifacts`: returns Related Artifacts.
- `check_completion_claim`: returns the criteria and evals an agent must verify before claiming implementation is complete.

## Agent Prompt

```text
Implement the feature described by specs/search.product-spec.md.

Use ProductSpec MCP before coding:
1. Validate the Product Spec.
2. Load Scope, Acceptance Criteria, AI Evals, Success Metrics, and Related Artifacts.
3. Keep implementation inside Scope.
4. Before claiming done, call check_completion_claim and verify each returned Acceptance Criterion and AI Eval.
```

## Boundary

The MCP server is deterministic. It does not judge whether code is correct and it does not call an LLM.

It gives agents a structured control file. The agent, tests, evals, reviewer, or managed ProductSpec implementation still decides whether the work satisfies the Product Spec.
