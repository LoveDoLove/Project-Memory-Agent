# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] — 2026-09-22

### Added

- **First-Class Native System Bundled Skills for DeepSeek Harness (Parity with `dsh-univer-office`)**:
  - Direct packaging of all 8 Project Memory skills (`knowledge-classification`, `knowledge-compounding`, `knowledge-discovery`, `memory-architecture`, `memory-edit`, `memory-verification`, `obsolete-knowledge`, `repository-audit`) and their reference guides directly inside `@lovedolove/dsh-project-memory`.
  - Implemented `createBundledSkillProvider()` conforming to `@deepseek-ai/dsh-skill` `SkillRegistry` with rank `BUNDLED_SKILL_RANK` (600) and `source: 'bundled'`.
  - Seamless single-command installation via DeepSeek Harness native package manager (`dsh plugin add @lovedolove/dsh-project-memory`), automatically activating all 8 skills across all sessions with zero filesystem copying or symlinking required.

## [0.5.0] — 2026-09-22

### Added

- **Built-in 384-d Vector Model & Hybrid RRF Search**:
  - Deterministic local feature-hash and subword n-gram embedder with zero dependencies and offline execution.
  - Active `sqlite-vec` KNN vector storage in derived `.ema/index.db`.
  - Stage 2 retrieval upgraded to Reciprocal Rank Fusion (RRF) combining FTS5 lexical matching with vector cosine distance.
- **Interactive Visual Memory Graph Web UI (`ema ui`)**:
  - Full-screen dark-theme force-directed physics knowledge graph on `http://127.0.0.1:3888`.
  - Dynamic 4-D lifecycle node coloring (Canonical, Candidate, Contradiction, Historical).
  - Explicit contradiction edge highlighting with animated glowing rings.
  - Interactive slide-over inspection drawer with grounded code evidence anchors, Markdown preview, and one-click promotion.
- **Autonomous Distillation & Ingestion Engine (`ema ingest`, MCP `ema_distill`)**:
  - Automated knowledge capture from Git diffs, patches, and task text.
  - Generates immutable evidence anchors (`ema://evidence/...#sym:...`, `#line:...`).
  - Quarantined candidate isolation invariant enforced in `.ema/candidates/`.
- **One-Line Universal Installer & DeepSeek Harness Integration**:
  - One-line installer script for Linux/macOS (`install.sh` via `curl | bash`) and Windows (`install.ps1` via `irm | iex`).
  - Auto-detection and auto-mounting to active DeepSeek Harness profile.
  - Slash commands `/ema ui` and `/ema ingest` supported in DeepSeek Harness chat.
  - Global `ema` launcher in `~/.local/bin/ema` and `%USERPROFILE%\.local\bin\ema.cmd`.

## [0.4.31] — 2026-09-14

### Added

- **WSL/Linux support for dsh-plugin**: codebase-memory-bridge.mjs now detects
  the platform and uses the POSIX codebase-memory-mcp binary on Linux/WSL
  instead of the Windows .exe. Project slugs are derived without a drive-letter
  prefix on Linux paths (e.g. /home/u/proj → home-u-proj).

- **dsh-plugin/test/**: added codebase-memory-bridge.test.mjs with node:test
  covering Windows slug behavior (pinned), Linux/WSL slug behavior, and a
  createClient round-trip with a fake POSIX MCP executable.

## [0.4.30] — 2026-09-XX

### Added
- **dsh-plugin/README.md**: plugin-specific documentation with feature overview,
  slash command usage, integration points, environment variables, and compatibility matrix.
- **Root README optimization**: restructured DSH Plugin section with Install/Usage
  subsections, added `--trace` flag documentation, removed redundancy with How to Use.
- **README.zh-CN.md sync**: updated Chinese README to match English version changes.

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
