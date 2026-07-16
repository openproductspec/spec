export const MANDATORY_SECTION_IDS = [
  "problem",
  "hypothesis",
  "product_summary",
  "scope",
  "acceptance_criteria",
  "success_metrics"
] as const;

export const OPTIONAL_SECTION_IDS = [
  "user_experience",
  "customer_truth",
  "solution_alternatives",
  "solution",
  "strategic_positioning",
  "adoption",
  "pricing",
  "risks",
  "ai",
  "open_questions",
  "rollout",
  "related_artifacts"
] as const;

export const CANONICAL_SECTION_IDS = [
  ...MANDATORY_SECTION_IDS,
  ...OPTIONAL_SECTION_IDS
] as const;

export type CanonicalSectionId = (typeof CANONICAL_SECTION_IDS)[number];
export type ArtifactType = "hypothesis" | "prd" | "openspec_proposal";
export const AI_EVAL_TYPES = ["exact_match", "contains", "regex", "llm_judge", "human_review"] as const;
export const AI_EVAL_EVALUATORS = ["deterministic", "llm", "human"] as const;
export const RELATED_ARTIFACT_TYPES = [
  "github_issue",
  "github_pr",
  "jira_issue",
  "linear_issue",
  "figma",
  "engineering_spec",
  "eval_run",
  "dashboard",
  "analytics_snapshot",
  "experiment",
  "release",
  "code",
  "product_spec",
  "other"
] as const;
export const RELATED_ARTIFACT_RELATIONS = [
  "depends_on",
  "blocks",
  "supersedes",
  "relates_to"
] as const;
export type AiEvalType = (typeof AI_EVAL_TYPES)[number];
export type AiEvalEvaluator = (typeof AI_EVAL_EVALUATORS)[number];
export type RelatedArtifactType = (typeof RELATED_ARTIFACT_TYPES)[number];
export type RelatedArtifactRelation = (typeof RELATED_ARTIFACT_RELATIONS)[number];
export const DECISION_TRACE_SUBJECT_TYPES = [
  "product_spec",
  "engineering_spec",
  "design",
  "implementation",
  "eval",
  "experiment",
  "incident",
  "other"
] as const;
export const DECISION_TRACE_EVENT_TYPES = [
  "intent_decision",
  "scope_drift",
  "acceptance_criteria_drift",
  "ux_drift",
  "ai_eval_drift",
  "success_metric_review",
  "implementation_tradeoff",
  "spec_revision",
  "outcome_review"
] as const;
export const DECISION_TRACE_OUTCOMES = [
  "update_spec",
  "update_implementation",
  "accept_tradeoff",
  "reopen_work",
  "record_learning",
  "no_action"
] as const;
export const AGENT_RUN_STATUSES = [
  "draft",
  "completed",
  "blocked",
  "failed"
] as const;
export const AGENT_RUN_ITEM_STATUSES = [
  "passed",
  "failed",
  "not_checked",
  "blocked"
] as const;
export type DecisionTraceSubjectType = (typeof DECISION_TRACE_SUBJECT_TYPES)[number];
export type DecisionTraceEventType = (typeof DECISION_TRACE_EVENT_TYPES)[number];
export type DecisionTraceOutcome = (typeof DECISION_TRACE_OUTCOMES)[number];
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];
export type AgentRunItemStatus = (typeof AGENT_RUN_ITEM_STATUSES)[number];

export interface ProductSpecFrontmatter {
  spec_format_version: "0.1";
  title: string;
  artifact_type: ArtifactType;
  spec_revision?: number;
  author: string;
  created_at: string;
  updated_at: string;
  linked_github_repo?: string;
  applies_to?: ProductSpecAppliesTo[];
  custom_sections?: Array<{ id: string; label: string; after: string }>;
  tool_metadata?: Record<string, string>;
}

export type ProductSpecAppliesTo = { path?: string; component?: string };

export interface ProductSpecSection {
  id: string;
  label: string;
  content: string;
  scope?: ProductSpecScope;
  acceptance_criteria?: ProductSpecAcceptanceCriterion[];
  ai_evals?: ProductSpecAiEval[];
  success_metrics?: ProductSpecSuccessMetric[];
  related_artifacts?: ProductSpecRelatedArtifact[];
}

export interface ProductSpecScope {
  in: string[];
  out: string[];
  cut: string[];
}

export interface ProductSpecAcceptanceCriterion {
  id: string;
  criterion: string;
}

export interface ProductSpecAiEval {
  id: string;
  type: AiEvalType;
  evaluator: AiEvalEvaluator;
  pass_threshold: number;
  cases: Array<{
    input: string;
    expected: string;
  }>;
  checks: string[];
}

export interface ProductSpecSuccessMetric {
  id: string;
  metric: string;
  target: string;
  target_status: "committed" | "provisional";
  target_owner?: string;
  window: string;
}

export interface ProductSpecRelatedArtifact {
  type: RelatedArtifactType;
  url?: string;
  title?: string;
  section_id?: string;
  item_id?: string;
  product_spec_path?: string;
  product_spec_revision?: number;
  relation?: RelatedArtifactRelation;
}

export interface ProductSpecDocument {
  frontmatter: ProductSpecFrontmatter;
  sections: ProductSpecSection[];
  parser_metadata?: {
    unknown_frontmatter?: string[];
  };
}

export interface ProductSpecValidationError {
  code: string;
  message: string;
  path?: string;
}

export interface ProductSpecValidationWarning {
  code: string;
  message: string;
  path?: string;
}

export type ProductSpecValidationResult =
  | { valid: true; document: ProductSpecDocument; errors: []; warnings: ProductSpecValidationWarning[] }
  | { valid: false; errors: ProductSpecValidationError[]; warnings: ProductSpecValidationWarning[] };

export interface DecisionTraceDocument {
  decision_trace_format_version: "0.1";
  trace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  subject: {
    type: DecisionTraceSubjectType;
    id: string;
    title?: string;
    product_spec_path?: string;
    product_spec_revision?: number;
  };
  events: DecisionTraceEvent[];
}

export interface DecisionTraceEvent {
  event_id: string;
  event_type: DecisionTraceEventType;
  occurred_at: string;
  summary: string;
  source?: {
    product_spec_revision?: number;
    links?: DecisionTraceLink[];
  };
  drift?: {
    spec_claim?: string;
    observed_reality?: string;
  };
  decision: {
    outcome: DecisionTraceOutcome;
    rationale: string;
    approved_by?: string[];
  };
  result?: {
    new_product_spec_revision?: number;
    linked_artifacts?: DecisionTraceLink[];
    learning?: string;
  };
}

export interface DecisionTraceLink {
  type: RelatedArtifactType;
  url: string;
  title?: string;
}

export type DecisionTraceValidationResult =
  | { valid: true; document: DecisionTraceDocument; errors: [] }
  | { valid: false; errors: ProductSpecValidationError[] };

export interface AgentRunDocument {
  agent_run_format_version: "0.1";
  run_id: string;
  agent: {
    name: string;
    version?: string;
  };
  product_spec: {
    path: string;
    spec_revision: number;
    content_hash?: string;
  };
  started_at: string;
  completed_at?: string;
  status: AgentRunStatus;
  checked_items: AgentRunCheckedItem[];
  drift: {
    detected: boolean;
    decision_trace_path?: string;
    summary?: string;
  };
  completion_claim?: string;
}

export interface AgentRunCheckedItem {
  item_id: string;
  status: AgentRunItemStatus;
  evidence?: DecisionTraceLink[];
  notes?: string;
}

export type AgentRunValidationResult =
  | { valid: true; document: AgentRunDocument; errors: [] }
  | { valid: false; errors: ProductSpecValidationError[] };

const LABELS: Record<string, string> = {
  problem: "Problem",
  hypothesis: "Hypothesis",
  product_summary: "Product Summary",
  scope: "Scope",
  user_experience: "User Experience",
  acceptance_criteria: "Acceptance Criteria",
  success_metrics: "Success Metrics",
  customer_truth: "Customer Truth",
  solution_alternatives: "Solution Alternatives",
  solution: "Solution",
  strategic_positioning: "Strategic Positioning",
  adoption: "Adoption",
  pricing: "Pricing",
  risks: "Risks",
  ai: "AI Details",
  open_questions: "Open Questions",
  rollout: "Rollout",
  related_artifacts: "Related Artifacts"
};

export function parseProductSpecMarkdown(input: string): ProductSpecDocument {
  const markdown = input.replace(/\r\n/g, "\n");
  const frontmatterMatch = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
  if (!frontmatterMatch) throw new Error("Product Spec frontmatter is required.");

  const { frontmatter, parser_metadata } = parseFrontmatter(frontmatterMatch[1]);
  const body = markdown.slice(frontmatterMatch[0].length);
  const sections = parseSections(body, frontmatter.custom_sections ?? []);

  for (const sectionId of MANDATORY_SECTION_IDS) {
    if (!sections.some((section) => section.id === sectionId)) {
      throw new Error(`Missing mandatory section: ${sectionId}`);
    }
  }

  return {
    frontmatter,
    sections,
    ...(parser_metadata ? { parser_metadata } : {})
  };
}

export function validateProductSpecMarkdown(markdown: string): ProductSpecValidationResult {
  try {
    const document = parseProductSpecMarkdown(markdown);
    const { errors, warnings } = validateDocument(document);
    if (errors.length) return { valid: false, errors, warnings };
    return { valid: true, document, errors: [], warnings };
  } catch (error) {
    return {
      valid: false,
      errors: [validationErrorFor(error)],
      warnings: []
    };
  }
}

