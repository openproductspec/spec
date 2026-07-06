# Why ProductSpec?

Software development is changing from human-authored code to agent-executed work.

That shift makes intent more important, not less. If an AI agent can build quickly, the expensive mistake is no longer slow implementation. The expensive mistake is building the wrong thing with confidence.

ProductSpec exists for that intent layer.

## The Missing Artifact

Teams already have tools for work tracking, design, source control, engineering specs, and code execution:

- Jira and Linear track work.
- Figma captures design artifacts.
- Git records implementation history.
- OpenSpec and Spec Kit turn intent into engineering plans.
- AI coding agents execute tasks.

ProductSpec sits before all of them.

```text
Product Spec (ProductSpec) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                       how / plan / tasks                         implementation
```

The Product Spec is where a team commits to the problem, hypothesis, scope, acceptance criteria, and success metrics before implementation begins.

## Human Readable, Agent Executable

A Product Spec has two readers:

1. Humans deciding whether the work is worth doing.
2. AI agents and downstream tools that need enough structure to plan and execute the work.

ProductSpec is intentionally Markdown-first because the artifact should remain readable in normal product and engineering workflows. It is also structured enough for parsers, validators, review tools, imports, exports, and agent handoffs.

## When To Use It

ProductSpec is not for every act of building.

It is for consequential software work where intent needs to survive handoff:

- multiple people or agents will touch the work
- design and engineering need shared context
- an AI agent will turn the spec into an engineering plan
- the decision may need to be revisited later
- success depends on more than shipping code

For a throwaway script or solo experiment, it may be faster to build directly. For work that affects a team, product surface, customer promise, or AI execution loop, the Product Spec is the control system.

## What ProductSpec Is Not

ProductSpec does not define product taste. It does not tell you whether a spec is good.

It defines the portable structure:

- canonical section IDs
- frontmatter
- validation rules
- conformance fixtures
- review annotation shapes
- future decision trace extensions

Different products and teams can build opinionated review layers on top.

## The Goal

ProductSpec should make software intent portable.

A Product Spec should be understandable to a founder, PM, designer, engineer, executive, reviewer, and AI agent. Each reader should be able to see what is being built, why it matters, what is in scope, how done will be judged, and what outcome would make the work worth continuing.
