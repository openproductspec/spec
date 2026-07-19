# Harness Demo

This folder shows ProductSpec as a Product Harness for agent-led work:

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


Garden the demo folder:

```bash
npm exec --package @productspec/parser -- productspec garden examples/harness-demo
```

Reconcile the Agent Run from inside the demo folder:

```bash
npm exec --package @productspec/parser -- productspec reconcile checkout-notifications.product-spec.md --against checkout-notifications.agent-run.json
```
