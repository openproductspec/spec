import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  changelogSince,
  compareVersions,
  defaultSkillRoots,
  listPackagedSkills,
  parseChangelog,
  readSkillVersion,
  stampSkillVersion,
  upgradeSkills
} from "../src/upgrade";

const changelog = `# Changelog

## v0.24.0 - MCP Install And Showcase Examples

Added:

- \`productspec mcp-config claude|cursor\` prints a copy-pasteable MCP client config.

## v0.23.0 - Parser Fidelity And Harness Demo

Fixed:

- Unknown frontmatter preservation now covers all key shapes.

## v0.22.0

Added:

- Agent Run drafting.
`;

const skillMarkdown = `---
name: productspec
description: Test skill.
---

# Body
`;

function makePackagedSkills(root: string, names: string[]): string {
  const packaged = join(root, "packaged");
  for (const name of names) {
    mkdirSync(join(packaged, name), { recursive: true });
    writeFileSync(join(packaged, name, "SKILL.md"), skillMarkdown, "utf8");
  }
  return packaged;
}

describe("parseChangelog", () => {
  it("parses versions, titles, and bodies", () => {
    const entries = parseChangelog(changelog);
    expect(entries.map((entry) => entry.version)).toEqual(["0.24.0", "0.23.0", "0.22.0"]);
    expect(entries[0].title).toBe("MCP Install And Showcase Examples");
    expect(entries[0].body).toContain("mcp-config");
    expect(entries[2].title).toBe("");
    expect(entries[2].body).toContain("Agent Run drafting.");
  });

  it("returns no entries for markdown without version headings", () => {
    expect(parseChangelog("# Changelog\n\nNothing released yet.")).toEqual([]);
  });
});

describe("compareVersions", () => {
  it("orders dotted versions numerically", () => {
    expect(compareVersions("0.9.0", "0.10.0")).toBe(-1);
    expect(compareVersions("0.24.0", "0.24.0")).toBe(0);
    expect(compareVersions("1.0.0", "0.24.0")).toBe(1);
    expect(compareVersions("0.24", "0.24.0")).toBe(0);
  });
});

describe("changelogSince", () => {
  it("returns entries newer than the given version", () => {
    const entries = parseChangelog(changelog);
    expect(changelogSince(entries, "0.22.0").map((entry) => entry.version)).toEqual(["0.24.0", "0.23.0"]);
    expect(changelogSince(entries, "0.24.0")).toEqual([]);
  });
});

describe("skill version frontmatter", () => {
  it("reads a stamped version", () => {
    expect(readSkillVersion(stampSkillVersion(skillMarkdown, "0.24.0"))).toBe("0.24.0");
    expect(readSkillVersion(skillMarkdown)).toBeNull();
  });

  it("replaces an existing top-level version line", () => {
    const stamped = stampSkillVersion(stampSkillVersion(skillMarkdown, "0.23.0"), "0.24.0");
    expect(readSkillVersion(stamped)).toBe("0.24.0");
    expect(stamped.match(/^version:/gm)).toHaveLength(1);
  });

  it("ignores indented metadata version keys", () => {
    const withMetadata = `---\nname: test\nmetadata:\n  version: "0.1"\n---\n\n# Body\n`;
    expect(readSkillVersion(withMetadata)).toBeNull();
    const stamped = stampSkillVersion(withMetadata, "0.24.0");
    expect(readSkillVersion(stamped)).toBe("0.24.0");
    expect(stamped).toContain('  version: "0.1"');
  });
});

describe("defaultSkillRoots", () => {
  it("returns only existing directories without duplicates", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-roots-"));
    mkdirSync(join(base, "skills"), { recursive: true });
    mkdirSync(join(base, ".claude", "skills"), { recursive: true });
    const roots = defaultSkillRoots(base, base);
    expect(roots).toEqual([join(base, "skills"), join(base, ".claude", "skills")]);
  });
});

describe("upgradeSkills", () => {
  it("upgrades an unversioned install and stamps the new version", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-upgrade-"));
    const packaged = makePackagedSkills(base, ["productspec"]);
    const root = join(base, "installed");
    mkdirSync(join(root, "productspec"), { recursive: true });
    writeFileSync(join(root, "productspec", "SKILL.md"), "---\nname: productspec\n---\n\n# Old body\n", "utf8");

    const results = upgradeSkills({
      packagedSkillsDir: packaged,
      version: "0.24.0",
      roots: [{ path: root, installMissing: false }]
    });

    expect(results).toEqual([
      {
        root,
        skill: "productspec",
        path: join(root, "productspec"),
        from: null,
        to: "0.24.0",
        action: "upgraded",
        dry_run: false
      }
    ]);
    const installed = readFileSync(join(root, "productspec", "SKILL.md"), "utf8");
    expect(readSkillVersion(installed)).toBe("0.24.0");
    expect(installed).toContain("# Body");
    expect(existsSync(join(root, "productspec.bak"))).toBe(false);
  });

  it("reports up-to-date installs without rewriting them", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-upgrade-"));
    const packaged = makePackagedSkills(base, ["productspec"]);
    const root = join(base, "installed");
    mkdirSync(join(root, "productspec"), { recursive: true });
    const current = stampSkillVersion("---\nname: productspec\n---\n\n# Local body\n", "0.24.0");
    writeFileSync(join(root, "productspec", "SKILL.md"), current, "utf8");

    const results = upgradeSkills({
      packagedSkillsDir: packaged,
      version: "0.24.0",
      roots: [{ path: root, installMissing: false }]
    });

    expect(results[0].action).toBe("up-to-date");
    expect(readFileSync(join(root, "productspec", "SKILL.md"), "utf8")).toBe(current);
  });

  it("skips missing skills unless the root allows installs", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-upgrade-"));
    const packaged = makePackagedSkills(base, ["productspec", "productspec-authoring"]);
    const root = join(base, "installed");
    mkdirSync(root, { recursive: true });

    expect(
      upgradeSkills({ packagedSkillsDir: packaged, version: "0.24.0", roots: [{ path: root, installMissing: false }] })
    ).toEqual([]);

    const results = upgradeSkills({
      packagedSkillsDir: packaged,
      version: "0.24.0",
      roots: [{ path: root, installMissing: true }]
    });
    expect(results.map((result) => result.action)).toEqual(["installed", "installed"]);
    expect(readSkillVersion(readFileSync(join(root, "productspec-authoring", "SKILL.md"), "utf8"))).toBe("0.24.0");
  });

  it("does not write anything on a dry run", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-upgrade-"));
    const packaged = makePackagedSkills(base, ["productspec"]);
    const root = join(base, "installed");
    mkdirSync(join(root, "productspec"), { recursive: true });
    const original = "---\nname: productspec\n---\n\n# Old body\n";
    writeFileSync(join(root, "productspec", "SKILL.md"), original, "utf8");

    const results = upgradeSkills({
      packagedSkillsDir: packaged,
      version: "0.24.0",
      roots: [{ path: root, installMissing: false }],
      dryRun: true
    });

    expect(results[0]).toMatchObject({ action: "upgraded", dry_run: true });
    expect(readFileSync(join(root, "productspec", "SKILL.md"), "utf8")).toBe(original);
  });

  it("lists only packaged directories that contain a SKILL.md", () => {
    const base = mkdtempSync(join(tmpdir(), "productspec-upgrade-"));
    const packaged = makePackagedSkills(base, ["productspec"]);
    mkdirSync(join(packaged, "not-a-skill"), { recursive: true });
    expect(listPackagedSkills(packaged)).toEqual(["productspec"]);
  });
});
