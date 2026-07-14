import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = join(packageRoot, "..", "..");
const { stampSkillVersion } = await import(new URL("../dist/upgrade.js", import.meta.url));

const version = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")).version;
const sourceSkills = join(repoRoot, "skills");
const sourceChangelog = join(repoRoot, "CHANGELOG.md");

if (!existsSync(sourceSkills) || !existsSync(sourceChangelog)) {
  console.error("error: repository skills/ and CHANGELOG.md are required to package assets");
  process.exit(1);
}

cpSync(sourceChangelog, join(packageRoot, "CHANGELOG.md"));

const packagedSkills = join(packageRoot, "skills");
rmSync(packagedSkills, { recursive: true, force: true });
cpSync(sourceSkills, packagedSkills, { recursive: true });

for (const entry of readdirSync(packagedSkills, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillPath = join(packagedSkills, entry.name, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  writeFileSync(skillPath, stampSkillVersion(readFileSync(skillPath, "utf8"), version), "utf8");
}

console.log(`packaged skills and CHANGELOG.md at v${version}`);
