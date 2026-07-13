# @productspec/parser

Reference parser, validator, CLI, and MCP server for
[ProductSpec](https://github.com/gokulrajaram/ProductSpec), the open standard
for product intent before implementation.

## Install

```bash
npm install @productspec/parser
```

## CLI

```bash
# Validate a Product Spec
npx --yes -p @productspec/parser productspec validate path/to/file.product-spec.md

# Validate a Decision Trace
npx --yes -p @productspec/parser productspec validate-trace path/to/file.decision-trace.json

# Validate an Agent Run
npx --yes -p @productspec/parser productspec validate-run path/to/file.agent-run.json

# Resolve the spec dependency graph under a directory
npx --yes -p @productspec/parser productspec graph path/to/spec-directory

# Scaffold a new Product Spec
npx --yes -p @productspec/parser productspec init path/to/new.product-spec.md

# Run the MCP server over stdio
npx --yes -p @productspec/parser productspec mcp
```

## Library

```ts
import { validateProductSpecMarkdown, validateDecisionTraceJson, validateAgentRunJson } from "@productspec/parser";

const result = validateProductSpecMarkdown(markdown);
if (!result.valid) {
  for (const error of result.errors) console.error(error.code, error.message);
}
```

See the [ProductSpec repository](https://github.com/gokulrajaram/ProductSpec)
for the specification, schemas, examples, and documentation.

## License

MIT
