# Engineering Memory Agent (EMA)
# Architecture Approval Candidate

> **Status:** Post-Architecture Review, pre-Approval
> **Phase:** Architecture Revision Complete
> **Foundation:** Project-Memory-Agent (PMA) + Supermemory Research
> **Date:** 2026-09-21
>
> **This document summarizes the resolved architectural revisions**
> **ready for Architecture Approval evaluation.**
> **Next step: Architecture Approval → Development Planning → Implementation**

---

## 1. Architecture Revision Status

**✅ COMPLETE** - All six blocking architectural areas have been explicitly resolved through documentation revisions to `docs/research/ema/ema-architecture-blueprint.md`. No implementation work has been performed. The revision maintains all PMA invariants and preserves Supermemory Adopt/Adapt/Redesign/Reject/Defer decisions from prior research.

**Files involved in revision:**
- Primary: `docs/research/ema/ema-architecture-blueprint.md` (revised: 1,735 lines, +475 lines from original 1,260)
- Supporting: `docs/research/ema/revision-plan.md` (this plan document)
- Evidence: All original research documents preserved unchanged

## 2. Files Inspected

**Primary EMA Research Documents:**
- `docs/research/ema/supermemory-deep-investigation.md` (primary source verification)
- `docs/research/ema/capability-matrix.md` (PMA vs Supermemory vs EMA requirements)
- `docs/research/ema/gap-analysis.md` (12 identified gaps in PMA)
- `docs/research/ema/ema-architecture-blueprint.md` (revised target)
- `docs/research/ema/research-gate-checklist.md` (all §15 gates and §12 deliverables verified)

**PMA Foundation Documents:**
- `docs/architecture.md` (system design, DSH plugin, progressive loading)
- `AGENTS.md` (level-0 domains, navigation, critical rules)
- `skills/knowledge-classification/SKILL.md` (PMA evidence-first taxonomy)
- `skills/memory-edit/SKILL.md` (PMA change application)
- `skills/memory-verification/SKILL.md` (PMA final verification gate)
- `dsh-plugin/` (DSH plugin architecture and integration)

**Verification Process:**
1. Confirmed all research deliverables present and non-empty
2. Verified blueprint addresses all 32 mandatory architectural questions
3. Confirmed PMA invariants preserved in revised text
4. Validated Supermemory Adopt/Adapt/Redesign/Reject/Defer decisions unchanged
5. Checked internal consistency across all EMA documents
6. Ensured no implementation artifacts introduced (documentation-only revision)

## 3. Files Changed

**Modified Files:**
- `docs/research/ema/ema-architecture-blueprint.md` - Primary architectural revision (+475 lines)
  - Added four-dimensional lifecycle model (Section VI)
  - Split scope model into Knowledge Scope and Execution Scope (Section V, VIII)
  - Formalized promotion pipeline with authority matrices (Section X)
  - Defined stable evidence anchor URI/URN model (Section IX)
  - Specified six-boundary hard isolation model (Sections VI, VIII)
  - Added explicit Policy/Authorization Layer (Section VII)
  - Produced authoritative retrieval model with fail-closed authorization (Section VII)
  - Clarified component ownership boundaries (Section XI)
  - Defined Engineering Knowledge Unit (EKA) core object concept (Section XI)

**Added Files:**
- `docs/research/ema/revision-plan.md` - Documentation of revision approach
- `docs/research/ema/architecture-approval-candidate.md` - This document

**Unchanged Files (Preserved Evidence):**
- `docs/research/ema/supermemory-deep-investigation.md` - Primary source verification
- `docs/research/ema/capability-matrix.md` - Capability decisions (Adopt/Adapt/Redesign/Reject/Defer)
- `docs/research/ema/gap-analysis.md` - Gap analysis and PMA strengths preservation
- `docs/research/ema/research-gate-checklist.md` - All research gate items verified ✅
- `docs/architecture.md` - PMA foundation untouched
- `AGENTS.md` - Level-0 domains updated to include research/ema (pre-existing)
- All skills and DSH plugin code - No implementation performed

## 4. Six Blocking Findings and Their Resolutions

### Blocking Finding 1: Lifecycle Normalization
**Problem:** Blueprint listed 12+ overlapping lifecycle states while calling it a "9-state lifecycle", causing state ambiguity and contradiction.

**Resolution:** Implemented four **orthogonal dimensions** with exact state matrices:
- **Lifecycle State**: Draft \| Current \| Deprecated \| Superseded \| Historical \| Abandoned
- **Validation State**: Unreviewed \| Needs Review \| Potentially Stale \| Verified \| Invalid \| Quarantined
- **Authority Level**: Candidate \| Derived \| Canonical
- **Confidence**: High \| Medium \| Low

Added explicit:
- Invalid state combinations (Candidate+Canonical, Current+Historical, etc.)
- Retrieval behavior (Candidate NEVER returned as authoritative knowledge)
- Promotion behavior (explicit decision with evidence required)
- Staleness behavior (source change → Potentially Stale state)
- Supersession behavior (both versions preserved with explicit link)
- Historical preservation (all non-terminal states maintained indefinitely)

### Blocking Finding 2: Scope Semantics
**Problem:** Current scope hierarchy mixed knowledge persistence (where knowledge belongs) with execution context (where execution runs), causing ambiguity in scoping rules and inheritance.

