---
title: OpenCode on Windows Does Not Resolve ~/.agents/skills
type: lesson
status: current
stability: evolving
scope: skills directory choice, installer targets
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.ps1 (lines 85-102)
  - external: anomalyco/opencode issue #17007 (session-verified reference)
related:
  - ../decisions/install-footprint.md
---

# OpenCode on Windows Does Not Resolve `~/.agents/skills`

## Problem

Skills installed to `~/.agents/skills` are not discovered by OpenCode on
Windows (even though that path is a documented cross-agent convention target
used for Codex).

## Root Cause

OpenCode's Windows path resolution for `~/.agents/skills` does not work
(tracked as anomalyco/opencode issue #17007 — external reference, verified
during the 2026-08 installer session; not checkable from repo contents
alone).

## Correct Approach

For OpenCode, install skills to either:

- `~/.claude/skills` — OpenCode scans it via its Claude-compat layer; also
  serves Claude Code (this is what installer target `all` relies on), or
- `~/.config/opencode/skills` — OpenCode's native dir (what single-target
  `opencode` uses).

`~/.agents/skills` remains **Codex's** skills dir and is written for the
`codex` target and by `all` — it is simply never relied on for OpenCode.

## Why It Matters

This is the root cause behind the `all` target's no-double-load shape: `all`
writes `~/.claude/skills` (covers Claude **and** OpenCode) +
`~/.agents/skills` (covers Codex), and deliberately skips
`~/.config/opencode/skills`. See
[install footprint decision](../decisions/install-footprint.md).

## Future Guidance

- Status `evolving`: if OpenCode fixes #17007, re-evaluate — the footprint
  decision still holds (per-target native dirs), but the constraint's
  wording would change.
- Re-verify OpenCode's scan paths before adding any new install target.
