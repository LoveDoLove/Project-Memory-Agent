---
title: Installer Delivery via irm iex and raw.githubusercontent Self-Fetch
type: decision
status: current
stability: stable
scope: install.ps1 delivery
created: 2026-08-28
updated: 2026-08-28
evidence:
  - install.ps1 (lines 8-9, 66-78)
related:
  - ./install-footprint.md
  - ../workflows/installer-testing.md
---

# Installer Delivery: `irm | iex` + raw.githubusercontent Self-Fetch

## Context

Users want the agent + 8 skills on their machine without cloning the repo.
The installer must work unattended from a one-liner and also interactively
from a local checkout.

## Decision

1. Deliver via a one-liner:
   `irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex`
2. The fetched script **self-fetches its payload** from
   `https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/$Branch`
   (`$Branch` param, default `main`) — no payload is bundled in the script.

## Rationale

- **Unattended under `iex`:** piping into `iex` redirects stdin;
  `[Console]::IsInputRedirected` (install.ps1:67) detects this and defaults
  the target to `all` instead of showing the interactive menu. Interactive
  local runs still get the menu (`1 OpenCode 2 Codex 3 Claude 4 All Q`).
- **`-Branch` param** enables pinning/testing against a branch without
  editing anything.
- **Self-fetch keeps one source of truth:** repo files are the payload;
  the installer never carries a stale embedded copy.

## Rejected Alternatives

- **Git clone + manual copy** — retained in README as the manual fallback
  path, but high-friction for the common case.
- **Release archives / zip download** — needs release tooling; raw fetch of
  9 small markdown files is simpler.
- **Package manager (winget/scoop/choco)** — heavyweight for a 9-file
  markdown payload; not yet justified.

## Consequences / Trade-offs

- `irm | iex` runs remote code as the user — standard PowerShell pattern but
  inherent trust requirement; no checksum verification (acceptable for now,
  revisit if the project grows).
- Raw fetch means each file is an independent request — a failure mid-run is
  reported per-file and the script exits 1 (install.ps1:111–117).
- README's Installation section documents the one-liner as the primary
  install path (resolved 2026-08-28; previously a known clone-only gap).

## Verification Evidence

- Redirected-input default-to-all behavior: install.ps1:66–78.
- Tests execute the same code paths with `Invoke-WebRequest` mocked:
  install.tests.ps1 (4/4 passing).
