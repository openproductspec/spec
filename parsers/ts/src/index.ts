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

export interface ProductSpecFrontmatter {
  spec_format_version: "0.1";
  title: string;
  artifact_type: ArtifactType;
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

export type ProductSpecValidationResult =
  | { valid: true; document: ProductSpecDocument; errors: [] }
  | { valid: false; errors: ProductSpecValidationError[] };

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
    return { valid: true, document: parseProductSpecMarkdown(markdown), errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [validationErrorFor(error)]
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
  return { code: "invalid_product_spec", message };
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
    return {
      id,
      label,
      content: body.slice(start, end).trim()
    };
  });
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
  for (const key of ["spec_format_version", "title", "artifact_type", "author", "created_at", "updated_at", "linked_github_repo"] as const) {
    const value = frontmatter[key];
    if (value) output += `${key}: "${value}"\n`;
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
