# Agent Handoff

Agent Handoff is a generated implementation brief for agents and engineers.

It is not a canonical ProductSpec section. Do not add `## Agent Handoff` to a `.product-spec.md` file.

ProductSpec remains the source of truth. An Agent Handoff is a view compiled from:

- Product Summary
- Scope
- Acceptance Criteria
- AI Evals
- Success Metrics
- Related Artifacts
- Decision Trace, when present

Generate one with the CLI:

```bash
productspec handoff specs/example.product-spec.md
```

Or write it to a file:

```bash
productspec handoff specs/example.product-spec.md specs/example.agent-handoff.md
```

MCP-aware agents can call `get_agent_handoff` to retrieve the same generated Markdown.

A generated handoff should usually include:

- Build Contract: spec path and `spec_revision`.
- Product Summary: what should exist when the work is done.
- Scope Guardrails: `scope.in`, `scope.out`, and `scope.cut`.
- Must Satisfy: every `AC-<number>` item.
- Evidence The Agent Must Produce: generated proof prompts for each acceptance criterion.
- AI Evals: every `EVAL-<number>` gate.
- Evidence To Return: pull request URL, verification result for each acceptance criterion, eval run result for each AI eval, screenshots or demo link if UI changed, and Decision Trace when implementation changes intent.

Generated handoffs may be tailored for Claude Code, Codex, Cursor, GitHub Actions, or another execution environment, but they should not introduce product intent that is not present in the Product Spec.

If implementation pressure changes intent, update the Product Spec or add a Decision Trace rather than editing the handoff alone.
