# Project Memory

[![npm](https://img.shields.io/npm/v/@lovedolove/dsh-project-memory?label=npm&style=flat-square)](https://www.npmjs.com/package/@lovedolove/dsh-project-memory)
[![GitHub Stars][stars-shield]][stars-url] [![License][license-shield]][license-url] [![Platform][platform-shield]][platform-url]

> **Durable, evidence-backed memory for coding agents.**

Project Memory gives every coding agent a single, trustworthy knowledge base for your repository — so it stops re-learning the same facts and writing conflicting "memory" files.

```text
Discover → Verify → Classify → Compound → Reconstruct → Single Source of Truth
```

Code tells agents **what exists**. Project Memory helps them remember **why** — and reconciles every place that already tried to write it down.

[🇨🇳 简体中文](./README.zh-CN.md)

---

## Table of Contents

- [Why it matters](#why-it-matters)
- [Quick Start](#quick-start)
- [Supported Platforms](#supported-platforms)
- [Engineering Memory Agent (EMA)](#engineering-memory-agent-ema)
  - [Core Capabilities](#core-capabilities)
  - [CLI Tooling](#cli-tooling)
  - [Model Context Protocol (MCP) Server](#model-context-protocol-mcp-server)
  - [DSH Plugin & Slash Commands](#dsh-plugin--slash-commands)
- [DeepSeek Harness (DSH) Plugin](#deepseek-harness-dsh-plugin)
- [How to Use](#how-to-use)
- [What It Does](#what-it-does)
- [Skills](#skills)
- [Knowledge Architecture](#knowledge-architecture)
- [Prerequisites & Limitations](#prerequisites--limitations)
- [Testing](#testing)
- [Architecture & Research Documentation](#architecture--research-documentation)
- [License](#license)

---

## Why it matters

Without reconciled memory, every agent (and every AI tool) re-discovers the architecture, re-tries the rejected approach, and writes its own slightly different conclusion. You end up with several disagreeing "sources of truth."

With Project Memory, that knowledge is discovered, verified against actual code, and rebuilt into **one canonical memory** that the next agent loads from a single trustworthy place.

---

## Quick Start

```powershell
# Install to all supported platforms (OpenCode, Codex, Claude, DSH, Global)
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

The installer downloads the orchestrator agent and its 8 skills into your chosen tool's global config. Pick a target from the interactive menu (`1` OpenCode · `2` Codex · `3` Claude · `4` DSH · `5` Global · `6` All). Via `irm | iex` it defaults to `all` non-interactively.

### Supported Platforms

| Target | Skills Location | Agent File |
|:------:|-----------------|------------|
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/agents/project-memory.md` |
| Codex | `~/.agents/skills/` | `~/.codex/agents/project-memory.toml` |
| Claude | `~/.claude/skills/` | `~/.claude/agents/project-memory.md` |
| DSH | CLI: `dsh plugin add …` | `~/.dsh/.agent-presets/project-memory/` |
| Global | `~/.agents/skills/` | `~/.agents/agents/project-memory.md` |

> `all` writes skills to both `~/.claude/skills` and `~/.agents/skills` (no OpenCode double-load), seeds agent files for all platforms, and prints DSH plugin commands.

**Local options:** `-Target all`, `-Verify` (dry-run), `-Branch dev`, `-Target dsh`.
**Codex note:** requires `[features] multi_agent = true` in `~/.codex/config.toml` (installer prints this; never edits your config).

---

## Engineering Memory Agent (EMA)

Engineering Memory Agent (EMA) extends Project Memory with a formal four-dimensional lifecycle model, authoritative 6-stage retrieval, six-boundary hard isolation, grounded evidence anchors, candidate queueing, and a standalone stdio MCP server.

### Core Capabilities

- **Interactive Visual Memory Graph**:
  - Live full-screen dark-theme force-directed knowledge graph (`ema ui`).
  - Real-time multi-dimensional node coloring: Emerald (`#10b981`) for Canonical/Verified, Amber (`#f59e0b`) for Quarantined Candidates, Crimson (`#ef4444`) with animated glowing rings for Contradictions & Conflicts, Slate (`#64748b`) for Historical/Superseded.
  - Interactive slide-over inspection drawer with grounded evidence anchors, Markdown previews, and one-click promotion actions.
- **Built-in Vector Model & sqlite-vec Hybrid RRF Search**:
  - Out-of-the-box 384-dimensional feature-hash & subword n-gram semantic vectorizer (zero network dependencies, zero API keys required).
  - Reciprocal Rank Fusion (RRF) combining FTS5 lexical precision with KNN cosine distance in `sqlite-vec`.
  - Extensible to remote neural embeddings (`EMA_EMBEDDING_API_KEY`, `OPENAI_API_KEY`, `EMA_EMBEDDING_URL`).
- **Autonomous Distillation & Ingestion Engine**:
  - One-click memory capture from Git diffs, commits, or task summaries (`ema ingest`).
  - Automatically parses modified files, hunk line ranges, and symbols into grounded evidence anchors (`ema://evidence/...#sym:...`, `#line:...`).
  - Strictly adheres to the Quarantined Candidate invariant: extracted knowledge enters `.ema/candidates/` with `authority_level: Candidate` and `validation_state: Unreviewed` (never directly modifying canonical `docs/`).
- **Four Orthogonal Lifecycle Dimensions**:
  - `status`: `Draft` | `Current` | `Deprecated` | `Superseded` | `Historical` | `Abandoned`
  - `validation_state`: `Unreviewed` | `Needs Review` | `Potentially Stale` | `Verified` | `Invalid` | `Quarantined`
  - `authority_level`: `Candidate` | `Derived` | `Canonical`
  - `confidence`: `High` | `Medium` | `Low`
- **Authoritative 6-Stage Retrieval Pipeline**:
  `Stage 1: Authorization Gate` → `Stage 2: Candidate Retrieval (Hybrid RRF)` → `Stage 3: Lifecycle Filtering` → `Stage 4: Multi-Dimensional Ranking` → `Stage 5: Contradiction Surfacing` → `Stage 6: Context Assembly`.
- **Zero Silent Contradiction Resolution**: Contradicting knowledge units are surfaced explicitly with warning banners; neither is silently suppressed.
- **Candidate Isolation & Multi-Repo Promotion**: Unreviewed knowledge is quarantined in `.ema/candidates/` with `authority_level: Candidate`. Promoting to `global` scope requires $\ge 2$ independent repository sources.
- **Evidence Anchoring**: Grounded via immutable URIs: `ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>`.
- **6-Boundary Hard Isolation**: Storage, Index, Query (zero-knowledge), Authorization (404 No-Probe), Promotion, and Export boundaries.
- **Canonical Markdown Ownership**: Markdown files in `docs/` remain the single source of truth. The SQLite + `sqlite-vec` index (`.ema/index.db`) is derived and fully rebuildable.

### CLI Tooling

The EMA CLI is available directly via Node.js in `dsh-plugin/bin/ema-cli.mjs` (or via `npx ema` / `npm link`):

```bash
# Launch the interactive Visual Memory Graph Web UI
node dsh-plugin/bin/ema-cli.mjs ui --port 3888

# Auto-distill and capture knowledge from working tree git changes into candidate queue
node dsh-plugin/bin/ema-cli.mjs ingest --git

# Auto-distill from a specific patch or diff file
node dsh-plugin/bin/ema-cli.mjs ingest --diff ./fix.patch

# Distill engineering knowledge from an explanation or incident text
node dsh-plugin/bin/ema-cli.mjs ingest --text "Fixed race condition in token refresh by using mutex"

# Review and promote an approved candidate to project canonical storage
node dsh-plugin/bin/ema-cli.mjs promote <candidate_id> project

# Check database health, schema version, unit counts, and candidate queue
node dsh-plugin/bin/ema-cli.mjs status

# Validate all repository knowledge documents against EKU Schema v2
node dsh-plugin/bin/ema-cli.mjs verify docs

# Execute authoritative 6-stage hybrid memory recall (FTS5 + sqlite-vec RRF)
node dsh-plugin/bin/ema-cli.mjs recall "cordis plugin injection"

# Rebuild the derived SQLite + sqlite-vec vector index from canonical Markdown
node dsh-plugin/bin/ema-cli.mjs index docs

# View CLI help and usage options
node dsh-plugin/bin/ema-cli.mjs help
```

### Model Context Protocol (MCP) Server

EMA includes a standalone stdio JSON-RPC 2.0 MCP server:

```bash
# Start the MCP server over stdio
node dsh-plugin/bin/ema-mcp.mjs
```

Available tools registered by the MCP server:
- `ema_recall`: Authoritative hybrid recall across authorized scopes (`query`, `limit`, `scope`, `actor`).
- `ema_distill`: Automatically distill knowledge from Git diffs or text into the candidate queue with grounded evidence anchors.
- `ema_add`: Submit new candidate knowledge manually into `.ema/candidates/`.
- `ema_context`: Assemble budget-capped static context injection for prompts.
- `ema_validate`: Update validation state and record validation audit trail.
- `ema_promote`: Promote knowledge units to broader scopes (`project`, `workspace`, `global`).

### DSH Plugin & Slash Commands

When mounted in DeepSeek Harness, the plugin registers both `/project-memory` and `/ema`:

```text
/ema recall <query>        # Authoritative recall with provenance headers
/ema status                # Memory health, index stats, and candidate queue
/ema verify                # Validate all documentation units
/ema promote <id> <scope>  # Promotes a validated candidate EKU
/ema                       # Interactive memory inspection & compounding workflow
```

---

## DeepSeek Harness (DSH) Plugin

The project ships a **DSH bundle plugin** (`@lovedolove/dsh-project-memory`) that mounts all 8 Project Memory skills into any DSH profile via the built-in skill registry. It also registers `cbm_*` tools (codebase-memory bridge) when the `codebase-memory-mcp` is available, injects a first-time-init hint when no `AGENTS.md` is found, and registers the `/project-memory` slash command.

See [dsh-plugin/README.md](./dsh-plugin/README.md) for plugin-specific details.

### Install

```powershell
# Interactive — shows the commands for your profile
.\install.ps1 -Target dsh

# Explicitly target your web profile
.\install.ps1 -Target dsh -DshProfile web
```

The installer will print the plugin add command. Run it manually:

```powershell
dsh plugin --profile web add @lovedolove/dsh-project-memory
```

### Usage

#### One-Click Command (Recommended)

After install, the one-click command is available in any DSH session:

```
/project-memory
```

This automatically detects the repository's Project Memory state and runs the
appropriate workflow — no Agent selection, no skill picking, no mode arguments.

Optional `--trace` flag enables retrieval tracing for debugging:

```
/project-memory --trace
```

#### Advanced: Direct Agent Invocation

For full control, dispatch the orchestrator as a subagent:

```powershell
use_agent(agent: "project-memory", prompt: "compound my last task")
```

**Plugin internals:** the npm package (`dsh-plugin/`) uses a single-row Cordis patch that loads the runtime glue (`dsh/plugin.mjs`), which dynamically registers skills relative to the active workspace, registers the `/project-memory` slash command, and injects a first-time-init hint when no `AGENTS.md` is found.

---

## How to Use

### Slash Command (DSH only)

```
/project-memory
```

See the [DSH Plugin](#deepseek-harness-dsh-plugin) section for installation and full usage.

### Agent Preset (All platforms)

Invoke the orchestrator agent directly in any supported agent:

```
@project-memory
```

It discovers existing knowledge, inspects the repository, verifies claims against real evidence, and reports what to keep, change, merge, or remove — across every origin tool, not just its own files.

**Typical tasks:** *audit this repo*, *build memory for a repo that already has docs*, *reconcile conflicting AGENTS.md / CLAUDE.md*, *compound lessons after this feature*.

---

## What It Does

| Capability | Description |
|---|---|
| [D] **Discover** | Inventories every pre-existing knowledge source with provenance |
| [V] **Verify** | Claims checked against code, tests, config, CI, Git — never assumed current |
| [C] **Classify** | One canonical type per claim; conflicts settled by evidence, not file age |
| [Co] **Compound** | Durable Solutions and Lessons instead of more documents |
| [Cl] **Clean** | Deletes obsolete knowledge regardless of origin |
| [S] **Single Truth** | One primary home per concept; everything else references it |
| [L] **Lean** | Aggressively deduplicated — no rule in two places |
| [A] **Self-Audit** | Quality bar (Memory Health) + Self-Audit directive to catch drift |

---

## Skills

Eight specialized skills instead of one huge prompt:

| Skill | Responsibility |
|---|---|
| `knowledge-discovery` | Inventory every pre-existing knowledge source, with provenance |
| `repository-audit` | Gather repository evidence (code, tests, CI, Git) |
| `knowledge-classification` | Classify claims and resolve cross-source conflicts |
| `knowledge-compounding` | Turn experience into reusable Solutions & Lessons |
| `memory-architecture` | Design hierarchy, navigation, progressive loading |
| `obsolete-knowledge` | Handle stale, deprecated, or superseded knowledge |
| `memory-edit` | Apply approved documentation changes |
| `memory-verification` | Final consistency and quality gate |

The orchestrator loads these progressively — you rarely invoke one directly. It can also delegate to `codebase-memory` (read-only code graph) and `cavecrew-builder` (bounded edits). Every rule has exactly one canonical owner across the agent and skills; skills reference each other instead of duplicating, so guidance can't drift apart.

---

## Knowledge Architecture

`AGENTS.md` is the single entry point; everything else is referenced, not duplicated.

```
AGENTS.md
   +-- docs/architecture.md      -> system design, DSH plugin internals
   +-- docs/solutions/           -> diagnosed fix patterns
   +-- docs/lessons/             -> reusable engineering principles
   +-- skills/<name>/SKILL.md    -> detailed skill instructions
   +-- templates/                -> document templates
```

Domains are a pattern, not a mandatory scaffold — only create what holds verified knowledge.

### Templates

Templates provide starting points for new knowledge documents:

- `templates/TEMPLATE.md` — Solution document with dual-track schema (Bug + Knowledge)
- `templates/CONCEPTS.md` — Project vocabulary with accretion/seeding/mutations
- `templates/SOLUTIONS.md` — Index template for tracking all Solutions
- `templates/schema.yaml` — Canonical frontmatter contract

### Reference Files

Detailed guidance lives in each skill:

- `skills/knowledge-compounding/references/` — Grounding validation, durable bar, quality constraints, session history, auto-memory

---

## Prerequisites & Limitations

- **Prerequisites**: Node.js `>= 18.0.0` (Node.js 20+ or 24 recommended).
- **Runtime Dependencies**: `better-sqlite3` and `sqlite-vec` in `dsh-plugin/`.
- **Disposable Cache**: The derived database `.ema/index.db` is purely a local cache; deleting it does not destroy any canonical knowledge.
- **Current Vector Status**: `sqlite-vec` foundation and schema are implemented; semantic vector embeddings are staged for future embedding provider integrations, while lexical FTS5 search is fully active.

---

## Testing

```bash
# Run the complete EMA unit, integration, and security test suite (172 tests)
cd dsh-plugin
node --test "test/**/*.test.mjs" "test/*.test.mjs"

# Run installer test suite
Invoke-Pester ./install.tests.ps1
```

12 tests cover installer targets, the no-double-load rule, and a guardrail keeping the 8 skills, their manifest, and both agent files in sync. The EMA suite covers 172 tests across schema validation, evidence grounding, derived SQLite indexing, fail-closed policy, 6-stage retrieval, promotion pipelines, DSH hooks, and stdio MCP server.

---

## Architecture & Research Documentation

For detailed architecture specifications and the phased implementation reports:

- [EMA Development Plan](docs/research/ema/development-plan.md) — 9-phase evolution roadmap and milestones
- [EMA Architecture Blueprint](docs/research/ema/ema-architecture-blueprint.md) — Deep architectural specification
- [Architecture Approval Candidate](docs/research/ema/architecture-approval-candidate.md) — Invariants, governance, and security model
- [Change Audit Log](docs/CHANGELOG-MEMORY.md) — Chronological ledger of all memory system changes
- [Phase 1–9 Reports](docs/research/ema/) — Individual phase implementation reports and verification reviews

---

## License

MIT — see [LICENSE](LICENSE).

---

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE
[platform-shield]: https://img.shields.io/badge/platforms-OpenCode%20%7C%20Codex%20%7C%20Claude%20%7C%20DSH-blue?style=flat-square
[platform-url]: https://github.com/LoveDoLove/Project-Memory-Agent
