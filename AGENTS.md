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
docs/architecture.md     ← system design, DSH plugin internals
    ↓
skills/<name>/SKILL.md   ← detailed skill instructions (loaded on demand)
    ↓
templates/               ← document templates for new knowledge
```

---

## When to Use `@project-memory`

Invoke the orchestrator to:

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