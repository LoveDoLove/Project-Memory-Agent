# EMA Gap Analysis: PMA → Engineering Memory Agent

> **Status:** Research deliverable
> **Phase:** EMA Pre-Architecture Research
> **Date:** 2026-09

---

## Summary

PMA is architecturally stronger than most external memory systems in the areas that matter for engineering: evidence discipline, lifecycle states, typed relationships, progressive loading, canonical ownership, and audit trail. It should NOT adopt Supermemory's patterns wholesale.

The gaps are real but targeted. EMA needs specific additions to PMA's foundation — not a rewrite.

---

## Critical Gaps (Required for EMA)

### Gap 1: No Candidate Knowledge State

**What PMA has:** `Experimental` lifecycle state, but it implies knowledge that has been committed and is being tested — not knowledge awaiting validation.

**What EMA needs:** An explicit `Candidate` state for knowledge that has been extracted/proposed but not yet verified against source evidence. This is the barrier between automatic extraction and canonical authority.

**Without this:** Any agent could propose knowledge that becomes canonical without review. The extraction → authority pipeline is incomplete.

**Proposed solution:** Add `status: Candidate | authority: Candidate` as the default state for newly created knowledge. Promotion to `status: Validated | authority: Canonical` requires explicit review.

---

### Gap 2: No Cross-Project Scope Model

**What PMA has:** Repository-scoped knowledge only. All PMA knowledge belongs to one project.

**What EMA needs:** A scope hierarchy: `session → task → project → workspace → global`. Knowledge must be promotable from project scope to wider scopes through an explicit, auditable process.

**Without this:** EMA cannot provide cross-project engineering knowledge. Each project remains an island.

**Proposed solution:** Add `scope` frontmatter field to all knowledge units. Implement scope inheritance in retrieval. Create promotion pathway with evidence requirements.

---

### Gap 3: No Promotion Pipeline

**What PMA has:** `consolidated_from` frontmatter field for tracking consolidations within one project. `superseded_by` for within-project supersession.

**What EMA needs:** An explicit, auditable pathway for promoting knowledge from project scope to workspace or global scope. This includes: promotion decision record, evidence requirement, actor tracking, quarantine state, and demotion capability.

**Without this:** Project-specific knowledge cannot safely become shared knowledge. The core cross-project use case is impossible to implement without safety.

**Proposed solution:** Add promotion-related frontmatter fields (`promoted_from`, `promoted_by`, `promoted_at`, `promotion_rationale`) and a promotion decision workflow skill.

---

### Gap 4: No Vector Retrieval Index

**What PMA has:** Agent-driven deterministic navigation via progressive loading. This works well for known domains. It does not support "find knowledge relevant to X" when the domain is unknown.

**What EMA needs:** A derived vector index over canonical knowledge units to support semantic retrieval. This enables cross-project knowledge discovery.

**Key constraint:** Vector index is DERIVED, never canonical. Canonical storage remains Markdown + Git.

**Proposed solution:** Background indexing of canonical docs into a local vector store (SQLite vec or LanceDB). Regeneratable from canonical sources at any time.

---

### Gap 5: No Stale Knowledge Detection from Source Changes

**What PMA has:** `last_indexed` / `pending_updates` in domain indexes. `memory-verification` skill. But verification is manually triggered, not event-driven.

**What EMA needs:** When a source file or Git commit changes, linked knowledge should be automatically flagged as `Potentially Stale`. This is the connector → lifecycle event model.

**Without this:** Knowledge can silently become stale as source code evolves. Engineers cannot trust that EMA knowledge reflects current codebase state.

**Proposed solution:** Integrate Git hook or file watcher that flags knowledge units linked to changed sources. Add `Potentially Stale` lifecycle state between `Current` and `Deprecated`.

---

### Gap 6: No Explicit Hard Isolation

**What PMA has:** Repository-scoped knowledge is naturally isolated because it lives inside the project's own Git repository. There is no cross-project sharing.

**What EMA needs:** For cross-project knowledge, isolation must be explicitly configurable. Some projects contain sensitive knowledge that should NEVER be promoted or visible beyond the project boundary.

**Without this:** Sensitive engineering decisions (security patterns, credential management approaches, proprietary algorithms) could be accidentally shared via cross-project queries.

**Proposed solution:** Project-level isolation flag: `ema_isolation: hard | soft` in AGENTS.md or project config. Hard-isolated projects are excluded from workspace/global retrieval regardless of scope.

---

### Gap 7: No MCP Interface

**What PMA has:** DSH plugin (dsh-project-memory) that registers PMA skills in DSH sessions. No MCP.

**What EMA needs:** MCP server exposing EMA retrieve/add/validate/promote tools for non-DSH agents (Claude Code, Cursor, OpenCode).

**Without this:** EMA is only accessible through DSH. Other development environments cannot benefit from it.

**Proposed solution:** EMA MCP server built on the existing PMA DSH plugin architecture, exposing a clean engineering-memory-specific MCP tool set.

---

### Gap 8: No Session-Start Context Injection

**What PMA has:** DSH plugin injects freshness warnings and post-task compounding prompts. But it does not automatically inject active project engineering context into the session.

**What EMA needs:** At session start, EMA should automatically inject a compressed static engineering context (architecture, key constraints, recent decisions) so agents don't need to manually discover it every session.

**Without this:** Agents must explicitly invoke `/project-memory` to get context. For cross-project queries, there is no injection at all. This creates adoption friction.

**Proposed solution:** DSH plugin extended to inject L0 engineering context automatically at session start (compressed to ~500 tokens maximum). Dynamic context is queried on demand.

---

## Important Gaps (Significant but addressable in later phases)

### Gap 9: No Contradiction Representation Model

PMA has a `contradicts` relationship with `Needs Review` verification status. But there is no formal representation of an UNRESOLVED contradiction as a first-class state. Contradictions should be surfaced in retrieval, not resolved silently.

**Phase 2 work:** Formalize contradiction lifecycle states and surfacing behavior.

---

### Gap 10: No Temporal Validity Intervals

PMA tracks `created` and `last_verified` dates but not explicit `valid_from` / `valid_until` intervals. This makes it impossible to answer temporal queries like "what was the architecture as of Q3 2025?"

**Phase 2 work:** Add `valid_from` and `valid_until` frontmatter fields. Implement temporal query mode in retrieval.

---

### Gap 11: No Formal Authority vs Derived Classification

PMA knowledge units can be `confidence: High|Medium|Low` but there is no formal classification of `authority: Canonical | Derived | Candidate`. This distinction is critical for retrieval ranking.

**Phase 1 work:** Add `authority` field to schema with Canonical/Derived/Candidate values.

---

### Gap 12: No CLI Interface

PMA is skill-only (agent-driven). There is no CLI for humans to directly query, add, validate, or promote knowledge.

**Phase 2 work:** Simple CLI wrapping EMA skills.

---

## Gaps That PMA Handles Better Than Supermemory

These are PMA strengths to PRESERVE:

| Capability | PMA (Better) | Supermemory |
|------------|-------------|-------------|
| Evidence discipline | Explicit evidence links required | No evidence model |
| Audit trail | CHANGELOG-MEMORY.md | No audit log |
| Lifecycle richness | 9 states | 2 states (active/forgotten) |
| Relationship typing | 8 semantic types + verification | 3 structural types only |
| Historical preservation | Historical state preserved | Forgotten = soft deleted |
| Ownership | One canonical home per concept | Duplication common |
| Authority model | Confidence + verification required | Recency = authority |
| Git-native | Canonical in Git | Not Git-native |

These must not be weakened in the evolution to EMA.