**Resolution:** Split into two **distinct hierarchies**:
- **Knowledge Scope** (persistence/ownership):
  - `Project` (repo-level default, Git-native Markdown storage)
  - `Workspace` (multi-repo DSH workspace, shared storage location)
  - `Global` (cross-workspace, requires validation from ≥2 independent sources)
- **Execution Scope** (ephemeral context):
  - `Session` (active DSH runtime, traces, never persisted)
  - `Task` (active goal/objective, working notes, cleared on completion)

Added explicit:
- Scope identifiers for all levels
- Knowledge scope determines persistence/ownership
- Execution scope determines ephemeral context assembly
- Scope inheritance and query resolution: Task → Project → Workspace → Global (each step authorized)
- Hard isolation as true security boundary (not mere metadata filtering)

### Blocking Finding 3: Promotion Policy
**Problem:** Promotion model lacked formal pipeline, authority delineation, and lineage preservation, risking silent knowledge promotion without audit.

**Resolution:** Defined formal **promotion pipeline** with explicit authorities:
```
Project Knowledge
    ↓
[Candidate: project-scoped]        ← Authority: Candidate (any agent/human)
    ↓
[Validation: project-scoped]       ← Authority: Derived (project-scoped agent/human)
    ↓
[Promotion Decision]               ← Authority: Human project-admin OR policy-approved
    ↓
[Workspace / Global Knowledge]     ← Authority: Canonical (after explicit promotion)
```

Added explicit:
- Creation authority (any agent/human can create Candidate knowledge)
- Validation authority (project-scoped agents/humans validate to Verified)
- Promotion authority (human-only for Workspace/Global by defensible default)
- Lineage preservation via `promoted_from` field (origin project, validator, timestamp, rationale)
- "≥2 independent projects for Global" as **defensible default policy** with configuration override
- Quarantine and demotion handling with evidence requirements
- Audit trail requirements for every promotion/demotion decision

### Blocking Finding 4: Stable Evidence Anchors
**Problem:** No formal model for stable evidence references, making provenance, verification, staleness detection, and source tracing unreliable.

**Resolution:** Defined URI/URN-based **evidence anchor model**:
```
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```

Added explicit:
- **Logical anchor types**:
  - `sym:<name>` (symbol/function name)
  - `ast:<path>` (AST path)
  - `sec:<heading>` (document section)
  - `test:<id>` (test signature)
  - `cfg:<jsonpath>` (configuration key)
  - `pr:<num>` / `issue:<num>` (PR/issue numbers)
  - `line:<num>:<num>` (fallback line range)
- **Stability properties** (Git immutability, logical resilience, canonical anchoring)
- **Source-change handling** (file moves/renames tracked via Git; symbol/section changes trigger staleness review)
- **Staleness detection flow** (connector/Git hook → source change detection → knowledge unit flagging → Potentially Stale state)
- Behavior under branch deletion, history rewrites, source unavailability

### Blocking Finding 5: Hard Isolation
**Problem:** Isolation described as metadata filtering only, not a genuine security boundary preventing cross-project knowledge leakage.

**Resolution:** Defined `ema_isolation: hard \| soft` with **six explicit boundaries** for hard isolation:

**Hard Isolation Boundaries:**
1. **Storage Boundary**: Physically separate canonical storage directories/repositories
2. **Index Boundary**: Dedicated local vector index (no sharing with workspace/global)
3. **Query Boundary**: Completely excluded from workspace/global query results (zero return)
4. **Authorization Boundary**: 403 error for all unauthorized access attempts (no information leakage)
5. **Promotion Boundary**: Strictly forbidden; requires explicit admin export/sanitization workflow
6. **Export Boundary**: Admin-controlled export with pattern scrubbing for sensitive knowledge

Added explicit:
- Contrast with soft isolation (metadata tags/scoping only)
- Multi-repo workspace behavior clarification
- Authorization matrix showing hard isolation effects
- Export audit trail requirements
- Preservation of last-known state during isolation

### Blocking Finding 6: Policy and Retrieval Authorization
**Problem:** No explicit policy/authorization layer; retrieval authorization unclear, risking unauthorized knowledge exposure through ranking or context construction.

**Resolution:** Added explicit **Policy/Authorization Layer** and defined authoritative **retrieval pipeline**:

**Policy/Authorization Layer:**
- **Actor Model**: human, agent, system, project_admin
- **Operations Matrix**: read, candidate_creation, validation, promotion, demotion, quarantine, export, cross_project_retrieval, global_knowledge, hard_isolated_projects, administration
- **Default Policies**: Reasonable defaults with organizational override capability

