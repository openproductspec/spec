---
name: productspec-upgrade
description: Upgrades installed ProductSpec agent skills to the latest published release and reports what changed. Use when asked to upgrade or update ProductSpec, or when the user wants to know what is new in ProductSpec since their installed version.
license: MIT
---

# Upgrading ProductSpec

ProductSpec ships two moving parts. The `@productspec/parser` npm package (CLI and MCP server) updates itself when launched through `npx --package @productspec/parser@latest`. The agent skills are Markdown files copied into repositories and agent skill directories, and those copies go stale silently. This skill refreshes the copies and tells the user what arrived.

## Step 1: Upgrade installed skills

```bash
npm exec --yes --package @productspec/parser@latest -- productspec upgrade-skills --json
```

The command looks for installed ProductSpec skills in `./skills/`, `./.claude/skills/`, and `~/.claude/skills/`, backs each one up, replaces it with the packaged copy, and stamps the new version into its frontmatter. Nothing outside those skill directories is touched. Every result reports `from` (the previously installed version, or `null` for unversioned copies), `to`, and an `action` of `upgraded`, `installed`, or `up-to-date`.

To refresh or vendor the skills into a specific directory instead of the detected locations:

```bash
npm exec --yes --package @productspec/parser@latest -- productspec upgrade-skills path/to/skills
```

Add `--dry-run` to preview without writing.

## Step 2: Collect what changed

Take the lowest non-null `from` version across the results. If every `from` is `null`, the installed copies predate version stamping; use the latest release only.

```bash
npm exec --yes --package @productspec/parser@latest -- productspec whats-new <from-version>
```

Without an argument, `whats-new` prints only the latest release entry.

## Step 3: Report to the user

Summarize the changelog entries between the old and new version as 5-7 bullets grouped by theme. Focus on user-facing capabilities: new CLI commands, new MCP tools, new artifact types, and validation changes. Skip internal refactors unless they change behavior.

Format:

```text
ProductSpec v{new} — skills upgraded from v{old}.

What's new:
- [bullet 1]
- [bullet 2]
- ...
```

If every result was `up-to-date`, say so plainly: "ProductSpec skills are already at v{version}." Do not print a changelog summary in that case unless the user asked what's new.

Close with one reminder when the MCP server is registered through `npx`: the running server picks up new releases on its next launch, so a connected client (Claude Code, Cursor) must restart or reconnect the server before new MCP tools appear.
