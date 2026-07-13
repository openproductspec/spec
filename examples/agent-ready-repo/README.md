# Agent-Ready ProductSpec Repo

This example shows the smallest repo layout that gives an AI coding agent useful product intent without making the repo heavy.

```text
docs/
  product-specs/
    transcript-search.product-spec.md
  agent-runs/
    transcript-search.agent-run.json
  decision-traces/
    transcript-search.decision-trace.json
```

The Product Spec gives the agent:

- scope it should respect
- acceptance criteria it must satisfy before claiming completion
- AI evals it should run or request evidence for
- success metrics that should not block implementation completion
- related artifacts that attach evidence to durable `AC-`, `EVAL-`, and `SM-` IDs

The Agent Run records what the agent checked against the pinned Product Spec revision.

Validate the spec:

```bash
npm exec --package @productspec/parser -- productspec validate docs/product-specs/transcript-search.product-spec.md
```

Validate the trace:

```bash
npm exec --package @productspec/parser -- productspec validate-trace docs/decision-traces/transcript-search.decision-trace.json
```

Validate the agent run:

```bash
npm exec --package @productspec/parser -- productspec validate-run docs/agent-runs/transcript-search.agent-run.json
```

Start the MCP server from the repo root:

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

An agent can then retrieve the Product Spec, pin the `spec_revision`, check the build graph, ask for the evidence checklist, and leave behind an Agent Run before declaring the work done.