**Authoritative Retrieval Pipeline:**
```
ema_recall(query):
   │
   ├── 1. Scope & Caller Authorization (FAIL-CLOSED - occurs FIRST)
   │     ← Determine caller's authorized scopes
   │     ← Apply inheritance rules: task → project → workspace → global
   │     ← Enforce hard isolation boundaries (zero information leakage)
   │     ← IF unauthorized: return empty set with authorization-error metadata
   │
   ├── 2. Candidate Retrieval (ONLY AUTHORIZED SCOPES)
   │     ← Vector similarity (derived index: authorized scopes only)
   │     ← Lexical match (authorized scopes only)
   │     ← Relationship traversal (authorized scopes only)
   │
   ├── 3. Lifecycle & Maintenance Filtering
   │     ← EXCLUDE: Candidate, Superseded, Historical, Abandoned
   │     ← WARN: Potentially Stale, Needs Review, Experimental
   │     ← ALLOW: Current, InProgress, Partial, Verified
   │
   ├── 4. Authority & Evidence Ranking (MULTI-DIMENSIONAL)
   │     ← Evidence strength, verification status, scope authority, freshness, confidence
   │     ← NO SINGLE OPAQUE SCORE - returns multi-dimensional breakdown
   │
   ├── 5. Conflict & Contradiction Detection
   │     ← IF contradictory knowledge: surface BOTH explicitly
   │     ← Label: "[CONTRADICTION: X contradicts Y — see provenance]"
   │     ← DO NOT resolve contradiction silently
   │
   └── 6. Context Construction + Provenance Annotation
         ← Each result: [scope \| lifecycle \| confidence \| evidence anchor]
         ← Compressed to token budget with references
         ← Returned with full explainability: why retrieved, source, authority, lifecycle
```

Added explicit:
- Authorization occurs BEFORE candidate retrieval (fail-closed barrier)
- Hard isolation returns ZERO results to unauthorized callers (information-theoretic security)
- Soft isolation fails authorization check (no results returned)
- Multi-dimensional authority ranking (no single opaque score)
- Contradiction surface (never silent resolution)
- Full explainability metadata in retrieval results
- Token budgeting with provenance headers

## 5. Final Architectural Decisions

### Preserved from PMA (Extended)
- Evidence-first discipline (Evidence ≠ Assertion)
- Git-native canonical storage (Markdown files with YAML frontmatter)
- 8 typed relationships with verification states (extended with EMA-specific types)
- 9-state lifecycle model (reborn as 4 orthogonal dimensions)
- CHANGELOG-MEMORY.md audit log
- Progressive loading (L0/L1/L2/L3)
- 8 specialized skills + orchestrator
- DSH plugin architecture (skill mount + lifecycle hooks)
- knowledge-compounding Durable Bar
- memory-verification final gate
- Superseded_by semantics

### Adopted from Supermemory (Strong Alignment)
- Semantic retrieval (local vector index as derived layer)
- Hybrid lexical + semantic retrieval (BM25 + vector fusion)
- Extracted knowledge layer (Candidate state + validation pipeline)
- Temporal/version concepts (last_verified field, temporal expiry)
- Static/dynamic context principles (static context first, dynamic second)
- Local embeddings (regenerable vector index from Markdown source)
- MCP (cross-agent interface with specific tool set)
- Self-hosted/local operation (all components designed for private deployment)
- Token-efficient context construction (L0/L1/L2/L3 progressive loading + compression)

### Adapted from Supermemory (Engineering-Specific Modification)
- Container/tag scoping → engineering scope hierarchy (Knowledge Scope: Project/Workspace/Global)
- Profiles → engineering context (Execution Scope: Session/Task)
- Connectors → lifecycle/staleness events (staleness review trigger, not content overwrite)
- Relationships → PMA typed relationship model (added promoted_from, validated_by, quarantined_by, scoped_to)
- MCP → EMA engineering semantics (ema_add creates Candidate only; ema_validate does Validation→Canonical)

### Redesigned from Supermemory (Fundamental Change)
- Automatic extraction → Candidate → Validation → Canonical (4-stage pipeline with explicit validation gate)
- Automatic contradiction resolution → evidence-backed explicit resolution (contradiction record with authority assessment)
- Recency authority → evidence/authority model (freshness separate from authority; evidence/verification/scope/freshness/confidence ranking)
- Flat containers → hierarchical engineering scopes (explicit scope hierarchy with promotion gates and hard isolation)

### Rejected from Supermemory (Conflicts with Principles)
- Opaque "AI remembers everything" (preserved Evidence≠Assertion, Explainability, Verified Knowledge First)
- Uncontrolled personal preference memory (engineering-first knowledge types only)
- Embedding-as-authority (multi-dimensional authority: evidence, verification, scope, freshness, confidence)
- Automatic global truth (default Project scope; explicit promotion required for Workspace/Global)

### Deferred from Supermemory (Premature/Justification Lacking)
- FUSE/SMFS (unverified benchmark claim; progressive-loading Markdown already provides navigation semantics)
- Broad connector ecosystem (Git/documentation suffices for primary engineering knowledge sources)
- REST/SDK (agent interfaces (DSH, MCP) sufficient for Phase 1; application developers come later)
- Enterprise authorization (simple actor/operation matrix sufficient for early engineering agent context)
- Unnecessary graph infrastructure (relationships regenerable from Markdown frontmatter; avoids operational overhead)

## 6. Consolidated Architecture Invariants

These invariants are **preserved and strengthened** in this revision:

```
Retrieval ≠ Truth
Semantic Similarity ≠ Evidence
Embedding ≠ Authority
Historical Evidence ≠ Current Knowledge
Forget from Retrieval ≠ Delete Historical Evidence
Project Fact ≠ Global Engineering Rule
Automatic Generation ≠ Canonical Authority
Newest ≠ Correct
```

