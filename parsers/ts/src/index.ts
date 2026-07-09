export const MANDATORY_SECTION_IDS = [
  "problem",
  "hypothesis",
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
  "rollout"
] as const;

export const CANONICAL_SECTION_IDS = [
  ...MANDATORY_SECTION_IDS,
  ...OPTIONAL_SECTION_IDS
] as const;

export type CanonicalSectionId = (typeof CANONICAL_SECTION_IDS)[number];
export type ArtifactType = "hypothesis" | "prd" | "openspec_proposal";
export const AI_EVAL_TYPES = ["exact_match", "contains", "regex", "llm_judge", "human_review"] as const;
export const AI_EVAL_EVALUATORS = ["deterministic", "llm", "human"] as const;
export type AiEvalType = (typeof AI_EVAL_TYPES)[number];
export type AiEvalEvaluator = (typeof AI_EVAL_EVALUATORS)[number];

export interface ProductSpecFrontmatter {
  spec_format_version: "0.1";
  title: string;
  artifact_type: ArtifactType;
  spec_revision?: number;
  author: string;
  created_at: string;
  updated_at: string;
  linked_github_repo?: string;
  custom_sections?: Array<{ id: string; label: string; after: string }>;
  tool_metadata?: Record<string, string>;
}

export interface ProductSpecSection {
  id: string;
  label: string;
  content: string;
  scope?: ProductSpecScope;
  acceptance_criteria?: ProductSpecAcceptanceCriterion[];
  ai_evals?: ProductSpecAiEval[];
  success_metrics?: ProductSpecSuccessMetric[];
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
  window: string;
}

export interface ProductSpecDocument {
  frontmatter: ProductSpecFrontmatter;
  sections: ProductSpecSection[];
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

const LABELS: Record<string, string> = {
  problem: "Problem",
  hypothesis: "Hypothesis",
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
  rollout: "Rollout"
};

export function parseProductSpecMarkdown(markdown: string): ProductSpecDocument {
  const frontmatterMatch = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
  if (!frontmatterMatch) throw new Error("Product Spec frontmatter is required.");

  const frontmatter = parseFrontmatter(frontmatterMatch[1]);
  const body = markdown.slice(frontmatterMatch[0].length);
  const sections = parseSections(body, frontmatter.custom_sections ?? []);

  for (const sectionId of MANDATORY_SECTION_IDS) {
    if (!sections.some((section) => section.id === sectionId)) {
      throw new Error(`Missing mandatory section: ${sectionId}`);
    }
  }

  return { frontmatter, sections };
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

export function serializeProductSpecMarkdown(doc: ProductSpecDocument): string {
  const frontmatter = serializeFrontmatter(doc.frontmatter);
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
  return { code: "invalid_product_spec", message };
}

function validateDocument(document: ProductSpecDocument): {
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
} {
  const errors: ProductSpecValidationError[] = [];
  const warnings: ProductSpecValidationWarning[] = [];
  const seenSectionIds = new Set<string>();

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
    }

    if (section.id === "success_metrics" && !section.success_metrics?.length) {
      errors.push({
        code: "invalid_success_metric",
        message: "Invalid success metric: include at least one productspec-success-metrics item.",
        path: "sections.success_metrics.success_metrics"
      });
    }
  }

  return { errors, warnings };
}

function parseFrontmatter(raw: string): ProductSpecFrontmatter {
  const lines = raw.split("\n");
  const result: Record<string, unknown> = {};
  let customSections: Array<{ id: string; label: string; after: string }> | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
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

  return result as unknown as ProductSpecFrontmatter;
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

function parseSections(
  body: string,
  customSections: Array<{ id: string; label: string }>
): ProductSpecSection[] {
  const headingPattern = /^##\s+(.+)$/gm;
  const matches = [...body.matchAll(headingPattern)];
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
    return {
      id,
      label,
      content,
      ...(scope ? { scope } : {}),
      ...(acceptance_criteria.length ? { acceptance_criteria } : {}),
      ...(ai_evals.length ? { ai_evals } : {}),
      ...(success_metrics.length ? { success_metrics } : {})
    };
  });
}

function parseScopeBlock(content: string): ProductSpecScope | undefined {
  const blockPattern = /```productspec-scope\n([\s\S]*?)\n```/g;
  const blocks = [...content.matchAll(blockPattern)];
  if (!blocks.length) return undefined;

  const scope: ProductSpecScope = { in: [], out: [], cut: [] };
  for (const block of blocks) {
    let category: keyof ProductSpecScope | undefined;
    for (const line of block[1].split("\n")) {
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
  const blockPattern = /```productspec-acceptance-criteria\n([\s\S]*?)\n```/g;
  return [...content.matchAll(blockPattern)].flatMap((match) => parseAcceptanceCriterionList(match[1]));
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
  const blockPattern = /```productspec-ai-evals\n([\s\S]*?)\n```/g;
  return [...content.matchAll(blockPattern)].flatMap((match) => parseAiEvalList(match[1]));
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
  const blockPattern = /```productspec-success-metrics\n([\s\S]*?)\n```/g;
  return [...content.matchAll(blockPattern)].flatMap((match) => parseSuccessMetricList(match[1]));
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
    window: String(metric.window ?? "")
  }));
}

function assignSuccessMetricValue(target: Partial<ProductSpecSuccessMetric>, line: string) {
  const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid success metric block line: ${line}`);
  const key = match[1] as keyof ProductSpecSuccessMetric;
  if (!["id", "metric", "target", "window"].includes(key)) {
    throw new Error(`Invalid success metric field: ${key}`);
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

function serializeFrontmatter(frontmatter: ProductSpecFrontmatter): string {
  let output = "";
  for (const key of ["spec_format_version", "title", "artifact_type", "spec_revision", "author", "created_at", "updated_at", "linked_github_repo"] as const) {
    const value = frontmatter[key];
    if (value === undefined || value === "") continue;
    output += typeof value === "number" ? `${key}: ${value}\n` : `${key}: "${value}"\n`;
  }
  if (frontmatter.custom_sections?.length) {
    output += "custom_sections:\n";
    for (const section of frontmatter.custom_sections) {
      output += `  - id: "${section.id}"\n`;
      output += `    label: "${section.label}"\n`;
      output += `    after: "${section.after}"\n`;
    }
  }
  return output;
}
