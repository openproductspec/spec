#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validateProductSpecMarkdown } from "./index.js";

const [command, filePath] = process.argv.slice(2);

if (command !== "validate" || !filePath) {
  console.error("Usage: productspec validate path/to/file.product-spec.md");
  process.exit(1);
}

const result = validateProductSpecMarkdown(readFileSync(filePath, "utf8"));

if (result.valid) {
  console.log(`${filePath}: valid`);
  process.exit(0);
}

for (const error of result.errors) {
  console.error(`${error.code}: ${error.message}`);
}
process.exit(1);