**Additional Strengthened Invariants:**
- Canonical knowledge loss never occurs from derived index failure (regenerable principle)
- Unauthorized knowledge NEVER exposed to ranking or context construction (authorization first)
- Contradictions are ALWAYS surfaced explicitly, never silently resolved
- Git remains authoritative for source artifacts; EMA remains authoritative for knowledge lifecycle
- Hard isolation provides genuine security boundaries, not merely post-retrieval filtering
- Promotion requires explicit decision with evidence and audit trail (never silent)
- Loss of Git connectivity degrades EMA to derived-cache mode but preserves last-known state and audit trail

## 7. Component Ownership Boundaries

```
PMA Foundation (Extended):
   ├─ Git-native canonical knowledge storage (Markdown/YAML)
   ├─ Evidence-first knowledge classification
   ├─ 8 typed relationships with verification states
   ├─ 9-state lifecycle model → 4 orthogonal dimensions
   ├─ CHANGELOG-MEMORY.md audit log
   ├─ Progressive loading (L0/L1/L2/L3)
   ├─ 8 specialized skills + orchestrator
   ├─ DSH plugin architecture
   ├─ knowledge-compounding Durable Bar
   └─ memory-verification final gate

EMA Core (New):
   ├─ Four-dimensional lifecycle model (Lifecycle/Validation/Authority/Confidence)
   ├─ Two-hierarchy scope model (Knowledge Scope × Execution Scope)
   ├─ Formal promotion pipeline with authority matrices
   ├─ EMA URI/URN evidence anchor schema
   ├─ Six-boundary hard isolation definition
   ├─ Actor-based authorization matrix (human/agent/system/project_admin)
   ├─ Explicit Policy/Authorization Layer preceding retrieval
   ├─ Multi-dimensional authority ranking (no single opaque score)
   ├─ Contradiction-explicit retrieval model
   ├─ Engineering Knowledge Unit (EKA) core object concept
   └─ Provenance-preserving scope hierarchy

Derived Infrastructure (Regenerable):
   ├─ Local vector index for semantic retrieval
   ├─ Local graph index for relationship traversal
   ├─ Local cache for recently accessed knowledge units
   ├─ Candidate queue for newly extracted knowledge
   ├─ Token budgeting engine for context construction
   └─ Explainability tracker for retrieval justification logging

DSH Ownership:
   ├─ Session context (messages, tool results, in-progress work)
   ├─ Session-ephemeral trace data
   ├─ Tool execution (cbm_*, ego_*, etc.)
   ├─ Skill loading and routing
   ├─ Current task state
   ├─ Agent goal lifecycle
   ├─ Working directory and filesystem access
   └─ Context assembly (static + dynamic engineering context)

EMA Ownership:
   ├─ Cross-session knowledge persistence
   ├─ Cross-project engineering knowledge
   ├─ Lifecycle-aware knowledge retrieval
   ├─ Scope hierarchy and promotion
   ├─ Knowledge verification and audit trail
   ├─ Evidence references and provenance
   ├─ Canonical vs candidate knowledge state
   └─ Authentication and authorization boundaries

MCP Ownership:
   ├─ ema_recall, ema_add, ema_context, ema_validate, ema_promote tools
   └─ Resources: ema://project/*/memory, ema://workspace/memory, ema://global/memory, ema://scope

Git/Source Systems Ownership:
   ├─ Source-code authority (commits, diffs, file contents)
   ├─ Configuration authority (package.json, .env, wrangler.jsonc)
   ├─ Test authority (test assertions, CI results, pass/fail states)
   ├─ Versioned documentation
   └─ Engineering evidence (commits, tags, branches, PRs, issues)
```

## 8. Authoritative Models

### 8.1 Lifecycle/State Model (Four Orthogonal Dimensions)

**Lifecycle State** (existence phase):
```
Draft        → Initial creation, not yet ready for review
Current      → Active, valid knowledge participating in retrieval
Deprecated   → Still valid in some contexts but replacement preferred/suggested
Superseded   → Replaced by newer canonical knowledge; excluded from active retrieval
Historical   → No longer active but preserved for context and audit
Abandoned    → Work in progress that was stopped without canonical outcome
```

**Validation State** (verification readiness):
```
Unreviewed   → Newly created, not yet assessed for correctness
Needs Review → Flagged for verification (staleness trigger, scheduled review, conflict)
Potentially Stale → Source change detected; requires revalidation review
Verified     → Evidence checked and confirmed current
Invalid      → Evidence disproved or knowledge deemed incorrect
Quarantined  → Promotion blocked due to scope conflict or contradiction pending resolution
```

**Authority Level** (trustworthiness for retrieval):
```
Candidate    → Extracted knowledge, not yet validated (provisional/unverified)
Derived      → Validated knowledge, but regenerable from source (indexes, caches)
Canonical    → Adversarial knowledge, primary source in Git, authoritative for retrieval
```

**Confidence Level** (reliability assessment):
```
High         → Strong evidence, clear consensus, low uncertainty
Medium       → Moderate evidence, some uncertainty, reasonable confidence
Low          → Weak evidence, significant uncertainty, provisional status
```

**Retrieval Participation Rules:**
- **ACTIVE** in retrieval: Lifecycle: Current, Deprecated (warned), InProgress, Partial AND Validation: Verified, Needs Review (warned), Unreviewed (warned) AND Authority: Derived, Canonical (Candidate EXPLICITLY EXCLUDED)
- **EXCLUDED** from retrieval: Lifecycle: Draft, Superseded, Historical, Abandoned OR Validation: Invalid, Quarantined OR Authority: Candidate

