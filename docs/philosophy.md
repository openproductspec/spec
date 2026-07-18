# ProductSpec philosophy

AI changed the cost of implementation.

It did not remove the need for judgment.

ProductSpec starts from one belief: consequential software work needs a durable statement of intent before implementation begins.

## Intent before implementation

Software teams already have many downstream artifacts:

- tickets
- branches
- pull requests
- design files
- engineering specs
- tests
- dashboards

Those artifacts work better when they share the same product intent.

A Product Spec states that intent directly: the problem, hypothesis, product summary, scope, acceptance criteria, and success metrics.

That is the Product Harness frame: the spec is the product contract that downstream tools and agents execute against.

## Human-readable and agent-readable

A Product Spec has two readers.

Humans use it to decide whether the work is worth doing.

Agents and downstream tools use it to plan, implement, review, and report progress.

That is why ProductSpec is Markdown with structure. Plain text keeps the artifact readable. Section IDs, frontmatter, parser output, schema, and validator rules make it usable by tools.

## Portable access

The same operations reach a Product Spec through more than one surface.

The CLI is the most portable. It runs in any shell, any CI job, any script, with no client to install and no tool definitions to load into context first. The MCP adds a typed tool surface for agents that speak it, with room for auth and stateful sessions.

Neither surface is privileged. Every operation an agent can perform is reachable from the CLI, backed by the same function the MCP tool wraps. The MCP is additive, not the only door. A spec library can be validated, read, planned, and checked from a plain terminal, not only from an MCP client.

## Acceptance Criteria and Success Metrics

Acceptance Criteria are the build contract.

They say what must be true before launch. For AI products, eval thresholds belong here.

Success Metrics are the market contract.

They say what user or business behavior would make the work worth continuing after launch.

Agents can build against Acceptance Criteria. Teams learn from Success Metrics.

## Living documents

Product Specs should change when product intent changes.

`spec_revision` gives each meaningful revision a portable handle. Git keeps the detailed diff. The revision number lets a ticket, engineering spec, AI agent loop, pull request, or decision trace cite the exact version of intent it used.

Typo fixes do not need a new revision. Scope changes do.

## Git as memory

ProductSpec works well in Git because intent should have history.

A Product Spec can live beside code, change through pull requests, and be reviewed before implementation begins. Code history says what changed. ProductSpec says why the work exists and how the team agreed to judge it.

## Standard, not taste

ProductSpec defines portable structure.

It does not define product taste. It does not decide whether a product bet is good. Teams, reviewers, and tools can build opinionated layers on top.

The open standard should stay small enough that many teams can adopt it and many tools can implement it.

## Product discipline

ProductSpec should make teams slower at the right moment and faster after that.

The discipline is:

1. Make the requirement less wrong.
2. Delete before building.
3. Simplify before optimizing.
4. Accelerate after intent is clear.
5. Automate last.

`problem` and `hypothesis` force the team to make the requirement less wrong before work begins. `scope` creates an explicit place to delete work, including work that sounds useful but does not belong in this version. `acceptance_criteria` and AI evals simplify the build contract into pass/fail checks. `success_metrics` keeps the team honest about whether the work mattered after launch.

Agents should enter after that discipline, not before it. A faster implementation loop is valuable only when it is pointed at clear intent.

## Consequential work

ProductSpec is for work where intent needs to survive handoff.

That usually means multiple people, multiple tools, an AI agent loop, a customer-facing promise, an important internal workflow, or a decision the team will revisit later.

Small experiments can stay small. Consequential work deserves a Product Spec.
