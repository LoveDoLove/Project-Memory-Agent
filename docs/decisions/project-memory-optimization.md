---
title: Project Memory Agent Optimization Strategy
type: decision
status: current
stability: stable
scope: self-optimization of the PMA orchestrator and skills
created: 2026-08-29
updated: 2026-09-02
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

## Update — 2026-09-02: second trim reverses "leave skills verbose"

A prompt-debt audit (Boris Cherny school: stale instructions constrain more
than they help) found the full-verbosity stance cost more than tokens:
16 cross-file duplication clusters, ~63% of all `Do not` lines living in
per-file tail restatements, and 4 near-copies of the lifecycle list — a
drift and contradiction risk, not just bulk. Executed an extreme trim:

- Orchestrator 1081→405; 8 skills 553–1927 → 375–864 each (system total
  12,711→6,081, −52%); `project-memory.toml` regenerated to mirror (437).
- Cross-skill dedup solved via **canonical ownership + one-line pointers**
  (17 clusters, one owner each) — not the rejected `skills/_shared/`
  mechanism, so no extra per-session file load and no new coupling.
- Load-bearing content verified post-trim: 14/14 safety-floor lines,
  3/3 canonical scenarios, 17/17 ownership clusters, Pester 7/7.

The "compress the orchestrator first" priority stands; the "skills cost ~0"
claim is corrected above: skill verbosity costs drift, which costs
correctness.

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
  preference (conflict-resolution rules).
- A generated TOML builder. The repo has no build system; `project-memory.toml`
  is maintained by hand and covered by the same guardrail test.
- Cross-skill verbatim dedup. Net-zero token benefit, adds coupling — skipped.
