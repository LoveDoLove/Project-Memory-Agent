# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.20] — 2026-09-06

### Added
- **DSH subagent dispatch**: `install.ps1` seeds `agents/project-memory.md` into `~/.dsh/agents/` for both `-Target dsh` and `-Target all`. After the user runs `dsh plugin add @lovedolove/dsh-project-memory`, they can dispatch via `use_agent(agent: "project-memory")`.
- **New `global` target**: installs skills to `~/.agents/skills/` and agent to `~/.agents/agents/project-memory.md` (cross-tool compatible with Claude Code, Codex, etc.).

### Fixed
- **DSH target**: no longer touches `~/.dsh/profiles/` files (package.json, cordis.patch.yml, pnpm-workspace.yaml). Respects the CLI-only workflow: `dsh plugin add` is the user's command.

### Changed
- `install.ps1`: DSH target now only prints the `dsh plugin add` command and seeds the agent file. ~180 lines → ~130 lines. Removed `Add-Plugin-ToProfile`, `Resolve-DshProfile`.
- `README.md`: updated DSH section to reflect CLI-only approach.
- `docs/architecture.md`: noted agent seeding + CLI-only DSH install.
- `CHANGELOG.md`: new file.

### Removed
- `@aiwayds/dsh-subagent-registry` references entirely from install.ps1 and documentation.
