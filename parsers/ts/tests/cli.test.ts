import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  checkCompletionClaim,
  getAcceptanceCriteria,
  getAiEvals,
  getEvidenceChecklist,
  getProductSpec,
  getProductSummary,
  getRelatedArtifacts,
  getScope,
  getSpecGraph,
  getSuccessMetrics,
  listProductSpecs,
  validateProductSpec
} from "../src/mcp-tools";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const cli = resolve(pkgRoot, "dist", "cli.js");

const scopeSpec = "conformance/valid/with-structured-scope-and-metrics.product-spec.md";
const evalsSpec = "conformance/valid/with-ai-evals.product-spec.md";
const relatedSpec = "conformance/valid/with-traceability.product-spec.md";
const minimalSpec = "conformance/valid/minimal.product-spec.md";
const validDir = "conformance/valid";

/** Run the built CLI from the repo root and parse its --json output. */
function cliJson(argv: string[]): unknown {
  const stdout = execFileSync("node", [cli, ...argv], { cwd: repoRoot, encoding: "utf8" });
  return JSON.parse(stdout);
}

/** Run the built CLI and return its exit code (0 on success). */
function cliExit(argv: string[]): number {
  try {
    execFileSync("node", [cli, ...argv], { cwd: repoRoot, stdio: "ignore" });
    return 0;
  } catch (error) {
    return typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 1;
  }
}

