# Harness Demo

This folder shows ProductSpec as an agent harness contract:

- `checkout-notifications.product-spec.md`: the intent an agent should build against
- `checkout-notifications.agent-run.json`: the receipt an agent leaves after checking the work
- `checkout-notifications.decision-trace.json`: the decision record when implementation pressure meets product intent

## Try It

From the repository root:

```bash
npm exec --package @productspec/parser -- productspec validate examples/harness-demo/checkout-notifications.product-spec.md
npm exec --package @productspec/parser -- productspec validate-run examples/harness-demo/checkout-notifications.agent-run.json
npm exec --package @productspec/parser -- productspec validate-trace examples/harness-demo/checkout-notifications.decision-trace.json
```

Draft a fresh Agent Run receipt from the Product Spec:

```bash
npm exec --package @productspec/parser -- productspec init-run examples/harness-demo/checkout-notifications.product-spec.md /tmp/checkout-notifications.agent-run.json
```

Start the MCP server:

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

An MCP-aware agent can then load the Product Spec, pin the spec revision, retrieve scope, acceptance criteria, AI evals, success metrics, related artifacts, and draft an Agent Run before claiming completion.
