# ProductSpec Vision

ProductSpec is the open standard for software intent before implementation.

As software development becomes AI-native, writing code becomes less scarce. The bottleneck moves upstream: expressing what should be built, why it matters, what tradeoffs are accepted, what must be true before launch, and how success will be measured after launch.

ProductSpec starts as a product spec format. It becomes the intent layer when downstream systems compile from it and report back to it.

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

There is no equivalent standard for product intent: the problem, hypothesis, scope, user experience, acceptance criteria, success metrics, tradeoffs, decisions, and evidence behind the work.

Today that intent is scattered across docs, chat threads, meetings, issue trackers, design comments, analytics dashboards, and people's memories.

ProductSpec exists to make intent structured, portable, reviewable, executable by agents, and durable over time.

## The Layer

ProductSpec operates before engineering specs are written.

It does not replace engineering specification systems such as OpenSpec or Spec Kit. Those systems operate downstream, after the product intent is clear enough to turn into design, tasks, implementation, and tests.

```text
Product Spec (ProductSpec) -> Engineering Spec (OpenSpec / Spec Kit) -> Code (agents)
what / why                  how / plan / tasks                         implementation
strategic intent            technical decomposition                    running system
```

Both layers are spec-driven development. They serve different roles with different artifacts.

## What The Standard Defines

The Standard defines interoperability, not taste.

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

The goal is not a better document. The goal is a durable, portable layer for product intent that humans can read and AI agents can execute.
