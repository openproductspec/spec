# 60-second demo script

Goal: show ProductSpec closing the agent harness loop in under 1 minute.

The demo should make one thing obvious: the agent is accountable to a Product Spec, not just a prompt.

## Setup

Use the harness demo files:

- `examples/harness-demo/checkout-notifications.product-spec.md`
- `examples/harness-demo/checkout-notifications.agent-run.json`
- `examples/harness-demo/checkout-notifications.decision-trace.json`

Use a terminal, editor, and an MCP-aware agent. Record as a GIF or short Loom.

## Storyboard

### 0-10 seconds: show intent

Open the Product Spec and zoom on:

- Scope
- Acceptance Criteria
- AI Evals
- Success Metrics

Narration:

```text
This Product Spec tells the agent what to build, what not to build, and how completion will be checked.
```

### 10-25 seconds: expose structured context

Start the MCP server:

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

Ask the agent to use ProductSpec MCP:

```text
Validate the Product Spec, begin a spec session, load scope, acceptance criteria, AI evals, success metrics, related artifacts, and evidence checklist before coding.
```

Narration:

```text
The agent reads structured intent, not just raw Markdown.
```

### 25-40 seconds: draft the receipt

Run:

```bash
npm exec --package @productspec/parser -- productspec init-run examples/harness-demo/checkout-notifications.product-spec.md /tmp/checkout-notifications.agent-run.json
```

Open the generated Agent Run and zoom on:

- `status: "draft"`
- `AC-` items
- `EVAL-` items
- `SM-` items marked `not_checked`

Narration:

```text
Before an agent can claim done, it leaves a receipt: what it checked, what evidence exists, and what remains post-launch.
```

### 40-55 seconds: validate the loop

Run:

```bash
npm exec --package @productspec/parser -- productspec validate-run examples/harness-demo/checkout-notifications.agent-run.json
npm exec --package @productspec/parser -- productspec validate-trace examples/harness-demo/checkout-notifications.decision-trace.json
```

Narration:

```text
Agent Run records execution. Decision Trace records drift or learning. The Product Spec remains the source of intent.
```

### 55-60 seconds: close

Show this line:

```text
ProductSpec is the harness contract for agent-led software work.
```

## What To Avoid

- Do not spend time explaining the whole standard.
- Do not show every file.
- Do not make quality claims the validator does not make.
- Do not imply ProductSpec runs code, evals, or production traces by itself.

The demo should show the loop: Product Spec -> MCP -> Agent Run -> Decision Trace.
