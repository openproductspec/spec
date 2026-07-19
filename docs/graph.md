# The Spec Graph

`product_spec` related artifacts make a library of Product Specs traversable. The `graph` command resolves that traversal so a tool or an agent does not have to re-derive it file by file.

```bash
npm exec --package @productspec/parser -- productspec graph docs/product-specs/
```

The command walks the directory recursively, validates every `.product-spec.md` file, resolves `product_spec` links across the folder, and reports:

```
buildable:
  docs/product-specs/foundation/contact-profiles.product-spec.md
  docs/product-specs/intelligence/signals.product-spec.md
blocked:
  docs/product-specs/core/human-handoff.product-spec.md (waits on: docs/product-specs/intelligence/signals.product-spec.md)
order: ... -> ... -> ...
```

Add `--json` for the machine-readable form. Agents should prefer it:

```bash
npm exec --package @productspec/parser -- productspec graph docs/product-specs/ --json
```

## Semantics

- `depends_on` gates: the declaring spec waits on its target.
- `blocks` gates in reverse: the target waits on the declaring spec.
- `supersedes` and `relates_to` appear in `edges` and never gate.
- `buildable` lists specs with no unmet gating link inside the folder.
- `blocked` lists the rest, each with the exact specs it waits on.
- `order` is a dependency-respecting build order over the gating edges.

## Warnings

Warnings never fail the command. They surface graph problems a single-file validation cannot see.

| Warning | Cause |
|---|---|
| `missing_link_target` | A `depends_on` or `blocks` link points at a path that is not in the folder. A missing `depends_on` target blocks the declaring spec: the dependency is unresolved planning context, so the spec appears in `blocked` with the missing path in `waits_on`. A missing `blocks` target is warning-only, since nothing in the folder waits on it. |
| `dependency_cycle` | A set of specs waits on each other in a loop. Each cycle gets its own warning naming exactly its members, and cycle members are excluded from `order`. |
| `self_dependency` | A spec links to itself. The edge is ignored. |
| `duplicate_spec_path` | Two files normalize to the same path. The first stays in the graph. |
| `unsupported_link_path` | A `product_spec_path` is absolute. Paths are relative to the spec file; the edge is dropped. |
| `supersedes_cycle` | Two or more specs supersede each other in a loop. None of them can be the replacement, so none is treated as replaced and all of them stay in the fleet plan. |
| `unschedulable_dependency` | A spec waits on work that cannot be built, because a `supersedes` edge replaced it, a cycle traps it, or its link target is not in the graph. The waiting spec is in `blocked` and in no wave. A spec that is itself the fault is named by its own warning instead, so it does not get a second one. Point the dependency at work that can be built. |
| `skipped_invalid_spec` | A file failed validation and is not in the graph. Included in `--json` output. Fix the file with `productspec validate`. |

If every file in the folder fails validation, the command prints the skips and exits 1, the same way it treats a folder with no spec files at all.

Overlap matching is deliberately narrow: components compare as exact strings after trimming, so `auth service` and `Auth Service` do not match, and paths compare by whole segments, so `src/auth` contains `src/auth/tokens` but not `src/authorize`. The check knows nothing about `depends_on` or `blocks` sequencing, and an overlap by itself is not a problem; `applies_to` is traceability metadata, not an ownership claim.

## Fleets

`order` is a sequential build order. A fleet needs the other question answered: what can run *at the same time*. Two fields carry it.

`contention` lists every surface that more than one live spec touches, as `{ kind, value, specs }`, one entry per declared surface. Components match on the exact trimmed string. Paths match by whole segments, and a surface names every spec scoped at or above it, because a spec scoped to `src/api` edits inside `src/api/conversations` too.

Two specs collide when one's path contains the other's. That is a relation between a pair of specs, and sharing a parent directory does not create it. `src/api/v2` and `src/api/v3` both sit under `src/api`, so neither one ships beside a spec scoped to `src/api`, and the two of them ship together.

