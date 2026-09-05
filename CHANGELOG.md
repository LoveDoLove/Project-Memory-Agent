# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.20] — 2026-09-06

### Added
- **DSH subagent dispatch**: Bundle `@aiwayds/dsh-subagent-registry` into the DSH plugin so users can dispatch the orchestrator agent via `use_agent(agent: "project-memory")` after install.
- **Agent file seeding**: `install.ps1` now copies `agents/project-memory.md` into `~/.dsh/agents/` for both `-Target dsh` and `-Target all` install paths.
- **3 new tests**: DSH agent seeding with existing profile, DSH agent seeding with no profile, and `all` target also seeds DSH agents dir.

### Fixed
- **`install.ps1` `all` target**: Fixed pre-existing bug where the DSH profile directory was never created when no profile existed (would fail on first install with missing parent directory error).

### Changed
- `dsh-plugin/cordis.patch.yml`: Appended `dsh-subagent-registry` insert row (id: `dsh-subagent-registry`).
- `README.md`: Added subagent dispatch instructions under DSH section.
- `docs/architecture.md`: Noted subagent registry bundling in Two Components section.

### Dependencies
- Added: `@aiwayds/dsh-subagent-registry ^0.8.1`
