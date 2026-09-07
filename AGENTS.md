---
# AGENTS.md — Project Memory Agent
# Primary Agent-facing entry point. Level 0 progressive loading.
---

# Project Memory

A durable, evidence-backed memory system for coding agents. It turns
scattered project knowledge — across AGENTS.md, CLAUDE.md, `.cursor/rules/`,
skills/, READMEs, and generated docs — into one reconciled, low-redundancy,
progressively loadable knowledge base.

Code tells agents **what exists**. Project Memory helps them remember
**why** — and reconciles every place that already tried to write it down.

---

## What This Repository Is

An open-source toolkit that gives any coding agent (OpenCode, Codex, Claude,
DeepSeek Harness) a persistent memory system for your software projects.

Two parts:

- **Skills + Agents** (`skills/`, `agents/`) — the core memory pipeline
- **DSH Plugin** (`dsh-plugin/`) — npm package that mounts skills into any
  DeepSeek Harness profile via the built-in skill registry

See [README.md](./README.md) for project introduction and installation.
See [docs/architecture.md](./docs/architecture.md) for system design details.

---

## Critical Rules

1. **Discover before assume** — run `knowledge-discovery` first when auditing
   a repo with existing knowledge sources.
2. **Evidence before memory** — ground every claim in source/tests/config/git.
3. **One canonical home per concept** — no parallel authoritative copies.
4. **AGENTS.md stays short** — navigation and critical rules only; detailed
   knowledge lives in `docs/`.
5. **Current wins over historical** — superseded knowledge must not appear
   as equally current.

---

## Memory Navigation

```
AGENTS.md (you are here)
    ↓
docs/architecture.md        ← system design, DSH plugin internals, progressive loading levels
docs/solutions/             ← diagnosed fix patterns (read when debugging)
docs/lessons/               ← reusable engineering principles
    ↓
skills/<name>/SKILL.md      ← detailed skill instructions (loaded on demand)
    ↓
templates/                  ← document templates for new knowledge
```

For progressive loading levels (what each docs/ tier contains), see
[docs/architecture.md](./docs/architecture.md#Progressive-Loading-Levels).

---

## How to Run Project Memory

### One-Click Command (Recommended)

```
/project-memory
```

This is the primary user-facing entry point. It automatically:

1. Detects whether Project Memory exists in the repository
2. Determines what operations are required (initialize, audit, update, verify)
3. Delegates to the appropriate skills without requiring manual selection
4. Verifies the final result

No Agent preset selection. No `@project-memory`. No manual Skill selection.

**When memory is missing:** auto-initializes AGENTS.md and the memory architecture.
**When memory exists:** audits for staleness, updates only what changed, verifies.
**When memory is current:** runs verification and reports no changes needed.

### Advanced: Direct Agent Invocation

For full control, invoke the orchestrator agent directly:

```
@project-memory
```

This loads the full `project-memory` Agent with access to all 8 skills and
the complete routing table. See [`agents/project-memory.md`](./agents/project-memory.md).

---

## When to Use `@project-memory`

Invoke the orchestrator (defined in [`agents/project-memory.md`](./agents/project-memory.md))
to:

- Audit an existing repository's knowledge sources
- Bootstrap memory for a repo that has no AGENTS.md yet
- Reconcile conflicting docs from multiple AI tools
- Extract durable lessons from completed work
- Clean up stale or superseded memory

---

## Verification

All memory claims must be verifiable against:
- Source code
- Tests
- Configuration files
- Build/CI setup
- Git history

See `knowledge-discovery` for the full discovery workflow.
See `repository-audit` for the evidence-gathering process.
