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
~/.claude/skills/          <- Claude / Codex
~/.config/opencode/skills/ <- OpenCode
~/.dsh/profiles/<name>/node_modules/ <- DeepSeek Harness
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

### Bundle Mechanism

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

1. **`skill-filesystem`** - registers the workspace's `skills/` directory
   as a custom skill root so the 8 Project Memory skills are discoverable
   via the skill registry.
2. **`project-memory-dsh`** - loads `dsh/plugin.mjs`, the runtime glue
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
- `inject`: `['skills']` - tells Cordis to wait until `ctx.skills` is
  available before calling `apply()`
- `apply(ctx)`: registers workspace skills, listens for session events,
  injects prompts

---

## Skill Registration Flow

1. DSH loads bundles -> applies plugin's `cordis.patch.yml`
2. `skill-filesystem` configures `customSkillDirs: [skills]`
3. `project-memory-dsh` runs `apply(ctx)` -> calls
   `registerWorkspaceSkills(ctx, workspaceRoot)`
4. Plugin discovers all `skills/*/SKILL.md` files in the workspace
5. Each skill is registered with `ctx.skills.register()`

Result: all 8 Project Memory skills become available in the session.

---

## Progressive Loading Levels

| Level | What's Read | Purpose |
|---|---|---|
| 0 | `AGENTS.md` | Project identity, critical rules, navigation |
| 1 | `docs/<domain>/README.md` | Domain orientation |
| 2 | `docs/<domain>/<topic>.md` | Focused knowledge unit |
| 3 | `skills/<name>/SKILL.md` | Skill instructions (on demand) |

---

## File Map

| Path | Role | Owner |
|---|---|---|
| `AGENTS.md` | Agent entry point | `@project-memory` agent |
| `README.md` | Human introduction | `@project-memory` agent |
| `docs/architecture.md` | System design | this document |
| `skills/*/SKILL.md` | Skill instructions | individual skill authors |
| `agents/project-memory.md` | DSH/Claude orchestrator | `@project-memory` |
| `agents/project-memory.toml` | Codex orchestrator | `@project-memory` |
| `templates/` | Knowledge document templates | `memory-architecture` |
| `dsh-plugin/` | npm package source | `dsh-plugin` |