# Knowledge Document Template

Use this template when creating new knowledge documents in `docs/`.
Applies to all knowledge types: architecture, decision, solution, lesson,
constraint, workflow, reference, and history.

---

# YAML Frontmatter

Every knowledge document requires YAML frontmatter. Use the fields below;
omitted fields are optional unless marked required for the document type.

## Minimal Required Fields (All Types)

```yaml
---
# Minimal Core Fields
title: "Short descriptive title"
type: architecture | decision | solution | lesson | constraint | workflow | reference | history | fact | obsolete

# Four Orthogonal Dimensions
status: current | draft | deprecated | superseded | historical | abandoned  # Lifecycle State
validation_state: unreviewed | needs_review | potentially_stale | verified | invalid | quarantined  # Validation State
authority_level: canonical | derived | candidate  # Authority Level
confidence: high | medium | low  # Confidence Level

# Knowledge Scope (project-local, shared workspace, or universal global)
scope: project | workspace | global

# Verification Dates
created: "YYYY-MM-DD"
last_verified: "YYYY-MM-DD"
---
```

## Optional Enhancement Fields

```yaml
---
# Scope URI and Isolation
scope_id: "project:github.com/org/repo"
isolation: soft | hard  # default soft; hard prevents cross-scope query leakage

# Evidence backing this claim (anchors or file paths)
evidence:
  - anchor: "ema://evidence/github.com/org/repo/9f8a2c1b/src/auth/token.ts#sym:verifyToken"
    type: source
    verified_at: "2026-09-22T10:00:00Z"
  - path: tests/auth/token.test.ts
    type: test

# Semantic relationships to other knowledge units
# Plain paths are backward-compatible. Typed links are directional:
# the current document is the source, the target path is the referenced unit.
related:
  - docs/decisions/authentication.md              # plain path (backward compatible)
  - path: docs/architecture/security.md
    type: belongs_to          # I belong to this parent concept
  - path: docs/solutions/login-failure.md
    type: caused_by           # This was caused by the target issue
  - path: docs/decisions/auth-v1.md
    type: evolved_from        # This is a newer version that evolved from the target
  - path: docs/decisions/auth-v1.md
    type: supersedes          # This current version replaces the old version
  - path: docs/solutions/build-failure-symptom.md
    type: resolves            # This fix/decision addresses the target problem
  - path: docs/architecture/build/generated-sources.md
    type: affects             # This change constrains or impacts the target
  - path: docs/decisions/legacy-auth.md
    type: contradicts         # Direct conflict; resolution required
  - path: docs/solutions/token-distill.md
    type: derived_from        # Generalized from target
  - path: docs/solutions/jwt-fix.md
    type: promoted_from       # Promoted from target candidate/project
  - path: docs/architecture/auth-v2.md
    type: updates             # Updates target architecture
  - path: docs/architecture/core.md
    type: extends             # Builds upon target without replacing
  - path: docs/lessons/auth-patterns.md
    type: derives             # Source of derivation for target

# Relationship vocabulary (source -> target):
#   supersedes    - source is the current replacement for target
#   evolved_from  - source is a newer version of target
#   resolves      - source is the fix/decision/solution for target's problem
#   caused_by     - source's problem/impact/constraint is caused by target
#   affects       - source changes, constrains, or impacts target
#   belongs_to    - source is a sub-topic, detail, or component of target
#   contradicts   - source conflicts with target; resolution is required
#   derived_from  - source was distilled, inferred, or generalized from target
#   promoted_from - source was promoted from target candidate/project
#   updates       - source updates or revises target
#   extends       - source builds upon target without replacing
#   derives       - source was used to infer or generate target

# What supersedes this knowledge (required when status = superseded)
superseded_by: "docs/decisions/new-authentication.md"

# Promotion lineage (present when promoted from Candidate/Project to Workspace/Global)
promoted_from:
  origin_scope: "project:github.com/org/sub-repo"
  origin_id: "docs/solutions/jwt-fix.md"
  validated_by: "agent:project-memory"
  promoted_by: "human:lead-dev"
  promoted_at: "2026-09-22T12:00:00Z"
  rationale: "Pattern verified across independent services"
  min_sources_checked: 2
  audit_ref: "docs/CHANGELOG-MEMORY.md#2026-09-22-jwt-promotion"

# Origin paths merged during multi-source reconstruction
consolidated_from:
  - "CLAUDE.md § Authentication"
  - ".cursor/rules/auth.md"

# Searchable tags (corpus-first vocabulary — sample existing tags first)
tags:
  - authentication
  - security
---
```

