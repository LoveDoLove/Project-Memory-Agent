# Project Memory

[![GitHub Stars][stars-shield]][stars-url] [![GitHub Issues][issues-shield]][issues-url] [![License][license-shield]][license-url]

> Durable, evidence-backed memory for coding agents.

**Project Memory** gives coding agents a single, trustworthy memory for a software repository â€” so they stop re-learning the same facts and stop writing conflicting "memory" files.

Most repositories already contain fragments of project knowledge scattered across `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, docs, and notes from previous AI tools. Project Memory treats all of that as **existing knowledge to discover, verify, and reconcile** â€” not as separate truths to leave alone.

> Code tells agents what exists. Project Memory helps them remember **why** â€” and reconciles every place that already tried to write it down.

## Why it matters

Without reconciled memory, every agent (and every AI tool) re-discovers the architecture, re-tries the rejected approach, and writes its own slightly different conclusion. You end up with several disagreeing "sources of truth."

With Project Memory, that knowledge is discovered, verified against the actual code, and rebuilt into **one canonical memory** that the next agent loads from a single trustworthy place.

## Install

```powershell
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

Downloads the agent + its 8 skills into your chosen tool's global config. Pick a target from the menu (`1` OpenCode, `2` Codex, `3` Claude, `4` DSH, `5` All). Via `irm | iex` it defaults to `all` non-interactively.

| Target | Skills | Agent |
|--------|--------|-------|
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/agents/project-memory.md` |
| Codex | `~/.agents/skills/` | `~/.codex/agents/project-memory.toml` |
| Claude | `~/.claude/skills/` | `~/.claude/agents/project-memory.md` |
| DSH | `~/.dsh/profiles/project-memory/node_modules/...` | `dsh --profile project-memory` |

- `all` writes skills to `~/.claude/skills` + `~/.agents/skills` (no OpenCode double-load) and also sets up the DSH profile.
- Local options: `-Target all`, `-Verify` (dry-run), `-Branch dev`, `-Target dsh`.
- Codex: needs `[features] multi_agent = true` in `~/.codex/config.toml` (installer prints this; never edits your config).

### DeepSeek Harness (DSH)

The project ships a **DSH bundle plugin** (`dsh-plugin/`) that mounts all 8 Project Memory skills into any DSH profile via the built-in skill registry. The installer copies the plugin into `~/.dsh/profiles/project-memory/`.

To start a session with the bundled skills:

```powershell
# Web GUI (recommended)
dsh --profile project-memory

# Headless â€” run one task and exit
dsh --profile project-memory headless "audit my repo"

# SDK
dsh --profile project-memory sdk
```

The skills are discoverable from any workspace because the plugin's `cordis.patch.yml` registers the project's `skills/` directory as a custom skill root via `@deepseek-ai/dsh-skill-filesystem`.

To install from npm instead of the offline copy (receives updates automatically):

```powershell
dsh plugin --profile project-memory install @lovedolove/dsh-project-memory
```

This works because `@lovedolove/dsh-project-memory` is published to the public [npm registry](https://www.npmjs.com/package/@lovedolove/dsh-project-memory) via a GitHub Actions workflow. Anyone can install it with zero setup.

To verify the profile is wired correctly:

```powershell
dsh --profile project-memory --dump-config | Select-String "project-memory-plugin|skill-filesystem"
```

## Use

Invoke the orchestrator in your agent:

```
@project-memory
```

It discovers existing knowledge, inspects the repository, verifies claims against real evidence, and reports what to keep, change, merge, or remove â€” across every origin tool, not just its own files.

Typical tasks: *audit this repo*, *build memory for a repo that already has docs*, *reconcile conflicting AGENTS.md / CLAUDE.md*, *compound lessons after this feature*.

## What it does

- **Discovers existing knowledge** â€” inventories every pre-existing source with provenance.
- **Verifies with evidence** â€” claims checked against code, tests, config, build/CI, Git. Documentation is evidence, never assumed current.
- **Classifies & resolves conflicts** â€” one canonical type per claim; conflicts settled by repository evidence, not by file age.
- **Compounds learning** â€” durable Solutions and Lessons instead of more documents.
- **Removes obsolete knowledge** â€” deleted or marked deprecated/superseded, regardless of origin.
- **Single source of truth** â€” one primary home per concept; everything else references it.
- **Lean by design** â€” prompts are aggressively deduplicated; no rule exists in two places, and models are trusted with what they already do natively.
- **Self-audits** â€” a quality bar (Memory Health) and a Self-Audit directive let the agent run its own pipeline on its own repo to catch drift.

## Skills

Specialized Skills instead of one huge prompt:

| Skill | Responsibility |
| --- | --- |
| `knowledge-discovery` | Inventory every pre-existing knowledge source, with provenance |
| `repository-audit` | Gather repository evidence |
| `knowledge-classification` | Classify and resolve cross-source conflicts |
| `knowledge-compounding` | Turn experience into reusable memory |
| `memory-architecture` | Design hierarchy, navigation, reconstruction |
| `obsolete-knowledge` | Handle stale or superseded knowledge |
| `memory-edit` | Apply approved documentation changes |
| `memory-verification` | Final consistency and quality gate |

The orchestrator loads these progressively â€” you rarely invoke one directly. It can also delegate to `codebase-memory` (read-only code graph) and `cavecrew-builder` (bounded edits). Every rule has exactly one canonical owner across the agent and skills â€” skills reference each other instead of duplicating, so guidance can't drift apart.

## How memory is organized

`AGENTS.md` is the single entry point; everything else is referenced, not duplicated.

```
AGENTS.md
  â†’ docs/<domain>/README.md      (domain index)
    â†’ docs/<domain>/<topic>.md   (one concept per file)
```

Domains: `architecture/`, `decisions/`, `solutions/`, `lessons/`, `workflows/`, `constraints/`, `reference/`, `history/`. This is a pattern, not a mandatory scaffold â€” only create what holds verified knowledge.

### Templates

Templates provide starting points for creating new knowledge documents:

- `templates/TEMPLATE.md` â€” Solution document template with dual-track schema (Bug track + Knowledge track)
- `templates/CONCEPTS.md` â€” Project vocabulary with accretion/seeding/mutations system
- `templates/SOLUTIONS.md` â€” Index template for tracking all Solutions
- `templates/schema.yaml` â€” Canonical frontmatter contract

### Reference Files

Reference files provide detailed guidance for specific skills:

- `skills/knowledge-compounding/references/` â€” Grounding validation, durable bar, quality constraints, auto-memory, session history
- `skills/memory-edit/references/` â€” Edit operations, migration procedures
- `skills/memory-verification/references/` â€” Claim verification, evidence confidence

## Testing

Windows PowerShell 5.1, Pester 3.4.0:

```powershell
Invoke-Pester ./install.tests.ps1
```

7 tests cover installer targets, the no-double-load rule, and a guardrail that keeps the 8 skills, their manifest, and both agent files in sync.

## Status

Core agent + full memory lifecycle are complete, and the agent self-audits its own repository. See GitHub Issues for planned work (stale-reference detection, broader platform support, cross-project patterns).

## License

MIT â€” see [LICENSE](LICENSE).

---

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/Project-Memory-Agent.svg
[issues-url]: https://github.com/LoveDoLove/Project-Memory-Agent/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE


