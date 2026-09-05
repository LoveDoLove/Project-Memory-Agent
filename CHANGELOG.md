# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.20] — 2026-09-06

### Added
- **DSH subagent dispatch**: `install.ps1` now runs `dsh plugin add @aiwayds/dsh-subagent-registry` alongside our plugin, so DSH users get `use_agent(agent: "project-memory")` automatically after install. No npm dependency bundling.
- **Agent file seeding**: `install.ps1` copies `agents/project-memory.md` into `~/.dsh/agents/` for both `-Target dsh` and `-Target all` install paths.
- **3 new tests**: DSH agent seeding with existing profile, DSH agent seeding with no profile, and `all` target also seeds DSH agents dir.

### Fixed
- **`install.ps1` `all` target**: Fixed pre-existing bug where the DSH profile directory was never created when no profile existed.

### Changed
- `install.ps1`: runs two `dsh plugin add` commands per DSH profile (our plugin + subagent-registry). Our plugin has no new npm dependencies.
- `README.md`: added subagent dispatch instructions under DSH section.
- `docs/architecture.md`: noted subagent registry install via install.ps1.
- `CHANGELOG.md`: new file documenting v0.4.20 changes.