---

# Per-Type Field Requirements

| Type | Required Extra Fields |
|------|----------------------|
| **solution** | `problem_type`, `severity` (+ bug track: `category`, `module`, `symptoms`, `root_cause`, `resolution_type`; + knowledge track: `applies_when`, `category`) |
| **decision** | `rationale` (recommended), `alternatives` (recommended) |
| **lesson** | `generalizable_from` (recommended) |
| **constraint** | `enforced_by` (recommended), `violation_impact` (recommended) |
| **workflow** | `steps` (recommended) |
| **architecture** | `invariants` (recommended) |
| **reference**, **history**, **fact** | None beyond core fields |

---

# Content Structure by Type

## Architecture

```markdown
# <Title>

> Status: current · Confidence: high · Last verified: YYYY-MM-DD

## Overview

What this architecture describes and why it matters.

## Structure

Module boundaries, component relationships, data flow.

## Invariants

What must always hold true.

## Evidence

- Source: `src/module/...`
- Tests: `tests/module/...`
```

## Decision

```markdown
# <Title>

> Status: current · Confidence: high · Last verified: YYYY-MM-DD

## Context

The situation that required a decision.

## Decision

The choice that was made.

## Rationale

Why this choice over alternatives.

## Alternatives Considered

- **Option A** — Rejected because: <reason>
- **Option B** — Rejected because: <reason>

## Consequences

What follows from this decision.

## Evidence

- Configuration: `config/...`
- Git history: `<commit>`
```

## Solution

```markdown
# <Title>

> Status: current · Confidence: high · Last verified: YYYY-MM-DD
> Problem type: bug | knowledge · Category: <category>

## Problem

What was the issue? What was the impact?

## Root Cause

Verified mechanism (not assumed).

## Solution

What was done and why.

## Failed / Rejected Approaches

- **Approach A** — Why it failed: <evidence>

## Verification

- [ ] Tests pass: `<test names>`
- [ ] Build succeeds: `<command>`
- [ ] Evidence: `<file:line>`

## Future Guidance

Actionable guidance for future Agents.
```

## Lesson

```markdown
# <Title>

> Status: current · Confidence: medium · Last verified: YYYY-MM-DD

## Problem

What general situation does this apply to?

## Root Cause

What mechanism causes this pattern?

## Incorrect Approach

What do Agents tend to try first (and why it fails)?

## Correct Approach

What should they do instead?

## Why It Matters

Future engineering value.

## Evidence

- Incident: `<date or commit>`
- Source: `<file>`
```

---

# Domain README Template

For `docs/<domain>/README.md`:

```yaml
---
title: "<Domain> Domain"
last_indexed: "2026-09-08"
pending_updates: 0
summary: "One-line description for AGENTS.md cross-reference"
---
```

```markdown
# <Domain>

This domain covers <scope>.

## Read When

- <task A> → `<topic-a.md>`
- <task B> → `<topic-b.md>`

## Knowledge Units

- [`<topic-a.md>`](./topic-a.md) — <one-line description>
- [`<topic-b.md>`](./topic-b.md) — <one-line description>
```

---

# Quality Checklist

Before publishing any knowledge document:

- [ ] Frontmatter is complete (all required fields present)
- [ ] `status` matches repository reality
- [ ] `confidence` reflects actual evidence strength
- [ ] `last_verified` is current (within 30 days for current knowledge)
- [ ] Every factual claim has at least one `evidence` entry
- [ ] `related:` links point to existing documents (verified by memory-verification)
- [ ] Typed `related:` links use one of the eight relationship types and respect source → target direction
- [ ] Typed `related:` links do not present superseded or obsolete targets as current authoritative knowledge
- [ ] High-impact typed links (`supersedes`, `resolves`, `caused_by`, `contradicts`) have supporting evidence or are marked Needs Review in the verification receipt
- [ ] High-impact typed links are recency-tracked in the verification receipt (Tier 5); a Stale link is flagged, never silently trusted
- [ ] Typed `related:` links pass the Typed Relationship Verification Gate in `memory-verification`
- [ ] `superseded_by` is set when status is `superseded`
- [ ] Tags use existing corpus vocabulary (corpus-first rule)
- [ ] Document passes the Durable Bar counterfactual (for solutions/lessons)
- [ ] One canonical home — no duplicate knowledge across origin tools

---

# References

- `templates/schema.yaml` — canonical frontmatter contract
- `knowledge-classification` — knowledge type and lifecycle definitions
- `knowledge-compounding` — extraction and Durable Bar criteria
- `memory-verification` — verification acceptance criteria
