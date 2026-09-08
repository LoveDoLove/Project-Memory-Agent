---
title: "Project Memory - System Architecture"
category: reference
status: active
created: "2026-09-05"
last_verified: "2026-09-05"
tags:
  - architecture
  - dsh
  - plugin
---

# System Architecture

This document describes how Project Memory works at the system level.

---

## Two Components

Project Memory has two distinct parts that serve different purposes:

### 1. Skills + Agents (cross-platform)

The core memory pipeline: 8 specialized skills plus an orchestrator agent.
Installed into each tool via `install.ps1`:

```
~/.claude/skills/          <- Claude / Codex (shared)
~/.config/opencode/skills/ <- OpenCode
~/.agents/skills/          <- Global (Codex + Claude Code)
~/.dsh/agents/             <- DSH agent seeding (CLI: `dsh plugin add`)
```

### 2. DSH Plugin (npm package)

A DeepSeek Harness bundle plugin (`@lovedolove/dsh-project-memory`) that
mounts skills dynamically from the workspace's `skills/` directory into
any DSH profile via Cordis. install.ps1 also seeds `project-memory.md` into
`~/.dsh/agents/` so the orchestrator is callable via
`use_agent(agent: "project-memory")` once the user runs
`dsh plugin add @lovedolove/dsh-project-memory`.

---

## DSH Plugin Architecture

### Package Structure

```
dsh-plugin/
  package.json              -> declares @deepseek-ai/dsh-llm dep; peerDep on @deepseek-ai/cordis
  cordis.patch.yml          -> two-row Cordis patch (pma-skill-dir insert + project-memory-dsh)
  dsh/plugin.mjs            -> real logic: skill mount, lifecycle hooks, cbm_* tools
  lib/index.js              -> deliberate no-op stub (empty inject array). All behavior
                              is in dsh/plugin.mjs loaded via cordis.patch.yml insert row.
```

`lib/index.js` exists only to satisfy the npm package entry-point requirement.
Its `inject = []` means the bundle framework loads nothing from it — all actual
mounting happens through the Cordis patch in `dsh/plugin.mjs`.

DSH profiles declare which npm packages to load as bundles in
`package.json`:

```json
{
  "dsh": {
    "profile": {
      "bundles": ["@deepseek-ai/dsh-base", ..., "@lovedolove/dsh-project-memory"]
    }
  }
}
```

Each bundle package may declare a `dsh.bundle.patch` pointing to a
`cordis.patch.yml` file. DSH applies each bundle's patch layer in order,
then applies the profile's own `cordis.patch.yml` on top.

### Two-Layer Patch System

```
dsh-base            -> cordis.patch.yml (core plugins)
dsh-web-app         -> cordis.patch.yml (web UI plugins)
...
@lovedolove/dsh-project-memory -> cordis.patch.yml (skill mount + glue)
────── BUNDLE LAYERS ABOVE ──────
────── PROFILE PATCH BELOW ──────
profile/cordis.patch.yml (user customizations, kept empty by default)
```

The plugin's `cordis.patch.yml` adds two rows:

1. **`pma-skill-dir`** (insert) — registers the workspace's `skills/` directory
   as a custom skill root (avoids colliding with the official `skill-filesystem`
   entry owned by `@deepseek-ai/dsh-skill-filesystem` / `dsh-skills-manager`).
2. **`project-memory-dsh`** (insert) — loads `dsh/plugin.mjs`, the runtime glue
   that re-registers skills dynamically, injects first-time-init hints,
   and posts-task memory prompts.

### Critical Design Rule

**Never write plugin loader entries to the profile's `cordis.patch.yml`.**
The plugin manages its own patches via the bundle mechanism. Writing the
same entries to both layers causes `duplicate loader entry id` errors at
boot time.

`install.ps1` only writes a clean empty layer to the profile patch.

### Runtime Glue (`dsh/plugin.mjs`)

The glue plugin exports:
- `name`: plugin identifier
- `inject`: `['skills', 'tools', 'commands']` - tells Cordis to wait until
  `ctx.skills`, `ctx.tools`, and `ctx.commands` are available before calling
  `apply()`
- `apply(ctx)`: registers workspace skills, listens for session events,
  injects prompts

---

## Skill Registration Flow

1. DSH loads bundles -> applies plugin's `cordis.patch.yml`
2. `pma-skill-dir` inserts a custom skill directory config row
3. `project-memory-dsh` runs `apply(ctx)` -> calls
   `registerWorkspaceSkills(ctx, workspaceRoot)`
4. Plugin discovers all `skills/*/SKILL.md` files in the workspace
5. Each skill is registered with `ctx.skills.register()`

Result: all 8 Project Memory skills become available in the session.

---

## Progressive Loading Levels

| Level | What's Read | Purpose |
|---|---|---|
| 0 | `AGENTS.md` | Project identity, critical rules, **L0 domain summaries** for quick scanning |
| 1 | `docs/<domain>/README.md` | Domain orientation, when to read each unit |
| 2 | `docs/<domain>/<topic>.md` | Focused knowledge unit with evidence |
| 3 | `skills/<name>/SKILL.md` | Skill instructions (on demand) |

### L0 Domain Summaries (Level 0 Enhancement)

`AGENTS.md` now includes an `l0_domains` frontmatter section and a navigation
table with one-line summaries for each knowledge domain. Agents scan this table
**before** loading any domain README to decide which domain is relevant.

```yaml
l0_domains:
  architecture: "System design, DSH plugin internals, progressive loading model"
  solutions: "Diagnosed fix patterns for recurring issues and bugs"
  lessons: "Reusable engineering principles distilled from completed work"
```

This is a lightweight version of OpenViking's L0 abstract sidecar — human-maintained,
not auto-generated, preserving evidence discipline.

### Retrieval Trace Mode

Run `/project-memory --trace` to enable ephemeral retrieval tracing. The agent
records each knowledge lookup step (query → route → unit → evidence → confidence)
and prints the trace at the end of the session. Traces are **never persisted**
to repository files — they are session-ephemeral debug output only.

### Knowledge Change Audit Log

All edits are appended to [`docs/CHANGELOG-MEMORY.md`](../CHANGELOG-MEMORY.md).
This file records what changed, why, confidence level, and evidence source.
It enables rollbacks, drift detection, and transparent review of system
modifications. See [`skills/memory-edit/SKILL.md`](../../skills/memory-edit/SKILL.md#knowledge-change-audit-log).

---

## File Map

| Path | Role | Owner |
|---|---|---|
| `AGENTS.md` | Agent entry point with L0 domain summaries | `@project-memory` agent |
| `README.md` | Human introduction | `@project-memory` agent |
| `docs/CHANGELOG-MEMORY.md` | Knowledge change audit log (append-only) | `memory-edit` |
| `docs/architecture.md` | System design, DSH plugin internals, progressive loading levels | this document |
| `skills/*/SKILL.md` | Skill instructions | individual skill authors |
| `agents/project-memory.md` | DSH/Claude orchestrator | `@project-memory` |
| `agents/project-memory.toml` | Codex orchestrator | `@project-memory` |
| `templates/` | Knowledge document templates | `memory-architecture` |
| `dsh-plugin/` | npm package source | `dsh-plugin` |