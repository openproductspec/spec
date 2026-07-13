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

Use this test when deciding between `cut` and `solution_alternatives`: would a user have noticed the difference?

- If yes, it is a user-visible capability, channel, or workflow. Put it in `cut` with the rejection reason.
- If no, it is usually a rejected way of building the same user-visible behavior. Put it in `solution_alternatives`.

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
- id: EVAL-1
  type: llm_judge
  cases:
    - input: "Representative input for this eval."
      expected: "Expected behavior for this eval."
  evaluator: llm
  pass_threshold: 0.9
  checks:
    - answer is supported by retrieved source text
    - answer includes a citation for every factual claim
```
````

Use plain bullets when the eval is still a rough human note. Use the structured block when the eval is part of the launch gate. `checks` are optional; add them only when `input` and `expected` need extra grading rules.

**Example:**

````markdown
```productspec-acceptance-criteria
- id: AC-1
  criterion: Given a valid public YouTube URL, the user can create a transcript page.
- id: AC-2
  criterion: Search returns matching transcript passages with timestamps.
- id: AC-3
  criterion: Empty, private, or unsupported videos return a clear error.
```
````

Acceptance Criteria use generated durable IDs (`AC-1`, `AC-2`) because agents, tickets, pull requests, and Decision Traces may need to cite the exact build condition. Eval cases and optional checks stay un-IDed; cite them positionally if needed, such as `EVAL-1.case[2]`.

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
- id: SM-1
  metric: first_session_transcript_search_rate
  target: ">= 60%"
  target_status: committed
  window: first session after transcript creation
- id: SM-2
  metric: timestamped_quote_copy_rate
  target: tbd
  target_status: provisional
  target_owner: Data lead
  window: within 7 days of transcript creation
```
````

**Relationship to Hypothesis:**

Hypothesis names the expected behavior change. Success Metrics quantify it.

**Relationship to Acceptance Criteria:**

Acceptance Criteria say whether the artifact is ready to ship. Success Metrics say whether shipping it changed real behavior.

Use `target_status: committed` when the threshold is a real commitment. Use `target_status: provisional` when the metric is right but the target depends on a baseline that will be calibrated after launch; in that case, include `target_owner` so the uncertainty is owned.

**Committed targets:**

`target_status` defaults to `committed`, so a metric with no status is a committed one. Use it when the number came from somewhere: a current baseline, a prior release, a contractual threshold, or a decision the team already made. `committed` is a claim about who agreed to the number, not about how confident anyone feels.

**Provisional targets:**

Use `provisional` when the metric is right but the number cannot exist yet, because the baseline arrives with the launch or the threshold needs a calibration pass. Write `target: tbd`, and name the person who will set it in `target_owner`.

`target_owner` is required for provisional targets, and the requirement is the point. A provisional target with no owner is a number nobody will ever go back and set. The owner is the person who replaces `tbd` with a real value once the baseline exists, inside the `window` the metric already states.

A provisional target is a scheduled decision, not a permanent state. Once the number is set, change `target_status` to `committed` in the same revision that records the number.

**Common mistake:** marking a target `provisional` because the number feels uncertain. Provisional describes whether the baseline exists yet, not how sure the team is. A number the team has agreed to belongs in `committed` even when nobody is confident it will be hit. A number nobody has agreed to does not belong in the spec at all, and that is what `provisional` is for.

When the metric itself is undecided, that is not a provisional target. Leave the row out and record the open decision under `## Open Questions`, where a reviewer will see it.

For a complete example, see [`examples/provisional-success-metric.product-spec.md`](../examples/provisional-success-metric.product-spec.md).


## AI Evals

AI evals are not a separate mandatory section in ProductSpec.

For AI features, pre-launch eval thresholds belong in `acceptance_criteria` because they are build gates. Post-launch AI quality signals belong in `success_metrics` when they come from real usage.

**Acceptance Criteria example:**

> On a 50-query golden set, at least 90% of returned passages include the cited text in the source transcript, with zero fabricated citations.

**Success Metrics example:**

> Fewer than 2% of copied AI-generated citations are reported as incorrect by users.

## Compliance and Policy Content

Compliance, privacy, security, or legal content goes where its job belongs.

- A concrete pre-launch pass/fail gate belongs in Acceptance Criteria.
- An ongoing obligation, standing policy, or background rule belongs in a custom section.

Example: "SOC 2 evidence exists before launch" is an acceptance criterion. "Quarterly access review policy" is usually a custom section.

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
- `related_artifacts`: links from Product Spec sections or item IDs to issues, pull requests, eval runs, dashboards, design artifacts, releases, engineering specs, or other durable records.

## Traceability

Traceability helps humans and agents see how intent connects to implementation and evidence.

Use frontmatter for stable document-level relationships:

```yaml
linked_github_repo: "acme/app"
applies_to:
  - path: "apps/web/src/transcripts/"
  - component: "transcript-search"
```

Use `Related Artifacts` for item-level links:

````markdown
## Related Artifacts

```productspec-related-artifacts
- type: github_issue
  url: "https://github.com/acme/app/issues/123"
  title: "Build transcript search"
  section_id: acceptance_criteria
  item_id: AC-1
- type: eval_run
  url: "https://evals.example.com/runs/456"
  section_id: acceptance_criteria
  item_id: EVAL-1
```
````

Use `section_id` when the link applies to a whole section. Use `item_id` when the link applies to a specific Acceptance Criterion, Success Metric, or AI eval.

Use item IDs to attach evidence:

- `AC-<number>`: implementation evidence such as pull requests, tests, code links, release notes, or engineering specs.
- `EVAL-<number>`: eval evidence such as eval runs, test reports, or human review records.
- `SM-<number>`: post-launch outcome evidence such as dashboards, analytics snapshots, experiments, or metric reviews.

A related artifact can also point at another Product Spec. Use `type: product_spec` with `product_spec_path`, an optional `product_spec_revision` pin, and an optional `relation` of `depends_on`, `blocks`, `supersedes`, or `relates_to`:

```productspec-related-artifacts
- type: product_spec
  product_spec_path: "../library/citation-library.product-spec.md"
  product_spec_revision: 2
  relation: depends_on
  title: "Citation Library"
```

Use `depends_on` when this spec cannot ship until the referenced spec does, and `blocks` for the reverse. `supersedes` says this spec replaces the referenced one. A repo of specs with these links is a graph a tool can walk to find build order.