export function validateDecisionTraceJson(json: string): DecisionTraceValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          code: "invalid_json",
          message: error instanceof Error ? error.message : "Invalid JSON."
        }
      ]
    };
  }

  const errors = validateDecisionTraceValue(parsed);
  if (errors.length) return { valid: false, errors };
  return { valid: true, document: parsed as DecisionTraceDocument, errors: [] };
}

export function validateAgentRunJson(json: string): AgentRunValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          code: "invalid_json",
          message: error instanceof Error ? error.message : "Invalid JSON."
        }
      ]
    };
  }

  const errors = validateAgentRunValue(parsed);
  if (errors.length) return { valid: false, errors };
  return { valid: true, document: parsed as AgentRunDocument, errors: [] };
}

export function serializeProductSpecMarkdown(doc: ProductSpecDocument): string {
  const frontmatter = serializeFrontmatter(doc.frontmatter, doc.parser_metadata);
  const body = doc.sections
    .map((section) => `## ${section.label}\n\n${section.content.trim()}`)
    .join("\n\n");
  return `---\n${frontmatter}---\n\n${body}\n`;
}

function validationErrorFor(error: unknown): ProductSpecValidationError {
  const message = error instanceof Error ? error.message : "Invalid Product Spec.";
  if (message.includes("frontmatter is required")) {
    return { code: "missing_frontmatter", message };
  }
  if (message.includes("Unsupported spec_format_version")) {
    return { code: "unsupported_version", message, path: "frontmatter.spec_format_version" };
  }
  if (message.includes("Missing mandatory section")) {
    const sectionId = message.split(":").at(-1)?.trim();
    return {
      code: "missing_required_section",
      message,
      path: sectionId ? `sections.${sectionId}` : "sections"
    };
  }
  if (message.includes("Missing required Product Spec frontmatter")) {
    return { code: "missing_required_frontmatter", message, path: "frontmatter" };
  }
  if (message.includes("Unsupported artifact_type")) {
    return { code: "unsupported_artifact_type", message, path: "frontmatter.artifact_type" };
  }
  if (message.includes("Invalid spec_revision")) {
    return { code: "invalid_spec_revision", message, path: "frontmatter.spec_revision" };
  }
  if (message.includes("Invalid AI eval")) {
    return { code: "invalid_ai_eval", message, path: "sections.acceptance_criteria.ai_evals" };
  }
  if (message.includes("Invalid acceptance criterion")) {
    return { code: "invalid_acceptance_criterion", message, path: "sections.acceptance_criteria.acceptance_criteria" };
  }
  if (message.includes("Invalid structured scope")) {
    return { code: "invalid_structured_scope", message, path: "sections.scope.scope" };
  }
  if (message.includes("Invalid success metric")) {
    return { code: "invalid_success_metric", message, path: "sections.success_metrics.success_metrics" };
  }
  if (message.includes("Invalid applies_to")) {
    return { code: "invalid_applies_to", message, path: "frontmatter.applies_to" };
  }
  if (message.includes("Invalid related artifact")) {
    return { code: "invalid_related_artifact", message, path: "sections.related_artifacts.related_artifacts" };
  }
  return { code: "invalid_product_spec", message };
}