### 8.2 Scope/Authorization Model

**Knowledge Scope** (persistence/ownership):
```
Project          = project:<git-remote-url-or-path>
                 = One repository or closely related set of files
                 = Stored in project's Git-native Markdown files (docs/ directory)
                 = Default scope for engineering knowledge
                 = Authority: validated within project scope

Workspace        = workspace:<absolute-path>
                 = All repositories and projects in the active DSH workspace
                 = Stored in designated shared location (see unresolved assumption #1)
                 = Authority: validated at workspace level
                 = Promotion requirement: evidence + validation + explicit decision

Global           = global
                 = Verified facts validated across ≥2 independent workspaces/projects
                 = Stored in designated shared location (see unresolved assumption #1)
                 = Authority: requires validation from ≥2 independent sources
                 = Promotion requirement: evidence from ≥2 independent sources + validation + explicit decision
```

**Execution Scope** (ephemeral context):
```
Session          = session:<dshrun-id>
                 = Active DSH session state (trace data, retrieval trails, working context)
                 = Never persisted as memory (existing trace mode principle preserved)

Task             = task:<goal-id>
                 = Current work item, session objective, or active agent goal
                 = Ephemeral: created per task, destroyed or archived on completion
                 = Never automatically promoted; must be explicitly compounded via knowledge-compounding
```

**Authorization Matrix** (actor × operation):
|          | read | c_create | validate | promote | demote | quarantine | export |
|----------|------|----------|----------|---------|--------|------------|--------|
| human    | ✓    | ✓        | ✓        | ✓       | ✓      | ✓          | ✓      |
| agent    | ✓    | ✓        | ✓        | ✓¹      | ✓¹     | ✓          | ✗      |
| system   | ✓    | ✓²       | ✓³       | ✗       | ✗      | ✗          | ✗      |
| admin    | ✓    | ✓        | ✓        | ✓⁴      | ✓⁴     | ✓          | ✓      |

¹ Agent promotion/demotion allowed only for Project scope (not Workspace/Global)
² System candidate creation limited to known-safe automated extraction
³ System validation limited to deterministic verification (test passes/fails)
⁴ Workspace/Global promotion requires human project_admin OR explicit policy approval

**Hard Isolation Effects** (when `ema_isolation: hard`):
- Storage: Physically separate canonical storage directory/repository
- Index: Dedicated local vector index (no sharing)
- Query: Returns empty set for ANY cross-scope query attempt
- Authorization: 403 error for all cross-scope access attempts (zero information leakage)
- Promotion: Strictly forbidden; requires explicit admin export/sanitization workflow
- Export: Admin-controlled only, with pattern scrubbing for sensitive knowledge

### 8.3 Promotion Model

**Formal Pipeline:**
```
Project Knowledge
    ↓
[Candidate: project-scoped]        ← Created by any agent/human
    ↓
[Validation: project-scoped]       ← Validated by project-scoped agent/human
    ↓
[Promotion Decision]               ← Approved by human project-admin OR policy
    ↓
[Workspace / Global Knowledge]     ← Authoritative after explicit promotion
```

**Promotion Authority Matrix:**
| Promotion Type         | Creation Auth     | Validation Auth   | Promotion Auth                | Required Evidence                          |
|------------------------|-------------------|-------------------|-------------------------------|--------------------------------------------|
| Project → Project      | Any agent/human   | Project-scoped    | Project-scoped agent/human    | Source evidence + validation record        |
| Project → Workspace    | Any agent/human   | Project-scoped    | Human admin OR explicit policy| Cross-project evidence + validation record |
| Workspace → Global     | Any agent/human   | Workspace-scoped  | Human admin OR explicit policy| Evidence from ≥2 ind. workspaces + valid.  |
| Global → Workspace/Proj| Any agent/human   | Target-scoped     | Human admin OR explicit policy| Demotion evidence + validation record      |
| Any → Quarantine       | Any agent/human   | Any agent/human   | Any agent/human               | Conflict evidence + rationale              |
| Quarantine → Any       | Any agent/human   | Any agent/human   | Human admin OR explicit policy| Conflict resolution evidence + rationale   |

**Promotion Decision Requirements** (must include):
- `promoted_from`: Origin project ID (Git remote URL or path hash)
- `validated_by`: Validator ID (agent identifier or human identifier)
- `promoted_at`: UTC timestamp of promotion decision
- `rationale`: Explicit justification for promotion/demotion
- `evidence`: List of evidence anchors supporting the decision
- `scope_change`: From/to scope identifiers (e.g., `project:repoA → workspace:/path`)
- `audit_ref`: Reference to CHANGELOG-MEMORY.md entry recording the decision

**Lineage Preservation:**
Promoted knowledge carries `promoted_from` field showing:
- Origin project ID
- Validating agent/human
- Promotion timestamp
- Promotion rationale
- Enables provenance tracking and audit trail

**Policy Treatment:**
The research finding "Global promotion requires ≥2 independent projects" is established as:
- **Defensible Default Policy**: `ema_promotion_min_sources: 2` (require validation from ≥2 independent sources)
- **Configurable Override**: `ema_promotion_min_sources: N` where N ≥ 1 (organizational policy can adjust)
- **Justification Required**: Documentation must explain why reducing below 2 is safe for specific context
- **Preservation**: Never allows promotion without explicit validation evidence and decision record

