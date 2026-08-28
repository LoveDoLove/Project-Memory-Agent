# Decisions

Why the project chose these directions. Each unit: context, decision,
rationale, rejected alternatives.

## Read When

- Changing `install.ps1` or adding an install target → [installer-delivery.md](./installer-delivery.md), [install-footprint.md](./install-footprint.md)
- Adding/changing the Codex agent → [codex-agent-toml.md](./codex-agent-toml.md)
- Adding a new skill → AGENTS.md sync invariant (8-name list in `install.ps1:10`, `skills/`, frontmatter)

## Index

| Decision | Subject |
|---|---|
| [Installer delivery](./installer-delivery.md) | `irm \| iex` one-liner + raw.githubusercontent self-fetch |
| [Install footprint](./install-footprint.md) | Global user-profile scope, per-target native dirs, `all` no-double-load rule |
| [Codex agent as TOML](./codex-agent-toml.md) | Standalone `~/.codex/agents/*.toml`, never config.toml mutation |
