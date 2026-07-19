# Why ProductSpec?

AI made it much easier to turn instructions into code.

That makes intent more important, not less. When implementation gets faster, the expensive mistake is building the wrong thing with confidence.

ProductSpec exists for that intent layer.

## The Missing Artifact

Teams already have tools for every layer after intent:

- Jira and Linear track work.
- Figma captures design artifacts.
- Git records implementation history.
- OpenSpec and Spec Kit turn intent into engineering plans.
- AI coding agents execute tasks.

ProductSpec sits before all of them.

```text
Product Spec (ProductSpec) -> Jira / Linear -> Engineering Spec -> Git / Code
what / why                       work tracking   how / plan / tasks   implementation
```

The Product Spec is where a team commits to the problem, hypothesis, product summary, scope, acceptance criteria, and success metrics before implementation begins.

It can live in Git, link to Figma, generate Jira or Linear work, feed OpenSpec or Spec Kit, and guide AI coding agents. It should remain the durable statement of intent when tickets, branches, and implementation details change.

Without that artifact, teams often end up with a pile of downstream objects that look coordinated but do not share the same why.

## Human Readable, Agent Executable

A Product Spec has two readers:

1. Humans deciding whether the work is worth doing.
2. AI agents and downstream tools that need enough structure to plan and execute the work.

ProductSpec is intentionally Markdown-first because the artifact should remain readable in normal product and engineering workflows. It is also structured enough for parsers, validators, repo gardening, reconciliation, local dashboards, review tools, imports, exports, and agent handoffs.

That is the difference from a classic PRD. A PRD was mostly a human handoff. A Product Spec is a human-readable Product Harness for downstream software work.

## Acceptance Criteria vs. Success Metrics

ProductSpec separates two ideas that often get mixed together:

- Acceptance Criteria are the build contract. They say what must be true before launch. For AI products, eval thresholds belong here.
- Success Metrics are the market contract. They say what real user or business behavior would make the work worth continuing after launch.

An AI agent can use Acceptance Criteria to know when the implementation loop is done. A team uses Success Metrics to know whether the shipped product mattered.

## When To Use It

ProductSpec is not for every act of building.

It is for consequential software work where intent needs to survive handoff:

- multiple people or agents will touch the work
- design and engineering need shared context
- an AI agent will turn the spec into an engineering plan
- the decision may need to be revisited later
- success depends on more than shipping code

For a throwaway script or solo experiment, it may be faster to build directly. For work that affects a team, product surface, customer promise, or AI execution loop, the Product Spec is the control system.

The more handoffs a piece of work has, the more valuable the spec becomes.

## What ProductSpec Is Not

ProductSpec does not define product taste. It does not tell you whether a spec is good.

It defines the portable structure:

- canonical section IDs
- frontmatter
- validation rules
- conformance fixtures
- review annotation shapes
- Decision Trace companion documents
- repo maintenance commands for graph health, evidence gaps, Agent Run reconciliation, and local dashboards

Different products and teams can build opinionated review layers on top.

The standard should stay small and portable. The ecosystem around it can be opinionated.

## The Goal

ProductSpec should make software intent portable.

A Product Spec should be understandable to a founder, PM, designer, engineer, executive, reviewer, and AI agent. Each reader should be able to see what is being built, why it matters, what is in scope, how done will be judged, and what outcome would make the work worth continuing.
