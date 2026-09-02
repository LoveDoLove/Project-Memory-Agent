---
title: Codex Agent as Standalone TOML File
type: decision
status: current
stability: stable
scope: Codex integration
created: 2026-08-28
updated: 2026-08-28
evidence:
  - agents/project-memory.toml
  - install.ps1 (lines 93-96, 116)
related:
  - ./install-footprint.md
---

# Codex Agent as Standalone TOML File

## Decision

Ship the Codex agent as `~/.codex/agents/project-memory.toml` — a standalone
file with keys `name`, `description`, `developer_instructions` (full agent
prompt as a TOML triple-quoted string). Never mutate the user's
`~/.codex/config.toml`.

## Rationale

- Codex auto-discovers `~/.codex/agents/*.toml` subagent files; no central
  config registration needed. (External docs:
  developers.openai.com/codex/subagents — session-verified reference, not
  checked into the repo.)
- Repo-side source of truth: `agents/project-memory.toml` (437 lines);
  content mirrors `agents/project-memory.md` in Codex's format.
- Mutating user config would be invasive and conflict-prone; dropping one
  file is reversible and idempotent.

## Required User Action (deliberately NOT automated)

Codex needs `[features] multi_agent = true` in `~/.codex/config.toml` to
spawn subagents; it is **off by default**. The installer prints this hint on
every run (install.ps1:116, marked "not auto-applied") but never edits user
config — consistent with the no-config-mutation decision above.

## Consequences

- Two agent source files (`md` + `toml`) must be kept content-synced in the
  repo — changing the agent prompt means updating both.
- Codex users who miss the hint will see the agent installed but unable to
  spawn; the hint is the mitigation.

## Verification Evidence

- TOML structure: agents/project-memory.toml lines 1–5 (name, description,
  `developer_instructions = '''`).
- Codex target installs toml to `~/.codex/agents/`: install.ps1:93–96.
- Test `single codex: skills + agent .toml`: install.tests.ps1:52–61.
