# AGENTS.md — Project Memory Agent

Durable, evidence-backed memory for coding agents. This repository contains the
Project Memory orchestrator agent, 8 specialized skills, and a PowerShell
installer that deploys them to OpenCode, Codex, and Claude Code.

`README.md` is the human-facing project doc (purpose, philosophy, features,
roadmap). This file is the Agent-facing entry point. Do not duplicate README
content here — link it.

## Critical Rules

1. **Evidence before claims.** This repo is markdown/prompt content plus one
   PowerShell installer — no build system. Ground truth = reading the actual
   files (`install.ps1`, `install.tests.ps1`, `agents/*`, `skills/*/SKILL.md`).
2. **Sync invariant:** the `$Skills` list in `install.ps1` (line 10), the
   `skills/` directory, and every `SKILL.md` `name:` frontmatter field must
   stay in sync (currently 8 skills). Change one → change all three → run the
   tests.
3. **Tests must remain Pester 3.4.0-compatible** (Windows PowerShell 5.1
   default). No `Should -Be`-style dash operators. See
   [Pester 3.4 lesson](docs/lessons/pester-3-4-legacy-syntax.md).
4. **After any `install.ps1` change**, run
   `Invoke-Pester ./install.tests.ps1` and a `-Verify` dry-run. See
   [installer testing workflow](docs/workflows/installer-testing.md).
5. **README owns human-facing content** (install snippet for humans, skills
   table, memory-structure pattern). Memory docs reference it; they do not
   copy it.

## Architecture Orientation

```text
agents/project-memory.md    orchestrator agent (Markdown frontmatter format)
agents/project-memory.toml  same agent in Codex subagent TOML format
skills/<name>/SKILL.md ×8   specialized skills (discovery → audit → classify
                            → compound → architect → clean → edit → verify)
install.ps1                 network installer (self-fetches from raw.githubusercontent)
install.tests.ps1           Pester 3.4 tests (Invoke-WebRequest mocked, no network)
```

Details: [repository and installer architecture](docs/architecture/repo-and-installer.md).

## Critical Constraints

- Installer targets Windows PowerShell 5.1 (Pester 3.4.0, `Join-Path` 2-arg
  limit — see [lessons](docs/lessons/README.md)).
- Codex requires `[features] multi_agent = true` in `~/.codex/config.toml` to
  spawn subagents. The installer prints this hint but **never auto-applies**
  user config — deliberate policy.
- `all` install target must never write skills into
  `~/.config/opencode/skills` (OpenCode double-loads). See
  [install footprint decision](docs/decisions/install-footprint.md).

## Verification Requirements

- `Invoke-Pester ./install.tests.ps1` — must pass (7 tests).
- `.\install.ps1 -Verify -Target all` — dry-run listing, no writes.
- Full procedure incl. real-network checks:
  [installer testing workflow](docs/workflows/installer-testing.md).

## Documentation Navigation

```text
AGENTS.md  (you are here)
├── docs/architecture/repo-and-installer.md   how the repo/installer work
├── docs/decisions/README.md
│   ├── installer-delivery.md                 irm|iex + raw.githubusercontent self-fetch
│   ├── install-footprint.md                  global scope, per-target dirs, no-double-load
│   └── codex-agent-toml.md                   Codex agent as standalone TOML
├── docs/lessons/README.md
│   ├── pester-3-4-legacy-syntax.md           Pester 3.4.0 compat rules
│   ├── join-path-two-positional-args.md      Join-Path arity bug
│   └── opencode-windows-agents-skills.md     ~/.agents/skills not resolved on Windows
└── docs/workflows/installer-testing.md       how to test the installer
```

Human-facing docs: `README.md` (canonical for project purpose, features,
skills table, roadmap). License: MIT (`LICENSE`).