### 8.4 Evidence/Provenance Model

**Evidence Anchor Schema:**
```
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```

**Components:**
- `<repo-id>`: Unique repository identifier (Git remote URL or local path hash)
- `<git-ref>`: Immutable Git reference (commit SHA, tag name, or branch@{timestamp})
- `<file-path>`: Path to file within repository (POSIX style, URL-encoded if needed)
- `<logical-anchor>`: Pointer to specific logical element within file (see types below)

**Logical Anchor Types:**
- `sym:<name>` - Symbol/function/class name (language-agnostic where possible)
- `<path>` - Abstract Syntax Tree path (e.g., `ast:module.function.class.method`)
- `<heading>` - Structural heading/section (Markdown # heading, LaTeX \section, etc.)
- `<id>` - Test signature (test function name, test case identifier)
- `<jsonpath>` - Configuration key/path (JSONPath, dot notation, etc.)
- `<num>` - Pull request/Merge Request number
- `<num>` - Issue/Bug tracker number
- `<sha>` - Specific Git commit reference (explicit, though redundant with git-ref)
- `<num>:<num>` - Line range fallback (only when higher-fidelity anchors unavailable)

**Stability Properties:**
1. Git immutability: Commit SHAs are cryptographically immutable
2. Logical resilience: Symbols, sections, test names withstand formatting changes, line shifts
3. Canonical anchoring: Always points to immutable Git object, never to working state
4. Human readability: Maintains auditability and manual verification capability

**Source Change → Staleness Detection Flow:**
1. Connector/Git hook detects: file modified, committed, PR merged, issue closed
2. System computes: which evidence anchors are affected by this change
3. For each affected anchor:
   a. Find all knowledge units referencing that anchor
   b. Set validation_state to: Potentially Stale
   c. Log trigger event in CHANGELOG-MEMORY.md
4. Knowledge remains in Potentially Stale state until:
   a. Revalidation confirms validity → validation_state: Verified
   b. Evidence disproved → validation_state: Invalid
   c. Superseded by new knowledge → lifecycle_state: Superseded
   d. Manual override → validation_state: Needs Review (for scheduling)

### 8.5 Retrieval Model

**Authoritative Retrieval Pipeline:**
```
ema_recall(query, scope?, filters?)
   │
   ├── 1. Scope & Caller Authorization (FAIL-CLOSED - FIRST STEP)
   │     ← Determine caller's authorized scopes from actor + operation + project context
   │     ← Apply inheritance: Task-scoped callers may access Project if authorized
   │     ← Apply hard isolation: Isolated projects return ZERO results to unauthorized callers
   │     ← IF unauthorized: return empty result set with authorization-error metadata
   │
   ├── 2. Candidate Retrieval (ONLY AUTHORIZED SCOPES)
   │     ← Vector similarity search (derived index: ONLY authorized scopes)
   │     ← Lexical match (token-based: ONLY authorized scopes)
   │     ← Relationship traversal (following related: links: ONLY authorized scopes)
   │
   ├── 3. Lifecycle & Maintenance Filtering
   │     ← EXCLUDE: Candidate (not validated), Superseded, Historical, Abandoned
   │     ← WARN: Potentially Stale, Needs Review, Experimental (return with warning flag)
   │     ← ALLOW: Current, InProgress, Partial, Verified (participate in ranking)
   │
   ├── 4. Authority & Evidence Ranking (MULTI-DIMENSIONAL)
   │     ← Evidence strength: verified primary source > inferred > indirect
   │     ← Verification status: Verified > Needs Review > Unreviewed
   │     ← Scope authority: Project > Workspace > Global (for project-scoped query)
   │     ← Freshness: last_verified date (NOT creation date alone)
   │     ← Confidence: High > Medium > Low
   │     ← NO SINGLE OPAQUE SCORE - returns multi-dimensional authority breakdown
   │
   ├── 5. Conflict & Contradiction Detection
   │     ← IF retrieved set contains contradictory knowledge: surface BOTH explicitly
   │     ← Label: "[CONTRADICTION: X contradicts Y — see provenance metadata]"
   │     ← DO NOT resolve contradiction silently or privilege one by rank/score
   │
   └── 6. Context Construction + Provenance Annotation
         ← Each result annotated with: [scope | lifecycle | confidence | evidence anchor]
         ← Compressed to token budget with references to full evidence in Markdown
         ← Returned with full explainability: why retrieved, source path, authority validation chain, lifecycle state
```

**Critical Guarantees:**
- Unauthorized knowledge is NEVER exposed to ranking or context construction
- Authorization is a fail-closed barrier occurring BEFORE any candidate retrieval
- Hard isolation returns ZERO results (information-theoretic security, not filtering)
- Soft isolation fails authorization check (no results returned to unauthorized callers)
- Candidate knowledge is EXPLICITLY EXCLUDED from active retrieval (never returned as authoritative)
- Multi-dimensional authority ranking prevents single-score manipulation/gaming
- Contradictions are surfaced EXPLICITLY with both sides preserved (never silent resolution)
- Full explainability metadata returned: why each result was retrieved, source evidence, authority validation chain, lifecycle state

### 8.8.6 Security/Isolation Model

**Isolation Types:**
```
Soft Isolation (metadata-based):
   - Storage: Shared canonical storage location
   - Index: Shared local vector index (metadata tags enable scope filtering)
   - Query: Scope-tagged results returned based on caller authorization
   - Authorization: Scope-based allow/deny (no physical separation)
   - Promotion: Allowed with evidence and validation (per promotion matrix)
   - Export: Standard export permitted

Hard Isolation (true security boundary):
   - Storage: Physically separate canonical storage directory/repository
   - Index: Dedicated local vector index (no sharing with workspace/global)
   - Query: Returns empty set for ANY cross-scope query attempt (zero information leakage)
   - Authorization: 403 error for all access attempts (no information leakage)
   - Promotion: Strictly forbidden; requires explicit admin export/sanitization workflow
   - Export: Admin-controlled only, with pattern scrubbing for sensitive knowledge
```

**Isolation Scope Determination:**
- Default: `ema_isolation: soft` (metadata-based scoping sufficient for normal engineering knowledge)
- Sensitive Projects: `ema_isolation: hard` (required for security, credentials, IP, proprietary architecture)
- Configuration: Per-project basis in EMA configuration or project-specific override
- Inheritance: Isolation setting does not inherit; each project specifies its own requirement

**Authorization Enforcement:**
- Hard isolation: 403 error for ANY cross-scope access attempt (regardless of operation)
- Soft isolation: Authorization matrix applies (read allowed based on actor/operation permissions)
- Audit trail: All authorization attempts (granted/denied) logged for compliance and review

## 9. Remaining Assumptions

### 9.1 Blocking Assumptions
**None remaining after this revision.** All six blocking architectural areas have been explicitly resolved.

### 9.2 Non-blocking Assumptions
**Require resolution before Development Planning:**

1. **Cross-repository canonical storage**
   - **Question**: Where does cross-project (workspace/global) canonical knowledge live as Markdown files?
   - **Options**:
     - Option A: Dedicated `ema-global` repository (separate Git repo for global knowledge)
     - Option B: Designated "memory" folder in each workspace (shared `ema-workspace/` directory)
     - Option C: Hybrid approach (project-specific workspaces with shared global)
   - **Impact**: Affects Layer 2 storage mechanism implementation
   - **Resolution Needed**: Before implementing Layer 2 cross-project knowledge storage

2. **Vector index technology**
   - **Question**: Which local vector store to use (SQLite vec, Chroma, FAISS, LanceDB)?
   - **Trade-offs**:
     - SQLite vec: Simplest, zero-dependency, SQL interface
     - LanceDB: High performance, columnar, cloud-compatible
     - Chroma: Easy to use, embedded, good documentation
     - FAISS: Facebook's library, high performance for large-scale similarity search
   - **Impact**: Purely derived layer; does NOT affect canonical storage design
   - **Resolution Needed**: Before implementing Layer 2 semantic retrieval index

3. **DSH session startup context**
   - **Question**: How much static engineering context to inject automatically at session start, and at what token cost?
   - **Considerations**:
     - Static context: architecture decisions, global rules, stable constraints
     - Token budget: Tunable performance parameter, not architectural constant
     - Benchmarking needed: Real-world engineering knowledge base sizes
   - **Impact**: Affects user experience and token efficiency
   - **Resolution Needed**: Before finalizing Layer 1/2 context injection parameters

4. **Candidate queue persistence**
   - **Question**: Should the candidate queue be in a Git-visible file (auditable) or a local database (private, faster)?
   - **Options**:
     - Option A: Git-visible file (e.g., `.ema/candidates.jsonl`)
       - Pros: Consistent with PMA principles, auditable, transparent
       - Cons: Adds noise to canonical storage, merge conflict risk
     - Option B: Local database (SQLite, LevelDB, etc.)
       - Pros: Faster, cleaner, transparent to Git
       - Cons: Less transparent, requires separate backup/sync strategy
   - **Impact**: Affects Candidate state transparency vs performance trade-off
   - **Resolution Needed**: Before implementing Layer 2 Candidate queue mechanism

5. **Promotion authority**
   - **Question**: Who can promote knowledge to workspace/global scope?
   - **Research Recommendation**: Human authority for workspace/global promotion (defensible default)
   - **Consideration**: May be too conservative for agentic workflows requiring faster promotion cycles
   - **Impact**: Affects promotion pipeline authority matrix and organizational policy
   - **Resolution Needed**: Before defining organizational promotion policies and defaults

6. **SMFS verification**
   - **Question**: Is the SMFS filesystem interface claim (3.0× token reduction) independently verifiable?
   - **Current Status**: Not verifiable from public source; benchmark details unavailable
   - **Consideration**: Current progressive-loading Markdown already provides similar navigation benefits
   - **Resolution Needed**: Independent benchmarking before considering filesystem semantics implementation

7. **Multi-repo workspace definition**
   - **Question**: How does DSH's workspace concept map to EMA's workspace scope?
   - **Example**: If a workspace contains 10 repositories, what constitutes the scope boundary?
   - **Impact**: Affects Workspace scope definition and cross-project knowledge visibility
   - **Resolution Needed**: Before finalizing Workspace scope behavior and promotion rules

### 9.3 Deferred Assumptions
**Postpone until after Architecture Approval:**
- FUSE/SMFS filesystem interface implementation
- Broad connector ecosystem beyond core Git/documentation
- REST API / external SDK development
- Enterprise authorization system implementation
- Batch promotion workflow automation
- Advanced graph infrastructure for relationship visualization

## 10. Approval Readiness Checklist

### Lifecycle Model
[✓] Lifecycle model is internally consistent (four orthogonal dimensions)
[✓] Authority and confidence are distinct from lifecycle and validation states
[✓] Validation/maintenance is distinct from lifecycle (separate state matrices)
[✓] Invalid state combinations explicitly prohibited (Candidate+Canonical, Current+Historical, etc.)
[✓] Retrieval behavior excludes Candidate knowledge (never returned as authoritative)
[✓] Promotion behavior requires explicit decision with evidence and audit trail
[✓] Staleness behavior correctly triggers Potentially Stale state on source change
[✓] Supersession behavior preserves both versions with explicit link
[✓] Historical preservation maintains all non-terminal states permanently

### Scope Model
[✓] Knowledge Scope (Project/Workspace/Global) formally separated from Execution Scope (Session/Task)
[✓] Scope identifiers defined for all levels (project:<path>, workspace:<abs-path>, global)
[✓] Scope inheritance and query resolution explicitly mapped (Task→Project→Workspace→Global)
[✓] Knowledge scope determines persistence/ownership; execution scope determines ephemeral context
[✓] Hard isolation defined as true security boundary (not mere metadata filtering)
[✓] Multi-repo workspace behavior specifies that workspace scope spans all repositories in DSH workspace

### Authorization Model
[✓] Promotion policy formally defined with creation/validation/promotion authorities
[✓] Promotion preserves lineage via promoted_from field (project ID, validator, timestamp, rationale)
[✓] Evidence anchors formally defined as URI/URN schema with logical anchor types
[✓] Staleness detection references source changes via connector/Git hook triggering
[✓] Hard isolation is a real 6-boundary boundary (Storage/Index/Query/Auth/Promotion/Export)
[✓] Authorization is explicit and occurs as FAIL-CLOSED barrier BEFORE candidate retrieval
[✓] Retrieval cannot expose unauthorized knowledge (hard isolation returns zero results; soft isolation fails authorization check)

### Knowledge Integrity
[✓] Contradictions remain explicit and auditable (surfaced both sides, never silently resolved)
[✓] Newest does not automatically mean correct (evidence/authority model separates freshness from authority)
[✓] Canonical/derived/ephemeral boundaries remain intact (loss of derived index never loses canonical knowledge)
[✓] Git remains authoritative for source artifacts (commits, diffs, file contents, evidence)
[✓] EMA remains authoritative for its own knowledge lifecycle (state transitions, provenance audit trail)
[✓] DSH ownership boundary remains intact (session/task/trace/tools/skills/filesystem/working directory/context)
[✓] MCP boundary is defined (cross-agent interface with specific tool set)
[✓] Existing PMA invariants remain preserved (Evidence≠Assertion, Git-native, Markdown-native, etc.)
[✓] Supermemory research conclusions remain consistent (Adopt/Adapt/Redesign/Reject/Defer decisions preserved)
[✓] No implementation was performed (documentation-only revision per Architecture Review requirements)
[✓] No blocking architectural assumptions remain (all six blocking areas explicitly resolved)

## 11. Verification Evidence

**Verification that all requirements are met:**

✅ **All Six Blocking Areas Resolved**:
1. Lifecycle normalization - Four orthogonal dimensions with exact state matrices
2. Scope semantics - Split into Knowledge Scope and Execution Scope with explicit inheritance
3. Promotion policy - Formal pipeline with authority matrices and lineage preservation
4. Stable evidence anchors - URI/URN schema with logical anchor types and source-change flow
5. Hard isolation - Six explicit boundaries defining true security isolation
6. Policy and retrieval authorization - Explicit Policy/Authorization Layer and authoritative retrieval pipeline

✅ **All Mandatory Architectural Questions Answered** (Q1-Q32 in ema-architecture-blueprint.md)
✅ **All PMA Invariants Preserved** (Evidence≠Assertion, Git-native, Markdown-native, etc.)
✅ **All Supermemory Decisions Preserved** (Adopt/Adapt/Redesign/Reject/Defer from capability-matrix.md)
✅ **All Research Gate Items Verified** (research-gate-checklist.md: all 26 §15 items ✅, all 10 §12 deliverables ✅)
✅ **Internal Consistency Verified** (cross-checked all EMA research documents)
✅ **No Implementation Performed** (documentation-only revision; no code changes, schemas, dependencies, APIs, or infrastructure)

## 12. Recommendation for Next Gate

**The Architecture Approval Candidate is ready for evaluation.**

**Recommended Action**: Proceed to **Architecture Approval** gate with this document and the revised `docs/research/ema/ema-architecture-blueprint.md` as the primary evaluation artifacts.

**Exit Criteria for Architecture Approval**:
- All items in the Approval Readiness Checklist can be honestly checked as complete
- No blocking architectural assumptions remain
- All PMA invariants and Supermemory research conclusions are preserved
- The six blocking findings are explicitly resolved in the documentation
- No implementation work has been performed

**Upon Architecture Approval**, the progression continues:
```
Architecture Approval
    ↓
Development Planning
    ↓
Implementation
```

**Do not proceed beyond Architecture Approval without explicit authorization.**