function validateDocument(document: ProductSpecDocument): {
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
} {
  const errors: ProductSpecValidationError[] = [];
  const warnings: ProductSpecValidationWarning[] = [];
  const seenSectionIds = new Set<string>();
  const seenItemIds = new Set<string>();

  for (const field of ["created_at", "updated_at"] as const) {
    if (!isoDateTime(document.frontmatter[field])) {
      errors.push({
        code: "invalid_datetime",
        message: `Invalid Product Spec date-time: ${field} must be ISO 8601.`,
        path: `frontmatter.${field}`
      });
    }
  }

  for (const section of document.sections) {
    if (seenSectionIds.has(section.id)) {
      errors.push({
        code: "duplicate_section",
        message: `Duplicate section: ${section.id}`,
        path: `sections.${section.id}`
      });
    }
    seenSectionIds.add(section.id);
  }

  let lastRequiredIndex = -1;
  for (const section of document.sections) {
    const requiredIndex = MANDATORY_SECTION_IDS.indexOf(section.id as (typeof MANDATORY_SECTION_IDS)[number]);
    if (requiredIndex === -1) continue;
    if (requiredIndex < lastRequiredIndex) {
      errors.push({
        code: "invalid_section_order",
        message: `Required section out of order: ${section.id}`,
        path: `sections.${section.id}`
      });
    }
    lastRequiredIndex = Math.max(lastRequiredIndex, requiredIndex);
  }

  for (const customSection of document.frontmatter.custom_sections ?? []) {
    if (!/^custom-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(customSection.id)) {
      errors.push({
        code: "invalid_custom_section_id",
        message: `Custom section id must use custom-<kebab-name>: ${customSection.id}`,
        path: `frontmatter.custom_sections.${customSection.id}`
      });
    }
  }

  for (const [index, appliesTo] of (document.frontmatter.applies_to ?? []).entries()) {
    const hasPath = "path" in appliesTo && Boolean(appliesTo.path?.trim());
    const hasComponent = "component" in appliesTo && Boolean(appliesTo.component?.trim());
    if (hasPath === hasComponent) {
      errors.push({
        code: "invalid_applies_to",
        message: "Invalid applies_to: each item must include exactly one non-empty path or component.",
        path: `frontmatter.applies_to.${index}`
      });
    }
  }

  for (const sectionId of MANDATORY_SECTION_IDS) {
    const section = document.sections.find((candidate) => candidate.id === sectionId);
    if (!section) continue;

    const meaningfulContent = section.content.replace(/[`*_#>\-\s\d.()[\]]/g, " ").trim();
    const wordCount = meaningfulContent.split(/\s+/).filter(Boolean).length;
    if (!meaningfulContent || /^tbd$/i.test(meaningfulContent)) {
      warnings.push({
        code: "empty_required_section",
        message: `Required section has no meaningful content: ${sectionId}`,
        path: `sections.${sectionId}`
      });
      continue;
    }
    if (wordCount < 6) {
      warnings.push({
        code: "thin_required_section",
        message: `Required section is very short: ${sectionId}`,
        path: `sections.${sectionId}`
      });
    }
  }

  const knownItemIds = new Set(
    document.sections.flatMap((section) => [
      ...(section.acceptance_criteria ?? []).map((criterion) => criterion.id),
      ...(section.ai_evals ?? []).map((evalSpec) => evalSpec.id),
      ...(section.success_metrics ?? []).map((metric) => metric.id)
    ])
  );

  for (const section of document.sections) {
    if (section.scope) {
      const path = `sections.${section.id}.scope`;
      if (section.id !== "scope") {
        errors.push({
          code: "invalid_structured_scope",
          message: "Structured scope blocks belong in Scope.",
          path
        });
      }
      const items = [...section.scope.in, ...section.scope.out, ...section.scope.cut];
      if (!items.length || items.some((item) => !item.trim())) {
        errors.push({
          code: "invalid_structured_scope",
          message: "Invalid structured scope: include at least one non-empty in, out, or cut item.",
          path
        });
      }
      for (const key of ["in", "out", "cut"] as const) {
        for (const [index, item] of section.scope[key].entries()) {
          if (isFragmentLikeScopeItem(item)) {
            warnings.push({
              code: "scope_item_fragment",
              message: `Scope item should be a complete sentence or imperative statement: ${item}`,
              path: `${path}.${key}.${index}`
            });
          }
        }
      }
    }

    for (const [index, criterion] of (section.acceptance_criteria ?? []).entries()) {
      const path = `sections.${section.id}.acceptance_criteria.${index}`;
      if (section.id !== "acceptance_criteria") {
        errors.push({
          code: "invalid_acceptance_criterion",
          message: "Structured acceptance criteria blocks belong in Acceptance Criteria.",
          path
        });
      }
      const missingFields = ["id", "criterion"].filter(
        (field) => !String(criterion[field as keyof ProductSpecAcceptanceCriterion] ?? "").trim()
      );
      if (missingFields.length) {
        errors.push({
          code: "invalid_acceptance_criterion",
          message: `Invalid acceptance criterion: missing ${missingFields.join(", ")}.`,
          path
        });
      }
      if (criterion.id && !/^AC-[1-9]\d*$/.test(criterion.id)) {
        errors.push({
          code: "invalid_acceptance_criterion",
          message: "Invalid acceptance criterion: id must use AC-<number>.",
          path
        });
      }
      addDuplicateItemIdError(errors, seenItemIds, criterion.id, `${path}.id`);
    }

    if (section.id === "acceptance_criteria" && !section.acceptance_criteria?.length) {
      errors.push({
        code: "invalid_acceptance_criterion",
        message: "Invalid acceptance criterion: include at least one productspec-acceptance-criteria item.",
        path: "sections.acceptance_criteria.acceptance_criteria"
      });
    }

    for (const [index, aiEval] of (section.ai_evals ?? []).entries()) {
      const path = `sections.${section.id}.ai_evals.${index}`;
      if (section.id !== "acceptance_criteria") {
        errors.push({
          code: "invalid_ai_eval",
          message: "AI eval blocks belong in Acceptance Criteria.",
          path
        });
      }
      const missingFields = ["id", "type", "evaluator"].filter(
        (field) => !String(aiEval[field as keyof ProductSpecAiEval] ?? "").trim()
      );
      if (missingFields.length) {
        errors.push({
          code: "invalid_ai_eval",
          message: `Invalid AI eval: missing ${missingFields.join(", ")}.`,
          path
        });
      }
      if (aiEval.id && !/^EVAL-[1-9]\d*$/.test(aiEval.id)) {
        errors.push({
          code: "invalid_ai_eval",
          message: "Invalid AI eval: id must use EVAL-<number>.",
          path
        });
      }
      addDuplicateItemIdError(errors, seenItemIds, aiEval.id, `${path}.id`);
      if (aiEval.type && !AI_EVAL_TYPES.includes(aiEval.type as AiEvalType)) {
        errors.push({
          code: "invalid_ai_eval",
          message: `Invalid AI eval: type must be one of ${AI_EVAL_TYPES.join(", ")}.`,
          path
        });
      }
      if (aiEval.evaluator && !AI_EVAL_EVALUATORS.includes(aiEval.evaluator as AiEvalEvaluator)) {
        errors.push({
          code: "invalid_ai_eval",
          message: `Invalid AI eval: evaluator must be one of ${AI_EVAL_EVALUATORS.join(", ")}.`,
          path
        });
      }
      if (!Number.isFinite(aiEval.pass_threshold) || aiEval.pass_threshold <= 0 || aiEval.pass_threshold > 1) {
        errors.push({
          code: "invalid_ai_eval",
          message: "Invalid AI eval: pass_threshold must be a number greater than 0 and less than or equal to 1.",
          path
        });
      }
      if (
        !aiEval.cases.length ||
        aiEval.cases.some((testCase) => !testCase.input.trim() || !testCase.expected.trim())
      ) {
        errors.push({
          code: "invalid_ai_eval",
          message: "Invalid AI eval: cases must include at least one item with non-empty input and expected values.",
          path
        });
      }
      if (aiEval.checks.some((check) => !check.trim())) {
        errors.push({
          code: "invalid_ai_eval",
          message: "Invalid AI eval: checks must be non-empty when provided.",
          path
        });
      }
      if (aiEval.checks.some((check) => /^id\s*:/i.test(check.trim()))) {
        errors.push({
          code: "invalid_ai_eval",
          message: "Invalid AI eval: checks do not use standalone IDs.",
          path
        });
      }
    }

    for (const [index, metric] of (section.success_metrics ?? []).entries()) {
      const path = `sections.${section.id}.success_metrics.${index}`;
      if (section.id !== "success_metrics") {
        errors.push({
          code: "invalid_success_metric",
          message: "Structured success metric blocks belong in Success Metrics.",
          path
        });
      }
      const missingFields = ["id", "metric", "target", "window"].filter(
        (field) => !String(metric[field as keyof ProductSpecSuccessMetric] ?? "").trim()
      );
      if (missingFields.length) {
        errors.push({
          code: "invalid_success_metric",
          message: `Invalid success metric: missing ${missingFields.join(", ")}.`,
          path
        });
      }
      if (metric.id && !/^SM-[1-9]\d*$/.test(metric.id)) {
        errors.push({
          code: "invalid_success_metric",
          message: "Invalid success metric: id must use SM-<number>.",
          path
        });
      }
      addDuplicateItemIdError(errors, seenItemIds, metric.id, `${path}.id`);
      if (!["committed", "provisional"].includes(metric.target_status)) {
        errors.push({
          code: "invalid_success_metric",
          message: "Invalid success metric: target_status must be committed or provisional.",
          path
        });
      }
      if (metric.target_status === "provisional" && !metric.target_owner?.trim()) {
        errors.push({
          code: "invalid_success_metric",
          message: "Invalid success metric: provisional targets require target_owner.",
          path
        });
      }
    }

    if (section.id === "success_metrics" && !section.success_metrics?.length) {
      errors.push({
        code: "invalid_success_metric",
        message: "Invalid success metric: include at least one productspec-success-metrics item.",
        path: "sections.success_metrics.success_metrics"
      });
    }

    for (const [index, artifact] of (section.related_artifacts ?? []).entries()) {
      const path = `sections.${section.id}.related_artifacts.${index}`;
      if (section.id !== "related_artifacts") {
        errors.push({
          code: "invalid_related_artifact",
          message: "Related artifact blocks belong in Related Artifacts.",
          path
        });
      }
      const requiredFields = artifact.type === "product_spec" ? ["type", "product_spec_path"] : ["type", "url"];
      const missingFields = requiredFields.filter(
        (field) => !String(artifact[field as keyof ProductSpecRelatedArtifact] ?? "").trim()
      );
      if (missingFields.length) {
        errors.push({
          code: "invalid_related_artifact",
          message: `Invalid related artifact: missing ${missingFields.join(", ")}.`,
          path
        });
      }
      if (artifact.type && !RELATED_ARTIFACT_TYPES.includes(artifact.type as RelatedArtifactType)) {
        errors.push({
          code: "invalid_related_artifact",
          message: `Invalid related artifact: type must be one of ${RELATED_ARTIFACT_TYPES.join(", ")}.`,
          path
        });
      }
      if (artifact.url && artifact.type === "product_spec") {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: product_spec entries use product_spec_path, not url.",
          path
        });
      }
      if (artifact.product_spec_path && artifact.type !== "product_spec") {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: product_spec_path only applies to type product_spec.",
          path
        });
      }
      if (artifact.product_spec_revision !== undefined && artifact.type !== "product_spec") {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: product_spec_revision only applies to type product_spec.",
          path
        });
      }
      if (artifact.relation && artifact.type !== "product_spec") {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: relation only applies to type product_spec.",
          path
        });
      }
      if (artifact.product_spec_revision !== undefined && !positiveInteger(artifact.product_spec_revision)) {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: product_spec_revision must be a positive integer.",
          path
        });
      }
      if (artifact.relation && !RELATED_ARTIFACT_RELATIONS.includes(artifact.relation as RelatedArtifactRelation)) {
        errors.push({
          code: "invalid_related_artifact",
          message: `Invalid related artifact: relation must be one of ${RELATED_ARTIFACT_RELATIONS.join(", ")}.`,
          path
        });
      }
      if (artifact.section_id) {
        const validSection =
          CANONICAL_SECTION_IDS.includes(artifact.section_id as CanonicalSectionId) ||
          /^custom-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artifact.section_id);
        if (!validSection) {
          errors.push({
            code: "invalid_related_artifact",
            message: "Invalid related artifact: section_id must be canonical or custom-<kebab-name>.",
            path
          });
        }
      }
      if (artifact.item_id && !/^(AC|SM|EVAL)-[1-9]\d*$/.test(artifact.item_id)) {
        errors.push({
          code: "invalid_related_artifact",
          message: "Invalid related artifact: item_id must use AC-<number>, SM-<number>, or EVAL-<number>.",
          path
        });
      }
      if (artifact.item_id && /^(AC|SM|EVAL)-[1-9]\d*$/.test(artifact.item_id) && !knownItemIds.has(artifact.item_id)) {
        errors.push({
          code: "invalid_related_artifact",
          message: `Invalid related artifact: item_id ${artifact.item_id} does not match any Acceptance Criterion, Success Metric, or AI Eval.`,
          path
        });
      }
      const expectedPrefix = expectedItemIdPrefixForArtifact(artifact.type);
      if (artifact.item_id && expectedPrefix && !artifact.item_id.startsWith(`${expectedPrefix}-`)) {
        warnings.push({
          code: "unusual_related_artifact_target",
          message: `Related artifact type ${artifact.type} usually attaches to ${expectedPrefix}-<number>.`,
          path
        });
      }
    }
  }

  return { errors, warnings };
}

function isFragmentLikeScopeItem(item: string): boolean {
  const trimmed = item.trim();
  if (!trimmed) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 5) return false;
  return !/^(accept|add|allow|block|build|create|display|do|do not|enable|fetch|generate|hide|include|let|limit|prevent|reject|require|return|show|store|support|use|validate)\b/i.test(trimmed);
}

function expectedItemIdPrefixForArtifact(type?: string): "AC" | "EVAL" | "SM" | undefined {
  switch (type) {
    case "github_pr":
    case "code":
    case "release":
    case "engineering_spec":
      return "AC";
    case "eval_run":
      return "EVAL";
    case "dashboard":
    case "analytics_snapshot":
    case "experiment":
      return "SM";
    default:
      return undefined;
  }
}

function validateDecisionTraceValue(value: unknown): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) {
    return [{ code: "invalid_decision_trace", message: "Decision Trace must be a JSON object." }];
  }

  const requiredFields = [
    "decision_trace_format_version",
    "trace_id",
    "title",
    "created_at",
    "updated_at",
    "subject",
    "events"
  ];
  for (const field of requiredFields) {
    if (value[field] === undefined || value[field] === null || value[field] === "") {
      errors.push({
        code: "missing_required_trace_field",
        message: `Missing required Decision Trace field: ${field}`,
        path: field
      });
    }
  }

  if (value.decision_trace_format_version !== "0.1") {
    errors.push({
      code: "unsupported_trace_version",
      message: "Unsupported decision_trace_format_version.",
      path: "decision_trace_format_version"
    });
  }
  if (typeof value.trace_id === "string" && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value.trace_id)) {
    errors.push({
      code: "invalid_trace_id",
      message: "Invalid trace_id. Use lowercase words separated by hyphens or underscores.",
      path: "trace_id"
    });
  }
  for (const field of ["trace_id", "title", "created_at", "updated_at"] as const) {
    if (value[field] !== undefined && typeof value[field] !== "string") {
      errors.push({
        code: "invalid_trace_field",
        message: `Invalid Decision Trace field: ${field} must be a string.`,
        path: field
      });
    }
  }
  for (const field of ["created_at", "updated_at"] as const) {
    if (value[field] !== undefined && !isoDateTime(value[field])) {
      errors.push({
        code: "invalid_datetime",
        message: `Invalid Decision Trace date-time: ${field} must be ISO 8601.`,
        path: field
      });
    }
  }

  errors.push(...validateDecisionTraceSubject(value.subject));
  if (!Array.isArray(value.events) || value.events.length === 0) {
    errors.push({
      code: "invalid_trace_events",
      message: "Decision Trace events must include at least one event.",
      path: "events"
    });
  } else {
    const seenEventIds = new Set<string>();
    for (const [index, event] of value.events.entries()) {
      errors.push(...validateDecisionTraceEvent(event, `events.${index}`));
      if (isRecord(event) && typeof event.event_id === "string") {
        if (seenEventIds.has(event.event_id)) {
          errors.push({
            code: "duplicate_trace_event_id",
            message: `Duplicate Decision Trace event_id: ${event.event_id}.`,
            path: `events.${index}.event_id`
          });
        }
        seenEventIds.add(event.event_id);
      }
    }
  }
  return errors;
}

function validateDecisionTraceSubject(value: unknown): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) {
    return [{ code: "invalid_trace_subject", message: "Decision Trace subject must be an object.", path: "subject" }];
  }
  for (const field of ["type", "id"] as const) {
    if (!nonEmptyString(value[field])) {
      errors.push({
        code: "missing_required_trace_field",
        message: `Missing required Decision Trace subject field: ${field}`,
        path: `subject.${field}`
      });
    }
  }
  if (value.type && !DECISION_TRACE_SUBJECT_TYPES.includes(value.type as DecisionTraceSubjectType)) {
    errors.push({
      code: "invalid_trace_subject",
      message: `Invalid Decision Trace subject type: ${String(value.type)}`,
      path: "subject.type"
    });
  }
  if (value.product_spec_revision !== undefined && !positiveInteger(value.product_spec_revision)) {
    errors.push({
      code: "invalid_trace_revision",
      message: "Decision Trace product_spec_revision must be a positive integer.",
      path: "subject.product_spec_revision"
    });
  }
  return errors;
}

function validateDecisionTraceEvent(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) {
    return [{ code: "invalid_trace_event", message: "Decision Trace event must be an object.", path }];
  }
  for (const field of ["event_id", "event_type", "occurred_at", "summary", "decision"] as const) {
    if (value[field] === undefined || value[field] === null || value[field] === "") {
      errors.push({
        code: "missing_required_trace_field",
        message: `Missing required Decision Trace event field: ${field}`,
        path: `${path}.${field}`
      });
    }
  }
  if (typeof value.event_id === "string" && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value.event_id)) {
    errors.push({
      code: "invalid_trace_event",
      message: "Invalid event_id. Use lowercase words separated by hyphens or underscores.",
      path: `${path}.event_id`
    });
  }
  if (value.event_type && !DECISION_TRACE_EVENT_TYPES.includes(value.event_type as DecisionTraceEventType)) {
    errors.push({
      code: "invalid_trace_event",
      message: `Invalid event_type: ${String(value.event_type)}`,
      path: `${path}.event_type`
    });
  }
  if (value.occurred_at !== undefined && !isoDateTime(value.occurred_at)) {
    errors.push({
      code: "invalid_datetime",
      message: "Invalid Decision Trace date-time: occurred_at must be ISO 8601.",
      path: `${path}.occurred_at`
    });
  }
  if (value.source !== undefined) errors.push(...validateDecisionTraceSource(value.source, `${path}.source`));
  if (value.drift !== undefined && !isRecord(value.drift)) {
    errors.push({ code: "invalid_trace_drift", message: "Decision Trace drift must be an object.", path: `${path}.drift` });
  }
  errors.push(...validateDecisionTraceDecision(value.decision, `${path}.decision`));
  if (value.result !== undefined) errors.push(...validateDecisionTraceResult(value.result, `${path}.result`));
  return errors;
}

function validateDecisionTraceSource(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_trace_source", message: "Decision Trace source must be an object.", path }];
  if (value.product_spec_revision !== undefined && !positiveInteger(value.product_spec_revision)) {
    errors.push({
      code: "invalid_trace_revision",
      message: "Decision Trace product_spec_revision must be a positive integer.",
      path: `${path}.product_spec_revision`
    });
  }
  if (value.links !== undefined) errors.push(...validateDecisionTraceLinks(value.links, `${path}.links`));
  return errors;
}

function validateDecisionTraceDecision(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_trace_decision", message: "Decision Trace decision must be an object.", path }];
  for (const field of ["outcome", "rationale"] as const) {
    if (!nonEmptyString(value[field])) {
      errors.push({
        code: "missing_required_trace_field",
        message: `Missing required Decision Trace decision field: ${field}`,
        path: `${path}.${field}`
      });
    }
  }
  if (value.outcome && !DECISION_TRACE_OUTCOMES.includes(value.outcome as DecisionTraceOutcome)) {
    errors.push({
      code: "invalid_trace_decision",
      message: `Invalid decision outcome: ${String(value.outcome)}`,
      path: `${path}.outcome`
    });
  }
  if (value.approved_by !== undefined && (!Array.isArray(value.approved_by) || value.approved_by.some((item) => !nonEmptyString(item)))) {
    errors.push({
      code: "invalid_trace_decision",
      message: "Decision Trace approved_by must be an array of non-empty strings.",
      path: `${path}.approved_by`
    });
  }
  return errors;
}

function validateDecisionTraceResult(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_trace_result", message: "Decision Trace result must be an object.", path }];
  if (value.new_product_spec_revision !== undefined && !positiveInteger(value.new_product_spec_revision)) {
    errors.push({
      code: "invalid_trace_revision",
      message: "Decision Trace new_product_spec_revision must be a positive integer.",
      path: `${path}.new_product_spec_revision`
    });
  }
  if (value.linked_artifacts !== undefined) errors.push(...validateDecisionTraceLinks(value.linked_artifacts, `${path}.linked_artifacts`));
  return errors;
}

function validateDecisionTraceLinks(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  const linkTypes: readonly string[] = RELATED_ARTIFACT_TYPES;
  if (!Array.isArray(value)) {
    return [{ code: "invalid_trace_link", message: "Decision Trace links must be an array.", path }];
  }
  for (const [index, link] of value.entries()) {
    const linkPath = `${path}.${index}`;
    if (!isRecord(link)) {
      errors.push({ code: "invalid_trace_link", message: "Decision Trace link must be an object.", path: linkPath });
      continue;
    }
    for (const field of ["type", "url"] as const) {
      if (!nonEmptyString(link[field])) {
        errors.push({
          code: "missing_required_trace_field",
          message: `Missing required Decision Trace link field: ${field}`,
          path: `${linkPath}.${field}`
        });
      }
    }
    if (link.type && !linkTypes.includes(String(link.type))) {
      errors.push({
        code: "invalid_trace_link",
        message: `Invalid Decision Trace link type: ${String(link.type)}`,
        path: `${linkPath}.type`
      });
    }
  }
  return errors;
}

function validateAgentRunValue(value: unknown): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) {
    return [{ code: "invalid_agent_run", message: "Agent Run must be a JSON object." }];
  }

  const requiredFields = [
    "agent_run_format_version",
    "run_id",
    "agent",
    "product_spec",
    "started_at",
    "status",
    "checked_items",
    "drift"
  ];
  for (const field of requiredFields) {
    if (value[field] === undefined || value[field] === null || value[field] === "") {
      errors.push({
        code: "missing_required_agent_run_field",
        message: `Missing required Agent Run field: ${field}`,
        path: field
      });
    }
  }

  if (value.agent_run_format_version !== "0.1") {
    errors.push({
      code: "unsupported_agent_run_version",
      message: "Unsupported agent_run_format_version.",
      path: "agent_run_format_version"
    });
  }
  if (typeof value.run_id === "string" && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value.run_id)) {
    errors.push({
      code: "invalid_agent_run_id",
      message: "Invalid run_id. Use lowercase words separated by hyphens or underscores.",
      path: "run_id"
    });
  }
  if (value.started_at !== undefined && !isoDateTime(value.started_at)) {
    errors.push({
      code: "invalid_datetime",
      message: "Invalid Agent Run date-time: started_at must be ISO 8601.",
      path: "started_at"
    });
  }
  if (value.completed_at !== undefined && !isoDateTime(value.completed_at)) {
    errors.push({
      code: "invalid_datetime",
      message: "Invalid Agent Run date-time: completed_at must be ISO 8601.",
      path: "completed_at"
    });
  }
  if (value.status && !AGENT_RUN_STATUSES.includes(value.status as AgentRunStatus)) {
    errors.push({
      code: "invalid_agent_run_status",
      message: `Invalid Agent Run status: ${String(value.status)}`,
      path: "status"
    });
  }

  errors.push(...validateAgentRunAgent(value.agent, "agent"));
  errors.push(...validateAgentRunProductSpec(value.product_spec, "product_spec"));
  errors.push(...validateAgentRunCheckedItems(value.checked_items, "checked_items"));
  errors.push(...validateAgentRunDrift(value.drift, "drift"));
  return errors;
}

function validateAgentRunAgent(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_agent_run_agent", message: "Agent Run agent must be an object.", path }];
  if (!nonEmptyString(value.name)) {
    errors.push({
      code: "missing_required_agent_run_field",
      message: "Missing required Agent Run agent field: name",
      path: `${path}.name`
    });
  }
  if (value.version !== undefined && !nonEmptyString(value.version)) {
    errors.push({ code: "invalid_agent_run_agent", message: "Agent Run agent version must be a non-empty string.", path: `${path}.version` });
  }
  return errors;
}

function validateAgentRunProductSpec(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_agent_run_product_spec", message: "Agent Run product_spec must be an object.", path }];
  if (!nonEmptyString(value.path)) {
    errors.push({
      code: "missing_required_agent_run_field",
      message: "Missing required Agent Run product_spec field: path",
      path: `${path}.path`
    });
  }
  if (!positiveInteger(value.spec_revision)) {
    errors.push({
      code: "invalid_agent_run_revision",
      message: "Agent Run product_spec spec_revision must be a positive integer.",
      path: `${path}.spec_revision`
    });
  }
  if (value.content_hash !== undefined && !nonEmptyString(value.content_hash)) {
    errors.push({ code: "invalid_agent_run_product_spec", message: "Agent Run content_hash must be a non-empty string.", path: `${path}.content_hash` });
  }
  return errors;
}

function validateAgentRunCheckedItems(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!Array.isArray(value)) return [{ code: "invalid_agent_run_item", message: "Agent Run checked_items must be an array.", path }];
  const seenItemIds = new Set<string>();
  for (const [index, item] of value.entries()) {
    const itemPath = `${path}.${index}`;
    if (!isRecord(item)) {
      errors.push({ code: "invalid_agent_run_item", message: "Agent Run checked item must be an object.", path: itemPath });
      continue;
    }
    if (!nonEmptyString(item.item_id)) {
      errors.push({
        code: "missing_required_agent_run_field",
        message: "Missing required Agent Run checked item field: item_id",
        path: `${itemPath}.item_id`
      });
    } else if (!/^(AC|EVAL|SM)-[1-9]\d*$/.test(item.item_id)) {
      errors.push({
        code: "invalid_agent_run_item",
        message: "Agent Run checked item id must reference AC-<number>, EVAL-<number>, or SM-<number>.",
        path: `${itemPath}.item_id`
      });
    } else if (seenItemIds.has(item.item_id)) {
      errors.push({
        code: "duplicate_agent_run_item_id",
        message: `Duplicate Agent Run checked item id: ${item.item_id}.`,
        path: `${itemPath}.item_id`
      });
    } else {
      seenItemIds.add(item.item_id);
    }
    if (!nonEmptyString(item.status)) {
      errors.push({
        code: "missing_required_agent_run_field",
        message: "Missing required Agent Run checked item field: status",
        path: `${itemPath}.status`
      });
    } else if (!AGENT_RUN_ITEM_STATUSES.includes(item.status as AgentRunItemStatus)) {
      errors.push({
        code: "invalid_agent_run_item",
        message: `Invalid Agent Run checked item status: ${String(item.status)}`,
        path: `${itemPath}.status`
      });
    }
    if (item.evidence !== undefined) errors.push(...validateDecisionTraceLinks(item.evidence, `${itemPath}.evidence`));
    if (item.notes !== undefined && !nonEmptyString(item.notes)) {
      errors.push({ code: "invalid_agent_run_item", message: "Agent Run checked item notes must be a non-empty string.", path: `${itemPath}.notes` });
    }
  }
  return errors;
}

function validateAgentRunDrift(value: unknown, path: string): ProductSpecValidationError[] {
  const errors: ProductSpecValidationError[] = [];
  if (!isRecord(value)) return [{ code: "invalid_agent_run_drift", message: "Agent Run drift must be an object.", path }];
  if (typeof value.detected !== "boolean") {
    errors.push({
      code: "missing_required_agent_run_field",
      message: "Missing required Agent Run drift field: detected",
      path: `${path}.detected`
    });
  }
  if (value.decision_trace_path !== undefined && !nonEmptyString(value.decision_trace_path)) {
    errors.push({ code: "invalid_agent_run_drift", message: "Agent Run decision_trace_path must be a non-empty string.", path: `${path}.decision_trace_path` });
  }
  if (value.summary !== undefined && !nonEmptyString(value.summary)) {
    errors.push({ code: "invalid_agent_run_drift", message: "Agent Run drift summary must be a non-empty string.", path: `${path}.summary` });
  }
  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isoDateTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
}

function addDuplicateItemIdError(
  errors: ProductSpecValidationError[],
  seenItemIds: Set<string>,
  id: string,
  path: string
) {
  if (!id) return;
  if (seenItemIds.has(id)) {
    errors.push({
      code: "duplicate_item_id",
      message: `Duplicate Product Spec item id: ${id}.`,
      path
    });
    return;
  }
  seenItemIds.add(id);
}

function positiveInteger(value: unknown): boolean {
  return Number.isInteger(value) && Number(value) >= 1;
}

const KNOWN_FRONTMATTER_KEYS = new Set([
  "spec_format_version",
  "title",
  "artifact_type",
  "spec_revision",
  "author",
  "created_at",
  "updated_at",
  "linked_github_repo",
  "applies_to",
  "custom_sections",
  "tool_metadata"
]);

function parseFrontmatter(raw: string): {
  frontmatter: ProductSpecFrontmatter;
  parser_metadata?: ProductSpecDocument["parser_metadata"];
} {
  const lines = raw.split("\n");
  const result: Record<string, unknown> = {};
  const unknownFrontmatter: string[] = [];
  let customSections: Array<{ id: string; label: string; after: string }> | undefined;
  let appliesTo: ProductSpecAppliesTo[] | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (line.startsWith("applies_to:")) {
      appliesTo = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        const item: Record<string, string> = {};
        const first = lines[index].replace(/^  - /, "");
        assignKeyValue(item, first);
        while (lines[index + 1]?.startsWith("    ")) {
          index += 1;
          assignKeyValue(item, lines[index].trim());
        }
        appliesTo.push({
          ...(item.path !== undefined ? { path: item.path } : {}),
          ...(item.component !== undefined ? { component: item.component } : {})
        });
      }
      result.applies_to = appliesTo;
      continue;
    }
    if (line.startsWith("custom_sections:")) {
      customSections = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        const item: Record<string, string> = {};
        const first = lines[index].replace(/^  - /, "");
        assignKeyValue(item, first);
        while (lines[index + 1]?.startsWith("    ")) {
          index += 1;
          assignKeyValue(item, lines[index].trim());
        }
        customSections.push({
          id: item.id,
          label: item.label,
          after: item.after
        });
      }
      result.custom_sections = customSections;
      continue;
    }
    if (line.startsWith("tool_metadata:")) {
      const metadata: Record<string, string> = {};
      while (lines[index + 1]?.startsWith("  ")) {
        index += 1;
        assignKeyValue(metadata, lines[index].trim());
      }
      result.tool_metadata = metadata;
      continue;
    }
    const key = frontmatterKey(line);
    if (key && !KNOWN_FRONTMATTER_KEYS.has(key)) {
      const block = [line];
      while (lines[index + 1] !== undefined && /^[ \t]/.test(lines[index + 1]) && lines[index + 1].trim()) {
        index += 1;
        block.push(lines[index]);
      }
      unknownFrontmatter.push(block.join("\n"));
      continue;
    }
    assignKeyValue(result, line);
  }

  if (result.spec_format_version !== "0.1") throw new Error("Unsupported spec_format_version.");
  if (!result.title || !result.artifact_type || !result.author || !result.created_at || !result.updated_at) {
    throw new Error("Missing required Product Spec frontmatter.");
  }
  if (!["hypothesis", "prd", "openspec_proposal"].includes(String(result.artifact_type))) {
    throw new Error("Unsupported artifact_type.");
  }
  if (result.spec_revision !== undefined) {
    const revision = Number(result.spec_revision);
    if (!Number.isInteger(revision) || revision < 1) {
      throw new Error("Invalid spec_revision. Use a positive integer.");
    }
    result.spec_revision = revision;
  }

  return {
    frontmatter: result as unknown as ProductSpecFrontmatter,
    ...(unknownFrontmatter.length
      ? { parser_metadata: { unknown_frontmatter: unknownFrontmatter } }
      : {})
  };
}

function frontmatterKey(line: string): string | undefined {
  return /^("[^"]*"|'[^']*'|[^\s:#][^:]*?):/.exec(line)?.[1];
}

function assignKeyValue(target: Record<string, unknown>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) return;
  target[match[1]] = unquote(match[2]);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function fencedRanges(body: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const openPattern = /^ {0,3}(`{3,}|~{3,})/;
  let offset = 0;
  let openMarker: string | null = null;
  let openStart = 0;

  for (const line of body.split("\n")) {
    const fence = openPattern.exec(line);
    if (openMarker === null) {
      if (fence) {
        openMarker = fence[1];
        openStart = offset;
      }
    } else if (
      fence &&
      fence[1][0] === openMarker[0] &&
      fence[1].length >= openMarker.length &&
      line.slice(fence[0].length).trim() === ""
    ) {
      ranges.push([openStart, offset + line.length]);
      openMarker = null;
    }
    offset += line.length + 1;
  }

  if (openMarker !== null) {
    ranges.push([openStart, body.length]);
  }
  return ranges;
}

function parseSections(
  body: string,
  customSections: Array<{ id: string; label: string }>
): ProductSpecSection[] {
  const headingPattern = /^##\s+(.+)$/gm;
  const fenced = fencedRanges(body);
  const matches = [...body.matchAll(headingPattern)].filter((match) => {
    const index = match.index ?? 0;
    return !fenced.some(([start, end]) => index >= start && index < end);
  });
  return matches.map((match, index) => {
    const label = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    const id = sectionIdForLabel(label, customSections);
    const content = body.slice(start, end).trim();
    const scope = parseScopeBlock(content);
    const acceptance_criteria = parseAcceptanceCriterionBlocks(content);
    const ai_evals = parseAiEvalBlocks(content);
    const success_metrics = parseSuccessMetricBlocks(content);
    const related_artifacts = parseRelatedArtifactBlocks(content);
    return {
      id,
      label,
      content,
      ...(scope ? { scope } : {}),
      ...(acceptance_criteria.length ? { acceptance_criteria } : {}),
      ...(ai_evals.length ? { ai_evals } : {}),
      ...(success_metrics.length ? { success_metrics } : {}),
      ...(related_artifacts.length ? { related_artifacts } : {})
    };
  });
}

function parseScopeBlock(content: string): ProductSpecScope | undefined {
  const blocks = productSpecBlocks(content, "productspec-scope");
  if (!blocks.length) return undefined;

  const scope: ProductSpecScope = { in: [], out: [], cut: [] };
  for (const block of blocks) {
    let category: keyof ProductSpecScope | undefined;
    for (const line of block.split("\n")) {
      if (!line.trim()) continue;
      const categoryMatch = /^(in|out|cut):$/.exec(line.trim());
      if (categoryMatch) {
        category = categoryMatch[1] as keyof ProductSpecScope;
        continue;
      }
      if (category && line.startsWith("  - ")) {
        scope[category].push(unquote(line.replace(/^  - /, "")));
        continue;
      }
      throw new Error(`Invalid structured scope block line: ${line}`);
    }
  }
  return scope;
}

function parseAcceptanceCriterionBlocks(content: string): ProductSpecAcceptanceCriterion[] {
  return productSpecBlocks(content, "productspec-acceptance-criteria").flatMap((block) =>
    parseAcceptanceCriterionList(block)
  );
}

function parseAcceptanceCriterionList(raw: string): ProductSpecAcceptanceCriterion[] {
  const criteria: Array<Partial<ProductSpecAcceptanceCriterion>> = [];
  let current: Partial<ProductSpecAcceptanceCriterion> | undefined;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("- ")) {
      current = {};
      criteria.push(current);
      assignAcceptanceCriterionValue(current, line.slice(2));
      continue;
    }
    if (!current) throw new Error("Invalid acceptance criterion block: expected list item.");
    if (line.startsWith("  ")) {
      assignAcceptanceCriterionValue(current, line.trim());
      continue;
    }
    throw new Error(`Invalid acceptance criterion block line: ${line}`);
  }

  return criteria.map((criterion) => ({
    id: String(criterion.id ?? ""),
    criterion: String(criterion.criterion ?? "")
  }));
}

