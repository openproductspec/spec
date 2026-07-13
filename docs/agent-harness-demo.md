# 5-minute agent harness demo

This demo shows ProductSpec as the control file for agent-led work.

The Product Spec states intent. MCP exposes that intent as structured tools. Agent Run records what the agent checked. Decision Trace records what changed when implementation pressure met product intent.

## 1. Validate the Product Spec

```bash
npm exec --package @productspec/parser -- productspec validate examples/harness-demo/checkout-notifications.product-spec.md
```

The Product Spec gives the agent:

- `scope.in`: what it should build
- `scope.out` and `scope.cut`: what it should avoid
- `AC-` IDs: launch correctness checks
- `EVAL-` IDs: model or deterministic behavior checks
- `SM-` IDs: post-launch outcome checks
- `Related Artifacts`: evidence targets

## 2. Start the MCP server

```bash
npx --yes -p @productspec/parser@latest productspec mcp
```

Ask your MCP-aware agent to use ProductSpec before coding:

```text
Implement examples/harness-demo/checkout-notifications.product-spec.md.

Use ProductSpec MCP before coding:
1. validate_product_spec
2. begin_spec_session
3. get_scope
4. get_acceptance_criteria
5. get_ai_evals
6. get_success_metrics
7. get_related_artifacts
8. get_evidence_checklist

Before claiming done, call check_spec_session, check_completion_claim, and draft_agent_run.
```

## 3. Draft the Agent Run receipt

```bash
npm exec --package @productspec/parser -- productspec init-run examples/harness-demo/checkout-notifications.product-spec.md /tmp/checkout-notifications.agent-run.json
```

The generated file starts with `status: "draft"` and every `AC-`, `EVAL-`, and `SM-` item marked `not_checked`.

The agent or reviewer fills in:

- what passed
- what failed
- what evidence proves it
- whether drift was detected
- what the agent claims is complete

Validate the finished receipt:

```bash
npm exec --package @productspec/parser -- productspec validate-run examples/harness-demo/checkout-notifications.agent-run.json
```

## 4. Record drift or learning

If implementation pressure changes intent, do not let the code silently become the new spec.

Use Decision Trace:

```bash
npm exec --package @productspec/parser -- productspec validate-trace examples/harness-demo/checkout-notifications.decision-trace.json
```

In the demo, the agent considered SMS notifications, but the Product Spec listed SMS in `scope.out`. The Decision Trace records that the team kept SMS out of the first release.

## What this proves

ProductSpec gives agents a harness:

- what to build
- what not to build
- how to prove completion
- what evidence to leave behind
- when to stop and re-plan

Agent Run gives the run a receipt. Decision Trace gives drift a place to go.