`waves` is the dispatch schedule: each wave is a set of specs whose dependencies are all satisfied by earlier waves and where no two members collide. Walk the waves in order and run each wave in parallel.

The guarantee is about declared surfaces, not files. No two specs in one wave declare a surface the other one touches. Whether that keeps two agents out of the same file depends on the specs being honest about their scope, which is the same thing every other part of the format already depends on.

Contention is reported, never warned about. Two specs sharing a surface is a fact, and often a deliberate one: a parent and a child split a directory on purpose. Warning about it would scold every library that has only ever used `applies_to` for traceability, which is what it was added for. The fact sits in `contention` for anyone dispatching agents, and `waves` acts on it. Both are advisory: the graph reports, the dispatcher decides.

`applies_to` is broad scope, so the schedule is conservative on purpose. A spec that declares `apps/web/src/` contends with everything under it, even if the work only touches one file in there. That is the safe direction to be wrong in, and it gives a library a reason to declare scope narrowly, which the agent skill already asks for when it tells an agent to use `applies_to` to find the relevant code.

A path that means the whole repository, written as `.` or `/`, is the widest scope there is. It contains every other path, so a spec that rewrites the repository never ships alongside a spec that edits one directory inside it, and it is named on every contended surface in the library. It does not drag the rest of the library into single file waves, though: the specs it holds back still only collide with each other where they actually nest.

A spec that is the target of a `supersedes` edge is replaced work. It stays in `order`, which describes the whole folder, and stays out of `waves`, which describes what a fleet should pick up. It also claims no surface, since the spec that replaced it owns that surface now.

The schedule is safe, not minimal. Finding the fewest possible waves is an expensive problem to solve exactly, so `waves` takes each spec in build order and puts it in the earliest wave where nothing collides with it. That never puts two colliding specs together, and it may occasionally use one wave more than a perfect packing would. A fleet wants the guarantee, not the last drop of parallelism.

## What the graph cannot see

`applies_to` is optional. A live spec that declares no surface is listed in `unscoped` and carries no contention, so it lands in the earliest wave its dependencies allow. That is unknown scope, not safe scope, and a fleet should treat it that way.

Components and paths are separate namespaces and never compare against each other. The graph does not infer that a component named `conversation` lives at `apps/api/src/conversations`; guessing that mapping from a string would produce false positives, and a contention report that cries wolf is worse than none. A library that wants surface safety across both namespaces declares both on the specs that need it.

`waves` only schedules specs that can actually be built. A spec caught in a dependency cycle, or blocked on a `depends_on` target that is not in the folder, is in neither `order` nor `waves`. A spec that waits on a spec which cannot be built is in `order` but in no wave, and `unschedulable_dependency` names the dependency that stranded it. Nothing leaves the schedule quietly.

## MCP

The same graph is available to agents as the `get_spec_graph` tool on the MCP server (`productspec mcp`), taking an optional `root` and returning the identical JSON shape. The graph does not know which agents are running. An agent about to start work reads `contention` to learn whether another spec would land on the surface it is about to edit, and `waves` to learn which specs it is safe to be working alongside.

## Graph vs. Garden

`graph` answers dependency planning: buildable, blocked, order, waves, contention, and unscoped specs.

`garden` uses the same graph and adds repo health: invalid specs, missing evidence, stale revision pins, Agent Run gaps, and Decision Trace gaps. Use `graph` when an agent only needs scheduling context. Use `garden` when a human or agent needs to know what needs attention across the ProductSpec library.

```bash
npm exec --package @productspec/parser -- productspec garden docs/product-specs --json
```

## Boundary

`resolveProductSpecGraph(inputs)` is a pure function in the parser package: it takes already-parsed documents with their paths and never touches the filesystem. The CLI owns file discovery and feeds it. Single-file validation stays single-file; the graph is a separate read over many documents. Nothing in this command changes the format, and a library that never uses `product_spec` links never sees it.