function assignAcceptanceCriterionValue(target: Partial<ProductSpecAcceptanceCriterion>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid acceptance criterion block line: ${line}`);
  const key = match[1] as keyof ProductSpecAcceptanceCriterion;
  if (!["id", "criterion"].includes(key)) {
    throw new Error(`Invalid acceptance criterion field: ${key}`);
  }
  target[key] = unquote(match[2]) as never;
}

function parseAiEvalBlocks(content: string): ProductSpecAiEval[] {
  return productSpecBlocks(content, "productspec-ai-evals").flatMap((block) => parseAiEvalList(block));
}

function parseAiEvalList(raw: string): ProductSpecAiEval[] {
  const evals: Array<Partial<ProductSpecAiEval>> = [];
  let current: Partial<ProductSpecAiEval> | undefined;
  let inChecks = false;
  let inCases = false;
  let currentCase: { input: string; expected: string } | undefined;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("- ")) {
      current = {};
      evals.push(current);
      assignAiEvalValue(current, line.slice(2));
      inChecks = false;
      inCases = false;
      currentCase = undefined;
      continue;
    }
    if (!current) throw new Error("Invalid AI eval block: expected list item.");
    if (line.trim() === "cases:") {
      current.cases = [];
      inCases = true;
      inChecks = false;
      currentCase = undefined;
      continue;
    }
    if (line.trim() === "checks:") {
      current.checks = [];
      inChecks = true;
      inCases = false;
      currentCase = undefined;
      continue;
    }
    if (inCases && line.startsWith("    - ")) {
      currentCase = { input: "", expected: "" };
      current.cases = [...(current.cases ?? []), currentCase];
      assignAiEvalCaseValue(currentCase, line.replace(/^    - /, ""));
      continue;
    }
    if (inCases && currentCase && line.startsWith("      ")) {
      assignAiEvalCaseValue(currentCase, line.trim());
      continue;
    }
    if (inChecks && line.startsWith("    - ")) {
      current.checks = [...(current.checks ?? []), unquote(line.replace(/^    - /, ""))];
      continue;
    }
    if (line.startsWith("  ")) {
      assignAiEvalValue(current, line.trim());
      inChecks = false;
      continue;
    }
    throw new Error(`Invalid AI eval block line: ${line}`);
  }

  return evals.map((aiEval) => ({
    id: String(aiEval.id ?? ""),
    type: String(aiEval.type ?? "") as AiEvalType,
    evaluator: String(aiEval.evaluator ?? "") as AiEvalEvaluator,
    pass_threshold: Number(aiEval.pass_threshold),
    cases: aiEval.cases ?? [],
    checks: aiEval.checks ?? []
  }));
}

function assignAiEvalCaseValue(target: { input: string; expected: string }, line: string) {
  const match = /^(input|expected):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid AI eval case line: ${line}`);
  target[match[1] as "input" | "expected"] = unquote(match[2]);
}

