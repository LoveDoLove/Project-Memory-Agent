---
title: Installer Testing Workflow
type: workflow
status: current
stability: stable
scope: install.ps1 verification
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.tests.ps1
  - install.ps1
related:
  - ../lessons/pester-3-4-legacy-syntax.md
  - ../decisions/installer-delivery.md
---

# Installer Testing Workflow

Four layers, cheap → expensive. Run at least layers 1–2 after any installer
change; layers 3–4 before shipping target-mapping or delivery changes.

## Layer 1 — Unit tests (no network, mocked fetch)

```powershell
Invoke-Pester ./install.tests.ps1
```

- `Invoke-WebRequest` is mocked (creates empty files) — no network, no real
  writes outside a temp `USERPROFILE` (each test swaps `$env:USERPROFILE` to
  a fresh `%TEMP%\pmtest_<guid>` and removes it after).
- Expect: `Passed: 4 Failed: 0`.
- Must run on Pester 3.4.0 syntax — see
  [Pester lesson](../lessons/pester-3-4-legacy-syntax.md).

## Layer 2 — Dry-run listing (no writes at all)

```powershell
.\install.ps1 -Verify -Target all
```

Prints `would install:` lines for every destination; `-Verify` skips all
writes and prompts. Use to eyeball the target→dir mapping without touching
the real profile.

## Layer 3 — Real fetch into a sandbox profile (network, no real writes)

```powershell
$p = Join-Path $env:TEMP ("pmsandbox_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $p | Out-Null
$env:USERPROFILE = $p
.\install.ps1 -Target all -Force   # real raw.githubusercontent fetches, into sandbox
# inspect $p\.claude\skills, $p\.agents\skills, $p\.codex\agents, ...
$env:USERPROFILE = <restore> ; Remove-Item -Recurse -Force $p
```

Verifies the manifest URLs actually resolve on the target branch
(`-Branch <name>` to test a non-main branch).

## Layer 4 — End-to-end one-liner (real machine, real writes)

```powershell
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

The actual user path: stdin is redirected → target defaults to `all`. Run
last, on a machine where overwriting the real destinations is acceptable
(existing files prompt Y/N unless `-Force` — note `-Force` cannot be passed
through `iex`; interactive prompts are the guard).

## What each layer catches

| Defect | Caught by |
|---|---|
| Pester syntax / Mock binding regression | 1 |
| Wrong destination dir, double-load into OpenCode | 1 (test asserts absence) + 2 |
| Broken raw URLs / renamed files on branch | 3 |
| Menu/redirect behavior, prompts, exit codes | 4 |
