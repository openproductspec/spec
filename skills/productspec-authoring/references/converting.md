# Converting an Existing PRD or Feature Doc

Converting a real document is harder than authoring fresh, because the source was not written in the format's shape. Work section by section. Do not paste the source wholesale and patch what breaks.

## The mapping pass

1. Read the whole source first. Identify the person in pain, the causal bet, the boundaries, the pre-launch checks, and the post-launch expectations. These map to the five mandatory sections.
2. `problem` and `hypothesis` usually do not exist verbatim in engineering docs. Derive them from the source and flag both for author review. They are the sections most worth a human's time.
3. Sort every boundary statement into scope: shipping now (`in`), explicitly not this version (`out`), considered and rejected (`cut`). If an item is committed but deferred behind another piece of work, keep it in `out` and state the gate in prose next to the block.
4. Pre-launch checks become `acceptance_criteria`. Post-launch behavior becomes `success_metrics`. When the source mixes them, split them.
5. Pick `artifact_type` by the source's commitment level: a committed build doc is `prd`, an unvalidated bet being tested is `hypothesis`, a change proposal against an existing spec is `openspec_proposal`.
6. Carry the source's links across. A ticket, a Figma file, an engineering spec, or a dashboard named in the source belongs in a `productspec-related-artifacts` block under `## Related Artifacts`, pointed at the `AC-` or `SM-` id it serves. A dependency on another feature becomes a `product_spec` item with `relation: depends_on`. A repository or a directory the doc governs belongs in frontmatter as `linked_github_repo` or `applies_to`.
7. Content with no canonical home (dependencies, retention rules, standing policy) goes in a custom section. A compliance item that is a concrete pre-launch pass/fail gate belongs in `acceptance_criteria`. Only ongoing or ambient obligations get a custom section. Any non-canonical `## Heading` becomes a custom section automatically with a derived `custom-<kebab-name>` id. Declare it in frontmatter `custom_sections` when you need to pin the id and label.

## Frontmatter with no source values

`author`, `created_at`, and `updated_at` are required, and messy sources often name none of them. Do not fabricate a name. Set `author` to the converting person or team, or to an explicit "unattributed, pending review" marker. Use the conversion date for both timestamps. Flag authorship in the review note alongside problem and hypothesis.

## Conversion hazards

- **Prose acceptance criteria.** Sources write checks as loose bullets, often bundling three assertions in one line. Each `AC-<number>` item is a single pass/fail condition. Split compound bullets. Number them in source order, then leave the numbering alone, because other documents will cite these ids.
- **Numbers you do not have.** Success metrics are a required block with a `target` and a `window`, so prose is not an escape hatch. When the source names the metric but no number, set `target: tbd`, `target_status: provisional`, and put the owner in `target_owner`. That is the honest conversion, and it validates. Never invent a target to clear the validator, and never attribute a metric to a person the source does not name.
- **Ranges.** A source target like "60 to 80%" does not fit one comparison string. Put the committed floor in `target`, and keep the range in prose beside the block so the upper bound survives.
- **AI behavior with an undecided eval setup.** The evals block is optional. State the behavioral constraint in prose inside `acceptance_criteria`, note which eval fields are pending, and add the open decision to `open_questions`. Do not emit a `productspec-ai-evals` block until `type`, `cases`, `evaluator`, and `pass_threshold` are all real.
- **Code samples containing `##` lines.** A heading inside a fenced sample is example content, not a section boundary, and the parser skips fenced regions when it scans for headings. After converting, validate and read the parsed sections back, and confirm Scope still holds everything you put in it.
- **Rejected designs vs descoped features.** The deciding question: was the rejected thing something a user would have experienced, or an internal way of building the same experience? A capability or channel goes in `cut` with the rejection reason in prose. A rejected approach goes in `solution_alternatives`.
- **One decision, two homes.** If sequencing lives in both `scope` and `rollout`, pick one and reference it from the other. Duplicated facts drift.

## After converting

Validate, then diff the spec against the source: every load-bearing sentence in the source should be findable in the spec or deliberately dropped. Record deliberate drops in `open_questions` or a review note, so the author sees them.
