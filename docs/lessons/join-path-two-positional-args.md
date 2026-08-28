---
title: Join-Path Accepts Only Two Positional Arguments
type: lesson
status: current
stability: stable
scope: PowerShell 5.1, install.ps1 path building
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.ps1 (line 18)
related:
  - ./pester-3-4-legacy-syntax.md
---

# Join-Path Accepts Only Two Positional Arguments

## Problem

Building a 3-segment path in one call fails at runtime.

## Root Cause

PowerShell's `Join-Path` binds exactly two positional parameters (`-Path`,
`-ChildPath`; `-AdditionalChildPath` exists only in PowerShell 6.2+).
A third positional argument throws a `ParameterBindingException` on 5.1.

## Incorrect Approach

```powershell
$d = Join-Path $skillsDir $s 'SKILL.md'   # throws on 5.1
```

## Correct Approach

```powershell
# install.ps1:18 — fixed form, nested
$d = Join-Path (Join-Path $skillsDir $s) 'SKILL.md'
```

## Why It Matters

The installer targets stock Windows PowerShell 5.1, where this bug was hit
and fixed (current line 18 is the nested form). Any new path-building code
in this repo must nest (or use `-ChildPath` explicitly per level).

## Future Guidance

- 3+ segment paths → nest `Join-Path` calls, or interpolate with a single
  join per level.
- If the repo ever moves to PowerShell 7+, `Join-Path a b c` becomes legal —
  but keep nesting for 5.1 compatibility until then.
