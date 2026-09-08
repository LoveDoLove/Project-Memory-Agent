# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.27] — 2026-09-08

### Fixed
- **DSH boot crash**: removed broken `pma-skill-dir` insert row from
  `cordis.patch.yml`. It used `name: cordis:plugin` which is NOT a registered
  Cordis builtin (only `cordis:include` and `cordis:group` exist), causing
  `builtins['plugin']` to resolve to `undefined` and the loader to throw
  "invalid plugin, expect function or object with an "apply" method, received undefined".
- Skill directory registration is now handled entirely by `dsh/plugin.mjs`
  at runtime via `registerWorkspaceSkills()` (workspace `skills/` + global dirs).
- Added `@deepseek-ai/dsh-tools` to peerDependencies so the module resolves
  correctly when installed in a DSH profile.

## [0.4.26] — 2026-09-08

### Fixed
- **DSH Store contract**: replaced colliding `skill-filesystem` entry ID with
  unique `pma-skill-dir` insert row in `cordis.patch.yml`; removed
  `@deepseek-ai/dsh-skill-filesystem` from dependencies.
- Added `dsh.compatibility` block with per-release DSH version declarations
  (`0.1.2-rc.1`, `0.1.3-alpha.1`, `0.1.3-alpha.2` all `compatible`),
  Node.js range (`>=18.0.0 <23.0.0`), and DSH version range.
- Added `lifecycle-evidence.md` for DSH Store validation.
- Updated `docs/architecture.md` to reflect new patch structure.

## [0.4.25] — 2026-09-07

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
