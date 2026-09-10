# @lovedolove/dsh-project-memory

DSH bundle plugin that mounts the 8 Project Memory skills into any DeepSeek Harness profile, registers the `/project-memory` slash command, injects first-time-init hints when no `AGENTS.md` exists, and optionally bridges to the `codebase-memory-mcp` for `cbm_*` tools.

**Part of [Project Memory Agent](../README.md).**

---

## Quick Install

```powershell
dsh plugin --profile web add @lovedolove/dsh-project-memory
```

The plugin reads skills from your workspace (or falls back to global directories) and wires them into the active DSH profile at runtime.

---

## What It Does

| Feature | Description |
|---|---|
| **Skill Mount** | Discovers and registers the 8 Project Memory skills from `skills/` in the workspace root, or from global directories (`~/.agents/skills/`, `~/.claude/skills/`, `~/.config/opencode/skills/`). |
| **Slash Command** | Registers `/project-memory` — automatic state detection, initialization, audit, update, and verification in one command. |
| **First-Time Init Hint** | When `AGENTS.md` is absent from the workspace, injects a one-time hint to run the `memory-architecture` skill to bootstrap the Project Knowledge System. |
| **Post-Task Compounding** | After substantial tasks, prompts the agent to consider whether durable learning should be extracted via the `knowledge-compounding` skill. |
| **Freshness Warning** | Checks domain `README.md` indexes for `pending_updates > 0` and warns on session start if any child documents have been updated since the index was last refreshed. |
| **cbm_* Bridge** | When `codebase-memory-mcp` is installed and `ctx.tools` is available, registers semantic search, snippet, architecture, and trace tools (`cbm_*`). |

---

## Slash Command: `/project-memory`

```
/project-memory [--trace]
```

**What it does:**
- Detects whether the workspace already has an `AGENTS.md`
- If **missing**: runs the full initialization workflow (discover → audit → classify → architect → edit → verify)
- If **present**: runs an audit that only touches what has changed since last memory update
- Optional `--trace` flag enables retrieval tracing for debugging

No preset selection, no skill picking, no manual mode arguments.

---

## Integration Points

### Skills Registered

The plugin auto-discovers skills from the following locations (in priority order):

1. `<workspace>/skills/` — project-level skills
2. `~/.agents/skills/` — Codex / universal
3. `~/.claude/skills/` — Claude
4. `~/.config/opencode/skills/` — OpenCode

This means the plugin works regardless of where your skills are installed — it finds and registers them dynamically.

### cbm_* Tools (Optional)

When the `codebase-memory-mcp` executable is found (via `CBM_EXE` env var, common install paths, or `PATH`), the plugin registers these read-only codegraph tools:

| Tool | Purpose |
|---|---|
| `cbm_projects` | List indexed projects with git status and node/edge counts |
| `cbm_search` | Semantic graph search by function/class/route/variable name |
| `cbm_snippet` | Read source code for a symbol (get_code_snippet) |
| `cbm_arch` | Architecture overview with Leiden community clustering |
| `cbm_trace` | Call-chain, data-flow, and cross-service path tracing |
| `cbm_search_code` | Grep-like text search enriched with graph context |

> **Note:** `codebase-memory-mcp` must be installed separately. See the [codebase-memory](https://github.com/jiayan-xu/dsh-codebase-memory) project.

### First-Time Init Hint

When a session starts in a workspace without `AGENTS.md`, the plugin injects a hint like:

> Project Memory: this workspace has no AGENTS.md yet — run the `memory-architecture` skill to bootstrap the Project Knowledge System.

This only fires once per agent per session and can be dismissed.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `COMPOUNDING_ENABLED` | `true` | Set to `0`, `false`, or `off` to disable post-task compounding prompts |
| `CBM_EXE` | *(auto-detect)* | Override the `codebase-memory-mcp.exe` path |

---

## Directory Layout

```
dsh-plugin/
├── package.json                  # npm manifest
├── cordis.patch.yml              # DSH bundle patch (one-row Cordis hook)
├── dsh/
│   ├── plugin.mjs                # Main entry: skill mount, event hooks, slash command
│   ├── slash-project-memory.mjs  # /project-memory command handler
│   └── codebase-memory-bridge.mjs # cbm_* tool registration & MCP client
└── node_modules/                 # Runtime dependencies (not bundled)
```

The plugin is a single Cordis row loaded via `cordis.patch.yml`. The patch entry:

```yaml
- insert:
    - id: project-memory-dsh
      name: '@lovedolove/dsh-project-memory/dsh'
```

---

## Version & Compatibility

| Requirement | Version |
|---|---|
| **DSH** | `>=0.1.2-rc.1 <0.2.0-0` |
| **Node.js** | `>=18.0.0 <25.0.0` |
| **Cordis (peer)** | `>=4.0.1-rc.1 <5.0.0-0` |
| **dsh-tools (peer)** | `>=0.1.2-rc.1 <0.2.0-0` |

Current package version: `0.4.29`

---

## License

MIT — see [LICENSE](../LICENSE).