function assignAiEvalValue(target: Partial<ProductSpecAiEval>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid AI eval block line: ${line}`);
  const key = match[1] as keyof ProductSpecAiEval;
  if (key === "pass_threshold") {
    target.pass_threshold = Number(unquote(match[2]));
    return;
  }
  if (key === "checks") {
    target.checks = [];
    return;
  }
  target[key] = unquote(match[2]) as never;
}

function parseSuccessMetricBlocks(content: string): ProductSpecSuccessMetric[] {
  return productSpecBlocks(content, "productspec-success-metrics").flatMap((block) => parseSuccessMetricList(block));
}

function parseSuccessMetricList(raw: string): ProductSpecSuccessMetric[] {
  const metrics: Array<Partial<ProductSpecSuccessMetric>> = [];
  let current: Partial<ProductSpecSuccessMetric> | undefined;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("- ")) {
      current = {};
      metrics.push(current);
      assignSuccessMetricValue(current, line.slice(2));
      continue;
    }
    if (!current) throw new Error("Invalid success metric block: expected list item.");
    if (line.startsWith("  ")) {
      assignSuccessMetricValue(current, line.trim());
      continue;
    }
    throw new Error(`Invalid success metric block line: ${line}`);
  }

  return metrics.map((metric) => ({
    id: String(metric.id ?? ""),
    metric: String(metric.metric ?? ""),
    target: String(metric.target ?? ""),
    target_status: (String(metric.target_status ?? "committed") === "provisional"
      ? "provisional"
      : String(metric.target_status ?? "committed")) as ProductSpecSuccessMetric["target_status"],
    ...(metric.target_owner ? { target_owner: String(metric.target_owner) } : {}),
    window: String(metric.window ?? "")
  }));
}

function assignSuccessMetricValue(target: Partial<ProductSpecSuccessMetric>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid success metric block line: ${line}`);
  const key = match[1] as keyof ProductSpecSuccessMetric;
  if (!["id", "metric", "target", "target_status", "target_owner", "window"].includes(key)) {
    throw new Error(`Invalid success metric field: ${key}`);
  }
  target[key] = unquote(match[2]) as never;
}

