# ProductSpec Vision

ProductSpec is the open standard for software intent before implementation.

As software development becomes AI-native, writing code becomes less scarce. The bottleneck moves upstream: expressing what should be built, why it matters, what tradeoffs are accepted, what must be true before launch, and how success will be measured after launch.

ProductSpec starts as a Product Spec document format. It becomes the intent layer when downstream systems compile from it and report back to it.

```text
ProductSpec -> Engineering Spec -> Code -> Evaluation -> Learning
what / why     how / plan / tasks   implementation  outcome
```

## Why This Exists

The software stack has mature standards for implementation:

- Git for source history.
- OpenAPI for APIs.
- Kubernetes for deployment.
- Terraform for infrastructure.
- SQL for data.

There is no equivalent standard for software intent: the problem, hypothesis, scope, user experience, acceptance criteria, success metrics, tradeoffs, decisions, and evidence behind the work.

Today that intent is scattered across docs, chat threads, meetings, issue trackers, design comments, analytics dashboards, and people's memories.

ProductSpec exists to make intent structured, portable, reviewable, executable by agents, and durable over time.

## The Layer

ProductSpec operates before engineering specs are written.

It does not replace engineering specification systems such as OpenSpec or Spec Kit. Those systems operate downstream, after the software intent is clear enough to turn into design, tasks, implementation, and tests.

```text
Product Spec (ProductSpec) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                  how / plan / tasks                         implementation
strategic intent            technical decomposition                    running system
```

Both layers are spec-driven development. They serve different roles with different artifacts.

## Where ProductSpec Fits

ProductSpec does not replace Git, Jira, Linear, Figma, analytics tools, OpenSpec, Spec Kit, or AI coding agents.

It sits upstream of them.

```text
ProductSpec -> Engineering Spec -> Tasks -> Code -> Evaluation -> Learning
```

- Git stores implementation history.
- Jira and Linear store work history.
- Figma stores design artifacts.
- Analytics tools store outcome data.
- OpenSpec and Spec Kit turn intent into engineering plans.
- AI coding agents execute implementation tasks.
- ProductSpec stores the software intent behind the work.

The goal is interoperability. ProductSpec should preserve the intent that downstream systems consume, execute, and report back against.

## Intent, Reality, And Drift

ProductSpec should not assume intent is written once.

ProductSpec captures committed intent. Implementation creates reality. Drift is the delta between the two.

That drift can come from explicit product decisions, but it can also come from quieter changes:

- A workaround ships and becomes user-visible behavior.
- A test codifies behavior that was never written in the Product Spec.
- A prototype changes after the Product Spec was approved.
- An AI eval threshold changes during implementation.
- Analytics show the success metric target was missed or measured differently.

ProductSpec should not be overwritten by implementation. Accidental behavior should not silently become intent.

ProductSpec should be reconciled against implementation. When code, tests, UX, evals, analytics, or support evidence diverge from the Product Spec, tools should be able to flag the drift and force an explicit decision:

- Update the Product Spec.
- Update the implementation.
- Record an accepted tradeoff.
- Reopen the work.

The open standard should define portable artifacts for this loop. Implementations can connect to GitHub, issue trackers, design tools, CI, eval systems, analytics, and deployed products to detect drift.

## Managed Implementation

The open standard should stay portable. A managed implementation can make the standard useful inside day-to-day product and engineering work.

The managed implementation should be Git-native, not Git-centric.

PMs should be able to work in a polished ProductSpec editor. Engineers should be able to review clean Markdown, pull requests, commits, and linked implementation history in GitHub.

A strong managed workflow:

1. Create: a PM writes a Product Spec in ProductSpec.
2. Publish: ProductSpec opens a GitHub branch and pull request with clean Markdown at a chosen repo path.
3. Review: engineers review in GitHub, PMs respond in ProductSpec, and comments or approvals sync across both surfaces.
4. Implement: issues, pull requests, tests, eval runs, feature flags, and analytics link back to specific Product Spec sections.
5. Reconcile: ProductSpec detects drift and proposes an explicit decision, spec revision, implementation change, or Decision Trace entry.

The managed implementation should not become a generic GitHub document editor.

The product loop is narrower and more valuable:

```text
Define intent -> Review with engineering -> Track implementation -> Reconcile drift after shipping
```

Useful managed capabilities include:

- Publishing Product Specs as clean Markdown into a selected GitHub repo and path.
- Opening review branches and pull requests for spec review.
- Mapping Product Spec sections to issues, pull requests, tests, eval runs, and analytics.
- Showing Acceptance Criteria with linked implementation and test evidence.
- Detecting freshness and drift when linked code, tests, UX, evals, or metrics change.
- Drafting Decision Trace entries when implementation and intent diverge.

The positioning:

```text
Specs your PMs can write. Specs your engineers can trust.
```

## Decision Trace

Decision Trace is the audit trail for drift reconciliation.

ProductSpec says what the team intended.

Drift detection says where reality appears to differ.

Decision Trace records what the team noticed, what it decided, who approved it, and what changed.

Decision Trace should be able to capture:

- Intent decisions: why a direction, scope, acceptance criterion, or success metric changed.
- Drift events: where implementation, tests, UX, evals, or metrics diverged from the Product Spec.
- Reconciliation decisions: whether the team updated the spec, changed the implementation, accepted a tradeoff, or reopened work.
- Outcome reviews: whether the hypothesis held, what the success metrics showed, and what the team learned.

The loop is:

```text
Intent -> Implementation -> Drift -> Decision -> Revised Intent
```

The Product Spec remains the current committed intent. Decision Trace explains how that intent changed over time.

## What ProductSpec Defines

ProductSpec defines interoperability, not taste.

It defines:

- Canonical sections.
- Structure.
- Identifiers.
- Schemas.
- Parsers.
- Validators.
- Examples.
- Extension mechanisms.
- Compatibility expectations.
- Conformance tests.

It does not define what makes a Product Spec good. That belongs to implementations, reviewers, teams, and local calibration.

## Long-Term Direction

Markdown is the first serialization.

Long term, the canonical representation should become a semantic model that can be serialized as Markdown, JSON, YAML, AST, or other formats.

The goal is not a better document. The goal is a durable, portable layer for software intent that humans can read and AI agents can execute.
