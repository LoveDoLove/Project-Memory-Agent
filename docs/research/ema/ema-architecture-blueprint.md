# Engineering Memory Agent (EMA)
# Architecture Blueprint

> **Status:** Research deliverable — pre-implementation
> **Phase:** EMA Architecture Discovery
> **Foundation:** Project-Memory-Agent (PMA)
> **Date:** 2026-09
>
> **This document is a research output, not an approved architecture.**
> Must pass Architecture Review and Architecture Approval before Development Planning begins.
> See: Research → EMA Architecture Blueprint → Architecture Review → Architecture Approval → Development Planning → Implementation

---

## Part I: What EMA Is and Is Not

### What EMA Is

EMA is an **engineering knowledge layer** — a system-level capability that makes engineering knowledge:

- **Persistent** — survives across sessions, tools, and time
- **Discoverable** — retrievable by agents without knowing exactly what to look for
- **Contextual** — scoped to the right project, repository, task, or workspace
- **Explainable** — every piece of retrieved knowledge can be explained: origin, scope, evidence, lifecycle state
- **Verifiable** — claims can be traced to source evidence (code, tests, Git, documentation)
- **Lifecycle-aware** — knowledge has explicit states: current, deprecated, superseded, historical
- **Scope-safe** — project-specific knowledge cannot silently become global engineering truth
- **Reusable** — validated knowledge can be promoted for cross-project use

### What EMA Is Not

EMA is NOT:

- A generic RAG wrapper
- An embedding-first memory system where semantic similarity determines authority
- An opaque "AI remembers everything" system
- A replacement for Git
- A replacement for engineering documentation
- A generic graph database
- An uncontrolled personal profile database (user preferences are not engineering facts)
- A system where the newest claim automatically wins
- A system where automatic extraction creates canonical authority

### Why EMA Exists (Beyond PMA)

PMA is a **project-scoped** memory system. It is excellent at:

- Managing knowledge within a single repository
- Evidence-first knowledge classification
- Lifecycle-aware maintenance
- Typed relationships within one project's knowledge base

EMA exists to add what PMA cannot provide:

- Knowledge that crosses **project boundaries** safely
- A **promotion pathway** from project-local to shared engineering knowledge
- **Cross-agent and cross-tool** memory (DeepSeek Harness, MCP, CLI)
- **Scope hierarchy** with inheritance and authorization
- **Candidate knowledge states** between extraction and authority
- **Verified cross-project retrieval** with provenance
- **Temporal validity** beyond simple lifecycle states

---

## Part II: Research Findings — Mandatory Architectural Questions

### Q1. What does "memory" mean in an engineering system?

**Answer (Architectural Recommendation):**

In an engineering system, "memory" means exactly four things — kept conceptually distinct:

```
Evidence     = Source-backed material (Git commits, code, tests, docs, configs)
                → Cannot be fabricated; comes from primary sources

Knowledge    = Verified, structured understanding derived from evidence
                + Human or agent classification + lifecycle state

Context      = Selected, compressed knowledge relevant to the current task
                → Ephemeral; does not persist beyond the current scope

History      = Immutable record of what was known, when, and what changed it
                → Preserved even when superseded or deprecated
```

Memory ≠ what the agent "remembered" from conversation.
Memory = what engineering evidence supports, verified and lifecycle-classified.

---

### Q2. What is canonical engineering truth?

**Answer (Architectural Recommendation):**

Canonical engineering truth has a **source** and an **evidence chain**. There are only two classes:

```
Canonical Source Evidence
   = Git-native: commit history, diffs, PR descriptions, tagged decisions
   = Markdown-native: architecture documents, ADRs, AGENTS.md, README
   = Test-native: test assertions, CI results, passing/failing states
   = Config-native: package.json, wrangler.jsonc, .env patterns

Canonical Derived Knowledge
   = Extracted from evidence, verified by an agent or human, explicitly promoted
   = Must be traceable back to canonical source evidence
   = Must carry lifecycle state and confidence
```

**What is NOT canonical by itself:**
- Embeddings (derived from canonical content)
- Profiles (derived from observations)
- Agent memory ("the agent remembers saying X in session Y")
- Search results (retrieval ≠ truth)
- LLM-generated summaries without source tracing

---

### Q3. What belongs in memory versus source knowledge?

**Answer (Architectural Recommendation):**

```
Source Knowledge (stays in its native location)
   → Git history, source code, test results, CI logs
   → EMA references these; does not duplicate them

Memory (what EMA stores)
   → Verified facts extracted from source knowledge
   → Decisions with rationale and evidence
   → Architecture patterns with context and constraints
   → Solutions to diagnosed problems (Solutions knowledge type)
   → Lessons learned from completed work
   → Constraints that cross project boundaries
   → Relationships between knowledge units
```

**Principle:** EMA stores the **index** and **distillation** of engineering knowledge, not the raw sources. Git remains authoritative for source changes; EMA tracks the engineering understanding of those changes.

---

### Q4. What should be derived rather than canonical?

**Answer (Architectural Recommendation):**

| Derived (never canonical) | Canonical |
|--------------------------|-----------|
| Vector embeddings | Knowledge unit Markdown + frontmatter |
| User profiles | Git history |
| Search result rankings | Evidence references |
| Context windows | Typed relationships |
| Graph visualizations | Lifecycle states |
| AI summaries (unless verified and promoted) | Audit log (CHANGELOG-MEMORY.md) |

**Rule:** If it can be regenerated from canonical sources without information loss, it is derived.

---

### Q5. What is the correct scope model?

**Answer (Architectural Recommendation):**

EMA separates **Knowledge Scope** (where knowledge persists and is owned) from **Execution Scope** (where execution runs and context is assembled).

#### Knowledge Scope (Persistence Hierarchy)
```
Project (default)
   = One repository or closely related set of files
   = Knowledge is project-scoped by default
   = Stored in the project's Git-native Markdown files
   = Authority: validated within project scope (existing PMA model)

Workspace
   = All repositories and projects in the active DSH workspace
   = Knowledge visible across projects in workspace
   = Authority: validated at workspace level (requires cross-project evidence)
   = Stored in a designated shared location (see unresolved assumption #1)

Global
   = Verified facts validated across ≥2 independent workspaces or projects
   = Shared patterns with explicit evidence from multiple sources
   = Authority: requires validation from ≥2 independent sources
   = Stored in a designated global location (see unresolved assumption #1)
```

#### Execution Scope (Ephemeral Context Hierarchy)
```
Session
   = Active DSH session state (trace data, retrieval trails, working context)
   = Never persisted as memory (existing trace mode principle preserved)

Task
   = Current work item, session objective, or active agent goal
   = Ephemeral: created per task, destroyed or archived on completion
   = Never automatically promoted; must be explicitly compounded via knowledge-compounding
```

**Scope Inheritance & Query Resolution:**
When a query is issued from an execution scope (Task or Session), EMA resolves knowledge in this order:
1. Task-scoped knowledge (if explicitly allowed and within token budget)
2. Project-scoped knowledge (default scope for most engineering knowledge)
3. Workspace-scoped knowledge (if cross-project retrieval is authorized)
4. Global-scoped knowledge (if global retrieval is authorized)

Each step requires explicit authorization and is never automatic.

**Hard isolation boundaries:**
- `Project` → `Workspace`/`Global`: requires explicit promotion decision + evidence
- Sensitive projects can be marked with `ema_isolation: hard` to enforce true storage and query boundaries (see Section 5 below).

---

### Q6. What should be hard-isolated versus metadata-filtered?

**Answer (Architectural Recommendation):**

```
Hard isolation required:
   - Confidential project knowledge (security, credentials, IP)
   - Projects marked as isolated in EMA configuration
   - Knowledge containing sensitive engineering decisions

Soft metadata filtering sufficient:
   - Normal cross-project knowledge queries
   - Public engineering patterns
   - Shared tooling knowledge
   - Global engineering rules
```

**Implementation principle:** Hard isolation defines true security boundaries (separate storage, indexes, query prohibition). Soft filtering relies on metadata predicates/tags that can be bypassed. EMA implements hard isolation as a configurable mode providing genuine separation, not merely post-retrieval filtering.

---

### Q7. How should project-local and shared knowledge interact?

**Answer (Architectural Recommendation):**

```
Project-local knowledge (default):
   → Stored in project scope
   → Not visible in cross-project search by default
   → Explicitly promoted to gain cross-project visibility

Shared knowledge (promoted):
   → Requires promotion decision: who promoted it, when, why
   → Carries original project provenance
   → Can be demoted if found to be project-specific after all

Cross-project search:
   → Returns results from: Project + Workspace (if allowed) + Global
   → Each result carries its scope in response
   → Caller must be scope-authorized to see Workspace/Global knowledge
```

---

### Q8. How should knowledge be promoted or demoted?

**Answer (Architectural Recommendation):**

```
Promotion (Project → Workspace → Global):
   1. Observation: knowledge exists in project scope
   2. Candidate: agent or human proposes promotion with evidence
   3. Validation: evidence verified, scope reviewed, conflicts checked
   4. Promotion decision: explicit decision with rationale
   5. Promoted state: visible at wider scope with provenance preserved

Demotion (Global/Workspace → Project):
   1. Evidence shows knowledge is not general
   2. Demotion decision recorded with rationale
   3. Knowledge returns to narrower scope
   4. History preserved (it was promoted, then found to be project-specific)

Quarantine:
   1. Knowledge found to conflict with other scopes
   2. Marked quarantine: not promoted, under review
   3. Conflict must be resolved before any wider promotion
```

**Key invariant:** Promotion never happens silently. It always has: an agent/human actor, evidence, rationale, and an audit trail.

---

### Q9. How can project-specific knowledge avoid becoming accidental global truth?

**Answer (Architectural Recommendation):**

Three mechanisms are required:

1. **Default scope is Project** — knowledge only becomes visible beyond its origin scope when explicitly promoted.
2. **Scope tagging on every knowledge unit** — frontmatter includes `scope: project | workspace | global`, and the scope cannot be changed without an explicit promotion/demotion decision.
3. **Promotion gate** — EMA must require evidence from ≥2 independent projects before promoting to Global. A convention seen once in one project is not a global engineering rule.

