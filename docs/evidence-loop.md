# Evidence Loop

ProductSpec defines intent before implementation. Evidence shows what happened after people or agents acted on that intent.

The loop:

```text
ProductSpec
-> implementation
-> tests, eval runs, production traces, analytics, support signals
-> Related Artifacts
-> Decision Trace
-> revised ProductSpec
```

ProductSpec does not collect traces, run evals, or replace observability tools. It gives those systems something to attach to: the committed product intent.

## Evidence Types

Use `Related Artifacts` to connect evidence to durable ProductSpec item IDs.

```productspec-related-artifacts
- type: github_pr
  url: "https://github.com/acme/app/pull/456"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "https://evals.example.com/runs/456"
  section_id: acceptance_criteria
  item_id: EVAL-1
- type: analytics_snapshot
  url: "https://analytics.example.com/snapshots/transcript-search-day-14"
  section_id: success_metrics
  item_id: SM-1
```

Common mappings:

- `AC-<number>`: implementation evidence such as pull requests, tests, code links, release notes, or engineering specs.
- `EVAL-<number>`: eval evidence such as eval runs, test reports, or human review records.
- `SM-<number>`: post-launch outcome evidence such as dashboards, analytics snapshots, experiments, support reports, or metric reviews.

Acceptance Criteria and AI Evals are pre-launch gates. Success Metrics are post-launch outcomes. They should be linked to evidence, but they usually should not block implementation completion.

## Decision Trace

Use Decision Trace when evidence changes the product decision.

Examples:

- An eval run fails a launch-blocking behavior check.
- A pull request implements behavior outside `scope.in`.
- A dashboard shows the launch missed the intended success metric.
- A support signal shows the original problem was narrower or broader than the Product Spec claimed.

The Product Spec remains the current committed intent. The Decision Trace records why intent changed, why implementation changed, or why the team accepted a tradeoff.

## MCP

The MCP server exposes `get_evidence_checklist` so agents can ask what evidence they need before claiming work is complete.

The tool is deterministic. It does not verify code, run evals, or inspect dashboards. It lists expected evidence from Acceptance Criteria, AI Evals, Success Metrics, and existing Related Artifacts.

## Example

See [`examples/evidence-loop/`](../examples/evidence-loop/) for a Product Spec, eval run, and Decision Trace that show the loop end to end.
