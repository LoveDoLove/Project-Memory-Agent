---
title: Project Memory Agent Optimization Strategy
type: decision
status: current
stability: stable
scope: self-optimization of the PMA orchestrator and skills
created: 2026-08-29
updated: 2026-08-29
evidence:
  - agents/project-memory.md
  - install.tests.ps1
  - skills/*/SKILL.md
related:
  - ../architecture/repo-and-installer.md
---

# Project Memory Agent Optimization Strategy

## Decision

When optimizing the PMA for token/context cost, compress the **orchestrator**
(`agents/project-memory.md`) first — it is the only always-loaded file. Leave
the 8 skills at full verbosity; they load one-at-a-time on demand, so
cross-skill redundancy costs ~0 tokens and extracting shared text adds a
coupling risk (a shared file every skill session must also load).

## Context

The agent was audited for verbosity. Naive reading suggests ~11k lines across
orchestrator + skills is the cost. Wrong: only the orchestrator is injected
into every session. Skills are fetched per delegation and never two at once.

## Rationale

- Skills load per-delegation, never together — verified by the installer's
  per-target skill copy and the orchestrator's Progressive Skill Loading table.
  - The orchestrator is in every session. Its 1723→1081 line compression was the
  real saving; skills were left intact.
- A `skills/_shared/*.md` dependency would make each on-demand skill session
  load two files — net-negative token cost.

## Lessons

- **Graph scope**: `codebase-memory` is for CODE discovery (functions/callers).
  Existing-doc inventory (AGENTS.md, docs/) stays grep/glob. The orchestrator's
  Context Budget Discipline states exactly this.
- **Sync-invariant guardrail**: a Pester test asserting each `SKILL.md name:` ∈
  `$Skills` and the orchestrator references all 8 prevents name/manifest drift.
  Added in install.tests.ps1 (Describe 'skill name <-> manifest sync').
- **Memory Health**: the agent had no success metric. Added a quality bar
  (evidence pointer per current claim, zero unresolved conflicts, obsolete
  labelled, no duplicate homes, discovery re-verified, no stale pointers) as
    `# Memory Health` in the orchestrator.
- **Embedded numeric claims drift**: re-verify counts and line numbers embedded in memory docs each audit — not just cross-file path references. A prior limited audit confirmed "doc line-refs accurate" yet missed `1723→1036` (actual orchestrator 1081 lines) and `(6 tests)` (actual 7 It blocks). Check numerics against `Get-Content -Count` / Pester output.

## Rejected alternatives

- Hardcoding a conflict-resolution priority order. Provenance must stay a
  tie-break only; `knowledge-classification` already forbids resolving by
  preference (L658–661, L1549).
- A generated TOML builder. The repo has no build system; `project-memory.toml`
  is maintained by hand and covered by the same guardrail test.
- Cross-skill verbatim dedup. Net-zero token benefit, adds coupling — skipped.
