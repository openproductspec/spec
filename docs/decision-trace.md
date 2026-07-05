# Decision Trace

Decision Trace is a planned optional extension to the Product Spec Standard.

A Product Spec captures the current product intent. A Decision Trace captures the reasoning that produced it.

## Why It Matters

Teams do not only need to know what was written in a spec. They often need to know:

- Why this was built.
- What evidence supported it.
- Which alternatives were considered.
- Who approved the decision.
- What was expected to happen.
- What happened after launch.
- What the team learned.

ProductSpec should eventually support this reasoning trail in a portable way.

## Proposed Shape

A Decision Trace should be able to capture:

- Evidence.
- Observations.
- Hypotheses.
- Alternatives considered.
- Decision.
- Approvals.
- Expected outcomes.
- Implementation links.
- Observed outcomes.
- Learnings.

Example:

```yaml
decision_traces:
  - id: "decision_001"
    related_sections: ["hypothesis", "scope"]
    decision: "Start with YouTube transcript search before multi-source ingestion."
    evidence:
      - "Researcher interviews repeatedly showed quote retrieval as the acute pain."
    alternatives_considered:
      - "Support podcasts first."
      - "Support PDFs first."
    approved_by:
      - "Product lead"
    expected_outcome: "Researchers can find and cite passages faster."
    linked_artifacts:
      - type: "engineering_spec"
        url: "https://example.com/spec"
      - type: "github_pr"
        url: "https://github.com/example/repo/pull/1"
    observed_outcome: null
    learning: null
```

## Storage

Decision Traces can live in Git beside Product Specs for open source and agent-native workflows.

They can also live in other systems. The open standard should define the portable schema and link conventions, not require one storage backend.

## Versioning

Decision Trace should not block adoption of the core Product Spec format.

The likely path is:

- v0.1: Product Spec document format.
- v0.2: Validation and conformance.
- v0.3: Optional Decision Trace schema.
- v0.4: Outcome and tool-link conventions.
- v1.0: Stable semantic model.
