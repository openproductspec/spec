# Evidence Loop Example

This folder shows how ProductSpec connects intent to evidence without becoming an eval platform or observability platform.

Files:

- [`transcript-search-v1.product-spec.md`](transcript-search-v1.product-spec.md): committed product intent.
- [`transcript-search.eval-run.json`](transcript-search.eval-run.json): example evidence for `EVAL-1`.
- [`transcript-search.decision-trace.json`](transcript-search.decision-trace.json): decisions made after evidence arrived.

The important links are in `Related Artifacts`:

- `AC-1` links to a pull request.
- `EVAL-1` links to an eval run.
- `SM-1` links to an analytics snapshot.

Validate the Product Spec:

```bash
npm exec --package @productspec/parser -- productspec validate examples/evidence-loop/transcript-search-v1.product-spec.md
```

Validate the Decision Trace:

```bash
npm exec --package @productspec/parser -- productspec validate-trace examples/evidence-loop/transcript-search.decision-trace.json
```

Ask the MCP server what evidence is expected:

```json
{
  "name": "get_evidence_checklist",
  "arguments": {
    "path": "examples/evidence-loop/transcript-search-v1.product-spec.md"
  }
}
```