/** Run the built CLI and capture status, stdout, and stderr. */
function cliRun(argv: string[], cwd: string = repoRoot): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [cli, ...argv], { cwd, encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: typeof e.status === "number" ? e.status : 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

/** No V8 stack frame ("at fn file:line:col") leaked into user-facing output. */
const noStackTrace = (text: string): boolean => !/\bat \w[\w.]*.*:\d+:\d+/.test(text);

beforeAll(() => {
  // Build the shipped artifact so the test exercises the real dist/cli.js, not a stale one.
  execFileSync("npm", ["run", "build"], { cwd: pkgRoot, stdio: "ignore" });
}, 120000);

// Surface parity: the CLI and the MCP are two adapters over one function layer
// (mcp-tools.ts). Each assertion runs the CLI command and the function the MCP
// tool wraps, and asserts identical output. A caller cannot drift from a
// definition it does not own; if one does, one of these fails.
describe("CLI/MCP surface parity", () => {
  it("get scope matches getScope", () => {
    expect(cliJson(["get", scopeSpec, "scope", "--json"])).toEqual(getScope({ root: repoRoot, path: scopeSpec }));
  });

  it("get metrics matches getSuccessMetrics", () => {
    expect(cliJson(["get", scopeSpec, "metrics", "--json"])).toEqual(
      getSuccessMetrics({ root: repoRoot, path: scopeSpec })
    );
  });

  it("get acceptance matches getAcceptanceCriteria", () => {
    expect(cliJson(["get", minimalSpec, "acceptance", "--json"])).toEqual(
      getAcceptanceCriteria({ root: repoRoot, path: minimalSpec })
    );
  });

  it("get evals matches getAiEvals", () => {
    expect(cliJson(["get", evalsSpec, "evals", "--json"])).toEqual(getAiEvals({ root: repoRoot, path: evalsSpec }));
  });

  it("get related matches getRelatedArtifacts", () => {
    expect(cliJson(["get", relatedSpec, "related", "--json"])).toEqual(
      getRelatedArtifacts({ root: repoRoot, path: relatedSpec })
    );
  });

  it("get summary matches getProductSummary (bare value, same shape as the MCP tool)", () => {
    expect(cliJson(["get", minimalSpec, "summary", "--json"])).toEqual(getProductSummary({ root: repoRoot, path: minimalSpec }));
  });

  it("get evidence matches getEvidenceChecklist", () => {
    expect(cliJson(["get", minimalSpec, "evidence", "--json"])).toEqual(
      getEvidenceChecklist({ root: repoRoot, path: minimalSpec })
    );
  });

  it("show matches getProductSpec", () => {
    expect(cliJson(["show", minimalSpec, "--json"])).toEqual(getProductSpec({ root: repoRoot, path: minimalSpec }));
  });

  it("list matches listProductSpecs", () => {
    expect(cliJson(["list", validDir, "--json"])).toEqual(listProductSpecs({ root: resolve(repoRoot, validDir) }));
  });

  it("graph matches getSpecGraph", () => {
    expect(cliJson(["graph", validDir, "--json"])).toEqual(getSpecGraph({ root: resolve(repoRoot, validDir) }));
  });

  it("check-claim matches checkCompletionClaim", () => {
    expect(cliJson(["check-claim", minimalSpec, "--claim", "shipped", "--json"])).toEqual(
      checkCompletionClaim({ root: repoRoot, path: minimalSpec, claim: "shipped" })
    );
  });

  it("validate matches validateProductSpec", () => {
    expect(cliJson(["validate", minimalSpec, "--json"])).toEqual(validateProductSpec({ root: repoRoot, path: minimalSpec }));
  });
});

describe("CLI behavior", () => {
  it("prints help and exits 0", () => {
    expect(cliExit(["--help"])).toBe(0);
  });

  it("rejects an unknown get section with a nonzero exit", () => {
    expect(cliExit(["get", minimalSpec, "not-a-section"])).not.toBe(0);
  });

  it("requires --against for session check", () => {
    expect(cliExit(["session", "check", minimalSpec])).not.toBe(0);
  });
});

// Bad input must fail cleanly: it should never corrupt output, read outside the
// given path, or surface an internal stack trace.
describe("CLI robustness", () => {
  it("blocks a path that resolves outside the root", () => {
    const result = cliRun(["get", "../../../../etc/passwd", "summary"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("stay inside root");
  });

  it("rejects reading a directory as a spec without leaking a stack trace", () => {
    const result = cliRun(["get", "conformance", "summary"]);
    expect(result.status).not.toBe(0);
    expect(noStackTrace(result.stderr)).toBe(true);
  });

  it("exits nonzero when graph is pointed at a file instead of a directory", () => {
    const result = cliRun(["graph", minimalSpec]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not a directory");
  });

  it("rejects a non-numeric --revision on session check", () => {
    const result = cliRun(["session", "check", minimalSpec, "--against", "sha256:x", "--revision", "abc"]);
    expect(result.status).not.toBe(0);
  });

  it("validate --json on an invalid spec exits nonzero with valid:false", () => {
    const dir = mkdtempSync(join(tmpdir(), "productspec-cli-"));
    writeFileSync(join(dir, "broken.product-spec.md"), "not a spec");
    const result = cliRun(["validate", "broken.product-spec.md", "--json"], dir);
    expect(result.status).not.toBe(0);
    expect(JSON.parse(result.stdout).valid).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it("check-claim on an invalid spec exits nonzero", () => {
    const dir = mkdtempSync(join(tmpdir(), "productspec-cli-"));
    writeFileSync(join(dir, "broken.product-spec.md"), "not a spec");
    const result = cliRun(["check-claim", "broken.product-spec.md", "--claim", "x"], dir);
    expect(result.status).not.toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it("get related on a spec with no related artifacts returns an empty array", () => {
    const result = cliRun(["get", minimalSpec, "related", "--json"]);
    expect(JSON.parse(result.stdout)).toEqual([]);
  });

  it("reports absent structured scope clearly when only a prose Scope heading exists", () => {
    const dir = mkdtempSync(join(tmpdir(), "productspec-cli-"));
    cliRun(["init", "x.product-spec.md"], dir);
    const result = cliRun(["get", "x.product-spec.md", "scope"], dir);
    expect(result.stdout).toContain("no structured scope");
    rmSync(dir, { recursive: true, force: true });
  });
});

// Argument-parsing regressions. Each of these returned a wrong result at exit 0
// (or silently dropped input) under the original naive parser.
describe("CLI argument parsing", () => {
  it("captures a --flag=value equals form", () => {
    const result = cliRun(["check-claim", minimalSpec, "--claim=shipped", "--json"]);
    expect(JSON.parse(result.stdout).claim).toBe("shipped");
  });

  it("keeps a value-flag's value out of positionals so it cannot shift the file argument", () => {
    // `--claim <evalsSpec>` placed before the real spec must not make evalsSpec the analyzed file.
    const result = cliRun(["check-claim", "--claim", evalsSpec, minimalSpec, "--json"]);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.claim).toBe(evalsSpec);
    // minimalSpec has 3 acceptance criteria; with-ai-evals has 2. Proves minimalSpec was analyzed.
    expect(parsed.acceptance_criteria.length).toBe(3);
  });

  it("rejects a non-integer --revision instead of coercing it", () => {
    for (const bad of ["2.5", "0x10", "1e3", ""]) {
      expect(cliRun(["session", "check", minimalSpec, "--against", "sha256:x", "--revision", bad]).status).not.toBe(0);
    }
  });

  it("rejects an unknown option instead of ignoring it", () => {
    const result = cliRun(["validate", minimalSpec, "--nope"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unknown option");
  });
});

// Stateless drift detection. `session begin` prints a pin; `session check` takes it
// back via --against. A hash-only check must not fabricate drift on an unchanged spec.
describe("CLI session drift (stateless)", () => {
  function withTempSpec(run: (dir: string, name: string, path: string) => void) {
    const dir = mkdtempSync(join(tmpdir(), "productspec-cli-"));
    const name = "s.product-spec.md";
    const path = join(dir, name);
    writeFileSync(path, readFileSync(resolve(repoRoot, minimalSpec), "utf8"));
    try {
      run(dir, name, path);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("a hash-only check on an unchanged spec reports changed:false", () => {
    withTempSpec((dir, name) => {
      const begin = JSON.parse(cliRun(["session", "begin", name, "--json"], dir).stdout);
      const check = JSON.parse(cliRun(["session", "check", name, "--against", begin.content_hash, "--json"], dir).stdout);
      expect(check.changed).toBe(false);
    });
  });

  it("detects a real content change as drift", () => {
    withTempSpec((dir, name, path) => {
      const begin = JSON.parse(cliRun(["session", "begin", name, "--json"], dir).stdout);
      writeFileSync(path, `${readFileSync(path, "utf8")}\n<!-- edit -->\n`);
      const check = JSON.parse(cliRun(["session", "check", name, "--against", begin.content_hash, "--json"], dir).stdout);
      expect(check.changed).toBe(true);
    });
  });
});
