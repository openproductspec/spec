import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, normalize, relative, resolve } from "node:path";
import {
  parseProductSpecMarkdown,
  type ProductSpecAcceptanceCriterion,
  type ProductSpecAiEval,
  type ProductSpecDocument,
  type ProductSpecRelatedArtifact,
  type ProductSpecScope,
  type ProductSpecSuccessMetric,
  validateProductSpecMarkdown,
  type ProductSpecValidationError,
  type ProductSpecValidationWarning
} from "./index.js";

export interface ProductSpecMcpArgs {
  root?: string;
  path?: string;
}

export interface ProductSpecListItem {
  path: string;
  title?: string;
  spec_revision?: number;
  valid: boolean;
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

export interface CompletionClaimCheck {
  spec_valid: boolean;
  claim: string;
  message: string;
  acceptance_criteria: Array<ProductSpecAcceptanceCriterion & { status: "needs_verification" }>;
  ai_evals: Array<ProductSpecAiEval & { status: "not_run_by_productspec" }>;
  success_metrics: ProductSpecSuccessMetric[];
  errors: ProductSpecValidationError[];
  warnings: ProductSpecValidationWarning[];
}

const DEFAULT_ROOT = process.cwd();

export function listProductSpecs(args: { root?: string } = {}): ProductSpecListItem[] {
  const root = resolveRoot(args.root);
  return findProductSpecFiles(root).map((absolutePath) => {
    const path = relative(root, absolutePath);
    const result = validateProductSpecMarkdown(readFileSync(absolutePath, "utf8"));
    if (!result.valid) {
      return { path, valid: false, errors: result.errors, warnings: result.warnings };
    }
    return {
      path,
      title: result.document.frontmatter.title,
      spec_revision: result.document.frontmatter.spec_revision,
      valid: true,
      errors: [],
      warnings: result.warnings
    };
  });
}

export function getProductSpec(args: ProductSpecMcpArgs): ProductSpecDocument {
  return readValidProductSpec(args);
}

export function validateProductSpec(args: ProductSpecMcpArgs) {
  const markdown = readProductSpecMarkdown(args);
  return validateProductSpecMarkdown(markdown);
}

export function getScope(args: ProductSpecMcpArgs): ProductSpecScope | null {
  const section = readValidProductSpec(args).sections.find((candidate) => candidate.id === "scope");
  return section?.scope ?? null;
}

export function getAcceptanceCriteria(args: ProductSpecMcpArgs): ProductSpecAcceptanceCriterion[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.acceptance_criteria ?? []);
}

export function getAiEvals(args: ProductSpecMcpArgs): ProductSpecAiEval[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.ai_evals ?? []);
}

export function getSuccessMetrics(args: ProductSpecMcpArgs): ProductSpecSuccessMetric[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.success_metrics ?? []);
}

export function getRelatedArtifacts(args: ProductSpecMcpArgs): ProductSpecRelatedArtifact[] {
  return readValidProductSpec(args).sections.flatMap((section) => section.related_artifacts ?? []);
}

export function checkCompletionClaim(args: ProductSpecMcpArgs & { claim?: string }): CompletionClaimCheck {
  const result = validateProductSpec(args);
  const claim = args.claim ?? "";
  if (!result.valid) {
    return {
      spec_valid: false,
      claim,
      message: "The Product Spec is invalid. Fix validation errors before using it as the control file for implementation.",
      acceptance_criteria: [],
      ai_evals: [],
      success_metrics: [],
      errors: result.errors,
      warnings: result.warnings
    };
  }

  return {
    spec_valid: true,
    claim,
    message: "ProductSpec does not verify code execution. Before claiming done, verify every Acceptance Criterion and run or review every listed AI Eval.",
    acceptance_criteria: getAcceptanceCriteria(args).map((criterion) => ({
      ...criterion,
      status: "needs_verification"
    })),
    ai_evals: getAiEvals(args).map((evalSpec) => ({
      ...evalSpec,
      status: "not_run_by_productspec"
    })),
    success_metrics: getSuccessMetrics(args),
    errors: [],
    warnings: result.warnings
  };
}

function readValidProductSpec(args: ProductSpecMcpArgs): ProductSpecDocument {
  const result = validateProductSpec(args);
  if (!result.valid) {
    throw new Error(`Invalid Product Spec: ${result.errors.map((error) => error.message).join("; ")}`);
  }
  return result.document;
}

function readProductSpecMarkdown(args: ProductSpecMcpArgs): string {
  if (!args.path) throw new Error("path is required");
  const root = resolveRoot(args.root);
  const absolutePath = resolveSpecPath(root, args.path);
  return readFileSync(absolutePath, "utf8");
}

function resolveRoot(root?: string): string {
  return resolve(root ?? DEFAULT_ROOT);
}

function resolveSpecPath(root: string, filePath: string): string {
  const absolutePath = isAbsolute(filePath) ? normalize(filePath) : resolve(root, filePath);
  const relativePath = relative(root, absolutePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Product Spec path must stay inside root: ${filePath}`);
  }
  if (!existsSync(absolutePath)) throw new Error(`Product Spec not found: ${filePath}`);
  return absolutePath;
}

function findProductSpecFiles(root: string): string[] {
  const results: string[] = [];
  visit(root);
  return results.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));

  function visit(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (shouldSkip(entry)) continue;
      const absolutePath = join(dir, entry);
      const stat = statSync(absolutePath);
      if (stat.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (entry.endsWith(".product-spec.md")) results.push(absolutePath);
    }
  }
}

function shouldSkip(entry: string): boolean {
  return entry === ".git" || entry === "node_modules" || entry === "dist" || entry === ".next";
}
