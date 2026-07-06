# Launch Post Draft

PRODUCTSPEC

AI made implementation cheaper.

The scarce artifact now is intent.

When code was expensive, teams spent most of their energy figuring out how to build. Now an AI agent can produce a first implementation quickly. That changes where the risk sits.

The expensive mistake is building the wrong thing with confidence.

That is why I created ProductSpec: an open standard for software intent before implementation.

A Product Spec is the product decision that comes before tickets, engineering plans, and code. It captures:

- Problem: who is hurting, what pain they feel, and why it matters
- Hypothesis: what behavior should change if this ships
- Scope: what is in, what is out, and what is deliberately cut
- Acceptance Criteria: the build contract before launch
- Success Metrics: the market contract after launch

The distinction between Acceptance Criteria and Success Metrics matters.

Acceptance Criteria tell an AI agent, engineer, or reviewer when the build loop is done.

Success Metrics tell the team whether the shipped product mattered.

ProductSpec is Markdown-first because intent should live where software teams already work: Git, pull requests, issues, docs, editors, and agent workflows.

It also includes `spec_revision`, because product specs are living documents. Scope changes. Designs change. Acceptance criteria change. A ticket, engineering spec, pull request, or future decision trace should be able to say exactly which revision of the product intent it implements.

The repo includes:

- a canonical Product Spec format
- a TypeScript parser and validator
- an npm CLI
- examples across AI features, consumer UX, enterprise workflows, internal APIs, and revision history
- GitHub issue and PR templates
- docs for Git, Jira, Linear, Figma, OpenSpec, Spec Kit, and AI agents

Try it:

```bash
npm exec --package @productspec/parser -- productspec init specs/my-feature.product-spec.md
npm exec --package @productspec/parser -- productspec validate specs/my-feature.product-spec.md
```

I want ProductSpec to evolve in the open.

Founders, PMs, product leaders, designers, engineers, and AI-agent builders: contribute examples, challenge the section vocabulary, propose changes, and show how your team wants product intent to move from idea to code.

ProductSpec is the open standard for software intent before implementation.
