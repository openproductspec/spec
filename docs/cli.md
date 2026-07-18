# ProductSpec CLI Reference

The `productspec` CLI reads, validates, and drives a Product Spec library from the shell.

It reaches every operation the MCP server exposes. The CLI and the MCP are two adapters over
one function layer (`parsers/ts/src/mcp-tools.ts`), so their output cannot drift. The CLI is
the more portable surface: it runs in any shell, any CI job, and any script, with no client to
install and no tool definitions to load into context first. Use the MCP when an agent already
speaks it or when you need a typed tool surface; use the CLI for everything else.

Every read command supports `--json` for machine-readable output.

## Invoke

```bash
# One-off, no install
npm exec --package @productspec/parser -- productspec <command> [args]
npx --yes -p @productspec/parser@latest productspec <command> [args]

# Installed
productspec <command> [args]
```

Show the full command reference at any time:

```bash
productspec --help
productspec help
```

## Commands

### Read a spec

| Command | Description |
|---|---|
| `productspec validate <file> [--json]` | Validate one Product Spec. Exit 0 if valid, 1 if not. `--json` prints the full validation result. |
| `productspec show <file> [--json]` | Show a parsed Product Spec. Human output is a summary (title, revision, sections). `--json` prints the full parsed document. |
| `productspec get <file> <section> [--json]` | Read one section. `section` is one of `summary`, `scope`, `acceptance`, `evals`, `metrics`, `related`, `evidence`. |
| `productspec list <dir> [--json]` | List every `.product-spec.md` under a directory, with validity, title, and revision. Defaults to the current directory. |

### Plan a spec library

| Command | Description |
|---|---|
| `productspec graph <dir> [--json]` | Resolve `product_spec` links across a folder into `buildable`, `blocked`, `order`, `waves`, `contention`, and `unscoped`. Paths are relative to `<dir>`. |

`waves` are sets of specs that share no surface and whose dependencies are met, so two agents
never land in the same files. `contention` names the surfaces more than one live spec claims
through `applies_to`.

### Build contract

| Command | Description |
|---|---|
| `productspec handoff <file> [out.md]` | Generate the Agent Handoff build contract. Prints to stdout, or writes to `out.md` if given. |
| `productspec check-claim <file> [--claim "<text>"] [--json]` | List the Acceptance Criteria to verify and AI Evals to run or review before an agent claims the work is done. |

### Detect drift

Sessions are stateless on the CLI: `session begin` prints the pin, and you pass it back to
`session check`. (The MCP server keeps the pin in memory across tool calls; the CLI runs one
process per command, so the pin travels on the command line.)

| Command | Description |
|---|---|
| `productspec session begin <file> [--json]` | Pin the spec's revision and content hash. Prints the pin and the exact `session check` command to run later. |
| `productspec session check <file> --against <content_hash> [--revision <n>] [--json]` | Report whether the spec changed since the pinned hash. |

The content hash covers the whole file, so `--against <hash>` alone detects any change,
including a `spec_revision` bump. `--revision` is optional and adds a revision-level
cross-check on top of the hash.

`session check` exits 0 when the current spec is valid (whether or not it changed) and 1 when
the current spec is invalid. The `changed` field carries the drift signal for scripting.

### Scaffold and receipts

| Command | Description |
|---|---|
| `productspec init <file>` | Scaffold a new Product Spec. |
| `productspec init-run <file> [out.json]` | Draft an Agent Run receipt with every AC, EVAL, and SM unchecked. |
| `productspec validate-run <file.agent-run.json>` | Validate an Agent Run receipt. |
| `productspec validate-trace <file.decision-trace.json>` | Validate a Decision Trace. |

### MCP

| Command | Description |
|---|---|
| `productspec mcp` | Run the MCP server over stdio. |
| `productspec mcp-config claude\|cursor` | Print MCP client config for Claude or Cursor. |

## Flags

| Flag | Applies to | Meaning |
|---|---|---|
| `--json` | validate, show, get, list, graph, check-claim, session begin/check | Machine-readable JSON output. |
| `--claim "<text>"` | check-claim | The completion claim being made. |
| `--against <hash>` | session check | The pinned content hash from `session begin`. Required. |
| `--revision <n>` | session check | The pinned spec revision from `session begin` (a non-negative integer). Optional; the hash alone detects changes. |
| `--help`, `-h` | any | Print the command reference and exit 0. |

## Argument syntax

- A value flag accepts either form: `--claim "text"` or `--claim=text`.
- Flag values never shift positional arguments: `check-claim --claim x spec.md` analyzes `spec.md`, not `x`.
- `--` ends option parsing, so a file whose name starts with `-` can be passed after it.
- Unknown options are rejected with a nonzero exit, so a typo like `--jso` fails loudly instead of silently printing non-JSON.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. For `validate`, the spec is valid. For `session check`, the current spec is valid. |
| 1 | Failure: invalid spec, missing file, unknown command or section, missing required flag, or an invalid current spec on `session check`. |

## Examples

```bash
# List a folder and read one section as JSON
productspec list specs
productspec get specs/checkout.product-spec.md acceptance --json

# Plan a folder into waves before dispatching agents
productspec graph specs --json

# What must an agent verify before claiming done
productspec check-claim specs/checkout.product-spec.md --claim "shipped 3DS recovery"

# Pin a spec, then check for drift after a long-running task
productspec session begin specs/checkout.product-spec.md
productspec session check specs/checkout.product-spec.md --against sha256:abc123 --revision 2
```

## CLI and MCP parity

Every command above maps to a function in `parsers/ts/src/mcp-tools.ts` that the matching MCP
tool also wraps. `parsers/ts/tests/cli.test.ts` asserts the CLI output equals that function's
output, so a change that ships on only one surface fails CI. When you add an operation, add it
to both surfaces. See `CONTRIBUTING.md`, "Surface Parity (CLI and MCP)".

| CLI command | MCP tool | Shared function |
|---|---|---|
| `validate` | `validate_product_spec` | `validateProductSpec` |
| `show` | `get_product_spec` | `getProductSpec` |
| `get <file> summary` | `get_product_summary` | `getProductSummary` |
| `get <file> scope` | `get_scope` | `getScope` |
| `get <file> acceptance` | `get_acceptance_criteria` | `getAcceptanceCriteria` |
| `get <file> evals` | `get_ai_evals` | `getAiEvals` |
| `get <file> metrics` | `get_success_metrics` | `getSuccessMetrics` |
| `get <file> related` | `get_related_artifacts` | `getRelatedArtifacts` |
| `get <file> evidence` | `get_evidence_checklist` | `getEvidenceChecklist` |
| `list` | `list_product_specs` | `listProductSpecs` |
| `graph` | `get_spec_graph` | `getSpecGraph` |
| `handoff` | `get_agent_handoff` | `generateAgentHandoff` |
| `check-claim` | `check_completion_claim` | `checkCompletionClaim` |
| `session begin` | `begin_spec_session` | `beginSpecSession` |
| `session check` | `check_spec_session` | `checkSpecSession` |
| `init-run` | `draft_agent_run` | `draftAgentRun` |
