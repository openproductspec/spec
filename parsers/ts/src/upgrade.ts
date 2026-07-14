import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface ChangelogEntry {
  version: string;
  title: string;
  body: string;
}

export interface SkillUpgradeResult {
  root: string;
  skill: string;
  path: string;
  from: string | null;
  to: string;
  action: "upgraded" | "installed" | "up-to-date";
  dry_run: boolean;
}

export interface UpgradeSkillsOptions {
  packagedSkillsDir: string;
  version: string;
  roots: Array<{ path: string; installMissing: boolean }>;
  dryRun?: boolean;
}

const CHANGELOG_HEADING = /^## v(\d+(?:\.\d+)*)(?:\s*-\s*(.*))?\s*$/;
const FRONTMATTER_VERSION = /^version:\s*"?(\d+(?:\.\d+)*)"?\s*$/m;
const FRONTMATTER_VERSION_LINE = /^version:.*$/m;

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let bodyLines: string[] = [];

  const flush = () => {
    if (current) {
      current.body = bodyLines.join("\n").trim();
      entries.push(current);
    }
    bodyLines = [];
  };

  for (const line of markdown.split(/\n/)) {
    const heading = CHANGELOG_HEADING.exec(line);
    if (heading) {
      flush();
      current = { version: heading[1], title: (heading[2] ?? "").trim(), body: "" };
    } else if (current) {
      bodyLines.push(line);
    }
  }
  flush();
  return entries;
}

export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const segmentA = partsA[index] ?? 0;
    const segmentB = partsB[index] ?? 0;
    if (segmentA !== segmentB) return segmentA < segmentB ? -1 : 1;
  }
  return 0;
}

export function changelogSince(entries: ChangelogEntry[], since: string): ChangelogEntry[] {
  return entries.filter((entry) => compareVersions(entry.version, since) > 0);
}

function frontmatterBounds(text: string): { start: number; end: number } | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return { start: 4, end };
}

export function readSkillVersion(skillMarkdown: string): string | null {
  const bounds = frontmatterBounds(skillMarkdown);
  if (!bounds) return null;
  const match = FRONTMATTER_VERSION.exec(skillMarkdown.slice(bounds.start, bounds.end));
  return match ? match[1] : null;
}

export function stampSkillVersion(skillMarkdown: string, version: string): string {
  const bounds = frontmatterBounds(skillMarkdown);
  if (!bounds) {
    return `---\nversion: "${version}"\n---\n\n${skillMarkdown}`;
  }

  const frontmatter = skillMarkdown.slice(bounds.start, bounds.end);
  const stamped = FRONTMATTER_VERSION_LINE.test(frontmatter)
    ? frontmatter.replace(FRONTMATTER_VERSION_LINE, `version: "${version}"`)
    : `version: "${version}"\n${frontmatter}`;
  return skillMarkdown.slice(0, bounds.start) + stamped + skillMarkdown.slice(bounds.end);
}

export function listPackagedSkills(packagedSkillsDir: string): string[] {
  return readdirSync(packagedSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(packagedSkillsDir, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

export function defaultSkillRoots(cwd: string, home: string): string[] {
  const candidates = [join(cwd, "skills"), join(cwd, ".claude", "skills"), join(home, ".claude", "skills")];
  const seen = new Set<string>();
  const roots: string[] = [];
  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (seen.has(resolved) || !existsSync(resolved)) continue;
    seen.add(resolved);
    roots.push(resolved);
  }
  return roots;
}

export function upgradeSkills(options: UpgradeSkillsOptions): SkillUpgradeResult[] {
  const packagedSkills = listPackagedSkills(options.packagedSkillsDir);
  const dryRun = options.dryRun === true;
  const results: SkillUpgradeResult[] = [];

  for (const root of options.roots) {
    for (const skill of packagedSkills) {
      const destination = join(root.path, skill);
      const installed = existsSync(join(destination, "SKILL.md"));
      if (!installed && !root.installMissing) continue;

      const from = installed ? readSkillVersion(readFileSync(join(destination, "SKILL.md"), "utf8")) : null;
      if (from !== null && compareVersions(from, options.version) >= 0) {
        results.push({ root: root.path, skill, path: destination, from, to: options.version, action: "up-to-date", dry_run: dryRun });
        continue;
      }

      const action = installed ? "upgraded" : "installed";
      if (!dryRun) {
        replaceSkillDir(join(options.packagedSkillsDir, skill), destination, installed, options.version);
      }
      results.push({ root: root.path, skill, path: destination, from, to: options.version, action, dry_run: dryRun });
    }
  }

  return results;
}

function replaceSkillDir(source: string, destination: string, hasBackup: boolean, version: string): void {
  const backup = `${destination}.bak`;
  if (hasBackup) {
    rmSync(backup, { recursive: true, force: true });
    cpSync(destination, backup, { recursive: true });
  }

  try {
    rmSync(destination, { recursive: true, force: true });
    cpSync(source, destination, { recursive: true });
    const skillPath = join(destination, "SKILL.md");
    writeFileSync(skillPath, stampSkillVersion(readFileSync(skillPath, "utf8"), version), "utf8");
    if (hasBackup) rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    if (hasBackup && existsSync(backup)) {
      rmSync(destination, { recursive: true, force: true });
      cpSync(backup, destination, { recursive: true });
      rmSync(backup, { recursive: true, force: true });
    }
    throw error;
  }
}
