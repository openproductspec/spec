# ProductSpec Field Guide

This guide explains the ProductSpec section vocabulary at the right altitude for an open standard.

It defines what each field is for, what belongs there, what does not belong there, and how adjacent fields differ. It is intentionally lighter than a reviewer rubric: ProductSpec defines interoperable structure, not taste.

ProductSpec is not for every act of building. It is for consequential software work where intent needs to survive handoff. Individual builders may not need a Product Spec for quick experiments or throwaway prototypes. Teams and organizations benefit most when multiple people, multiple agents, or future reviewers need a shared record of what should be built and why.

## Problem

**What it is:** the named user or group, the pain they experience, and why the pain matters.

**Belongs here:**

- A named user group.
- The pain or constraint they feel.
- The context in which the pain happens.
- Why solving it matters now.

**Does not belong here:**

- The solution.
- The channel or mechanism you already want to build.
- Company-centric goals such as "increase revenue" unless tied to a user pain.
- Generic actors such as "users" without any named group.

**Example:**

> Researchers using YouTube videos as source material spend too much time scrubbing through long videos to find exact quotes they can cite.

**Common mistake:** writing the desired feature as the problem. "Users need searchable transcripts" is already a solution. The problem is the pain that makes searchable transcripts useful.

## Hypothesis

**What it is:** the causal bet behind the work.

**Belongs here:**

- The thing you plan to ship.
- The specific user or group it is for.
- The behavior you expect to change.
- The reason that change should happen.

**Does not belong here:**

- Numeric targets.
- Success thresholds.
- Time windows.
- Metric definitions.
- A list of features.

**Example:**

> If we provide searchable transcripts with timestamped passages, researchers will treat YouTube videos as usable source material because they can find, verify, and cite the right moment quickly.

**Relationship to Success Metrics:**

Hypothesis names the expected behavior change. Success Metrics quantify it.

## Scope

**What it is:** the boundary of the work.

**Belongs here:**

- What is in.
- What is out.
- What was deliberately cut or deferred.
- The tradeoff behind the boundary.

**Does not belong here:**

- Architecture.
- Task breakdowns.
- Detailed implementation plans.
- Every possible future feature.

**Example:**

````markdown
```productspec-scope
in:
  - paste a YouTube URL
  - generate a transcript
  - search within one transcript
  - copy passages with citations
out:
  - multi-video projects
  - team workspaces
  - non-YouTube video imports
cut:
  - speaker diarization
  - transcript editing
```
````

**Common mistake:** treating scope as a feature wish list. Scope should help the team say no.

## User Experience

**What it is:** an optional externally observable experience of the work, when there is one.

**Belongs here:**

- Prototype URL.
- Mockup or design link.
- Public deploy.
- Loom walkthrough.
- API documentation page.
- CLI demo.
- Dashboard or report.
- Internal tool screen.

**Does not belong here:**

- Implementation architecture.
- Pixel-perfect design requirements.
- A prose-only description when an artifact exists.
- A homepage or generic docs page that does not show the actual experience.

**Example:**

> https://example.com/transcript-search-prototype

**Common mistake:** making User Experience mandatory for every software artifact. Backend tools, migrations, infrastructure changes, and internal systems may not have a user-facing flow. When there is no useful external experience to show, omit this section.

## Acceptance Criteria

**What it is:** the build contract: pass/fail checks that can be evaluated before launch.

**Belongs here:**

- Happy-path behavior.
- Important error handling.
- Edge cases that must work.
- Safety or data-loss protections.
- AI eval thresholds for AI features.
- Accessibility or compliance requirements that must be true before launch.

**Does not belong here:**

- Post-launch business outcomes.
- Adoption targets.
- Revenue targets.
- Architecture details.
- Specific table names, library choices, or implementation tasks unless the artifact itself is an API or integration contract.

For AI products, use a structured eval block when the eval should be parsed by tools:

````markdown
```productspec-ai-evals
- id: answer_faithfulness
  type: rubric
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm_judge
  pass_threshold: 0.9
  checks:
    - answer is supported by retrieved source text
    - answer includes a citation for every factual claim
```
````

Use plain bullets when the eval is still a rough human note. Use the structured block when the eval is part of the launch gate.

**Example:**

> Given a valid public YouTube URL, the user can create a transcript page.
>
> Search returns matching transcript passages with timestamps.
>
> Empty, private, or unsupported videos return a clear error.

**Relationship to Success Metrics:**

Acceptance Criteria are the build contract. Success Metrics are the market contract.

If you can mark it pass/fail before launch by inspecting the built artifact, it probably belongs in Acceptance Criteria. If you need real user behavior after launch, it probably belongs in Success Metrics.

## Success Metrics

**What it is:** the post-launch evidence that tells the team whether the bet worked.

**Belongs here:**

- Leading indicators that can be read soon after launch.
- Lagging confirmation metrics.
- Real-user behavior.
- Product or business outcome thresholds.
- Quality signals from real usage.

**Does not belong here:**

- Pre-launch AI eval pass rates.
- QA checklist items.
- Implementation milestones.
- Instrumentation details.
- Event names or data-pipeline logic.

**Example:**

````markdown
```productspec-success-metrics
- id: first_session_search_rate
  metric: first_session_transcript_search_rate
  target: ">= 60%"
  window: first session after transcript creation
- id: timestamped_quote_copy_rate
  metric: timestamped_quote_copy_rate
  target: ">= 35%"
  window: within 7 days of transcript creation
```
````

**Relationship to Hypothesis:**

Hypothesis names the expected behavior change. Success Metrics quantify it.

**Relationship to Acceptance Criteria:**

Acceptance Criteria say whether the artifact is ready to ship. Success Metrics say whether shipping it changed real behavior.

## AI Evals

AI evals are not a separate mandatory section in ProductSpec.

For AI features, pre-launch eval thresholds belong in `acceptance_criteria` because they are build gates. Post-launch AI quality signals belong in `success_metrics` when they come from real usage.

**Acceptance Criteria example:**

> On a 50-query golden set, at least 90% of returned passages include the cited text in the source transcript, with zero fabricated citations.

**Success Metrics example:**

> Fewer than 2% of copied AI-generated citations are reported as incorrect by users.

## Optional Sections

Optional sections add depth when the work needs it. They are not required for every Product Spec.

- `customer_truth`: direct customer evidence and current workaround.
- `solution_alternatives`: options considered and why they lost.
- `solution`: what the user sees and does when the Product Spec needs more depth than the core fields provide.
- `strategic_positioning`: target segment, non-target segment, competitors, and why this wins.
- `adoption`: how users discover, try, and keep using the product.
- `pricing`: packaging, price, unit of value, or monetization impact.
- `risks`: what could fail, how to detect it, and fallback plans.
- `ai`: deeper AI behavior contract, examples, risks, red-team cases, and fallback behavior.
- `open_questions`: unresolved decisions, owners, and next learning steps.
- `rollout`: exposure, segment, duration, and what learning closes the loop.
