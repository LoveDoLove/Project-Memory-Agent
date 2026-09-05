# Project Memory

[![npm](https://img.shields.io/npm/v/@lovedolove/dsh-project-memory?label=DSH%20plugin&style=flat-square)](https://www.npmjs.com/package/@lovedolove/dsh-project-memory)
[![GitHub Stars][stars-shield]][stars-url] [![License][license-shield]][license-url] [![Platform][platform-shield]][platform-url]

> **Durable, evidence-backed memory for coding agents.**

Project Memory gives every coding agent a single, trustworthy knowledge base for your repository — so it stops re-learning the same facts and writing conflicting "memory" files.

```text
Discover -> Verify -> Classify -> Compound -> Reconstruct -> Single Source of Truth
```

Code tells agents **what exists**. Project Memory helps them remember **why** — and reconciles every place that already tried to write it down.

---

## Why it matters

Without reconciled memory, every agent (and every AI tool) re-discovers the architecture, re-tries the rejected approach, and writes its own slightly different conclusion. You end up with several disagreeing "sources of truth."

With Project Memory, that knowledge is discovered, verified against actual code, and rebuilt into **one canonical memory** that the next agent loads from a single trustworthy place.

---

## Quick Start

```powershell
# Install to all supported platforms (OpenCode, Codex, Claude, DSH)
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

The installer downloads the agent and its 8 skills into your chosen tool's global config. Pick a target from the interactive menu (`1` OpenCode · `2` Codex · `3` Claude · `4` DSH · `5` All). Via `irm | iex` it defaults to `all` non-interactively.

### Supported Platforms

| Target | Skills Location | Agent File |
|:------:|-----------------|------------|
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/agents/project-memory.md` |
| Codex | `~/.agents/skills/` | `~/.codex/agents/project-memory.toml` |
| Claude | `~/.claude/skills/` | `~/.claude/agents/project-memory.md` |
| DSH | `~/.dsh/profiles/<name>/node_modules/...` | `dsh --profile <name>` |

> `all` writes skills to both `~/.claude/skills` and `~/.agents/skills` (no OpenCode double-load) and sets up the DSH profile.

**Local options:** `-Target all`, `-Verify` (dry-run), `-Branch dev`, `-Target dsh`.
**Codex note:** requires `[features] multi_agent = true` in `~/.codex/config.toml` (installer prints this; never edits your config).

---

## DeepSeek Harness (DSH) Plugin

The project ships a **DSH bundle plugin** (`@lovedolove/dsh-project-memory`) that mounts all 8 Project Memory skills into any DSH profile via the built-in skill registry.

The installer integrates into your **existing** profile (auto-detects `web` first, falls back to creating `project-memory`). It writes `cordis.patch.yml`, updates `package.json`, and patches `pnpm-workspace.yaml` — no separate profile is created unless you don't have one.

```powershell
# Interactive — picks your existing profile (or creates project-memory)
.\install.ps1 -Target dsh

# Explicitly target your web profile
.\install.ps1 -Target dsh -DshProfile web
```

To start a session with bundled skills:

```powershell
# Web GUI
dsh --profile web

# Headless
dsh --profile web headless "audit my repo"

# SDK
dsh --profile web sdk
```

Install the plugin from npm (receives updates automatically):

```powershell
dsh plugin --profile web add @lovedolove/dsh-project-memory
```

Published to [npm](https://www.npmjs.com/package/@lovedolove/dsh-project-memory) via GitHub Actions — install with zero setup.

After install, dispatch the orchestrator as a subagent:
```
use_agent(agent: "project-memory", prompt: "compound my last task")
```
The bundled subagent registry makes this available automatically.

---

## How to Use

Invoke the orchestrator in any supported agent:

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
   +-- docs/architecture/README.md     -> domain index
   |   +-- docs/architecture/<topic>.md  -> one concept per file
   +-- docs/decisions/
   +-- docs/solutions/
   +-- docs/lessons/
   +-- docs/workflows/
   +-- docs/constraints/
   +-- docs/reference/
   +-- docs/history/
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

- `skills/knowledge-compounding/references/` — Grounding validation, durable bar, quality constraints
- `skills/memory-edit/references/` — Edit operations, migration procedures
- `skills/memory-verification/references/` — Claim verification, evidence confidence

---

## Testing

```powershell
Invoke-Pester ./install.tests.ps1
```

10 tests cover installer targets, the no-double-load rule, and a guardrail keeping the 8 skills, their manifest, and both agent files in sync.

---

## License

MIT — see [LICENSE](LICENSE).

---

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/Project-Memory-Agent.svg
[issues-url]: https://github.com/LoveDoLove/Project-Memory-Agent/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE
[platform-shield]: https://img.shields.io/badge/platforms-OpenCode%20%7C%20Codex%20%7C%20Claude%20%7C%20DSH-blue?style=flat-square
[platform-url]: https://github.com/LoveDoLove/Project-Memory-Agent
