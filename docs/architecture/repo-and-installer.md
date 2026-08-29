---
title: Repository and Installer Architecture
type: architecture
status: current
stability: stable
scope: repository layout, installer
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.ps1
  - install.tests.ps1
  - agents/project-memory.md
  - agents/project-memory.toml
  - skills/
related:
  - ../decisions/installer-delivery.md
  - ../decisions/install-footprint.md
  - ../decisions/codex-agent-toml.md
---

# Repository and Installer Architecture

## Repository Layout

| Path | Role |
|---|---|
| `agents/project-memory.md` | Orchestrator agent, Markdown frontmatter format (OpenCode + Claude Code) |
| `agents/project-memory.toml` | Same agent, Codex subagent TOML format (`name` / `description` / `developer_instructions`) |
| `skills/<name>/SKILL.md` ×8 | Specialized skills, one dir each, `name:` frontmatter matches dir name |
| `install.ps1` | Network installer (120 lines) |
| `install.tests.ps1` | Pester 3.4.0 tests (120 lines, 7 It blocks, `Invoke-WebRequest` mocked — no network) |
| `README.md` | Human-facing doc — canonical owner of purpose/features/skills-table content |
| `.github/` | FUNDING.yml + 2 issue templates (bug report, feature request) |

The 8 skills (verified identical across `install.ps1:10`, `skills/` dirs, and
SKILL.md frontmatter): `knowledge-classification`, `knowledge-compounding`,
`knowledge-discovery`, `memory-architecture`, `memory-edit`,
`memory-verification`, `obsolete-knowledge`, `repository-audit`.

## Installer Data Flow

```text
install.ps1 (run locally OR fetched via irm | iex)
    ↓
params: -Target (opencode|claude|codex|all), -Force, -Verify, -Branch (default main)
    ↓
no -Target?  →  interactive menu 1/2/3/4/Q
              (but if [Console]::IsInputRedirected → default 'all',
               which is what makes `irm ... | iex` work unattended)
    ↓
manifest = $Base/skills/$s/SKILL.md ×8  +  agent file(s)
  where $Base = https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/$Branch
    ↓
per file: -Verify → print "would install", skip write
          exists && !-Force → Read-Host Y/N prompt
          else Invoke-WebRequest → write to destination dir
    ↓
summary (installed count / failures) → exit 1 if any failure
    ↓
always prints Codex hint: `[features] multi_agent = true` (not auto-applied)
```

Guard: `if ($MyInvocation.InvocationName -ne '.') { Main }` (line 120) lets
the test suite dot-source the script without executing `Main`.

## Target → Destination Mapping (install.ps1:84–106)

| Target | Skills → | Agent → |
|---|---|---|
| `opencode` | `~/.config/opencode/skills` | `~/.config/opencode/agents/project-memory.md` |
| `claude` | `~/.claude/skills` | `~/.claude/agents/project-memory.md` |
| `codex` | `~/.agents/skills` | `~/.codex/agents/project-memory.toml` |
| `all` | `~/.claude/skills` **and** `~/.agents/skills` only | all three agent destinations (md ×2 + toml) |

Note `all` does **not** write `~/.config/opencode/skills` — OpenCode scans
`~/.claude/skills` (Claude-compat), so writing both would double-load skills.
Asserted by test `all: no double-load into opencode skills`
(install.tests.ps1:63–78).

Why each mapping exists: [install footprint decision](../decisions/install-footprint.md).
Why raw self-fetch delivery: [installer delivery decision](../decisions/installer-delivery.md).
Codex TOML specifics: [Codex agent TOML decision](../decisions/codex-agent-toml.md).

## Owner Separation

- README owns: project philosophy, feature list, skills responsibility table,
  memory-structure pattern, roadmap.
- This doc owns: how the repository and installer actually work.
- Decisions own: why the installer is built this way.
