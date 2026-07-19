# Agent Run

Agent Run is an optional companion artifact for recording one AI agent execution against a Product Spec.

ProductSpec is the Product Harness. Agent Run is the receipt.

Use it when Claude, Codex, Cursor, or another coding agent implements against a `.product-spec.md` file and the repo needs a durable record of:

- which Product Spec path and `spec_revision` the agent used
- which `AC-`, `EVAL-`, and `SM-` IDs were checked
- which evidence links were produced
- whether drift was detected
- what the agent claimed was complete

## Shape

```json
{
  "agent_run_format_version": "0.1",
  "run_id": "transcript-search-run",
  "agent": {
    "name": "Codex",
    "version": "cli"
  },
  "product_spec": {
    "path": "docs/product-specs/transcript-search.product-spec.md",
    "spec_revision": 1,
    "content_hash": "sha256:abc123"
  },
  "started_at": "2026-07-13T00:00:00Z",
  "completed_at": "2026-07-13T00:15:00Z",
  "status": "completed",
  "checked_items": [
    {
      "item_id": "AC-1",
      "status": "passed",
      "evidence": [
        {
          "type": "github_pr",
          "url": "https://github.com/example/transcript-search/pull/18"
        }
      ]
    }
  ],
  "drift": {
    "detected": false
  },
  "completion_claim": "AC-1 and EVAL-1 are satisfied."
}
```

## Item IDs

`checked_items[].item_id` must reference a durable ProductSpec item:

- `AC-<number>` for Acceptance Criteria
- `EVAL-<number>` for AI Evals
- `SM-<number>` for Success Metrics

Use `not_checked` for Success Metrics that are post-launch and should not block implementation completion.

## Draft

Use `init-run` to create a draft receipt from the current Product Spec. It copies every `AC-`, `EVAL-`, and `SM-` ID into `checked_items` with `status: "not_checked"`.

```bash
npm exec --package @productspec/parser -- productspec init-run docs/product-specs/transcript-search.product-spec.md docs/agent-runs/transcript-search.agent-run.json
```

The generated receipt uses `status: "draft"`. Change it to `completed`, `blocked`, or `failed` only after the agent records what it checked, links evidence, and writes a completion claim.

## Drift

If the agent detects that implementation changed product intent, set:

```json
"drift": {
  "detected": true,
  "decision_trace_path": "docs/decision-traces/transcript-search.decision-trace.json",
  "summary": "Implementation added speaker labels outside scope.cut."
}
```

Decision Trace records the actual decision. Agent Run records that drift was observed during this run.

## Validate

```bash
npm exec --package @productspec/parser -- productspec validate-run docs/agent-runs/transcript-search.agent-run.json
```

## Reconcile

Validation checks the Agent Run shape. Reconciliation checks whether the run is enough evidence for one Product Spec revision.

```bash
npm exec --package @productspec/parser -- productspec reconcile docs/product-specs/transcript-search.product-spec.md --against docs/agent-runs/transcript-search.agent-run.json
```

Use reconciliation before an agent or human claims implementation complete. It reports stale revision pins, missing checked items, failed items, passed items without evidence, and drift without a Decision Trace link.

Schema: [`schema/agent-run.schema.json`](../schema/agent-run.schema.json)

Example: [`examples/agent-ready-repo/docs/agent-runs/transcript-search.agent-run.json`](../examples/agent-ready-repo/docs/agent-runs/transcript-search.agent-run.json)
