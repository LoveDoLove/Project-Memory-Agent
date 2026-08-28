---
title: Windows PowerShell Ships Pester 3.4.0 — Legacy Assertion Syntax
type: lesson
status: current
stability: stable
scope: install.tests.ps1, any Pester tests in this repo
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.tests.ps1 (lines 1-5, 28, 36-38, 74)
related:
  - ../../workflows/installer-testing.md
---

# Pester 3.4.0 Legacy Syntax

## Problem

Tests written with modern Pester 4/5 syntax fail on a stock Windows machine.

## Root Cause

Windows PowerShell 5.1 ships **Pester 3.4.0** by default; many machines never
upgrade it. (Confirmed on this machine: `(Get-Module Pester).Version` →
`3.4.0`, 2026-08-28.)

## Incorrect Approach

```powershell
# Pester 4+/5 only — fails on 3.4.0
$x | Should -Be 8
$d | Should -Exist
$d | Should -Not -Exist
```

## Correct Approach (3.4.0-compatible)

```powershell
$x | Should Be 8          # no dash
$d | Should Exist
$d | Should Not Exist
Mock Invoke-WebRequest { param($Uri, $OutFile) ... }   # 3.x Mock needs
                                                       # explicit param() to
                                                       # bind -Uri/-OutFile
```

## Why It Matters

The installer's whole safety net is its test run. If tests can't execute on a
stock Windows box, the safety net silently disappears for every user without
an upgraded Pester.

## Future Guidance

- Keep `install.tests.ps1` on 3.4.0 syntax; the header comment
  (install.tests.ps1:1–5) documents the Pester 5 migration mapping
  (`Should Be` → `Should -Be`, etc.) for whenever the repo drops 5.1 support.
- Header also documents the run command: `Invoke-Pester ./install.tests.ps1`.
- Verified 2026-08-28: 4/4 tests pass on Pester 3.4.0.
