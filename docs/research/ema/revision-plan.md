# EMA Architecture Revision Plan

## Objective
Revise the EMA Architecture Blueprint to resolve the six blocking architectural areas identified in the Architecture Review while preserving PMA's existing guarantees and Supermemory Adopt/Adapt/Redesign/Reject/Defer decisions.

## Files to Inspect
- Primary: docs/research/ema/ema-architecture-blueprint.md (target for revision)
- Supporting: docs/research/ema/capability-matrix.md, gap-analysis.md, supermemory-deep-investigation.md, research-gate-checklist.md
- PMA Foundation: docs/architecture.md, AGENTS.md, skills/knowledge-classification/SKILL.md

## Resolution Details

### 1. Lifecycle Normalization
**Problem**: Blueprint calls lifecycle "9-state" while listing 12+ states in overlapping dimensions.
**Solution**: Define four orthogonal dimensions with exact state matrices, transitions, and retrieval behaviors:
- Lifecycle State: Draft | Current | Deprecated | Superseded | Historical | Abandoned
- Validation State: Unreviewed | Needs Review | Potentially Stale | Verified | Invalid | Quarantined
- Authority Level: Candidate | Derived | Canonical
- Confidence: High | Medium | Low
Add explicit invalid combinations (e.g., Candidate + Canonical), retrieval filtering rules (Candidate excluded from active retrieval), and promotion behavior.

### 2. Scope Semantics
**Problem**: Current scope hierarchy mixes knowledge persistence with execution context.
**Solution**: Split into two distinct hierarchies:
- Knowledge Scope: Project (repo-level default) → Workspace (multi-repo group) → Global (cross-workspace)
- Execution Scope: Session (ephemeral DSH runtime) → Task (active goal context)
Define scope identifiers, ownership, visibility, inheritance, authorization rules, hard isolation semantics, and how execution context determines knowledge scope query boundaries.

### 3. Promotion Policy
**Problem**: Promotion model lacks formal pipeline and authority delineation.
**Solution**: Formal promotion pipeline:
Project Knowledge → [Candidate (target scope)] → Validation → [Promotion Decision] → Workspace/Global Knowledge
Define:
- Creation authority: any agent/human
- Validation authority: project-scoped agents or humans
- Promotion authority: human-only for workspace/global (defensible default)
- Lineage preservation: promoted_from (project ID, commit SHA, timestamp, validator, rationale)
- Policy: "≥2 independent projects for Global" as defensible default with configuration override

### 4. Stable Evidence Anchors
**Problem**: No formal model for stable evidence references supporting provenance/staleness/drift.
**Solution**: Define URI/URN-based evidence anchor model:
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
Logical anchors: sym:<name> (symbol), ast:<path> (AST path), sec:<heading> (document section), test:<id> (test signature), cfg:<jsonpath> (config key), pr:<num> (pull request), issue:<num>
Define stability properties, handling of file moves/renames (Git tracking), symbol changes, branch divergence, source deletion/rewrite, and connector-triggered staleness detection flow.

### 5. Hard Isolation
**Problem**: Isolation described as metadata filtering only, not true security boundary.
**Solution**: Define ema_isolation: hard | soft with six explicit boundaries:
- Storage Boundary: Physically separate canonical storage directories/repos
- Index Boundary: Dedicated local vector index (no shared derived indexes)
- Query Boundary: Completely excluded from workspace/global query results
- Authorization Boundary: 403 error for unauthorized access attempts
- Promotion Boundary: Promotion strictly forbidden; requires explicit sanitization/export workflow
- Export Boundary: Admin-controlled export with scrubbing of sensitive patterns
Hard isolation is a real security boundary, not merely post-retrieval filtering.

### 6. Policy and Retrieval Authorization
**Problem**: No explicit policy/authorization layer; retrieval authorization unclear.
**Solution**: Add Policy/Authorization Layer with:
- Actor Model: human, agent, system, project_admin
- Operations Matrix: read, candidate_creation, validation, promotion, demotion, quarantine, cross_project_retrieval, global_knowledge, hard_isolated_projects, export, administration
- Authoritative Retrieval Pipeline:
  1. Scope & Caller Authorization (fail-closed BEFORE retrieval)
  2. Candidate Retrieval (lexical + semantic on authorized indices only)
  3. Lifecycle/Maintenance Filtering (exclude Candidate, Superseded, Historical, Abandoned; warn on Potentially Stale, Deprecated, Experimental)
  4. Authority & Evidence Ranking (multi-dimensional: evidence strength, scope authority, verification status, freshness, confidence - no single opaque score)
  5. Conflict & Contradiction Detection (surface contradictions explicitly, do not resolve silently)
  6. Context Construction & Token Budgeting (tunable budget, provenance headers)
  7. Explainability Trace (why retrieved, source anchor, authority, lifecycle)

## Implementation Notes
- All changes must preserve PMA's existing engineering-memory guarantees
- Preserve all Supermemory Adopt/Adapt/Redesign/Reject/Defer decisions from research
- No implementation work - documentation only
- After revision, produce Architecture Approval Candidate document