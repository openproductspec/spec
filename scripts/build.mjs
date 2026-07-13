import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Prefer a reproducible install from the lockfile; fall back to install only
// when no lockfile is present.
const installCommand = existsSync("parsers/ts/package-lock.json") ? "ci" : "install";
run("npm", ["--prefix", "parsers/ts", installCommand]);
run("npm", ["--prefix", "parsers/ts", "run", "build"]);

await mkdir("dist", { recursive: true });
await writeFile("dist/cli.js", 'import "../parsers/ts/dist/cli.js";\n');
