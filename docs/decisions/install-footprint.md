---
title: Install Footprint — Global Scope, Per-Target Native Dirs, No Double-Load
type: decision
status: current
stability: stable
scope: install.ps1 destinations
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.ps1 (lines 84-106)
  - install.tests.ps1 (lines 63-78)
related:
  - ./installer-delivery.md
  - ../lessons/opencode-windows-agents-skills.md
---

# Install Footprint: Global Scope, Per-Target Native Dirs, No Double-Load

## Decision (three parts, one footprint)

1. **Global install scope** — everything lands under `$env:USERPROFILE`
   dot-dirs (`~/.claude`, `~/.config/opencode`, `~/.agents`, `~/.codex`),
   never project-local.
2. **Per-target native directories** — each tool gets files in the location
   it natively scans; no single shared dir with symlinks or dupes.
3. **`all` no-double-load rule** — target `all` writes skills to
   `~/.claude/skills` + `~/.agents/skills` ONLY, and must never also write
   `~/.config/opencode/skills`.

## Rationale

- **Global:** the agent is a user-level tool used across many repos, not a
  per-project dependency.
- **Per-target native:** each tool only reliably reads its own convention
  (verified mapping in
  [architecture](../architecture/repo-and-installer.md#target--destination-mapping-installps184106)).
- **No-double-load:** OpenCode scans `~/.claude/skills` as part of its
  Claude-compat layer. So for OpenCode + Claude together, one copy in
  `~/.claude/skills` serves both. If `all` *also* wrote
  `~/.config/opencode/skills`, OpenCode would load every skill twice.
  Enforced by test `all: no double-load into opencode skills`
  (install.tests.ps1:63–78, asserts `~/.config/opencode/skills` does not
  exist after an `all`-shaped run).

## Boundary case

Targeting `opencode` **alone** does write `~/.config/opencode/skills` — that
is correct for an OpenCode-only machine. The no-double-load rule applies only
to the `all` target.

## Rejected Alternatives

- **Single shared dir (`~/.agents/skills` for everything)** — OpenCode on
  Windows does not resolve `~/.agents/skills` (see
  [lesson](../lessons/opencode-windows-agents-skills.md)); Claude Code does
  not scan it either.
- **Project-local install** — wrong scope for a cross-repo agent; forces
  per-repo re-install.
- **Symlinks** — fragile on Windows without Developer Mode; plain copies are
  boring and reliable.

## Trade-offs

- Copies are not shared: updating requires re-running the installer
  (`-Force` to overwrite silently).
- Three destination schemes must be kept in sync with actual tool behavior —
  re-verify mapping if any tool changes its scan paths.
