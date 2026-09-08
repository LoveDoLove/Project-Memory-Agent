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
title: "Short descriptive title"
type: architecture | decision | solution | lesson | constraint | workflow | reference | history
status: current | deprecated | superseded | historical
confidence: high | medium | low
created: "YYYY-MM-DD"
last_verified: "YYYY-MM-DD"
---
```

## Optional Enhancement Fields

```yaml
---
# Evidence backing this claim (file paths with optional line numbers)
evidence:
  - path: src/auth/token.ts:42
    type: source
  - path: tests/auth/token.test.ts
    type: test

# Semantic relationships to other knowledge units
related:
  - docs/decisions/authentication.md              # plain path (backward compatible)
  - path: docs/architecture/security.md
    type: belongs_to          # I belong to this parent concept
  - path: docs/solutions/login-failure.md
    type: caused_by           # This was caused by the target issue
  - path: docs/decisions/auth-v1.md
    type: evolved_from        # This replaced the old version

# What supersedes this knowledge (required when status = superseded)
superseded_by: "docs/decisions/new-authentication.md"

# Origin paths merged during multi-source reconstruction
consolidated_from:
  - "CLAUDE.md § Authentication"
  - ".cursor/rules/auth.md"

# Searchable tags (corpus-first vocabulary — sample existing tags first)
tags:
  - authentication
  - security

# Breadth of applicability
scope: project | domain | component

# Domain README only — freshness indicators
# last_indexed: "2026-09-08"
# pending_updates: 0
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