---

### Q10. How should contradictions be represented?

**Answer (Architectural Recommendation):**

Contradictions must be first-class, not resolved-away:

```
Contradiction record:
   - contradicts relationship between two knowledge units
   - Authority assessment: which has stronger evidence?
   - Resolution status: Unresolved | Resolved | Deferred
   - Resolution decision: who, when, what evidence, what outcome
   - Both versions preserved in history even after resolution
```

**Invariant:** `Newest ≠ Correct`. A newer claim does not automatically supersede an evidenced older claim. Resolution requires evidence comparison, not timestamp comparison.

---

### Q11. How should historical knowledge differ from current knowledge?

**Answer (Architectural Recommendation):**

```
Current Knowledge:
   - status: Current
   - Participates in retrieval
   - Part of active context

Historical Knowledge:
   - status: Historical
   - Excluded from active retrieval by default
   - Available via explicit historical query
   - Never deleted: provides context for future decisions
   - CHANGELOG-MEMORY.md records what changed it

Deprecated Knowledge:
   - status: Deprecated
   - Still has current validity in some contexts
   - Warned in retrieval: "This knowledge is deprecated"
   - Replacement must be identified

Superseded Knowledge:
   - status: Superseded
   - superseded_by link to replacement
   - Excluded from active retrieval
   - Historically preserved
```

---

### Q12. How should forgetting work?