function parseRelatedArtifactBlocks(content: string): ProductSpecRelatedArtifact[] {
  return productSpecBlocks(content, "productspec-related-artifacts").flatMap((block) =>
    parseRelatedArtifactList(block)
  );
}

function productSpecBlocks(content: string, info: string): string[] {
  const blocks: string[] = [];
  const lines = content.split("\n");
  let openFence: string | undefined;
  let body: string[] = [];

  for (const line of lines) {
    if (!openFence) {
      const open = /^ {0,3}(`{3,}|~{3,})([A-Za-z0-9_-]+)[ \t]*$/.exec(line);
      if (open?.[2] === info) {
        openFence = open[1];
        body = [];
      }
      continue;
    }

    const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
    if (close && close[1][0] === openFence[0] && close[1].length >= openFence.length) {
      blocks.push(body.join("\n"));
      openFence = undefined;
      body = [];
      continue;
    }

    body.push(line);
  }

  return blocks;
}

function parseRelatedArtifactList(raw: string): ProductSpecRelatedArtifact[] {
  const artifacts: Array<Partial<ProductSpecRelatedArtifact>> = [];
  let current: Partial<ProductSpecRelatedArtifact> | undefined;

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("- ")) {
      current = {};
      artifacts.push(current);
      assignRelatedArtifactValue(current, line.slice(2));
      continue;
    }
    if (!current) throw new Error("Invalid related artifact block: expected list item.");
    if (line.startsWith("  ")) {
      assignRelatedArtifactValue(current, line.trim());
      continue;
    }
    throw new Error(`Invalid related artifact block line: ${line}`);
  }

  return artifacts.map((artifact) => ({
    type: String(artifact.type ?? "") as RelatedArtifactType,
    ...(artifact.url ? { url: String(artifact.url) } : {}),
    ...(artifact.title ? { title: String(artifact.title) } : {}),
    ...(artifact.section_id ? { section_id: String(artifact.section_id) } : {}),
    ...(artifact.item_id ? { item_id: String(artifact.item_id) } : {}),
    ...(artifact.product_spec_path ? { product_spec_path: String(artifact.product_spec_path) } : {}),
    ...(artifact.product_spec_revision !== undefined
      ? { product_spec_revision: Number(artifact.product_spec_revision) }
      : {}),
    ...(artifact.relation
      ? { relation: String(artifact.relation) as RelatedArtifactRelation }
      : artifact.type === "product_spec"
        ? { relation: "relates_to" as const }
        : {})
  }));
}

function assignRelatedArtifactValue(target: Partial<ProductSpecRelatedArtifact>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid related artifact block line: ${line}`);
  const key = match[1] as keyof ProductSpecRelatedArtifact;
  if (!["type", "url", "title", "section_id", "item_id", "product_spec_path", "product_spec_revision", "relation"].includes(key)) {
    throw new Error(`Invalid related artifact field: ${key}`);
  }
  target[key] = unquote(match[2]) as never;
}

function sectionIdForLabel(label: string, customSections: Array<{ id: string; label: string }>): string {
  const custom = customSections.find((section) => section.label === label);
  if (custom) return custom.id;

  const normalized = label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (normalized === "ai_details") return "ai";
  if (CANONICAL_SECTION_IDS.includes(normalized as CanonicalSectionId)) return normalized;
  return `custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function serializeFrontmatter(
  frontmatter: ProductSpecFrontmatter,
  parserMetadata?: ProductSpecDocument["parser_metadata"]
): string {
  let output = "";
  for (const key of ["spec_format_version", "title", "artifact_type", "spec_revision", "author", "created_at", "updated_at", "linked_github_repo"] as const) {
    const value = frontmatter[key];
    if (value === undefined || value === "") continue;
    output += typeof value === "number" ? `${key}: ${value}\n` : `${key}: "${value}"\n`;
  }
  if (frontmatter.applies_to?.length) {
    output += "applies_to:\n";
    for (const item of frontmatter.applies_to) {
      if ("path" in item) output += `  - path: "${item.path}"\n`;
      if ("component" in item) output += `  - component: "${item.component}"\n`;
    }
  }
  if (frontmatter.custom_sections?.length) {
    output += "custom_sections:\n";
    for (const section of frontmatter.custom_sections) {
      output += `  - id: "${section.id}"\n`;
      output += `    label: "${section.label}"\n`;
      output += `    after: "${section.after}"\n`;
    }
  }
  if (frontmatter.tool_metadata && Object.keys(frontmatter.tool_metadata).length) {
    output += "tool_metadata:\n";
    for (const [key, value] of Object.entries(frontmatter.tool_metadata)) {
      output += `  ${key}: "${value}"\n`;
    }
  }
  for (const block of parserMetadata?.unknown_frontmatter ?? []) {
    output += `${block}\n`;
  }
  return output;
}

export interface ProductSpecGraphInput {
  path: string;
  document: ProductSpecDocument;
}

export interface ProductSpecGraphEdge {
  from: string;
  to: string;
  relation: RelatedArtifactRelation;
  product_spec_revision?: number;
}

export interface ProductSpecGraphBlockedNode {
  path: string;
  waits_on: string[];
}

export interface ProductSpecGraphWarning {
  code: string;
  message: string;
  path: string;
}

export interface ProductSpecGraphContention {
  kind: "path" | "component";
  value: string;
  specs: string[];
}

export interface ProductSpecGraph {
  buildable: string[];
  blocked: ProductSpecGraphBlockedNode[];
  order: string[];
  waves: string[][];
  contention: ProductSpecGraphContention[];
  /**
   * Live specs that declare no `applies_to`. The graph cannot reason about a
   * surface a spec never names, so these carry no contention and land in the
   * earliest wave their dependencies allow. A fleet should read this as unknown
   * scope, not as safe scope.
   */
  unscoped: string[];
  edges: ProductSpecGraphEdge[];
  warnings: ProductSpecGraphWarning[];
}

function normalizeSpecPath(path: string): string {
  const segments: string[] = [];
  for (const segment of path.split(/[\\/]+/)) {
    if (!segment || segment === ".") continue;
    if (segment === ".." && segments.length && segments[segments.length - 1] !== "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join("/");
}

function resolveLinkTarget(fromPath: string, link: string): string {
  const cleanLink = link.replace(/\\/g, "/");
  if (cleanLink.startsWith("./") || cleanLink.startsWith("../")) {
    const fromDir = normalizeSpecPath(fromPath).split("/").slice(0, -1).join("/");
    return normalizeSpecPath(fromDir ? `${fromDir}/${cleanLink}` : cleanLink);
  }
  return normalizeSpecPath(cleanLink);
}

function findDependencyCycles(waitsOn: Map<string, Set<string>>): string[][] {
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  let counter = 0;

  function connect(node: string): void {
    index.set(node, counter);
    lowlink.set(node, counter);
    counter += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of waitsOn.get(node) ?? []) {
      if (!waitsOn.has(next)) continue;
      if (!index.has(next)) {
        connect(next);
        lowlink.set(node, Math.min(lowlink.get(node) as number, lowlink.get(next) as number));
      } else if (onStack.has(next)) {
        lowlink.set(node, Math.min(lowlink.get(node) as number, index.get(next) as number));
      }
    }

    if (lowlink.get(node) === index.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop() as string;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      if (component.length > 1) cycles.push(component.reverse());
    }
  }

  for (const node of waitsOn.keys()) {
    if (!index.has(node)) connect(node);
  }
  return cycles;
}

export function resolveProductSpecGraph(inputs: ProductSpecGraphInput[]): ProductSpecGraph {
  const warnings: ProductSpecGraphWarning[] = [];
  const nodes = new Map<string, ProductSpecGraphInput>();

  for (const input of inputs) {
    const path = normalizeSpecPath(input.path);
    if (nodes.has(path)) {
      warnings.push({
        code: "duplicate_spec_path",
        message: `Duplicate spec path: ${path}. The first occurrence stays in the graph.`,
        path
      });
      continue;
    }
    nodes.set(path, input);
  }

  const edges: ProductSpecGraphEdge[] = [];
  for (const [path, input] of nodes) {
    for (const section of input.document.sections) {
      for (const artifact of section.related_artifacts ?? []) {
        if (artifact.type !== "product_spec" || !artifact.product_spec_path) continue;
        const relation = artifact.relation ?? "relates_to";
        if (/^(?:[a-zA-Z]:)?[\\/]/.test(artifact.product_spec_path)) {
          warnings.push({
            code: "unsupported_link_path",
            message: `${path} declares ${relation} on ${artifact.product_spec_path}. Absolute paths are not supported; use a path relative to the spec file.`,
            path
          });
          continue;
        }
        const target = resolveLinkTarget(path, artifact.product_spec_path);
        if (target === path) {
          warnings.push({
            code: "self_dependency",
            message: `${path} declares a ${relation} link to itself. The edge is ignored.`,
            path
          });
          continue;
        }
        edges.push({
          from: path,
          to: target,
          relation,
          ...(artifact.product_spec_revision !== undefined
            ? { product_spec_revision: artifact.product_spec_revision }
            : {})
        });
        if ((relation === "depends_on" || relation === "blocks") && !nodes.has(target)) {
          warnings.push({
            code: "missing_link_target",
            message: `${path} declares ${relation} on ${target}, which is not in the graph.`,
            path
          });
        }
        const targetRevision = nodes.get(target)?.document.frontmatter.spec_revision;
        if (
          artifact.product_spec_revision !== undefined &&
          targetRevision !== undefined &&
          artifact.product_spec_revision !== targetRevision
        ) {
          warnings.push({
            code: "revision_pin_mismatch",
            message: `${path} pins ${target} at revision ${artifact.product_spec_revision}, but the target spec is revision ${targetRevision}.`,
            path
          });
        }
      }
    }
  }

  const waitsOn = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();
  for (const path of nodes.keys()) {
    waitsOn.set(path, new Set());
    dependents.set(path, new Set());
  }
  for (const edge of edges) {
    if (edge.relation === "depends_on") {
      waitsOn.get(edge.from)?.add(edge.to);
      if (nodes.has(edge.to)) dependents.get(edge.to)?.add(edge.from);
    }
    if (edge.relation === "blocks" && nodes.has(edge.to)) {
      waitsOn.get(edge.to)?.add(edge.from);
      dependents.get(edge.from)?.add(edge.to);
    }
  }

  const buildable: string[] = [];
  const blocked: ProductSpecGraphBlockedNode[] = [];
  for (const path of nodes.keys()) {
    const waits = waitsOn.get(path) ?? new Set();
    if (waits.size === 0) buildable.push(path);
    else blocked.push({ path, waits_on: [...waits] });
  }

  const remaining = new Map<string, number>();
  for (const [path, waits] of waitsOn) remaining.set(path, waits.size);
  const queue = [...buildable];
  const order: string[] = [];
  while (queue.length) {
    const path = queue.shift() as string;
    order.push(path);
    for (const dependent of dependents.get(path) ?? []) {
      const left = (remaining.get(dependent) ?? 0) - 1;
      remaining.set(dependent, left);
      if (left === 0) queue.push(dependent);
    }
  }
  // A spec that is itself the fault, because it sits in a cycle or waits on a
  // target that is not in the graph, is already named by its own warning. Only a
  // spec stranded by someone else's fault needs a second one.
  //
  // A missing `depends_on` target is the spec's own fault, since it gates the spec
  // that declared it. A missing `blocks` target is not: it warns, but it gates
  // nothing, so a spec carrying that warning can still be stranded by other work
  // and still needs to be told why.
  const explained = new Set(
    edges
      .filter((edge) => edge.relation === "depends_on" && !nodes.has(edge.to))
      .map((edge) => edge.from)
  );
  if (order.length < nodes.size) {
    for (const cycle of findDependencyCycles(waitsOn)) {
      for (const path of cycle) explained.add(path);
      warnings.push({
        code: "dependency_cycle",
        message: `Dependency cycle among: ${cycle.join(", ")}.`,
        path: cycle[0]
      });
    }
  }

  // Two specs that supersede each other cannot both be the replacement. Treating
  // either as replaced would drop both out of the fleet plan without saying so,
  // which is worse than a loud malformed library, so the loop is reported and
  // every spec in it stays live.
  const supersedesEdges = edges.filter((edge) => edge.relation === "supersedes");
  const replaces = new Map<string, Set<string>>();
  for (const path of nodes.keys()) replaces.set(path, new Set());
  for (const edge of supersedesEdges) replaces.get(edge.from)?.add(edge.to);

  const supersedesLoop = new Set<string>();
  for (const cycle of findDependencyCycles(replaces)) {
    for (const path of cycle) supersedesLoop.add(path);
    warnings.push({
      code: "supersedes_cycle",
      message: `Specs supersede each other in a loop: ${cycle.join(", ")}. None of them is treated as replaced.`,
      path: cycle[0]
    });
  }

  const superseded = new Set(
    supersedesEdges.map((edge) => edge.to).filter((path) => !supersedesLoop.has(path))
  );
  const live = [...nodes.entries()].filter(([path]) => !superseded.has(path));

  // Contention is reported, never warned about. Two specs sharing a surface is a
  // fact, and often a deliberate one: a parent and a child split a directory on
  // purpose. Warning about it would scold every library that has only ever used
  // `applies_to` for traceability, which is what it was added for. The fact is in
  // `contention` for anyone dispatching agents, and `waves` acts on it.
  const { contention, waves, unscoped, unschedulable } = resolveFleetPlan(live, order, waitsOn, explained);
  warnings.push(...unschedulable);

  return { buildable, blocked, order, waves, contention, unscoped, edges, warnings };
}

/**
 * Everything a fleet needs before it hands specs to several agents at once.
 *
 * `live` is the one list this works from. A spec replaced by a `supersedes` edge
 * is not in it, so it neither claims a surface nor gets scheduled. Contention,
 * waves, and unscoped all come off that same list, which is what stops a spec
 * being scheduled into a wave that knows nothing about the surface it touches.
 */
function resolveFleetPlan(
  live: Array<[string, ProductSpecGraphInput]>,
  order: string[],
  waitsOn: Map<string, Set<string>>,
  explained: Set<string>
): Pick<ProductSpecGraph, "contention" | "waves" | "unscoped"> & {
  unschedulable: ProductSpecGraphWarning[];
} {
  const pathClaims = new Map<string, Set<string>>();
  const componentClaims = new Map<string, Set<string>>();
  const pathsOf = new Map<string, Set<string>>();
  const componentsOf = new Map<string, Set<string>>();
  const unscoped: string[] = [];
  const unschedulable: ProductSpecGraphWarning[] = [];

  const claim = (
    claims: Map<string, Set<string>>,
    declaredBy: Map<string, Set<string>>,
    value: string,
    spec: string
  ): void => {
    if (!value) return;
    let specs = claims.get(value);
    if (!specs) claims.set(value, (specs = new Set()));
    specs.add(spec);
    let values = declaredBy.get(spec);
    if (!values) declaredBy.set(spec, (values = new Set()));
    values.add(value);
  };

  for (const [path, input] of live) {
    const declared = input.document.frontmatter.applies_to;
    let declaresSurface = false;
    for (const entry of Array.isArray(declared) ? declared : []) {
      if (!entry || typeof entry !== "object") continue;
      // Nothing stops one entry carrying both a component and a path. Take both,
      // rather than picking one and dropping the other surface without a word.
      const component = typeof entry.component === "string" ? entry.component.trim() : "";
      const rawPath = typeof entry.path === "string" ? entry.path.trim() : "";
      // A path that normalizes away, like "." or "/", is a claim on the whole
      // repository. Treating it as no claim at all would hide the widest overlap
      // there is, so it keeps its own surface.
      const declaredPath = rawPath ? normalizeSpecPath(rawPath) || REPO_ROOT_SURFACE : "";
      if (!component && !declaredPath) continue;
      declaresSurface = true;
      claim(componentClaims, componentsOf, component, path);
      claim(pathClaims, pathsOf, declaredPath, path);
    }
    if (!declaresSurface) unscoped.push(path);
  }
  unscoped.sort();

  const ancestorCache = new Map<string, string[]>();
  const contention: ProductSpecGraphContention[] = [];
  for (const [component, specs] of componentClaims) {
    if (specs.size < 2) continue;
    contention.push({ kind: "component", value: component, specs: [...specs].sort() });
  }
  for (const [claimed, specs] of pathClaims) {
    // A surface names every spec scoped at or above it, because a spec scoped to
    // `src/api` edits inside `src/api/v2` as well. One entry per declared surface
    // keeps each entry true on its own terms: `src/api/v2` and `src/api/v3` each
    // name the parent they sit under, and neither one names the other, because
    // they are different directories.
    const touching = new Set(specs);
    for (const ancestor of surfaceAncestors(claimed, ancestorCache)) {
      if (ancestor === claimed) continue;
      for (const spec of pathClaims.get(ancestor) ?? []) touching.add(spec);
    }
    if (touching.size < 2) continue;
    contention.push({ kind: "path", value: claimed, specs: [...touching].sort() });
  }
  contention.sort((a, b) => a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value));

  // Every spec that claims a path at or below this one. A spec registers under its
  // own path and under each of its ancestors, so a lookup on `src/api` returns the
  // specs scoped to `src/api`, `src/api/v2`, and everything deeper.
  const specsUnder = new Map<string, Set<string>>();
  for (const [spec, claimedPaths] of pathsOf) {
    for (const claimed of claimedPaths) {
      for (const ancestor of surfaceAncestors(claimed, ancestorCache)) {
        let specs = specsUnder.get(ancestor);
        if (!specs) specsUnder.set(ancestor, (specs = new Set()));
        specs.add(spec);
      }
    }
  }

  const scheduled = new Set(live.map(([path]) => path));
  const waves: string[][] = [];
  const waveOf = new Map<string, number>();

  // Two specs collide when they name the same component, or when one's path
  // contains the other's. Containment runs in both directions, so both are looked
  // up: walking a spec's ancestors through `pathClaims` finds the specs scoped
  // above it, and `specsUnder` finds the specs scoped inside it.
  //
  // Collision is between a pair of specs. Sharing a parent directory is not enough
  // on its own: `src/api/v2` and `src/api/v3` both sit under `src/api`, so neither
  // ships beside a spec scoped to `src/api`, and the two of them ship together.
  const collidingSpecs = (spec: string): Set<string> => {
    const colliding = new Set<string>();
    for (const component of componentsOf.get(spec) ?? []) {
      for (const other of componentClaims.get(component) ?? []) colliding.add(other);
    }
    for (const claimed of pathsOf.get(spec) ?? []) {
      for (const ancestor of surfaceAncestors(claimed, ancestorCache)) {
        for (const other of pathClaims.get(ancestor) ?? []) colliding.add(other);
      }
      for (const other of specsUnder.get(claimed) ?? []) colliding.add(other);
    }
    colliding.delete(spec);
    return colliding;
  };

  for (const path of order.filter((candidate) => scheduled.has(candidate))) {
    // A spec can only be dispatched once every spec it waits on has been. A
    // dependency that is itself unschedulable, because a supersedes edge replaced
    // it or a cycle traps it, never gets a wave, and a spec waiting on that cannot
    // be built either. `blocked` already says so, and scheduling it anyway would
    // have waves contradict blocked.
    let index = 0;
    let stranded = false;
    for (const dependency of waitsOn.get(path) ?? []) {
      const dependencyWave = waveOf.get(dependency);
      if (dependencyWave === undefined) {
        stranded = true;
        break;
      }
      index = Math.max(index, dependencyWave + 1);
    }
    if (stranded) continue;

    // The waves this spec may not join are exactly the waves its colliding specs
    // already sit in, so the search for a free wave costs one step per spec that
    // collides with this one, however long the schedule has grown.
    const taken = new Set<number>();
    for (const other of collidingSpecs(path)) {
      const wave = waveOf.get(other);
      if (wave !== undefined) taken.add(wave);
    }
    while (taken.has(index)) index += 1;

    if (!waves[index]) waves[index] = [];
    waves[index].push(path);
    waveOf.set(path, index);
  }

  // A spec can miss a wave two ways: it was reached above and its dependency has
  // no wave, or it never reached the loop at all, because the topological order
  // drops everything downstream of a cycle or a missing link target. Both end the
  // same way, a live spec in no wave, so both are reported the same way. A spec
  // that is itself the fault is skipped here, because its own warning already
  // names it. Nothing else leaves the schedule quietly.
  for (const [path] of live) {
    if (waveOf.has(path) || explained.has(path)) continue;
    const stranding = [...(waitsOn.get(path) ?? [])].filter((dependency) => !waveOf.has(dependency));
    unschedulable.push({
      code: "unschedulable_dependency",
      message: `${path} waits on ${stranding.join(", ")}, which cannot be built, so it is not in any wave. Point the dependency at work that can be built.`,
      path
    });
  }

  return { contention, waves, unscoped, unschedulable };
}

/**
 * A path and every path that contains it, outermost first, starting at the
 * repository root. `src/api` yields `/`, `src`, `src/api`. Comparing whole
 * segments is what keeps `src/api` from containing `src/apiv2`.
 *
 * A claimed path is walked while the surface index is built, and again for every
 * spec compared against it, so the answers are cached. Each ancestor is grown from
 * the one before it, which keeps a deep path linear in its own depth.
 */
function surfaceAncestors(path: string, cache: Map<string, string[]>): string[] {
  const cached = cache.get(path);
  if (cached) return cached;

  const ancestors: string[] = [REPO_ROOT_SURFACE];
  if (path !== REPO_ROOT_SURFACE) {
    let prefix = "";
    for (const segment of path.split("/")) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      ancestors.push(prefix);
    }
  }

  cache.set(path, ancestors);
  return ancestors;
}

const REPO_ROOT_SURFACE = "/";