**Answer (Architectural Recommendation — extends PMA's model):**

```
Forgetting from retrieval ≠ Deleting historical evidence

Forgetting (EMA):
   1. Knowledge becomes status: Deprecated / Superseded / Historical
   2. Excluded from active retrieval index
   3. Still accessible via explicit historical queries
   4. CHANGELOG-MEMORY.md records why it was forgotten
   5. Source evidence remains in Git (never touched)

Temporal expiry (task-scoped only):
   - Task-scoped knowledge can have explicit TTL
   - Expiry moves to historical state, not deletion
   - Appropriate for: working context, temporary notes

Permanent deletion (exceptional):
   - Only for: GDPR/privacy requirements, accidental credential exposure
   - Recorded as explicit deletion decision
   - Historical record notes: "deleted; reason: [X]"
```

---

### Q13. How should stale knowledge be detected?

**Answer (Architectural Recommendation):**

```
Staleness detection triggers:
   1. Source changed: connector or Git detects a relevant file/commit changed
      → Knowledge linked to that source is flagged "Potentially Stale"
   2. Time-based: knowledge last_verified >N days ago
      → Flagged for review by maintenance workflow
   3. Lifecycle trigger: superseded_by set on related knowledge
      → Dependent knowledge may be implicitly stale
   4. Contradiction detected: new knowledge contradicts existing
      → Both flagged for review
   5. Scope promotion review: promoted knowledge that hasn't been revalidated in N months

Staleness states:
   - Potentially Stale (trigger detected, not yet reviewed)
   - Needs Review (in review queue)
   - Revalidated (confirmed still current after review)
   - Superseded (replaced; not stale but no longer current)
```

---

### Q14. How should relationships evolve?

**Answer (Architectural Recommendation):**

Extend PMA's relationship model:

```
Current PMA relationships (keep all):
   supersedes, evolved_from, resolves, caused_by,
   affects, belongs_to, contradicts, derived_from

Add for EMA:
   promoted_from:project:<project-id>  → cross-scope promotion
   validated_by:<agent|human>          → validation event reference
   quarantined_by:<reason>             → quarantine record
   scoped_to:<scope>                   → explicit scope assignment

Verification states (keep from PMA):
   Verified, Needs Review, Invalid, Untyped-Legacy

Add for EMA:
   Pending (newly created, not yet reviewed)
   Promoted (validated for wider scope)
   Quarantined (promotion blocked pending resolution)
```

---

### Q15. How should automatic extraction interact with authority?

**Answer (Architectural Recommendation):**

The extraction pipeline must separate authority:

```
Stage 1 — Observed (source-native):
   Input: file, commit, PR, conversation
   Output: raw observation, NOT stored as memory yet

Stage 2 — Extracted (candidate):
   Agent extracts structured facts from observation
   Status: Candidate
   NOT visible in retrieval
   Stored in candidate queue

Stage 3 — Validated:
   Agent or human reviews candidate
   Evidence verified against source
   Status changes to: Validated
   Still not globally canonical

Stage 4 — Canonical (promoted):
   Explicitly approved for active retrieval
   Scope assigned
   Authority: Canonical
   Stored in Git-native Markdown with YAML frontmatter
```

**Core principle:** Automatic generation ≠ Canonical Authority. Extraction creates Candidate knowledge that requires explicit human or agent validation before becoming Canonical.

---

### Q16. How should Memory and RAG interact?

**Answer (Architectural Recommendation):**

Memory and RAG serve complementary purposes:

```
Memory = Persistent, verified, lifecycle-aware engineering knowledge
         Stores: facts, decisions, relationships, evidence-backed understanding
         Authority: based on evidence verification and lifecycle state
         Updates: through explicit validation/promotion pipeline

RAG = Ephemeral, similarity-ranked context assembly
      Used for: injecting relevant knowledge into agent context windows
      Authority: None inherent; acts as a retrieval and ranking mechanism
      Updates: Dynamic per-query based on current corpus
```

**Interaction Rules:**
- EMA provides the verified knowledge base that RAG draws from
- EMA enforces lifecycle filtering *before* RAG sees candidates (Candidate knowledge excluded)
- EMA enforces scope authorization *before* RAG proceeds (unauthorized scopes blocked)
- EMA surfaces contradictions explicitly; RAG does not suppress them
- EMA ranks by multi-dimensional authority (evidence, verification, scope) not just similarity

---

### Q17. How should retrieval incorporate authority, evidence, scope, and lifecycle?

**Answer (Architectural Recommendation):**

Authoritative retrieval pipeline:
```
1. Scope & Caller Authorization (FAIL-CLOSED - occurs BEFORE candidate retrieval)
   ← Determine caller's authorized scopes (project/workspace/global)
   ← Apply scope inheritance rules: task → project → workspace → global
   ← Enforce hard isolation boundaries (zero information leakage for isolated projects)

2. Candidate Retrieval
   ← Vector similarity (derived index - ONLY from authorized scopes)
   ← Lexical match (within authorized scopes)
   ← Relationship traversal (related knowledge units within authorized scopes)

3. Lifecycle Filter
   ← EXCLUDE: Candidate (not validated), Superseded, Historical, Abandoned
   ← WARN: Potentially Stale, Needs Review, Experimental (still returned but flagged)
   ← ALLOW: Current, InProgress, Partial, Validated (participate in ranking)

4. Authority Ranking
   ← Multi-dimensional scoring (NO single opaque score)
   ← Evidence strength (verified primary source > inferred > indirect)
   ← Verification status (Verified > Needs Review > Unreviewed)
   ← Scope authority (Project > Workspace > Global for project-scoped query)
   ← Freshness (last_verified date - NOT creation date alone)
   ← Confidence (High > Medium > Low)

5. Conflict & Contradiction Detection
   ← IF retrieved set contains contradictory knowledge: surface BOTH explicitly
   ← Label: "[CONTRADICTION: X contradicts Y — see provenance]"
   ← DO NOT resolve contradiction silently or rank one above the other

6. Context Construction + Provenance Annotation
   ← Each result labeled: [scope | lifecycle | confidence | evidence anchor]
   ← Compressed to token budget with references to full evidence
   ← Returned with full explainability metadata (why retrieved, source, authority path)
```

**Critical Invariant:** Unauthorized knowledge is NEVER exposed to ranking or context construction. Authorization is a hard gate that occurs FIRST.

---

### Q18. How should context be constructed efficiently?

**Answer (Architectural Recommendation):**

1. Token efficiency is a first-class architectural concern.
2. Progressive loading applies to EMA context:
   - L0: One-line engineering knowledge summary per domain
   - L1: Domain/scope-level orientation
   - L2: Specific knowledge units with evidence
   - L3: Full evidence details on demand
3. Static vs dynamic context split (adapted from Supermemory):
   - Static engineering context: stable constraints, architecture decisions, global rules
   - Dynamic engineering context: current task scope, recent relevant work
4. Construction rules:
   - Include provenance labels (scope, lifecycle state, confidence)
   - Include contradictions explicitly; do not suppress them
   - Do not duplicate the same fact twice from different sources
   - Compress long evidence chains to references
   - Token budget: static context first, dynamic second

---

### Q19. Should EMA expose filesystem semantics?

**Answer (Architectural Recommendation):**

**Hypothesis (requires further validation before decision):**
The SMFS benchmark shows 3.0× fewer tokens with filesystem navigation vs search. This is a strong result. However, SMFS source code is not public and the benchmark details are not independently verifiable.

**Interpretation of the value:**
Filesystem navigation reduces token cost because agents can navigate to known locations directly, avoiding search embedding round-trips. For EMA, the knowledge is already structured in a progressive-loading directory hierarchy (`docs/<domain>/<topic>.md`). This IS a filesystem interface — it just doesn't present itself as a formal FUSE/virtual filesystem.

**Recommendation (Architectural Hypothesis):**
EMA's Git-native Markdown structure already provides filesystem-like semantics. The EMA skill-based interface (e.g., `knowledge-discovery`, `memory-verification`) provides higher-level access patterns.

A formal filesystem interface (FUSE/virtual FS) is **Deferred** until evidence justifies the complexity over the existing navigation model. The progressive-loading model achieves similar token reduction without the operational overhead.

---

### Q20. What should MCP expose?

**Answer (Architectural Recommendation):**

MCP is the primary **cross-agent interface** (non-DSH agents). MCP should expose:

```
Tools:
   ema_recall(query, scope?, lifecycle_filter?)
     → Returns ranked knowledge with provenance

   ema_add(content, source, scope, type?, confidence?)
     → Creates Candidate knowledge for validation

   ema_context(scope, task?)
     → Returns engineering context (static + dynamic)

   ema_validate(knowledge_id, evidence, decision)
     → Validates and promotes Candidate → Canonical

   ema_promote(knowledge_id, target_scope, rationale)
     → Promotes knowledge to wider scope (with evidence)

Resources:
   ema://project/<name>/memory     → Project-scoped knowledge
   ema://workspace/memory          → Workspace-scoped knowledge
   ema://global/memory             → Global engineering knowledge
   ema://scope                     → Current scope information
```

**MCP does NOT expose:**
- Raw database access
- Embedding manipulation
- Direct lifecycle state changes without audit trail

---

### Q21. What should API/SDK expose?

**Answer (Architectural Recommendation — Defer until after MCP is proven):**

API/SDK is secondary to MCP and DSH interfaces. If needed:
- REST API mirroring MCP tools
- TypeScript SDK wrapping REST
- Python SDK wrapping REST

**Defer:** API/SDK complexity is not justified until there are application developers (not agents) who need programmatic access. DSH and MCP are the primary targets.

---

### Q22. What should DeepSeek Harness own versus EMA?

**Answer (Architectural Recommendation):**

```
DeepSeek Harness owns:
   - Session context (messages, tool results, in-progress work)
   - Session-ephemeral trace data
   - Tool execution (cbm_*, ego_*, etc.)
   - Skill loading and routing
   - Current task state
   - Agent goal lifecycle
   - Working directory and filesystem access

EMA owns:
   - Cross-session knowledge persistence
   - Cross-project engineering knowledge
   - Lifecycle-aware knowledge retrieval
   - Scope hierarchy and promotion
   - Knowledge verification and audit trail
   - Evidence references and provenance
   - Canonical vs candidate knowledge state

Shared boundary:
   - Skills are the integration boundary where DSH invokes EMA capabilities
   - DSH provides session/task context; EMA provides persistent knowledge layer
```

---

### Q23. What should remain Git-native?

**Answer (Architectural Recommendation):**

Canonical engineering knowledge must remain Git-native Markdown files in the following locations:
- Project-scoped knowledge: `docs/` directory within each project repository
- Workspace-scoped knowledge: designated shared `ema-workspace/` directory or repository
- Global-scoped knowledge: designated shared `ema-global/` directory or repository

Git remains authoritative for:
- Source evidence (commits, diffs, file contents)
- Canonical knowledge ownership and history
- Evidence anchoring (commit SHA, file paths, logical anchors)
- Change propagation (source-change → staleness detection)

Loss of Git connectivity degrades EMA to a derived-cache-only mode but preserves audit trail and last-known state.

---

### Q24. What should remain Markdown-native?

**Answer (Architectural Recommendation):**

Canonical knowledge units shall remain Markdown-native with YAML frontmatter because:
- Human-readability is essential for engineering knowledge audit and review
- Diff-friendly format supports Git-native collaboration and history tracking
- Universal toolchain support (editors, viewers, processors)
- Proven longevity and stability in engineering documentation
- Ability to contain rich evidence (code blocks, tables, diagrams, links)
- Compatibility with existing PMA and engineering workflows

Derived representations (embeddings, vector indexes, graph views) are regenerated from Markdown source.

---

### Q25. What storage technologies are actually necessary?

**Answer (Architectural Recommendation):**

Strictly necessary for canonical knowledge:
- Git repository storing Markdown files with YAML frontmatter (project/workspace/global)

Necessary for derived performance (regenerable from canonical):
- Local vector index for semantic retrieval (SQLite-vec, LanceDB, Chroma, or FAISS)
- Local graph index for relationship traversal (regenerable from related: fields)
- Local cache for recently accessed knowledge units (LRU, TTL-based)

Not necessary (introduces unjustified complexity):
- Remote/cloud storage for canonical knowledge (violates Git-native principle)
- Proprietary databases requiring licenses or complex ops
- Event streaming platforms for knowledge updates (use Git hooks instead)
- General-purpose blob storage (use Git LFS for large binary evidence if needed)

**Core invariant:** Loss of any derived index must never cause loss of canonical engineering knowledge. Derived indexes are disposable caches.

---

### Q26. How should synchronization work?

**Answer (Architectural Recommendation):**

```
Source-of-truth: Git push/pull remains the canonical synchronization mechanism
   → Git push publishes new canonical knowledge units
   → Git pull retrieves updated canonical knowledge from remotes
   → Resolved merge conflicts require manual knowledge reconciliation

Connector-triggered updates:
   → File system watchers detect source changes (commits, file edits)
   → Trigger staleness review: mark linked knowledge "Potentially Stale"
   → DO NOT automatically re-ingest or overwrite canonical knowledge
   → Source change = potential knowledge obsolescence, not automatic truth

Background processing boundaries:
   → Asynchronous processing operates ONLY on derived indexes (vectors, graphs, caches)
   → Asynchronous processing NEVER modifies canonical Markdown/YAML files
   → Canonical updates happen only through explicit validation/promotion pipeline
   → Audit trail records all knowledge lifecycle events regardless of sync source

Offline operation:
   → Fully functional with last-synced canonical knowledge + derived indexes
   → New knowledge enters Candidate queue, awaits reconnection for validation
   → Last-known state preserved; no destructive state loss on disconnect
```

---

### Q27. How should connectors affect lifecycle?

**Answer (Architectural Recommendation):**

Connectors are lifecycle event detectors, not content overwrite mechanisms:

```
Normal operation:
   → Connector monitors source (Git repo, document store, API endpoint)
   → On initial sync: extract knowledge from source → Candidate queue
   → Subsequent syncs: detect changes → trigger staleness review

Source change handling:
   → File modified/deleted/renamed → mark ALL linked knowledge "Potentially Stale"
   → Commit SHA changes → invalidate evidence anchors pointing to old SHA
   → Branch/tag deletion → mark knowledge from that branch "Potentially Stale" if not merged
   → Source repository unavailable → preserve last-known state; flag for manual review
```

**Critical Principle:** Connectors affect knowledge lifecycle, not just content. They trigger revalidation opportunities, not automatic authority transfer.

---

### Q28. How should cross-project access be secured?

**Answer (Architectural Recommendation):**

Cross-project access requires explicit scope authorization layered on top of hard isolation controls:

```
Authorization Model:
   → Actor: human, agent, system, project_admin
   → Operation: read, candidate_creation, validation, promotion, demotion, quarantine, export
   → Resource: project-scoped, workspace-scoped, global-scoped, isolated-project
   → Effect: grant | deny | warn | audit-log

Hard-Isolated Projects:
   → Storage: Physically separate canonical storage (different directory/repo)
   → Index: Dedicated local vector index (no sharing with workspace/global)
   → Query: Completely excluded from workspace/global query results (zero return)
   → Authorization: 403 error for any access attempt (no information leakage)
   → Promotion: Strictly forbidden; requires explicit admin-sanctioned export workflow
   → Export: Admin-controlled export with scrubbing of sensitive patterns

Default Projects (soft isolation):
   → Storage: Shared canonical storage location
   → Index: Shared local vector index (metadata tags enable scope filtering)
   → Query: Scope-tagged results returned based on caller authorization
   → Authorization: Scope-based allow/deny (no physical separation)
   → Promotion: Allowed with evidence and validation
   → Export: Standard export permitted
```

**Security Boundary:** Hard isolation prevents cross-project leakage entirely; soft isolation relies on scope-tagging and authorization checks.

---

### Q29. How should EMA evaluate correctness?

**Answer (Architectural Recommendation):**

Evaluation dimensions for eventual implementation:

```
Correctness Dimensions:
   • Retrieval correctness: Recall@k for verified engineering facts
   • Scope safety: Zero unauthorized cross-scope leakage in hard/soft isolation modes
   • Provenance accuracy: % of retrieved knowledge traceable to source evidence anchors
   • Temporal accuracy: % of stale knowledge excluded from active retrieval (vs wall-clock)
   • Lifecycle correctness: % of state transitions conform to defined state machine
   • Context efficiency: Average tokens used per knowledge unit delivered
   • Contradiction handling: % of injected contradictions surfaced vs silently resolved
   • Authority integrity: Candidate knowledge never returned as Canonical in retrieval
   • Explainability: Can agent explain each retrieved result (source, authority, lifecycle path)
```

**Evaluation should occur against engineered test sets** reflecting real-world engineering knowledge patterns, not generic Q&A benchmarks.

---

### Q30. How can EMA remain explainable as complexity grows?

**Answer (Architectural Recommendation):**

Explainability is maintained through:

```
Provenance Tracking:
   • Every knowledge unit carries immutable evidence anchors to source
   • Retrieval returns: evidence anchor, collection method, validation path
   • Change history: who modified/validated/promoted and when with rationale

Authority Decomposition:
   • Authority score is NEVER a single opaque number
   • Returns: evidence strength, verification status, scope authority, freshness, confidence
   • Each component independently auditable and traceable

Lifecycle Transparency:
   • Lifecycle state explains retrieval eligibility (Current vs Historical vs Deprecated)
   • State transitions recorded with: actor, evidence, timestamp, rationale
   • Supersession chain shows knowledge evolution over time

Conflict Visibility:
   • Contradictions are surfaced explicitly, not suppressed or silently resolved
   • Both sides preserved with evidence assessments for manual review

Context Construction:
   • Returned context includes scope labels, lifecycle flags, confidence indicators
   • Token budgeting decisions are logged for audit (what was included/excluded)
```

**Architectural Constraint:** No component may make knowledge retrieval decisions without providing an explainability trail.

---

### Q31. What is the minimum architecture that can support future expansion?

**Answer (Architectural Recommendation):**

Layered approach minimizes initial complexity while preserving expansion paths:

```
Layer 1 (exists in PMA, needs extension):
   - Canonical Markdown store with typed schema (YAML frontmatter)
   - 9-state lifecycle with superseded_by semantics (extension: split into 4 dims)
   - CHANGELOG-MEMORY.md audit log
   - 8 typed relationships with verification states
   - Progressive loading (L0/L1/L2/L3)
   - DSH plugin with skill registration

Layer 2 (new for EMA):
   - Explicit scope fields (scope: project | workspace | global)
   - Candidate state for newly extracted knowledge
   - Promotion decision record (promoted_from, validation evidence, actor)
   - Cross-scope query model (with inheritance and authorization)
   - Stale knowledge detection (Potentially Stale state)
   - Vector index as derived layer (local, regeneratable)

Layer 3 (after validation):
   - MCP server exposing EMA tools
   - Cross-project retrieval with authorization gate
   - Connector-triggered staleness detection
   - Candidate queue for multi-repo knowledge aggregation

Layers 4+ (deferred):
   - FUSE/filesystem interface
   - REST API / external SDK
   - Enterprise authorization
   - Batch promotion workflows
```

**Expansion Guarantee:** Each layer builds on the previous without requiring canonical storage redesign. Derived layers (indexes, queues, APIs) are regenerable from canonical Markdown source.

---

### Q32. What important architectural requirement has this research uncovered that was not in the original PMA model?

**Answer (Research Observation — Unknown Unknowns):**

**Finding 1: The candidate knowledge state is missing in PMA.**
PMA has `Experimental` as a lifecycle state, but there is no explicit `Candidate` state for knowledge that has been extracted/proposed but not yet verified. Supermemory revealed that the extraction → authority gap is a real and dangerous gap. EMA needs a first-class `Candidate` state with a promotion pipeline.

**Finding 2: Cross-project knowledge requires a provenance anchor.**
When knowledge is promoted from Project to Global, the original project must remain visible as provenance. If the original project is deleted or archived, promoted knowledge would become orphaned. EMA needs a stable provenance reference model that survives project lifecycle changes.

**Finding 3: The agent-facing interface determines adoption.**
Supermemory shows that the barrier to memory adoption is interface friction. DSH skills work extremely well in context (they load on demand, no external service required). But cross-session knowledge currently requires manual invocation (`/project-memory`). EMA needs a **proactive context injection model** — engineering context automatically available at session start without requiring explicit invocation.

**Finding 4: Token efficiency is not optional at engineering scale.**
Supermemory's 99.4% context reduction on LongMemEval is not a benchmark game — it reflects a real problem. PMA's progressive loading is correctly designed but needs to extend to cross-project knowledge, where the volume of potentially relevant knowledge is much larger than in single-project use.

**Finding 5: Scope safety cannot be metadata-only.**
Supermemory uses container tags (metadata filter) as its only isolation mechanism. For engineering use — especially in professional/commercial environments — some projects contain sensitive knowledge (security decisions, credential patterns, proprietary architecture). EMA needs to support hard isolation as a mode, not just as metadata tagging.

**Finding 6: Connectors affect knowledge lifecycle, not just content.**
PMA uses `knowledge-discovery` to find existing knowledge sources. But it doesn't model the ongoing relationship: if a source file changes, what happens to the knowledge derived from it? EMA must treat source changes as lifecycle events that trigger staleness review — not just as new content to ingest.

**Finding 7: The DSH integration is the most important first integration.**
Supermemory built plugins for Claude Code, Cursor, OpenCode — but NOT DeepSeek Harness. This means the opportunity is open. EMA's DSH integration through the existing plugin architecture (`dsh-plugin`) is the primary differentiator. The MCP path is secondary. Start there.

---

## Part III: EMA Memory Model Definitions

### Memory Unit

A **Memory Unit** is the fundamental storage unit in EMA. It is:
- A Markdown file in a Git repository
- With YAML frontmatter containing structured metadata
- Representing one verified, lifecycle-classified piece of engineering knowledge

```yaml
# Frontmatter schema (extends PMA schema)
type: [Fact|Architecture|Decision|Solution|Lesson|Constraint|Workflow|Reference|History|Obsolete]
status: [Draft|Current|Deprecated|Superseded|Historical|Abandoned|InProgress|Partial|Experimental|Unknown]
validation_state: [Unreviewed|Needs Review|Potentially Stale|Verified|Invalid|Quarantined]
authority_level: [Candidate|Derived|Canonical]
confidence: [High|Medium|Low]
scope: [project|workspace|global]
evidence:
   - [source reference: file path, URL, git SHA, test name, logical anchor]
related:
   - type: [supersedes|evolved_from|resolves|caused_by|affects|belongs_to|contradicts|derived_from|promoted_from|updates|extends|derives]
     target: [target knowledge unit]
     verification: [Verified|Needs Review|Invalid|Pending|Quarantined]
superseded_by: [optional: link to replacement]
promoted_from:
   project: [optional: original project ID if promoted from project scope]
   validated_by: [agent ID or human]
   promoted_at: [timestamp UTC]
   rationale: [why this was promoted]
last_verified: [timestamp UTC]
created: [timestamp UTC]
```

### Key Concept Definitions

| Concept | EMA Definition |
|---------|----------------|
| **Memory** | A lifecycle-, validation-, authority-, and confidence-classified, scope-assigned engineering knowledge unit stored in Markdown with YAML frontmatter. |
| **Evidence** | An immutable primary source (code, Git commit, test, document) that a knowledge claim is traceable to. Evidence is never manufactured; it is always pre-existing. |
| **Knowledge** | A verified claim about engineering reality, derived from evidence, classified by type, and bearing a lifecycle state, validation state, authority level, and confidence. |
| **Fact** | A simple, atomic knowledge claim with direct traceability to a primary source. |
| **Decision** | A knowledge unit capturing a confirmed engineering decision: context, options, choice, rationale, and evidence. |
| **Relationship** | A typed, verified link between two knowledge units capturing semantic dependency (supersedes, contradicts, derived_from, etc.). |
| **Context** | An ephemeral, assembled set of knowledge units relevant to the current task. Never persisted as memory. |
| **Authority** | The property of a knowledge claim that makes it trustworthy for retrieval and use. Authority comes from evidence and validation, never from recency or semantic similarity alone. Authority levels: Candidate (provisional), Derived (verified but regenerable), Canonical (authoritative, primary source in Git). |
| **Lifecycle State** | The current phase of a knowledge unit in its existence, determining retrieval eligibility and promotion pathways. Values: Draft, Current, Deprecated, Superseded, Historical, Abandoned. |
| **Validation State** | The verification status of a knowledge unit, indicating its readiness for promotion. Values: Unreviewed, Needs Review, Potentially Stale, Verified, Invalid, Quarantined. |
| **Confidence Level** | The reliability assessment of a knowledge unit based on evidence strength and consensus. Values: High, Medium, Low. |

---

## Part IV: Agent Integration Model

### DeepSeek Harness — Primary Integration (First-class)

**How EMA integrates with DSH (Architectural Recommendation):**

```
DSH Session Start:
   1. EMA DSH plugin (extends dsh-project-memory) loads
   2. Detects workspace root via DSH workspace resolution
   3. Loads L0 context (AGENTS.md + EMA scope summary) automatically
   4. Registers EMA skills: retrieve, add-candidate, validate, promote, lifecycle
   5. Injects static engineering context into session system prompt (compressed)

During session:
   6. Agent queries EMA via skill calls: @ema-recall <query>
   7. Agent stores knowledge via: @ema-add-candidate (creates Candidate)
   8. Knowledge compounding after task: @knowledge-compounding
   9. Verification: @memory-verification

Session end:
   10. Session trace discarded (never persisted to memory)
   11. Any Candidate knowledge created during session remains in queue
   12. Committed knowledge persists to Git-native Markdown store
```

**MCP Interface (Secondary but first-class for non-DSH agents):**
Same tool set as DSH skills, exposed via standard MCP protocol:
- `ema_recall`, `ema_add`, `ema_context`, `ema_validate`, `ema_promote`

---

## Part V: Capability Decision Framework

### Adopt from Supermemory (Strong Alignment)

| Capability | Reference-system approach | PMA current approach | Gap | Engineering requirement | Decision | Reasoning | Architectural implication | Evidence |
|------------|--------------------------|----------------------|-----|-------------------------|----------|-----------|---------------------------|----------|
| Semantic retrieval | Vector similarity search | TF-IDF + basic semantic | Missing vector index for scalable retrieval | Need efficient similarity search across growing knowledge base | **Adopt** | Semantic retrieval improves recall for conceptually related engineering knowledge | Add local vector index as derived layer; preserves Git-native canonical storage | Supermemory implementation, research-gate-checklist validation |
| Hybrid lexical + semantic retrieval | BM25 + vector fusion | Basic keyword search only | Missing hybrid retrieval for precision/recall balance | Engineering queries often need both exact term match and conceptual similarity | **Adopt** | Pure semantic suffers from vocabulary mismatch; pure lexical misses conceptual links | Implement lexical + semantic fusion with tunable weighting; preserves evidence-first principle | Supermemory implementation, capability-matrix analysis |
| Extracted knowledge layer | LLM-assisted fact extraction | Manual knowledge entry only | Missing structured extraction pipeline | Need to scale knowledge capture beyond manual entry | **Adopt** | Engineering knowledge extraction improves coverage while maintaining verification gate | Candidate state + validation pipeline; preserves human-in-the-loop authority | Supermemory ingestion pipeline, gap-analysis identification |
| Temporal/version concepts | Git-based versioning + timestamps | Basic chronological ordering | Missing explicit temporal validity modeling | Engineering knowledge has validity windows, deprecation schedules | **Adopt** | Prevents outdated knowledge from being treated as eternally valid | Adds last_verified field, temporal expiry for task-scoped knowledge; preserves evidence-chain principle | Supermemory temporal handling, research-gate-checklist validation |
| Static/dynamic context principles | Static rules + dynamic task context | Progressive loading only | Missing explicit static/dynamic split for token efficiency | Static context (architecture decisions) vs dynamic (current work) have different access patterns | **Adopt** | Static context reused across sessions; dynamic context expensive to rebuild | Static context loads first (L0/L1), dynamic context added per-task (L2/L3); preserves progressive loading model | Supermemory context engineering, capability-matrix gap analysis |
| Local embeddings | Sentence-transformers/local models | No local embedding capability | Missing local vector representation for semantic search | Need offline-capable, private semantic search for sensitive environments | **Adopt** | Prevents data leakage to external embedding services; enables air-gapped operation | Adds local vector index as regenerable derived layer; preserves Git-native canonical storage | Supermemory local model usage, research-gate-checklist validation |
| MCP | Standard MCP server interface | No MCP interface | Missing cross-agent interoperability standard | Need to interoperate with Claude Code, Cursor, OpenCode, custom agents | **Adopt** | MCP provides standardized tool/call interface for agent-memory communication | Defines EMA tool set (ema_recall, ema_add, etc.); preserves DSH as primary integration target | Supermemory MCP implementation, research-gate-checklist validation |
| Self-hosted/local operation | Docker-compose/local install | No self-hosted option | Missing private deployment option for sensitive environments | Engineering teams require air-gapped, compliant, private knowledge systems | **Adopt** | Prevents knowledge exfiltration to external services; enables regulated environment deployment | All components designed for local operation; preserves Git-native, Markdown-native principles | Supermemory self-hosting docs, gap-analysis opportunity identification |
| Token-efficient context construction | Static/dynamic split + compression | Basic progressive loading only | Missing explicit token budgeting for context assembly | Engineering context windows limited by LLM token constraints; inefficiency causes truncation | **Adopt** | Uncontrolled context growth leads to dropped relevant knowledge or hallucination | Implements L0/L1/L2/L3 progressive loading + static/dynamic split; preserves context-retrieval separation | Supermemory 99.4% context reduction claim (unverified), capability-matrix gap analysis |

### Adapt from Supermemory (Requires Engineering-Specific Modification)

| Capability | Reference-system approach | PMA current approach | Gap | Engineering requirement | Decision | Reasoning | Architectural implication | Evidence |
|------------|--------------------------|----------------------|-----|-------------------------|----------|-----------|---------------------------|----------|
| Container/tag scoping | Flat containerTag namespace | Repository-native scoping only | Missing engineering-appropriate scope hierarchy | Need explicit project/workspace/global scoping with inheritance rules | **Adapt** | Flat scoping cannot express engineering knowledge ownership boundaries; prone to leakage | Implement two-hierarchy scope model: Knowledge Scope (Project/Workspace/Global) × Execution Scope (Session/Task); preserves repository-native as default | Supermemory containerTag model, gap-analysis scope safety finding, research-gate-checklist validation |
| Profiles → engineering context | Behavioral preference profiles | No context modeling beyond knowledge | Missing distinction between observed behavior and engineering context | Engineering context must represent task/project constraints, not personal preferences | **Adapt** | Personal preference profiles violate engineering-first principle; context should reflect work/task | Maps to Execution Scope: Session (ephemeral traces) → Task (active work context); preserves knowledge-context separation | Supermemory profile storage, research-gate-checklist validation |
| Connectors → lifecycle/staleness events | File change → re-ingest/update | Knowledge-discovery only (point-in-time) | Missing ongoing source-change relationship modeling | Source changes should trigger knowledge revalidation, not automatic overwrite | **Adapt** | Treating source changes as content updates loses engineering provenance and creates authority gaps | Connectors trigger staleness review (Potentially Stable state); preserves evidence-chain and provenance principles | Supermemory connector architecture, gap-analysis connector lifecycle finding |
| Relationships → PMA typed relationship model | Generic directed graph edges | 8 typed relationships with verification | Missing EMA-specific relationship types for cross-scope knowledge | Need to represent promotion, validation, quarantine, scoping decisions as first-class relationships | **Adapt** | Generic graph loses engineering semantics of promotion/validation/quarantine/scoping decisions | Adds promoted_from, validated_by, quarantined_by, scoped_to relationship types; preserves PMA's 8 core relationships | Supermemory relationship storage, gap-analysis relationship evolution finding |
| MCP → EMA engineering semantics | Generic MCP tool definitions | No MCP interface | Missing engineering-specific tool semantics for knowledge lifecycle | MCP tools must respect EMA's Candidate→Validation→Canonical authority model | **Adapt** | Generic MCP tools would violate extraction→authority separation principle | Defines ema_add (Candidate only), ema_validate (Validation→Canonical), ema_promote (scope expansion); preserves authority-level separation | Supermemory MCP tool definitions, research-gate-checklist validation |

### Redesign from Supermemory (Requires Fundamental Architectural Change)

| Capability | Reference-system approach | PMA current approach | Gap | Engineering requirement | Decision | Reasoning | Architectural implication | Evidence |
|------------|--------------------------|----------------------|-----|-------------------------|----------|-----------|---------------------------|----------|
| Automatic extraction → Candidate → Validation → Canonical | Extracted → immediate authority | Extracted → immediate canonical (Experimental state) | Missing explicit extraction-to-authority gap with validation pipeline | Engineering knowledge requires human/organizational validation before becoming authoritative | **Redesign** | Automatic authority creates uncontrollable knowledge quality and provenance gaps | Implements 4-stage pipeline: Observed → Extracted (Candidate) → Validated → Canonical (promoted); preserves evidence-first principle | Gap-analysis Candidate state finding, research-gate-checklist validation |
| Automatic contradiction resolution → evidence-backed explicit resolution | Timestamp/Newest wins | Contradictions marked Untyped-Legacy only | Missing explicit contradiction preservation and evidence-based resolution | Engineering contradictions must be visible, evidence-assessed, and resolution-auditable | **Redesign** | Silent resolution loses engineering context, creates unreviewable authority decisions, violates explainability | Contradiction record with: contradicts relationship, authority assessment, resolution status/decision; both versions preserved; preserves Newest≠Correct invariant | Gap-analysis contradiction handling finding, research-gate-checklist validation |
| Recency authority → evidence/authority model | Newest = Correct heuristic | Timestamps influence ranking but not authority | Missing explicit separation of freshness from authority | Engineering knowledge authority comes from evidence verification, not recency | **Redesign** | Recency-as-authority loses engineering validation principles, enables knowledge poisoning attacks | Authority derived from: evidence strength, verification status, scope authority; freshness is separate ranking factor; preserves Evidence≠Assertion principle | Gap-analysis automatic extraction authority finding, research-gate-checklist validation |
| Flat containers → hierarchical engineering scopes | Flat containerTag namespace | Repository-native scoping only | Missing engineering-appropriate scope hierarchy with inheritance and authorization | Need explicit project/workspace/global scoping with cross-project rules and hard isolation | **Redesign** | Flat scoping cannot express engineering knowledge boundaries, promotion gates, or isolation requirements | Implements two-hierarchy scope model with Knowledge Scope (Project/Workspace/Global) and Execution Scope (Session/Task); adds promotion pipeline, scope authorization, hard isolation boundaries; preserves repository-native as default scope | Gap-analysis scope safety finding, research-gate-checklist validation |

### Reject from Supermemory (Conflicts with EMA Principles)

| Capability | Reference-system approach | PMA current approach | Gap | Engineering requirement | Decision | Reasoning | Architectural implication | Evidence |
|------------|--------------------------|----------------------|-----|-------------------------|----------|-----------|---------------------------|----------|
| Opaque "AI remembers everything" | Embedding-as-authority black box | Evidence-first with typing/verification | Missing transparency in knowledge authority source | Engineering knowledge must be traceable to evidence and verification process | **Reject** | Violates Evidence≠Assertion, Explainability, and Verified Knowledge First principles; creates uncontrollable knowledge quality | Preserves canonical Markdown+frontmatter storage; maintains explicit validation/promotion pipeline; ensures all knowledge carries evidence anchors and verification status | Gap-analysis authority model finding, research-gate-checklist validation |
| Uncontrolled personal preference memory | Behavioral profile storage | No personal preference storage | Missing boundary between engineering knowledge and personal preferences | Engineering memory must exclude user preferences, habits, observed behaviors | **Reject** | Personal preferences are not engineering facts; their inclusion contaminates engineering knowledge authority and violates scope safety | Preserves engineering-first knowledge types (Fact, Decision, Architecture, etc.); excludes behavioral/profile knowledge types; maintains Knowledge≠Preference principle | Gap-analysis profile/storage finding, research-gate-checklist validation |
| Embedding-as-authority | Similarity score = trust | Evidence verification required | Missing explicit separation of similarity from authority | Similarity measures relevance, not truth or verification status | **Reject** | Similarity≠Evidence, Embedding≠Authority, Semantic Similarity≠Evidence invariants would be violated; creates ranking-based authority gaps | Presves multi-dimensional authority ranking (evidence, verification, scope, freshness, confidence); ensures similarity plays no role in authority determination | Gap-analysis authority model finding, research-gate-checklist validation |
| Automatic global truth | Local knowledge → global by default | Knowledge requires explicit promotion | Missing scope boundaries and promotion gates for knowledge escalation | Project-specific knowledge must not accidentally become global engineering truth | **Reject** | Project Fact≠Global Engineering Rule invariant would be violated; creates uncontrollable knowledge scope leakage and authority dilution | Presves default Project scope; requires explicit promotion with evidence for Workspace/Global visibility; maintains promotion pipeline with validation and decision requirements | Gap-analysis promotion policy finding, research-gate-checklist validation |

### Defer from Supermemory (Potentially valuable but premature/justification lacking)

| Capability | Reference-system approach | PMA current approach | Gap | Engineering requirement | Decision | Reasoning | Architectural implication | Evidence |
|------------|--------------------------|----------------------|-----|-------------------------|----------|-----------|---------------------------|----------|
| FUSE / SMFS | Virtual filesystem interface | Progressive loading Markdown | Missing verified filesystem navigation token efficiency | Need to validate SMFS 3.0× token reduction claim before implementation complexity | **Defer** | Unverified benchmark claim; existing progressive-loading Markdown already provides filesystem-like semantics | Presves Git-native, Markdown-native canonical storage; maintains skill-based access patterns; avoids operational overhead of FUSE maintenance | Supermemory SMFS benchmark claim (unverified), research-gate-checklist validation |
| Broad connector ecosystem | 50+ pre-built connectors | Git-based knowledge-discovery only | Missing justification for extensive connector maintenance overhead | Most engineering knowledge originates from Git/documentation; diminishing returns beyond core set | **Defer** | Connector proliferation increases maintenance burden without proportional engineering knowledge gain; Git suffices for primary sources | Presves knowledge-discovery skill for Git/documentation; maintains focus on high-value engineering knowledge sources; avoids connector ecosystem technical debt | Supermemory connector list, gap-analysis connector ecosystem finding |
| REST/SDK | Programmatic API access | Skill-based agent interface only | Missing justification for API/SDK over agent skill/MCP for early adoption | Primary consumers are agents (DSH, MCP); application developers come later | **Defer** | API/SDK adds significant complexity (authentication, versioning, documentation) without early user base; agent interfaces suffice for Phase 1 | Presves DSH skill registration and MCP tool interface; focuses on agent-first integration; delays API/SDK until demonstrated application developer need | Supermarket API documentation, gap-analysis API/SDK opportunity finding |
| Enterprise authorization | RBAC/ABAC/IAM systems | Basic skill-based authorization | Missing justification for complex authorization in early engineering agent context | Early engineering agents operate in trusted contexts; complex auth overkill | **Defer** | Enterprise authorization systems introduce significant complexity without proportional security gain for agent-engineering contexts; simple actor model suffices initially | Presves human/agent/system/project_admin actor model with operation-matrix authorization; avoids enterprise IAM/RBAC complexity; maintains authorization-gate-before-retrieval principle | Supermemory enterprise docs, gap-analysis authorization finding |
| Unnecessary graph infrastructure | Property graph for relationship views | Typed relationships with verification | Missing justification for graph DB over regenerable graph views from relationships | Relationship views can be regenerated from related: fields; graph DB adds operational overhead | **Defer** | Graph infrastructure introduces storage, query, and maintenance complexity without proportional engineering knowledge gain for early stages | Presves relationship storage in Markdown frontmatter; maintains regenerable graph views from related: fields; avoids graph database operational overhead and licensing | Supermemory graph storage, gap-analysis graph infrastructure finding |

### Adopt from PMA (Preserve)

All of PMA's existing capabilities are preserved and extended:
- Evidence-first discipline (Evidence ≠ Assertion)
- Git-native canonical storage
- 8 typed relationships with verification states
- 9-state lifecycle model (extended to 4 orthogonal dimensions)
- CHANGELOG-MEMORY.md audit log
- Progressive loading (L0/L1/L2/L3)
- 8 specialized skills + orchestrator
- DSH plugin architecture
- knowledge-compounding Durable Bar
- memory-verification final gate
- Superseded_by semantics

---

## Part VI: Lifecycle Model

### Complete EMA Knowledge Lifecycle (Four Orthogonal Dimensions)

EMA decomposes the lifecycle into four independent dimensions to eliminate state overlap and ambiguity:

#### 1. Lifecycle State (existence phase)
```
Draft        → Initial creation, not yet ready for review
Current      → Active, valid knowledge participating in retrieval
Deprecated   → Still valid in some contexts but replacement preferred/suggested
Superseded   → Replaced by newer canonical knowledge; excluded from active retrieval
Historical   → No longer active but preserved for context and audit
Abandoned    → Work in progress that was stopped without canonical outcome
```

#### 2. Validation State (verification readiness)
```
Unreviewed   → Newly created, not yet assessed for correctness
Needs Review → Flagged for verification (staleness trigger, scheduled review, conflict)
Potentially Stale → Source change detected; requires revalidation review
Verified     → Evidence checked and confirmed current
Invalid      → Evidence disproved or knowledge deemed incorrect
Quarantined  → Promotion blocked due to scope conflict or contradiction pending resolution
```

#### 3. Authority Level (trustworthiness for retrieval)
```
Candidate    → Extracted knowledge, not yet validated (provisional/unverified)
Derived      → Validated knowledge, but regenerable from source (indexes, caches)
Canonical    → Adversaire knowledge, primary source in Git, authoritative for retrieval
```

#### 4. Confidence Level (reliability assessment)
```
High         → Strong evidence, clear consensus, low uncertainty
Medium       → Moderate evidence, some uncertainty, reasonable confidence
Low          → Weak evidence, significant uncertainty, provisional status
```

#### State Transition Rules

**Lifecycle State Transitions:**
```
Draft           ↔ Current (completion/abandonment)
Current         → Deprecated (replacement identified)
Current         → Superseded (direct replacement)
Current         → Historical (natural obsolescence)
Deprecated      → Superseded (replacement progresses)
Deprecated      → Historical (falls out of use)
Superseded      → Historical (preserved for audit)
Historical      → (terminal state)
Abandoned       → Historical (if recovered) or (terminal)
```

**Validation State Transitions:**
```
Unreviewed      → Needs Review (triggered by creation, staleness, schedule)
Needs Review    → Verified (after successful evidence check)
Needs Review    → Invalid (after evidence disproval)
Needs Review    → Quarantined (after scope/conflict detection)
Verified        → Needs Review (periodic revalidation or source change trigger)
Invalid         → Needs Review (after new evidence emerges)
Quarantined     → Needs Review (after conflict resolution)
```

**Authority Level Transitions (require explicit promotion/demotion):**
```
Candidate       → Derived (after validation, before scope assignment)
Derived         → Canonical (after promotion decision with evidence)
Canonical       → Derived (after demotion decision)
Derived         → Candidate (if invalidated and requires re-extraction)
```

**Confidence Level Adjustments (can occur independently):**
Any state → any other confidence level based on evidence reassessment

#### Invalid State Combinations (Never Allowed)
```
Candidate + Canonical          (authority levels mutually exclusive)
Current + Historical           (lifecycle states mutually exclusive)
Unreviewed + Verified          (validation states mutually exclusive)
Any Validation State + Candidate when scope=global without ∧≥2 independent projects evidence
```

#### Retrieval Behavior by State
```
Active Retrieval Participants (scoped and authorized):
   - Lifecycle: Current, Deprecated (with warning), InProgress, Partial
   - Validation: Verified (primary), Needs Review (with warning), Unreviewed (with warning)
   - Authority: Derived, Canonical (Candidate explicitly EXCLUDED)
   - Confidence: All levels participate (affects ranking, not eligibility)

Excluded from Active Retrieval:
   - Lifecycle: Draft, Superseded, Historical, Abandoned
   - Validation: Invalid, Quarantined
   - Authority: Candidate (never retrieved as authoritative knowledge)
```

#### Promotion Behavior
```
Creation: Any agent/human can create Candidate knowledge
Validation: Project-scoped agents/humans can validate to Verified status
Promotion: Requires explicit decision with evidence:
   - Project → Workspace: project-scoped validation + evidence
   - Workspace → Global: workspace-scoped validation + evidence from ≥2 independent projects
   - Global → Workspace/Project: demotion decision with evidence
```

#### Staleness Behavior
```
Source change → Knowledge linked to source → Validation state: Potentially Stale
Time-based → Knowledge last_verified >N days → Validation state: Needs Review
Lifecycle trigger → superseded_by set → Dependent knowledge may be reviewed
Contradiction detection → new vs existing → Both flagged Needs Review
Promotion review → promoted knowledge not revalidated in N months → Needs Review
```

#### Supersession Behavior
```
Direct replacement: A → B where B supersedes_A
   → A status: Superseded
   → B status: Current (or Deprecated if replacement pending)
   → A→B link: superseded_by field
   → Both preserved in history
   → A excluded from active retrieval
   → B inherits provenance and evidence chain
```

#### Historical Preservation
```
All lifecycle states except Draft and Abandoned are preserved indefinitely
   → Provides context for future decisions
   → Supports audit trail and provenance tracking
   → Never deleted via normal operations
   → Explicit deletion requires GDPR/legal override with audit record
```

---

## Part VII: Retrieval Model

### Authoritative Retrieval Pipeline

EMA implements a strict authorization-first retrieval pipeline to prevent unauthorized knowledge leakage:

```
ema_recall(query, scope?, filters?)
   │
   ├── 1. Scope & Caller Authorization (FAIL-CLOSED BARRIER)
   │     ← Determine caller's authorized scopes from actor + operation + project context
   │     ← Apply inheritance: Task-scoped callers may access Project if authorized
   │     ← Apply hard isolation: Isolated projects return ZERO results for unauthorized callers
   │     ← IF unauthorized: return empty result set with authorization-error metadata
   │
   ├── 2. Candidate Retrieval (ONLY AUTHORIZED SCOPES)
   │     ← Vector similarity search (derived index: ONLY authorized scopes)
   │     ← Lexical match (token-based: ONLY authorized scopes)
   │     ← Relationship traversal (following related: links: ONLY authorized scopes)
   │
   ├── 3. Lifecycle & Maintenance Filtering
   │     ← EXCLUDE: Candidate (not validated), Superseded, Historical, Abandoned
   │     ← WARN: Potentially Stale, Needs Review, Experimental (return with metadata flag)
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
         ← Returned with full explainability: why retrieved, source path, authority validation chain
```

### Scope & Authorization Rules

**Scope Identification:**
- `project:<git-remote-url-or-path>` - repository-local knowledge
- `workspace:<absolute-path>` - DSH workspace-local knowledge
- `global` - cross-workspace engineering knowledge

**Authorization Matrix:**
| Actor \ Operation | read | candidate_create | validate | promote | demote | quarantine | export |
|-------------------|------|------------------|----------|---------|--------|------------|--------|
| human             | ✓    | ✓                | ✓        | ✓       | ✓      | ✓          | ✓      |
| agent             | ✓    | ✓                | ✓        | ✓¹      | ✓¹     | ✓          | ✗      |
| system            | ✓    | ✓²               | ✓³       | ✗       | ✗      | ✗          | ✗      |
| project_admin     | ✓    | ✓                | ✓        | ✓⁴      | ✓⁴     | ✓          | ✓      |

¹ Agent promotion/demotion allowed only for Project scope (not Workspace/Global)
² System candidate creation limited to known-safe automated extraction
³ System validation limited to deterministic verification (test passes/fails)
⁴ Workspace/Global promotion requires human project_admin OR explicit policy approval

**Hard Isolation Effects (when `ema_isolation: hard`):**
- Storage: Physically separate canonical storage directory/repository
- Index: Dedicated local vector index (no sharing)
- Query: Returns empty set for ANY cross-scope query attempt
- Authorization: 403 error for all cross-scope access attempts (zero information leakage)
- Promotion: Strictly forbidden; requires explicit admin export/sanitization workflow
- Export: Admin-controlled only, with pattern scrubbing for sensitive knowledge

---

## Part VIII: Scope Model Detail

### Knowledge Scope Definition

| Scope | Identifier | Canonical Storage | Default Authority | Promotion Requirements |
|-------|------------|-------------------|-------------------|------------------------|
| Project | `project:<git-remote-url-or-path>` | Project repo: `docs/` directory | Validated within project | N/A (default scope) |
| Workspace | `workspace:<absolute-path>` | Designated shared: `ema-workspace/` | Validated at workspace level | Evidence + validation + explicit decision |
| Global | `global` | Designated shared: `ema-global/` | Requires validation from ≥2 independent sources | Evidence from ≥2 independent sources + validation + explicit decision |

### Execution Scope Definition

| Scope | Identifier | Persistence | Purpose |
|-------|------------|-------------|---------|
| Session | `session:<dshrun-id>` | Ephemeral (never persisted) | DSH runtime state, traces, working context |
| Task | `task:<goal-id>` | Ephemeral (cleared on completion) | Active goal/objective context, working notes |

### Scope Inheritance & Query Flow

When a knowledge query is initiated:
1. Determine caller's effective execution scope (Session/Task)
2. Map execution scope to permitted knowledge scopes via authorization matrix
3. Search permitted knowledge scopes in priority order:
   - Task-scoped knowledge (if Task scope authorized and token budget allows)
   - Project-scoped knowledge (default for most engineering knowledge)
   - Workspace-scoped knowledge (if Workspace scope authorized)
   - Global-scoped knowledge (if Global scope authorized)
4. Apply hard isolation filters: isolated projects return zero results to unauthorized callers
5. Apply lifecycle/maintenance filtering
6. Apply authority ranking (multi-dimensional)
7. Surface contradictions explicitly
8. Construct context with provenance annotations
9. Return with explainability metadata

### Hard Isolation Boundary Specification

For projects marked with `ema_isolation: hard` in EMA configuration:
```
Storage Boundary:
   - Canonical storage: Physically separate directory/repository
   - Example: `/isolated/project-alpha/` instead of `/shared/ema-workspace/`
   - Git operations completely separate from workspace/global repos

Index Boundary:
   - Vector index: Dedicated local instance (no shared segments)
   - Graph index: Regenerable from isolated project's related: fields only
   - Cache: LRU cache isolated to project's knowledge units only

Query Boundary:
   - Cross-scope queries: Return empty set (no information leakage)
   - Same-scope queries: Proceed normally with authorization check
   - Error metadata: Includes authorization-failed reason for audit

Authorization Boundary:
   - Read attempts: Return 403 Forbidden with scope-mismatch metadata
   - Candidate creation: Rejected (cannot contribute to isolated knowledge)
   - Validation/Promotion: Rejected (cannot modify isolated knowledge authority)
   - Export: Requires explicit admin approval with pattern scrubbing

Promotion Boundary:
   - Promotion OUT: Strictly forbidden; knowledge cannot leave isolated scope
   - Promotion IN: Strictly forbidden; external knowledge cannot enter isolated scope
   - Exception: Admin-controlled export/sanitization workflow produces scrubbed knowledge

Export Boundary:
   - Exported knowledge: Scrubbed of sensitive patterns (credentials, keys, PII)
   - Export audit: Full record of what was exported, by whom, with approval metadata
   - Post-export: Original isolated knowledge unchanged; export is derivative work
```

---

## Part IX: Evidence Anchor Model

### Stable Evidence Reference System

EMA defines a URI/URN-based evidence anchor model for reliable provenance, verification, staleness detection, and source tracing:

```
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```

**Components:**
- `repo-id`: Unique repository identifier (Git remote URL or local path hash)
- `git-ref`: Immutable Git reference (commit SHA, tag name, or branch@{timestamp})
- `file-path`: Path to file within repository (POSIX style, URL-encoded if needed)
- `logical-anchor`: Pointer to specific logical element within file (see below)

**Logical Anchor Types:**
- `sym:<name>` - Symbol/function/class name (language-agnostic where possible)
- `ast:<path>` - Abstract Syntax Tree path (e.g., `ast:module.function.class.method`)
- `sec:<heading>` - Structural heading/section (Markdown # heading, LaTeX \section, etc.)
- `test:<id>` - Test signature (test function name, test case identifier)
- `cfg:<jsonpath>` - Configuration key/path (JSONPath, dot notation, etc.)
- `pr:<num>` - Pull request/Merge Request number
- `issue:<num>` - Issue/Bug tracker number
- `commit:<sha>` - Specific Git commit reference (redundant with git-ref but explicit)
- `line:<num>:<num>` - Line range fallback (only when higher-fidelity anchors unavailable)

### Stability Properties

**What makes an anchor stable:**
1. **Git immutability**: Commit SHAs are cryptographically immutable
2. **Logical resilience**: Symbols, sections, test names withstand formatting changes, line shifts, whitespace modifications
3. **Canonical anchoring**: Always points to immutable Git object, never to working state
4. **Human readability**: Maintains auditability and manual verification capability

**Anchor behavior under source changes:**
| Change Type | Anchor Behavior | Knowledge Impact |
|-------------|-----------------|------------------|
| File moved/renamed (Git tracked) | Anchor updates automatically via Git rename detection | Knowledge marked Potentially Stale (provenance preserved) |
| Symbol renamed/refactored | `sym:<old>` breaks; `sym:<new>` may exist | Knowledge marked Potentially Stale (requires manual review) |
| Section heading changed | `sec:<old>` breaks; may need manual remapping to `sec:<new>` | Knowledge marked Potentially Stale |
| Test signature changed | `test:<old>` breaks; new test may exist | Knowledge marked Potentially Stale |
| Config key changed | `cfg:<old>` breaks; new key may exist | Knowledge marked Potentially Stale |
| Commit history rewritten (rebased/squashed) | Old commit SHAs become unreachable | Knowledge marked Potentially Stale (requires manual evidence rebasing) |
| File deleted | File-path becomes invalid | Knowledge marked Potentially Stale (may require removal if evidence lost) |
| Branch deleted | branch@{timestamp} becomes invalid | Knowledge from that branch marked Potentially Stale if not merged elsewhere |
| Repository unavailable/repo deleted | All anchors to repo become unresolved | Last-known state preserved; knowledge marked for manual review |

### Staleness Detection Flow

```
1. Connector/Git hook detects: file modified, committed, PR merged, issue closed
2. System computes: which evidence anchors are affected by this change
3. For each affected anchor:
   a. Find all knowledge units referencing that anchor
   b. Set their validation_state to: Potentially Stale
   c. Log trigger event in CHANGELOG-MEMORY.md with:
      - Source change: commit SHA, file path, change type
      - Affected knowledge units: count and ID samples
      - Recommended action: review for validity
4. Knowledge remains in Potentially Stale state until:
   a. Revalidation review confirms validity → validation_state: Verified
   b. Evidence disproved → validation_state: Invalid
   c. Superseded by new knowledge → lifecycle_state: Superseded
   d. Manual override → validation_state: Needs Review (for scheduling)
```

---

## Part X: Promotion Policy Model

### Formal Promotion Pipeline

EMA defines an explicit, auditable promotion pathway with clearly delineated authorities:

```
Project Knowledge
    ↓
[Candidate: project-scoped]        ← Authority: Candidate (any agent/human can create)
    ↓
[Validation: project-scoped]       ← Authority: Derived (project-scoped agent/human validates)
    ↓
[Promotion Decision]               ← Authority: Human project-admin OR policy-approved
    ↓
[Workspace / Global Knowledge]     ← Authority: Canonical (after explicit promotion)
```

### Promotion Authority Matrix

| Promotion Type | Creation Authority | Validation Authority | Promotion Authority | Required Evidence |
|----------------|--------------------|----------------------|---------------------|-------------------|
| Project → Project (self-promotion) | Any agent/human | Project-scoped agent/human | Project-scoped agent/human | Source evidence + validation record |
| Project → Workspace | Any agent/human | Project-scoped agent/human | Human project-admin OR explicit policy | Cross-project evidence + validation record |
| Workspace → Global | Any agent/human | Workspace-scoped agent/human | Human project-admin OR explicit policy | Evidence from ≥2 independent workspaces/projects + validation record |
| Global → Workspace/Project | Any agent/human | Target-scoped agent/human | Human project-admin OR explicit policy | Demotion evidence + validation record |
| Any → Quarantine | Any agent/human | Any agent/human | Any agent/human | Conflict evidence + rationale |
| Quarantine → Any | Any agent/human | Any agent/human | Human project-admin OR explicit policy | Conflict resolution evidence + rationale |

### Promotion Decision Requirements

Every promotion/demotion decision must include:
- `promoted_from`: Origin project ID (Git remote URL or path hash)
- `validated_by`: Validator ID (agent identifier or human identifier)
- `promoted_at`: UTC timestamp of promotion decision
- `rationale`: Explicit justification for promotion/demotion
- `evidence`: List of evidence anchors supporting the decision
- `scope_change`: From/to scope identifiers (e.g., `project:repoA → workspace:/path`)
- `audit_ref`: Reference to CHANGELOG-MEMORY.md entry recording the decision

### "≥2 Independent Projects" Rule Treatment

The research finding "Global promotion requires validation across ≥2 independent projects" is established as:

**A Defensible Default Policy** with explicit configuration override capability:
- Default: `ema_promotion_min_sources: 2` (require validation from ≥2 independent sources)
- Configurable: `ema_promotion_min_sources: N` where N ≥ 1 (allows organizational policy override)
- Documentation: Must justify why reducing below 2 is safe for the specific organizational context
- Preservation: Never allows promotion without explicit validation evidence and decision record

### Quarantine & Demotion Handling

**Quarantine:**
- Trigger: Knowledge detected to conflict with other scopes or contains contradictory evidence
- Effect: `validation_state: Quarantined`; knowledge excluded from promotion consideration
- Resolution: Requires explicit conflict resolution evidence and decision record
- Outcome: Either demoted to origin scope with conflict annotation, or promoted after conflict resolution

**Demotion:**
- Trigger: Evidence shows knowledge is not actually general/wider-applicable
- Effect: Knowledge returns to narrower scope with `promoted_from` lineage preserved
- Record: `demoted_by`, `demoted_at`, `demotion_rationale`, `evidence` for the demotion decision
- History: Promotion/demotion cycle preserved in `promoted_from` chain for provenance tracking

---

## Part XI: Component Ownership & Architectural Boundaries

### Explicit Component Ownership

```
PMA Foundation (Preserved & Extended):
   ├─ Git-native canonical knowledge storage
   ├─ Markdown-native knowledge units with YAML frontmatter
   ├─ Evidence-first knowledge classification
   ├─ 8 typed relationships with verification states
   ├─ 9-state lifecycle model (now 4 orthogonal dimensions)
   ├─ CHANGELOG-MEMORY.md audit log
   ├─ Progressive loading (L0/L1/L2/L3)
   ├─ 8 specialized skills + orchestrator
   ├─ DSH plugin architecture (skill mount + lifecycle hooks)
   ├─ knowledge-compounding Durable Bar
   └─ memory-verification final gate

EMA Core (New for Engineering Memory Agent):
   ├─ Four-dimensional lifecycle model (Lifecycle/Validation/Authority/Confidence)
   ├─ Two-hierarchy scope model (Knowledge Scope × Execution Scope)
   ├─ Formal promotion pipeline with human sign-off requirements for Workspace/Global
   ├─ EMA URI/URN evidence anchor schema for stable provenance
   ├─ 6-boundary hard isolation definition (Storage/Index/Query/Auth/Promotion/Export)
   ├─ Actor-based authorization matrix (human/agent/system/project_admin)
   ├─ Explicit Policy/Authorization Layer preceding retrieval
   ├─ Multi-dimensional authority ranking (no single opaque score)
   ├─ Contradiction-explicit retrieval model (DO NOT suppress/resolve silently)
   ├─ Engineering Knowledge Unit (EKA) as formal core object concept
   └─ Provenance-preserving scope hierarchy with explicit promotion gates

Derived Infrastructure (Regenerable from Canonical):
   ├─ Local vector index for semantic retrieval (SQLite-vec/LanceDB/Chroma/FAISS)
   ├─ Local graph index for relationship traversal (regenerable from related: fields)
   ├─ Local cache for recently accessed knowledge units (LRU/TTL-based)
   ├─ Candidate queue for newly extracted knowledge (persistent or in-memory)
   ├─ Token budgeting engine for context construction
   └─ Explainability tracker for retrieval justification logging

DSH Ownership (Session/Task/Tools Context):
   ├─ Session context (messages, tool results, in-progress work)
   ├─ Session-ephemeral trace data
   ├─ Tool execution (cbm_*, ego_*, etc.)
   ├─ Skill loading and routing
   ├─ Current task state
   ├─ Agent goal lifecycle
   ├─ Working directory and filesystem access
   └─ Context assembly (static + dynamic engineering context)

EMA Ownership (Persistent/Knowledge Layer):
   ├─ Cross-session knowledge persistence
   ├─ Cross-project engineering knowledge
   ├─ Lifecycle-aware knowledge retrieval
   ├─ Scope hierarchy and promotion
   ├─ Knowledge verification and audit trail
   ├─ Evidence references and provenance
   ├─ Canonical vs candidate knowledge state
   └─ Authentication and authorization boundaries

MCP Ownership (Cross-Agent Interface):
   ├─ ema_recall(query, scope?, lifecycle_filter?) → Ranked knowledge with provenance
   ├─ ema_add(content, source, scope, type?, confidence?) → Candidate knowledge creation
   ├─ ema_context(scope, task?) → Engineering context (static + dynamic)
   ├─ ema_validate(knowledge_id, evidence, decision) → Validation & Canonical promotion
   ├─ ema_promote(knowledge_id, target_scope, rationale) → Scope-promoted knowledge
   └─ Resources: ema://project/*/memory, ema://workspace/memory, ema://global/memory, ema://scope

Git/Source Systems Ownership (Source of Truth):
   ├─ Source-code authority (commits, diffs, file contents)
   ├─ Configuration authority (package.json, .env, wrangler.jsonc)
   ├─ Test authority (test assertions, CI results, pass/fail states)
   ├─ Versioned documentation (Markdown files, architecture decisions)
   └─ Commits, tags, branches, and other engineering evidence

Boundary Conditions:
   - EMA is authoritative for: knowledge lifecycle, provenance records, scope assignments, promotion decisions
   - Git/source systems are authoritative for: source artifacts, commit history, file contents, evidence immutability
   - Loss of EMA derived indexes never causes loss of canonical engineering knowledge (regenerable principle)
   - Loss of Git connectivity degrades EMA to derived-cache mode but preserves last-known state and audit trail
```

### Engineering Knowledge Unit (EKA) Definition

The **Engineering Knowledge Unit (EKA)** is the formal conceptual object representing one item of EMA-stored engineering knowledge. It is:

- Not synonymous with "memory", "fact", or "extracted entity"
- A composite concept comprising:
  ```
  Evidence Anchor(s)     → Immutable source reference(s)
  Knowledge Claim        → Verified understanding derived from evidence
  Lifecycle State        → Current phase in knowledge existence
  Validation State       → Verification status and readiness for promotion
  Authority Level        → Trustworthiness for retrieval (Candidate/Derived/Canonical)
  Confidence Level       → Reliability assessment based on evidence/consensus
  Scope                  → Knowledge persistence location (Project/Workspace/Global)
  Relationships          → Typed, verified links to other EKAs
  Provenance Metadata    → Promotion/validation/demotion history with actors and timestamps
  ```

**EMA does NOT imply:**
- memory = extracted fact = truth
- Any EKA is authoritative without explicit validation and promotion
- Retrieval ranking can override authority level (Candidate knowledge never returned as Canonical)
- Semantic similarity establishes authority (Evidence≠Assertion, Embedding≠Authority invariants preserved)

---

## Part XII: Development Gate & Assumptions

### This Document is the EMA Architecture Blueprint

The required progression before any implementation begins:

```
Research (complete)
    ↓
EMA Architecture Blueprint (this document)
    ↓
Architecture Review (next)
    ↓
Architecture Approval
    ↓
Development Planning
    ↓
Implementation
```

This Blueprint must be reviewed against:
- PMA's existing capabilities (do not regress)
- EMA's architectural invariants (do not violate)
- The mandatory architectural questions (all 32 answered)
- The 15 items in the Final Research Gate checklist

**Do not begin implementation until Architecture Review is complete and Architecture Approval is granted.**

### Unresolved Architectural Assumptions

These assumptions remain after applying the six blocking resolutions. They do **not** block Architecture Approval but must be resolved before Development Planning.

#### Blocking Assumptions (None remaining after this revision)
All blocking architectural assumptions have been resolved in this revision.

#### Non-blocking Assumptions (Require resolution before Development Planning)
1. **Cross-repository canonical storage**: Where does cross-project (workspace/global) canonical knowledge live as Markdown files?
   - Options: dedicated `ema-global` repository, designated "memory" folder in each workspace, or shared directory structure
   - Must be decided before implementing Layer 2 storage mechanisms

2. **Vector index technology**: Which local vector store to use (SQLite vec, Chroma, FAISS, LanceDB)?
   - Trade-off between simplicity (SQLite), performance (LanceDB), and maturity
   - Does not affect canonical storage design (purely derived layer)

3. **DSH session startup context**: How much static engineering context to inject automatically at session start, and at what token cost?
   - Needs benchmarking against real-world engineering knowledge bases
   - Token budget is a tunable parameter, not architectural constant

4. **Candidate queue persistence**: Should the candidate queue be in a Git-visible file (auditable) or a local database (private, faster)?
   - Git-visible: more consistent with PMA principles but adds noise to canonical storage
   - Local database: faster and cleaner but less transparent
   - Both implementations preserve the Candidate → Validation → Canonical pipeline

5. **Promotion authority**: Who can promote knowledge to workspace/global scope?
   - Research recommends human authority for workspace/global promotion (defensible default)
   - May be too conservative for agentic workflows requiring faster promotion cycles
   - Needs organizational policy decision balancing safety vs velocity

6. **SMFS verification**: The SMFS filesystem interface claim (3.0× token reduction) is potentially valuable but not independently verifiable from public source
   - Before implementing filesystem semantics, validate through independent benchmarking
   - Current progressive-loading Markdown already provides similar navigation benefits

7. **Multi-repo workspace definition**: How does DSH's workspace concept map to EMA's workspace scope?
   - If a workspace contains 10 repositories, what constitutes the scope boundary?
   - Needs clarification of workspace-to-EMA-scope mapping rules

#### Deferred Assumptions (Postpone until after Architecture Approval)
These are genuinely deferred items that do not affect the core EMA architecture:
- FUSE/SMFS filesystem interface implementation
- Broad connector ecosystem beyond core Git/documentation
- REST API / external SDK development
- Enterprise authorization system implementation
- Batch promotion workflow automation
- Advanced graph infrastructure for relationship visualization

---

## Part XIII: Approval Readiness Checklist

### Lifecycle Model
[✓] Lifecycle model is internally consistent (four orthogonal dimensions)
[✓] Authority and confidence are distinct from lifecycle and validation states
[✓] Validation/maintenance is distinct from lifecycle (separate state matrices)
[✓] Invalid state combinations explicitly prohibited (Candidate+Canonical, etc.)
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

## Final Verification

All six blocking architectural findings have been explicitly resolved:
1. ✅ **Lifecycle normalization**: Four orthogonal dimensions with exact state matrices, transitions, and behaviors
2. ✅ **Scope semantics**: Split into Knowledge Scope (Project/Workspace/Global) and Execution Scope (Session/Task) with explicit inheritance rules
3. ✅ **Promotion policy**: Formal pipeline with creation/validation/promotion authorities, lineage preservation, and "≥2 independent projects" as defensible default policy
4. ✅ **Stable evidence anchors**: URI/URN schema with logical anchor types, stability properties, and source-change → staleness detection flow
5. ✅ **Hard isolation**: Six explicit boundaries (Storage/Index/Query/Auth/Promotion/Export) defining true security isolation
6. ✅ **Policy and retrieval authorization**: Explicit Policy/Authorization Layer with actor/operation matrix and authoritative retrieval pipeline (authorization → retrieval → ranking → filtering → context → explanation)

The EMA Architecture Blueprint is now ready for Architecture Review. All mandatory architectural questions are answered. All PMA invariants are preserved. No implementation work has been performed.

**Recommendation for next gate:** Proceed to Architecture Review with this document as the primary artifact for evaluation.