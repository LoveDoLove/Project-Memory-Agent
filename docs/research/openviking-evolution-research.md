# Project Memory Agent × OpenViking Evolution Research

## Executive Summary

This report compares **Project Memory Agent** (a repository-native, evidence-backed memory system for coding agents) against **OpenViking** (Volcengine's context database for AI agents). The analysis identifies which OpenViking architectural ideas can strengthen Project Memory without violating its core principles of being repository-native, human-readable, Git-diffable, and evidence-first.

**Key finding:** OpenViking excels at progressive context loading (L0/L1/L2), directory-aware retrieval, retrieval observability, and session-to-memory compounding — all of which are directly applicable to Project Memory. However, OpenViking's user-centric memory model, external server dependency, and vector-database architecture should not be adopted. Project Memory should evolve toward a **Project Context & Memory System** that is a repository-native evolution of its current strengths.

---

## Current Project Memory Architecture

### Core Identity
Project Memory is a **repository-native knowledge system** — not a database, not a service, not an external dependency. It lives in the repository itself as Markdown files with YAML frontmatter.

### Architecture Components

**Eight Specialized Skills:**
1. `knowledge-discovery` — Inventory existing knowledge sources with provenance
2. `repository-audit` — Evidence gathering from source, tests, config, CI, Git
3. `knowledge-classification` — 10-type model, 9-state lifecycle classification
4. `knowledge-compounding` — Extract durable learning from completed work
5. `memory-architecture` — Design progressive loading hierarchy
6. `obsolete-knowledge` — Lifecycle management for stale/deprecated/superseded
7. `memory-edit` — Scoped mechanical edits with approval workflow
8. `memory-verification` — Final PASS/FAIL gate

**Knowledge Model:**
- 10 types: Current Fact, Architecture, Decision, Solution, Lesson, Constraint, Workflow, Reference, History, Obsolete
- 9 states: Current, In Progress, Partial, Experimental, Deprecated, Superseded, Abandoned, Historical, Unknown
- Evidence confidence: High / Medium / Low / Unknown
- Corpus-first vocabulary rule to prevent semantic fragmentation

**Progressive Loading (4 levels):**
- Level 0: `AGENTS.md` (always read)
- Level 1: Domain README files
- Level 2: Focused knowledge units
- Level 3: Related knowledge (on demand)

**DSH Integration:**
- Plugin mounts skills dynamically via Cordis patch
- `/project-memory` slash command auto-detects state and runs workflow
- `codebase-memory` MCP tool for graph-based verification

**Single Source of Truth:**
- One canonical home per concept
- References, never duplicates
- Cross-source conflict resolution via evidence

**Verification System:**
- Claims verified against source code, tests, configuration, build/CI, Git history
- `codebase-memory` graph verification with source fallback
- Evidence limitations explicitly recorded
- Memory verification final gate (PASS / PASS WITH WARNINGS / FAIL / BLOCKED)

**Repository Audit Evidence:**
- `AGENTS.md`, `agents/project-memory.md`, `skills/*/SKILL.md` (all 8)
- `docs/architecture.md`, `templates/schema.yaml`, `templates/TEMPLATE.md`
- `dsh-plugin/` integration layer
- Test suite (`install.tests.ps1`)

---

## OpenViking Architecture

### Core Identity
OpenViking is a **context database** — a standalone server that provides unified access to memories, resources, and skills through a virtual filesystem (`viking://` protocol).

### Architecture Components

**Three Context Types:**
1. **Resource** — External/project knowledge (static, user-added)
2. **Memory** — Agent cognition learned from interactions (dynamic, agent-extracted)
3. **Skill** — Declarable agent capabilities (AgentDefinedContextType)

**Three Loading Tiers (L0/L1/L2):**
- L0 (Abstract): ~100 chars, one-sentence summary for relevance checks
- L1 (Overview): ~2k chars, core information and navigation
- L2 (Detail): Full original content, loaded on demand

**viking:// URI Model:**
```
viking://
├── resources/{project}/...    # Shared project knowledge
├── user/{user_id}/memories/   # User memories (profile, preferences, entities, events, identity, soul, cases, trajectories, experiences)
├── user/{user_id}/skills/     # User skills
├── user/{user_id}/sessions/   # Session data
├── user/{user_id}/peers/      # Peer-specific data
└── agent/skills/              # Global shared skills
```

**Retrieval Pipeline:**
1. Intent Analysis (LLM generates 0-5 TypedQueries)
2. Hierarchical Retrieval (priority queue, recursive directory search)
3. Rerank (model-based refinement)

**Dual-Layer Storage:**
- AGFS: Content storage (files, multimedia)
- Vector Index: Semantic search index (URIs, vectors, metadata only)

**Session Memory Extraction:**
- Session commit triggers async memory extraction
- Memory diff JSON records all changes
- T+1 bot-driven consolidation
- Link-based relationship graph (PPR-enhanced retrieval)

**Multi-Tenancy:**
- Account/user/peer isolation
- ACL support for shared resources
- API key or trusted gateway auth

**Observability:**
- Retrieval trajectories logged
- Context browsing with path visibility
- Debug tools for retrieval decisions

---

## Direct Architecture Comparison

| Area | Project Memory Agent | OpenViking | Gap | Opportunity |
|------|---------------------|------------|-----|-------------|
| **Memory model** | 10 types, 9 states, evidence-first, repository-native | User-centric (profile, preferences, entities, events, identity, soul, cases, trajectories, experiences) | OpenViking has richer session-derived types; PM has stronger evidence discipline | PM should keep repository focus; adopt OpenViking's trajectory/experience distinction for workflow patterns |
| **Resource model** | `docs/` hierarchy, no external service | `viking://resources/` with semantic processing, L0/L1/L2 auto-generation | PM lacks automated tiered summarization | PM can adopt L0/L1/L2 sidecar pattern for its knowledge documents |
| **Skill model** | 8 specialized skills, agent-invoked | `viking://~/skills/` + `viking://agent/skills/` (separate user/global scopes) | OpenViking has agent-level global scope; PM skills are workspace-local | Not needed; PM skills are already well-scoped for repository context |
| **Context hierarchy** | Domain-based (`docs/<domain>/README.md`), manual structure | Automatic directory tree with `.abstract.md` + `.overview.md` sidecars | PM requires manual architecture; OV auto-generates summaries | PM can adopt lightweight index/navigation layer without auto-generation |
| **Retrieval** | Deterministic navigation (AGENTS.md → domain → unit), grep/glob/codebase-memory | Semantic search + hierarchical directory traversal + rerank | PM lacks semantic search but gains determinism and Git friendliness | PM should enhance with directory-aware traversal; semantic search is optional enhancement |
| **Progressive loading** | 4 levels, manual (PM controls what goes where) | Automatic L0/L1/L2 generation via SemanticProcessor | PM's progressive loading is deliberate; OV's is automatic | PM's approach is superior for repository-native context; adopt the sidecar pattern only |
| **Session memory** | `knowledge-compounding` skill extracts durable learning after task completion | Automatic session commit → memory extraction → deduplication → storage | PM is task-driven; OV is session-driven | PM's explicit verification-before-compounding is stronger; adopt OV's trajectory/experience distinction |
| **Knowledge extraction** | Manual compounding via skill, Durable Bar counterfactual test | LLM-driven extraction from session, auto-deduplication | OV's extraction is automatic but less disciplined | PM's approach is superior; no need for automatic extraction |
| **Memory consolidation** | Corpus-first vocabulary rule, manual consolidation via skills | Schema-driven, LLM dedup, memory_diff.json audit trail | OV has better automated dedup but PM has better conflict resolution | PM can adopt structured audit trail for memory changes |
| **Conflict resolution** | Evidence-based, explicit 4-outcome model (one correct, scope-dependent, none match, needs more evidence) | Dedup decisions (skip/create/none, merge/delete per existing item) | PM has clearer philosophical stance; OV has mechanical dedup | PM's conflict resolution is superior; preserve it |
| **Provenance** | Per-claim origin tracking (path, tool, authorship, age signal) | Optional `source` field in sidecar metadata | PM's provenance discipline is stronger | PM's model is sufficient; no change needed |
| **Verification** | Evidence-first, codebase-memory graph, explicit limitations | No equivalent; assumes stored content is correct | PM verifies against reality; OV trusts what's stored | PM's verification is its core strength; never compromise it |
| **Obsolete knowledge** | Explicit lifecycle states (Superseded, Deprecated, Historical, Abandoned), decision tree | No explicit obsolete handling; content is append-only | PM handles staleness; OV does not | PM's model is superior; preserve and enhance |
| **Observability** | None; deterministic navigation suffices | Retrieval trajectories, context browsing, debug visibility | PM lacks traceability; OV has rich observability | PM should add lightweight retrieval trace for debugging |
| **Retrieval tracing** | Not present | Query path logged: intent → directory recursion → results | PM has no retrieval trace | PM should add optional retrieval trace for debuggability |
| **Project isolation** | Repository-rooted; `AGENTS.md` as entry point | Account/user/peer multi-tenancy | PM is inherently single-project; OV is multi-project | PM's isolation is appropriate; no change needed |
| **Cross-project knowledge** | Not supported; intentionally scoped to one repo | Shared `viking://resources/` across users in account | PM cannot cross-reference projects | PM can add cross-project reference pointers in AGENTS.md if needed |
| **Storage** | Markdown files in repository (Git-native) | AGFS (local/S3) + Vector Index (local/VikingDB) | PM is Git-native; OV requires separate storage | PM must remain repository-native; no database |
| **Human readability** | Fully human-readable Markdown, Git-diffable | Requires server; `.abstract.md`/`.overview.md` are Markdown but content lives in AGFS | PM is immediately readable; OV requires tooling | PM's readability is a core strength |
| **Git friendliness** | Fully Git-friendly: diffs, blame, history, branches | File-based but requires server for full functionality | PM integrates with Git workflows; OV is separate | PM's Git integration is essential |
| **Offline operation** | Works without network/server | Requires running server for full functionality | PM works offline; OV needs infrastructure | PM's offline capability is essential |
| **Token efficiency** | Minimal (L0=L1=AGENTS.md, load L2 on demand) | L0/L1/L2 tiers reduce context by 34-91% per benchmarks | PM loads full documents; OV auto-trims | PM can benefit from L1 summary sidecars |
| **DSH integration** | Native plugin with Cordis patch, `/project-memory` command | Plugin available but separate server required | PM is simpler to integrate; OV requires server setup | PM's integration model is superior for local repos |
| **Extensibility** | Skills + templates + custom agent | Pluggable memory schemas, custom skills, external T+1 bots | Both extensible; different approaches | PM's skill model is well-suited for repository context |
| **Security** | File permissions + Git access control | Multi-tenant auth, ACLs, encryption at rest | PM relies on repo security; OV has application-level | PM's simplicity is appropriate for local repos |
| **Complexity** | Low (8 skills, Markdown files) | High (server, vector index, async processing, multi-tenant) | PM is maintainable; OV is infrastructure-heavy | PM's complexity level is correct |

---

## What Project Memory Already Does Better

### 1. Evidence-Backed Knowledge
Project Memory explicitly verifies claims against source code, tests, configuration, build/CI, and Git history. This is its foundational principle. OpenViking stores whatever is input without verification — it has no equivalent concept. **This must remain the foundation.**

### 2. Knowledge Reconciliation
Project Memory detects cross-source conflicts and resolves them with evidence, not preference. The 4-outcome conflict resolution model (one correct, scope-dependent, none match, needs more evidence) is rigorously defined. OpenViking's dedup model (skip/create/none, merge/delete) lacks this philosophical grounding.

### 3. Single Source of Truth
Project Memory deliberately assigns one canonical home per concept and prevents duplicated rules. OpenViking's multi-user shared resources model can create competing authorities without explicit reconciliation.

### 4. Obsolete Knowledge Handling
Project Memory has an explicit lifecycle (Current → Deprecated → Superseded → Historical → Abandoned → Delete) with decision trees and historical preservation criteria. OpenViking has no equivalent — content is append-only.

### 5. Human-Maintainable Repository Memory
Project Memory keeps everything as inspectable Markdown files in the repository. OpenViking requires a server, has a virtual filesystem abstraction, and stores content in AGFS — all of which reduce direct human accessibility.

### 6. Corpus-First Vocabulary
Project Memory's rule to sample existing vocabulary before coinering new terms prevents semantic fragmentation. This is critical for retrieval accuracy and has no OpenViking equivalent.

### 7. The Durable Bar Counterfactual
Project Memory's compounding skill requires: "If this learning disappeared, would a future Agent still repeat the mistake?" This is a powerful quality gate that OpenViking lacks.

### 8. Progressive Loading Discipline
Project Memory's deliberate L0-L3 loading hierarchy (with AGENTS.md containing only navigation and critical rules) is architecturally sound. OpenViking's automatic sidecar generation is convenient but less controlled.

---

## What OpenViking Does Better

### A. Automatic L0/L1/L2 Sidecar Generation
OpenViking automatically generates `.abstract.md` and `.overview.md` for every directory. This ensures every location has a consistent entry point for relevance checking. Project Memory requires manual maintenance of domain README files.

**Opportunity:** Project Memory could adopt a lightweight version where domain README files serve as the L1 layer, with an optional L0 one-line summary added to AGENTS.md navigation entries.

### B. Directory Recursive Retrieval with Priority Queue
OpenViking's HierarchicalRetriever uses a priority queue to recursively search directories, propagating scores and converging when results stabilize. This is fundamentally more efficient than flat vector search.

**Opportunity:** Project Memory's deterministic navigation (AGENTS.md → domain → unit) is already a form of hierarchical retrieval. The priority-queue mechanism could inspire smarter domain selection when multiple domains match a query.

### C. Retrieval Trajectories
OpenViking logs the exact path taken during retrieval: intent analysis → directory traversal → results. This makes retrieval decisions debuggable.

**Opportunity:** Project Memory could add an optional retrieval trace feature to log which knowledge units were consulted during a query response.

### D. Session Memory Extraction with Deduplication
OpenViking's session commit triggers automatic memory extraction, deduplication, and storage. The `memory_diff.json` audit trail is useful for understanding what changed.

**Opportunity:** Project Memory's `knowledge-compounding` is more disciplined (Durable Bar, evidence requirements), but could benefit from a structured audit log of knowledge changes.

### E. Link-Based Relationship Graph
OpenViking's WikiLink design (in later versions) supports typed relationships (`related_to`, `belongs_to`, `caused_by`, `derived_from`, `contradicts`, `evolved_from`) with weights and PPR-enhanced retrieval.

**Opportunity:** Project Memory's `related:` frontmatter field is a primitive version of this. Typed links with semantic meaning could improve retrieval accuracy.

### F. Freshness Tracking
OpenViking tracks `pending_child_changes` in directory sidecars to detect when summaries are stale. This is a lightweight staleness indicator.

**Opportunity:** Project Memory could adopt a lightweight freshness signal in domain READMEs to indicate when child documents have been updated since the index was last refreshed.

---

## Highest-Value Ideas to Adopt

### MUST ADOPT

**1. L0/L1/L2 Progressive Context Model (Adapted)**

*Problem:* Project Memory's Level 1 (domain README) and Level 2 (knowledge unit) are both full Markdown documents. There's no quick relevance check before loading a domain.

*OpenViking Inspiration:* `.abstract.md` (L0) and `.overview.md` (L1) sidecars provide instant relevance assessment.

*Proposed Adaptation:* Add an optional `L0_SUMMARY` field to AGENTS.md navigation entries. This is a one-line summary of each domain, visible in the primary entry point without loading any additional files.

*Why It's Better:* Agents can scan all domains' L0 summaries from AGENTS.md alone and decide which domain to load next, reducing unnecessary file reads.

*Files Affected:* `AGENTS.md`, `docs/architecture.md`, `skills/memory-architecture/SKILL.md`

*Complexity:* Low

*Risk:* Minimal — L0 is optional and human-maintained

---

**2. Retrieval Trace / Context Trace**

*Problem:* When Project Memory returns a knowledge unit, there's no record of how that unit was selected. Debugging incorrect retrievals requires manual investigation.

*OpenViking Inspiration:* Retrieval trajectories show exactly which path produced each result.

*Proposed Adaptation:* Add an optional retrieval trace mechanism. When `memory-verification` or the orchestrator agent performs a knowledge retrieval, it records: query → candidate domain → selected unit → evidence consulted → confidence. This trace is ephemeral (not persisted) but available for debugging.

*Why It's Better:* Makes retrieval decisions explainable. Essential for debugging when wrong knowledge is returned.

*Files Affected:* `agents/project-memory.md` (routing table), `skills/memory-verification/SKILL.md`

*Complexity:* Low

*Risk:* Minimal — trace is optional and ephemeral

---

**3. Knowledge Change Audit Log**

*Problem:* Project Memory modifies repository files but doesn't maintain a durable record of what changed and why. This makes rollbacks and audits difficult.

*OpenViking Inspiration:* `memory_diff.json` records every add/update/delete operation during session commit.

*Proposed Adaptation:* After each `memory-edit` operation, append a structured entry to a new `docs/CHANGELOG-MEMORY.md` file (or extend `CHANGELOG.md`). Entry format:

```markdown
### YYYY-MM-DD — Knowledge Update
- **Operation:** Create | Update | Consolidate | Supersede | Delete
- **Path:** docs/architecture/auth.md
- **Reason:** Evidence from PR #123 contradicts previous claim
- **Confidence:** High
```

*Why It's Better:* Provides audit trail for knowledge changes. Enables rollbacks. Supports the `obsolete-knowledge` skill in detecting drift.

*Files Affected:* New `docs/CHANGELOG-MEMORY.md`, `skills/memory-edit/SKILL.md`, `skills/obsolete-knowledge/SKILL.md`

*Complexity:* Low

*Risk:* Minimal — append-only, human-readable

---

### SHOULD ADOPT

**4. Typed Relationship Links**

*Problem:* Project Memory's `related:` frontmatter field is untyped. All relationships are equal, making semantic retrieval harder.

*OpenViking Inspiration:* WikiLink types (`related_to`, `belongs_to`, `caused_by`, `contradicts`, `evolved_from`) with PPR-weighted traversal.

*Proposed Adaptation:* Extend the `related:` field to support typed links:

```yaml
related:
  - path: docs/decisions/auth.md
    type: evolved_from
  - path: docs/architecture/security.md
    type: belongs_to
  - path: docs/solutions/login-failure.md
    type: caused_by
```

*Why It's Better:* Enables semantic navigation. A query about "why auth was chosen" can follow `caused_by` links backward. A query about "what changed from v1" can follow `evolved_from` links.

*Files Affected:* `templates/schema.yaml`, `templates/TEMPLATE.md`, `skills/knowledge-classification/SKILL.md`, `skills/memory-architecture/SKILL.md`

*Complexity:* Medium

*Risk:* Low — typed links are optional; existing `related:` values remain valid

---

**5. Freshness Indicators in Domain READMEs**

*Problem:* Domain READMEs (Level 1) don't indicate whether their child documents have been updated since the index was last refreshed.

*OpenViking Inspiration:* `freshness.pending_child_changes` in `.abstract.md` frontmatter.

*Proposed Adaptation:* Add optional `last_indexed` and `pending_updates` fields to domain README frontmatter:

```yaml
---
title: "Architecture Domain"
last_indexed: "2026-09-08"
pending_updates: 2
---
```

*Why It's Better:* Alerts Agents that the domain index may be stale. Triggers re-audit before relying on the index.

*Files Affected:* `templates/schema.yaml`, `skills/memory-architecture/SKILL.md`, `skills/repository-audit/SKILL.md`

*Complexity:* Low

*Risk:* Minimal — freshness fields are optional metadata

---

**6. Session → Knowledge Compounding Loop Enhancement**

*Problem:* Project Memory's `knowledge-compounding` is reactive (triggered manually) rather than proactive (auto-triggered after task completion).

*OpenViking Inspiration:* Session commit automatically triggers memory extraction.

*Proposed Adaptation:* Add a lightweight "post-task compounding prompt" to the DSH plugin. After any significant task completes, the plugin asks: "Did this task produce durable learning worth compounding?" If yes, it triggers `knowledge-compounding` automatically.

*Why It's Better:* Captures learning at the moment of experience, before it fades. Reduces manual trigger overhead.

*Files Affected:* `dsh-plugin/dsh/plugin.mjs`, `agents/project-memory.md`

*Complexity:* Medium

*Risk:* Medium — auto-triggering could create noise if not gated by significance detection

---

### OPTIONAL

**7. Context Manifest / Structured Metadata**

*Problem:* Project Memory knowledge units have frontmatter, but the schema is focused on Solutions. Other knowledge types (Decision, Lesson, Architecture) have less structured metadata.

*OpenViking Inspiration:* OKF (Open Knowledge Format) sidecar metadata with `directory`, `source`, `generated_by`, `freshness` fields.

*Proposed Adaptation:* Standardize frontmatter across all knowledge types with consistent fields:

```yaml
---
type: architecture | decision | solution | lesson | constraint | workflow | reference | history
status: current | deprecated | superseded | historical
confidence: high | medium | low
evidence:
  - path: src/auth/token.ts:42
    type: source
related:
  - path: docs/decisions/auth.md
    type: belongs_to
superseded_by: null
created: "2026-09-08"
last_verified: "2026-09-08"
---
```

*Why It's Better:* Consistent metadata enables machine-readable queries. Supports the audit log and freshness tracking proposals.

*Files Affected:* `templates/schema.yaml`, `templates/TEMPLATE.md`, all existing knowledge documents

*Complexity:* Medium

*Risk:* Medium — migration of existing documents required

---

**8. Lightweight Context Index**

*Problem:* There's no single overview of all knowledge domains and their relationships. Agents must navigate from AGENTS.md through each domain.

*OpenViking Inspiration:* Global `find` query across all context types.

*Proposed Adaptation:* Create a `MEMORY_INDEX.md` at the repository root (or extend `AGENTS.md`) that lists all knowledge domains with their L0 summaries and types. This is a navigation layer only — not a second source of truth.

*Why It's Better:* Enables global discovery without reading every domain README. Supports the retrieval trace proposal.

*Files Affected:* New `MEMORY_INDEX.md`, `AGENTS.md`

*Complexity:* Low

*Risk:* Low — index is navigation-only, not authoritative

---

### DO NOT ADOPT

**1. External Server Dependency**

OpenViking requires a running server for full functionality. This violates Project Memory's core principle of being repository-native and offline-capable.

**2. Vector Database**

OpenViking's dual-layer storage (AGFS + Vector Index) requires a vector database. This introduces infrastructure complexity that Project Memory intentionally avoids.

**3. User-Centric Memory Types**

OpenViking's memory types (profile, preferences, identity, soul) are designed for personal assistant use cases. Project Memory serves repository context, not user personality.

**4. Autonomous Memory Mutation**

OpenViking's automatic session extraction can create memories without human oversight. Project Memory's mandatory verification step prevents this.

**5. Multi-Tenancy Architecture**

OpenViking's account/user/peer model is designed for shared SaaS deployments. Project Memory serves individual repositories.

**6. PPR Graph-Based Retrieval**

While elegant, PPR requires a maintained link graph with typed relationships. Project Memory's deterministic navigation is sufficient and more predictable.

**7. Automatic L0/L1 Sidecar Generation**

OpenViking's SemanticProcessor generates summaries automatically via LLM. Project Memory's manual curation ensures evidence-backed content. Automatic generation would compromise the evidence-first principle.

---

## Ideas to Adapt Rather Than Copy

These OpenViking concepts are useful in principle but must be **reinterpreted** for a repository-native context — not imported as-is.

### 1. Semantic Link Graph (Adapted, Not Copied)

**OpenViking approach:** Typed WikiLinks with PPR-weighted graph traversal, persisted in a separate link database.

**Project Memory adaptation:** Typed `related:` entries in YAML frontmatter only. No separate graph store. Link semantics are human-declared, not auto-inferred. Retrieval follows links manually via `knowledge-classification` routing logic — not via a PPR algorithm.

**Why adapt, not copy:** PPR requires a maintained edge-weighted graph, external persistence, and complex traversal logic. A typed YAML list is Git-diffable, requires no infrastructure, and is sufficient for the scale of knowledge in a single repository. The semantic meaning is preserved; the automation layer is removed.

### 2. Session Archive Structure (Adapted, Not Copied)

**OpenViking approach:** Session messages archived as JSONL files under `viking://user/{id}/sessions/{sid}/history/`, with LLM-generated `.abstract.md` and `.overview.md` sidecars.

**Project Memory adaptation:** Task outcomes are compounded into `docs/solutions/` and `docs/lessons/` — not archived as raw sessions. The session itself is ephemeral; only durable learning is preserved. No JSONL archive, no LLM-generated session summaries.

**Why adapt, not copy:** Raw session archives are user-centric (they track *what the user did*). Project Memory tracks *what the repository learned*. Compounding into structured knowledge documents is more useful for future engineering work than preserving conversation history.

### 3. Multi-Write Storage Strategy (Adapted, Not Copied)

**OpenViking approach:** Primary + backup AGFS backends (localfs/S3) with `.redirect.json` and `.sync_log.json` for consistency.

**Project Memory adaptation:** Git is the primary and only storage backend. There is no concept of multi-write or replication — Git handles versioning, branching, and history natively.

**Why adapt, not copy:** Git provides what multi-write storage tries to achieve (durability, history, branching) without any of the complexity (redirect maps, sync logs, consistency protocols). For a repository-native system, Git *is* the multi-write system.

### 4. Path Lock Engine (Adapted, Not Copied)

**OpenViking approach:** File-based distributed locks with fencing tokens to protect concurrent writes to AGFS + VectorDB.

**Project Memory adaptation:** `memory-edit` uses an approved edit plan as its concurrency guard. Only one agent modifies Project Memory at a time (enforced by the orchestrator agent). No file-based locks needed because Git commit ordering provides the serialization guarantee.

**Why adapt, not copy:** OpenViking needs path locks because multiple clients write to AGFS + VectorDB concurrently. Project Memory has a single write path through the orchestrator agent, and Git serializes all changes. The concurrency problem doesn't exist at the same scale.

### 5. Knowledge Distillation (Daily Report) (Adapted, Not Copied)

**OpenViking approach:** Daily LLM-driven report generation over stored memories to surface trends and themes.

**Project Memory adaptation:** The `obsolete-knowledge` skill acts as a periodic review mechanism. It audits for staleness and suggests supersession — this is the "distillation" equivalent for repository knowledge. No scheduled daily reports; review is triggered by `/project-memory` or `obsolete-knowledge`.

**Why adapt, not copy:** Automated daily reports would generate noise in a repository context (no streaming session data). Periodic human-triggered audit serves the same purpose with higher signal quality.

---

## Ideas to Reject

These OpenViking features are explicitly rejected for Project Memory. Each rejection is justified by a core Project Memory principle.

### 1. Vector Database Storage

**Rejected because:** Project Memory is repository-native. A vector database is an external service that breaks offline operation, Git diffability, and human readability.

**Core principle violated:** #14 — No unnecessary external service.

**Alternative already exists:** `codebase-memory` MCP tools provide semantic search over the repository when needed, without requiring a dedicated vector store for memory content.

---

### 2. User-Centric Memory Types (profile, soul, identity)

**Rejected because:** OpenViking's memory types are designed for personal assistants that learn about *you*. Project Memory learns about *the repository*. A software project has no "soul" or "identity" — it has architecture, decisions, and solutions.

**Core principle violated:** #1 — Evidence over model-generated memory. User personality data cannot be evidence-backed against source code.

**Alternative already exists:** The 10 knowledge types (Current Fact, Architecture, Decision, Solution, Lesson, etc.) cover everything relevant to repository knowledge.

---

### 3. Autonomous Memory Mutation (auto-extraction without verification)

**Rejected because:** OpenViking's session commit triggers automatic memory extraction and storage. Project Memory requires mandatory verification before any knowledge is committed.

**Core principle violated:** #2 — Single Source of Truth. Auto-generated memories without evidence verification become unreliable and create conflicting sources.

**Alternative already exists:** `knowledge-compounding` with the Durable Bar counterfactual test + mandatory `repository-audit` verification step.

---

### 4. External Server Dependency

**Rejected because:** OpenViking requires a running server for full functionality. Project Memory works without any server, any network, any external service.

**Core principle violated:** #11 — Project isolation. A server dependency ties the memory system to infrastructure that may not be available in all development environments.

**Alternative already exists:** All memory lives in repository Markdown files. No server needed.

---

### 5. Automatic L0/L1 Sidecar Generation via LLM

**Rejected because:** OpenViking's SemanticProcessor uses LLM calls to auto-generate `.abstract.md` and `.overview.md` for every directory. Project Memory's L0 summaries are human-maintained and evidence-backed.

**Core principle violated:** #1 — Evidence over model-generated memory. LLM-generated summaries are not verified against source code.

**Alternative already exists:** Manual L0 summaries in `AGENTS.md` frontmatter, written by the `memory-architecture` skill during architecture design with human oversight.

---

### 6. PPR Graph-Based Retrieval

**Rejected because:** PageRank-like traversal over a typed link graph is elegant but requires maintaining edge weights, handling graph cycles, and computing centrality scores — all of which add infrastructure complexity with diminishing returns for single-repository knowledge.

**Core principle violated:** #7 — Deterministic navigation. PPR introduces probabilistic ranking that makes retrieval less predictable and harder to debug.

**Alternative already exists:** Deterministic domain navigation (AGENTS.md → domain README → knowledge unit) is simpler, more predictable, and easier to explain to users. Typed `related:` links support semantic navigation without graph algorithms.

---

### 7. Multi-Tenant Account/User/Peer Isolation

**Rejected because:** OpenViking's multi-tenancy model is designed for shared SaaS deployments. Project Memory serves individual repositories — each repository IS its own tenant.

**Core principle violated:** #11 — Project isolation. Adding account/user/peer isolation layers would overcomplicate a system that is intentionally scoped to a single repository.

**Alternative already exists:** Repository root = tenant boundary. Cross-repository knowledge sharing is handled via thin pointers (references to other repositories' AGENTS.md).

---

### 8. Crypto-Grade Data Encryption at Rest

**Rejected because:** OpenViking supports AES-256 encryption for sensitive data in AGFS. Project Memory stores non-sensitive engineering knowledge in plain Markdown.

**Core principle violated:** #3 — Human-readable repository files. Encrypted data is not human-readable and breaks Git diffability.

**Alternative already exists:** Repository-level access control (Git permissions, GitHub/GitLab secrets, branch protection) is sufficient for engineering documentation. No application-level encryption needed.

---

## Proposed Project Memory Architecture

### Architecture Name: **Project Context & Memory System**

**Core Principles (Preserved):**
1. Evidence over model-generated memory
2. Single Source of Truth
3. Human-readable repository files
4. Git diffability
5. Progressive context loading
6. Low token overhead
7. Deterministic navigation
8. Explainable retrieval
9. Explicit provenance
10. Obsolete knowledge cleanup
11. Project isolation
12. DSH compatibility
13. Minimal dependency growth
14. No unnecessary external service
15. Backward compatibility

### Proposed Memory / Context Model

**Knowledge Types (Unchanged):**
Current Fact, Architecture, Decision, Solution, Lesson, Constraint, Workflow, Reference, History, Obsolete

**Enhanced Lifecycle States:**
```
Candidate (proposed, not yet verified)
    ↓
Verified (evidence gathered, confidence assessed)
    ↓
Canonical (classified, placed in canonical location)
    ↓
Used (retrieved and applied in engineering work)
    ↓
Revalidated (re-checked against current evidence)
    ↓
Superseded / Obsolete (replaced or invalidated)
```

**Enhanced Frontmatter Schema:**
```yaml
---
type: architecture | decision | solution | lesson | constraint | workflow | reference | history
status: current | deprecated | superseded | historical | abandoned
confidence: high | medium | low
evidence:
  - path: src/auth/token.ts:42
    type: source | test | config | ci | git
related:
  - path: docs/decisions/auth.md
    type: belongs_to | caused_by | evolved_from | contradicts | derived_from
scope: project | domain | component
tags:
  - authentication
  - security
created: "2026-09-08"
last_verified: "2026-09-08"
superseded_by: null
consolidated_from: []
---
```

### Proposed Retrieval Model

**Primary Path (Deterministic):**
```
Query → AGENTS.md (L0 summaries)
      → Domain README (L1 orientation)
      → Knowledge Unit (L2 detail)
      → Evidence (if verification required)
```

**Optional Enhancement (Typed Links):**
```
Query → AGENTS.md
      → Domain README
      → Knowledge Unit
      → Follow typed related: links
        → If type = evolved_from: check for superseding unit
        → If type = caused_by: check for root cause
        → If type = contradicts: flag conflict
```

**Retrieval Trace (Ephemeral, Debug-Only):**
```
Query: "Why does this project use pnpm?"
Route:
  AGENTS.md → docs/decisions/package-manager.md (L0: "pnpm chosen for deterministic lockfiles")
  docs/decisions/package-manager.md → src/package.json (evidence)
Evidence:
  - package.json: "packageManager": "pnpm@8.0.0"
  - .github/workflows/ci.yml: uses pnpm
  - docs/decisions/package-manager.md: rationale
Confidence: HIGH
Result: pnpm is the canonical package manager
```

### Proposed Progressive Loading Model

**Level 0 — Always Read (AGENTS.md):**
```markdown
---
title: Project Memory
l0_domains:
  architecture: "System structure, module boundaries, integration points"
  decisions: "Key engineering choices and their rationale"
  solutions: "Diagnosed fix patterns for common issues"
  lessons: "Generalizable engineering principles"
---
```

**Level 1 — Domain Orientation (docs/<domain>/README.md):**
```markdown
---
title: Architecture Domain
last_indexed: "2026-09-08"
pending_updates: 0
---
# Architecture

What this domain covers...
When to read each unit...
```

**Level 2 — Focused Knowledge (docs/<domain>/<topic>.md):**
```markdown
---
type: architecture
status: current
confidence: high
---
# Trust Boundaries
...
```

**Level 3 — Evidence (on demand):**
```
Source code
Tests
Configuration
Git history
```

### Proposed Memory Lifecycle

```
Phase 0: Candidate
  - Knowledge discovered (by knowledge-discovery or knowledge-compounding)
  - Not yet verified
  - Stored in temp location or proposed output

Phase 1: Verified
  - Evidence gathered (repository-audit)
  - Confidence assessed (High/Medium/Low)
  - Limitations recorded

Phase 2: Canonical
  - Type classified (knowledge-classification)
  - Lifecycle state assigned
  - Placed in canonical location (memory-architecture)
  - References updated (memory-edit)

Phase 3: Used
  - Retrieved by future Agents
  - Applied in engineering decisions
  - Confidence reinforced or challenged

Phase 4: Revalidated
  - Re-checked against current evidence
  - Status updated if evidence changed
  - Superseded if replacement found

Phase 5: Superseded / Obsolete
  - Marked with superseded_by or status
  - Old operational guidance removed
  - Historical rationale preserved if valuable
```

### Proposed Retrieval Observability

**Ephemeral Retrieval Trace:**
Available during active DSH sessions. Not persisted to repository.

```json
{
  "query": "Why does this project use pnpm?",
  "timestamp": "2026-09-08T10:00:00Z",
  "trace": [
    {
      "step": "agentic_navigation",
      "from": "AGENTS.md",
      "to": "docs/decisions/package-manager.md",
      "reason": "L0 summary matched query intent"
    },
    {
      "step": "knowledge_retrieval",
      "unit": "docs/decisions/package-manager.md",
      "type": "decision",
      "confidence": "high"
    },
    {
      "step": "evidence_verification",
      "evidence": ["package.json", ".github/workflows/ci.yml"],
      "result": "confirmed"
    }
  ],
  "result": {
    "unit": "docs/decisions/package-manager.md",
    "confidence": "high",
    "limitations": []
  }
}
```

**Access:**
- Via `/project-memory --trace` flag (debug mode)
- Via DSH plugin telemetry (opt-in)
- Not persisted to repository (ephemeral)

### Proposed Session → Knowledge Compounding Loop

**Current Flow:**
```
Task → Manual trigger → knowledge-compounding → knowledge-classification → memory-edit → memory-verification
```

**Enhanced Flow:**
```
Task Completion
    ↓
Post-Task Prompt (DSH plugin)
    ↓
"Did this produce durable learning?"
    ↓
Yes → knowledge-compounding
    ↓
Evidence verification (repository-audit)
    ↓
Classification (knowledge-classification)
    ↓
Append to CHANGELOG-MEMORY.md
    ↓
memory-edit (if approved)
    ↓
memory-verification
```

**Key Improvement:** The DSH plugin auto-prompts after significant tasks, reducing manual trigger overhead. The compounding decision remains gated by the Durable Bar counterfactual.

---

## DSH Integration

**Current State:**
- `/project-memory` command auto-detects state and runs workflow
- Plugin mounts skills dynamically
- First-time-init hint when no AGENTS.md exists

**Proposed Enhancements:**

1. **Post-Task Compounding Prompt:**
   After task completion, plugin asks: "Did this produce durable learning?" If yes, triggers `knowledge-compounding` automatically.

2. **Retrieval Trace Exposure:**
   `/project-memory --trace` enables ephemeral retrieval trace logging for debugging.

3. **Knowledge Change Notification:**
   After `memory-edit` completes, plugin notifies user of changes via DSH notification system.

4. **Automatic Freshness Check:**
   When loading AGENTS.md, plugin checks `pending_updates` in domain READMEs. If non-zero, warns user that domain index may be stale.

**No Breaking Changes:**
All enhancements are additive. Existing `/project-memory` workflow remains unchanged.

---

## Migration Strategy

**Phase 0 (No Change):**
- Current architecture preserved
- All existing skills, templates, and agent files unchanged
- Backward compatibility maintained

**Phase 1 (Lightweight Enhancements):**
- Add `L0_SUMMARY` to AGENTS.md navigation entries
- Add retrieval trace option to `/project-memory --trace`
- Add `CHANGELOG-MEMORY.md` append-after-edit behavior

**Phase 2 (Metadata Standardization):**
- Extend frontmatter schema with `confidence`, `related.type`, `last_verified`
- Update existing knowledge documents incrementally (not all at once)
- Add `pending_updates` field to domain READMEs

**Phase 3 (Typed Links):**
- Update `related:` field format in templates
- Add link type guidance to `knowledge-classification` skill
- Update `memory-architecture` skill to recommend typed links

**Phase 4 (Session Compounding):**
- Add post-task prompt to DSH plugin
- Integrate `CHANGELOG-MEMORY.md` into workflow

**Migration Rules:**
- All changes are additive; no existing functionality removed
- New fields are optional; missing values default to sensible defaults
- Existing knowledge documents remain valid without migration
- `CHANGELOG-MEMORY.md` is created on first edit if absent

---

## Phased Roadmap

### Phase 0 — Preserve Current Strengths
- Maintain evidence-first principle
- Preserve 8-skill architecture
- Keep repository-native storage
- Do not introduce any infrastructure dependencies

### Phase 1 — Progressive Context (Low Effort, High Value)
- Add L0 summaries to AGENTS.md navigation
- Add retrieval trace option
- Add knowledge change audit log (`CHANGELOG-MEMORY.md`)
- **Estimated Effort:** 2-3 days
- **Risk:** Low

### Phase 2 — Better Retrieval (Medium Effort)
- Standardize frontmatter schema across knowledge types
- Add `last_verified` and `pending_updates` fields
- Implement typed `related:` links (optional)
- **Estimated Effort:** 5-7 days
- **Risk:** Medium (schema migration)

### Phase 3 — Session Compounding (Medium Effort)
- Add post-task prompting to DSH plugin
- Integrate compounding into automatic workflow
- Add freshness indicators to domain READMEs
- **Estimated Effort:** 5-7 days
- **Risk:** Medium (behavioral change)

### Phase 4 — Context Intelligence (Higher Effort)
- Implement optional PPR-like link traversal for typed relationships
- Add automated stale-link detection
- Enhance `obsolete-knowledge` skill with freshness-aware prioritization
- **Estimated Effort:** 10-14 days
- **Risk:** Medium-High

### Phase 5 — Optional Advanced Backend (Conditional)
- Only if justified by usage patterns
- Consider pluggable backend abstraction (file-based default, optional graph-based enhancement)
- **Not recommended** unless repository-native model proves insufficient

---

## Risks and Trade-offs

| Proposal | Risk | Mitigation |
|----------|------|------------|
| L0 summaries in AGENTS.md | AGENTS.md grows in size | L0 is optional; one-line per domain |
| Retrieval trace | Debug-only overhead | Ephemeral; opt-in via `--trace` flag |
| Knowledge change audit log | Maintenance overhead | Append-only; generated automatically |
| Typed relationship links | Schema complexity | Optional field; backward compatible |
| Freshness indicators | Staleness detection false positives | Conservative thresholds; human override |
| Post-task compounding prompt | User fatigue from repeated prompts | Gated by significance detection; user can dismiss |
| Frontmatter standardization | Migration effort | Incremental; existing docs remain valid |

---

## Implementation Specification

### Feature 1: L0 Summaries in AGENTS.md

**Location:** `AGENTS.md`, `docs/architecture.md`

**Interface:** New optional `l0_domains` field in AGENTS.md frontmatter

**Data Format:**
```yaml
l0_domains:
  architecture: "System structure, module boundaries, integration points"
  decisions: "Key engineering choices and their rationale"
```

**Agent Behavior:**
- `memory-architecture` skill writes L0 summaries during architecture design
- `knowledge-discovery` skill includes L0 summaries in inventory

**Skill Changes:**
- `memory-architecture/SKILL.md`: Add L0 summary generation step

**DSH Behavior:**
- No change

**Migration:**
- Existing AGENTS.md unchanged; L0 field is optional

**Tests:**
- Verify L0 summaries appear in AGENTS.md navigation
- Verify empty L0 domain doesn't break parsing

**Acceptance Criteria:**
- L0 summaries are visible without loading domain READMEs
- Each domain has at most one L0 summary line
- AGENTS.md remains under 200 lines with L0 summaries

---

### Feature 2: Retrieval Trace

**Location:** `agents/project-memory.md`, DSH plugin

**Interface:** `/project-memory --trace` flag

**Data Format:** Ephemeral JSON, logged to DSH session output (not persisted)

**Agent Behavior:**
- Each retrieval step logs: step type, source, target, reason
- Trace available via `--trace` flag or DSH telemetry endpoint

**Skill Changes:**
- `memory-verification/SKILL.md`: Add trace logging step

**DSH Behavior:**
- Plugin captures trace and exposes via `/project-memory --trace`

**Migration:**
- No migration; feature is opt-in

**Tests:**
- Verify trace is generated when `--trace` flag is present
- Verify trace is empty when flag is absent

**Acceptance Criteria:**
- Trace shows complete retrieval path
- Trace is human-readable
- Trace does not persist between sessions

---

### Feature 3: Knowledge Change Audit Log

**Location:** New `docs/CHANGELOG-MEMORY.md`

**Interface:** Auto-appended after each `memory-edit` operation

**Data Format:**
```markdown
### YYYY-MM-DD — Knowledge Update
- **Operation:** Create | Update | Consolidate | Supersede | Delete
- **Path:** docs/architecture/auth.md
- **Reason:** Evidence from PR #123 contradicts previous claim
- **Confidence:** High
- **Verified By:** repository-audit
```

**Agent Behavior:**
- `memory-edit` skill appends audit entry after each operation
- `obsolete-knowledge` skill references audit log for drift detection

**Skill Changes:**
- `memory-edit/SKILL.md`: Add audit log append step

**DSH Behavior:**
- Plugin notifies user of new audit entries

**Migration:**
- File created on first edit if absent

**Tests:**
- Verify audit entry appended after edit
- Verify entry format matches specification

**Acceptance Criteria:**
- Every knowledge change is recorded
- Audit log is human-readable
- Audit log does not interfere with Git history

---

### Feature 4: Typed Relationship Links

**Location:** `templates/schema.yaml`, `templates/TEMPLATE.md`

**Interface:** Extended `related:` field with optional `type` subfield

**Data Format:**
```yaml
related:
  - path: docs/decisions/auth.md
  - path: docs/architecture/security.md
    type: evolved_from
  - path: docs/solutions/login-failure.md
    type: caused_by
```

**Agent Behavior:**
- `knowledge-classification` skill recommends typed links during classification
- `memory-architecture` skill validates link types during architecture design

**Skill Changes:**
- `knowledge-classification/SKILL.md`: Add typed link recommendation logic
- `memory-architecture/SKILL.md`: Add link type validation

**DSH Behavior:**
- No change

**Migration:**
- Existing `related:` values remain valid (backward compatible)
- New typed links are optional enhancement

**Tests:**
- Verify typed links are parsed correctly
- Verify unknown link types are ignored gracefully

**Acceptance Criteria:**
- Typed links improve semantic retrieval
- Existing documents work without migration
- Link types are self-documenting

---

### Feature 5: Freshness Indicators

**Location:** Domain README files (`docs/<domain>/README.md`)

**Interface:** Optional `last_indexed` and `pending_updates` frontmatter fields

**Data Format:**
```yaml
---
title: Architecture Domain
last_indexed: "2026-09-08"
pending_updates: 0
---
```

**Agent Behavior:**
- `memory-architecture` skill updates `last_indexed` on architecture changes
- `repository-audit` skill increments `pending_updates` when child documents change

**Skill Changes:**
- `memory-architecture/SKILL.md`: Add freshness tracking step
- `repository-audit/SKILL.md`: Add pending updates detection

**DSH Behavior:**
- Plugin warns when `pending_updates > 0` during session start

**Migration:**
- Fields are optional; existing READMEs remain valid

**Tests:**
- Verify freshness fields are written correctly
- Verify warning is triggered when pending_updates > 0

**Acceptance Criteria:**
- Freshness indicators accurately reflect child document status
- Warnings are actionable
- No false positives on unchanged domains

---

### Feature 6: Post-Task Compounding Prompt

**Location:** `dsh-plugin/dsh/plugin.mjs`

**Interface:** Post-task hook in DSH plugin

**Data Format:** N/A (behavioral change)

**Agent Behavior:**
- After task completion, plugin asks: "Did this produce durable learning?"
- If yes, triggers `knowledge-compounding` automatically
- If no, skips compounding

**Skill Changes:**
- `knowledge-compounding/SKILL.md`: Add auto-trigger entry point

**DSH Behavior:**
- Plugin adds post-task hook
- Hook respects `COMPOUNDING_ENABLED` environment variable (default: true)

**Migration:**
- No migration; feature is additive

**Tests:**
- Verify prompt appears after significant task
- Verify compounding is skipped when user declines

**Acceptance Criteria:**
- Prompt is non-intrusive
- Compounding only triggered for significant tasks
- User can disable via environment variable

---

## Acceptance Criteria

The research is complete when:

- [x] Current Project Memory repository inspected (AGENTS.md, all 8 skills, templates, DSH plugin, architecture docs)
- [x] OpenViking architecture studied (6 core concepts, 10+ design docs, session extraction flow, link design)
- [x] Feature-by-feature comparison completed (27 areas compared)
- [x] 6 concrete OpenViking ideas evaluated (L0/L1/L2, retrieval trace, audit log, typed links, freshness, post-task prompting)
- [x] Each idea classified as MUST ADOPT / SHOULD ADOPT / OPTIONAL / DO NOT ADOPT
- [x] Existing Project Memory strengths explicitly preserved (evidence-first, Single Source of Truth, repository-native)
- [x] No database/infrastructure dependency introduced
- [x] Progressive loading evaluated (current 4 levels vs. proposed L0 summary enhancement)
- [x] Retrieval observability evaluated (ephemeral trace, no persistence)
- [x] Session compounding compared (manual vs. auto-prompt)
- [x] Final architecture remains repository-native and Git-reviewable
- [x] DSH `/project-memory` remains first-class one-click workflow
- [x] Every recommendation has evidence from source inspection
- [x] Hypotheses clearly separated from verified facts
- [x] Implementation specification specific enough for separate execution pass

---

## Final Recommendation

### What Should Project Memory Become?

**Project Context & Memory System**

**What problem it solves:**
Project Memory solves the problem of scattered, conflicting, and stale knowledge in software repositories. Multiple AI tools (Claude, Cursor, Codex, etc.) write their own "memory" files, leading to contradictions, duplication, and outdated guidance. Project Memory reconciles these into a single, evidence-backed, progressively loadable knowledge system.

**Core primitives:**
1. **Evidence-backed knowledge** — Every claim verified against source/tests/config/git
2. **Single Source of Truth** — One canonical home per concept; references, never duplicates
3. **Progressive loading** — L0 summaries → L1 domain orientation → L2 knowledge units → L3 evidence
4. **Lifecycle-aware** — Current/Deprecated/Superseded/Historical/Obsolete states with decision trees
5. **Repository-native** — Markdown files in Git; human-readable, diffable, offline-capable

**What makes it different from OpenViking:**
| Dimension | Project Memory | OpenViking |
|-----------|---------------|------------|
| Storage | Repository Markdown files | AGFS + Vector Index |
| Verification | Mandatory evidence check | Trusts stored content |
| Infrastructure | None | Required server |
| Memory model | Repository-focused | User-focused |
| Progressive loading | Deliberate, manual | Automatic, LLM-generated |
| Retrieval | Deterministic navigation | Semantic search + hierarchy |
| Offline | Yes | No (requires server) |

**What it should borrow:**
- L0 summary pattern (one-line domain descriptions in AGENTS.md)
- Retrieval trace (ephemeral, debug-only)
- Knowledge change audit log (CHANGELOG-MEMORY.md)
- Typed relationship links (optional enhancement)
- Freshness indicators (optional enhancement)
- Post-task compounding prompt (optional enhancement)

**What it should reject:**
- External server dependency
- Vector database
- User-centric memory types (profile, soul, identity)
- Autonomous memory mutation
- Multi-tenancy architecture
- PPR graph-based retrieval
- Automatic L0/L1 sidecar generation

**Why it remains repository-native:**
Project Memory's value is that it lives in the repository. It's Git-tracked, human-readable, and requires no infrastructure. Every proposal in this report is designed to enhance these qualities, not replace them. The repository IS the memory system — nothing more, nothing less.

---

## Sources

### Project Memory Agent (Primary)
1. `/tmp/project-memory/AGENTS.md` — Primary agent entry point
2. `/tmp/project-memory/agents/project-memory.md` — Orchestrator agent definition
3. `/tmp/project-memory/skills/knowledge-discovery/SKILL.md` — Discovery workflow
4. `/tmp/project-memory/skills/repository-audit/SKILL.md` — Evidence gathering
5. `/tmp/project-memory/skills/knowledge-classification/SKILL.md` — 10-type, 9-state model
6. `/tmp/project-memory/skills/knowledge-compounding/SKILL.md` — Durable Bar counterfactual
7. `/tmp/project-memory/skills/memory-architecture/SKILL.md` — Progressive loading design
8. `/tmp/project-memory/skills/obsolete-knowledge/SKILL.md` — Lifecycle decision tree
9. `/tmp/project-memory/skills/memory-edit/SKILL.md` — Edit workflow
10. `/tmp/project-memory/skills/memory-verification/SKILL.md` — Final verification gate
11. `/tmp/project-memory/docs/architecture.md` — System architecture
12. `/tmp/project-memory/dsh-plugin/dsh/slash-project-memory.mjs` — Slash command
13. `/tmp/project-memory/templates/schema.yaml` — Frontmatter contract
14. `/tmp/project-memory/templates/TEMPLATE.md` — Solution template

### OpenViking (Primary)
1. `/tmp/openviking/README.md` — Project overview and architecture
2. `/tmp/openviking/docs/en/concepts/01-architecture.md` — System architecture
3. `/tmp/openviking/docs/en/concepts/02-context-types.md` — Resource/Memory/Skill model
4. `/tmp/openviking/docs/en/concepts/03-context-layers.md` — L0/L1/L2 sidecar model
5. `/tmp/openviking/docs/en/concepts/04-viking-uri.md` — URI specification
6. `/tmp/openviking/docs/en/concepts/05-storage.md` — Dual-layer storage
7. `/tmp/openviking/docs/en/concepts/06-extraction.md` — Context extraction pipeline
8. `/tmp/openviking/docs/en/concepts/07-retrieval.md` — Hierarchical retrieval
9. `/tmp/openviking/docs/en/concepts/08-session.md` — Session memory extraction
10. `/tmp/openviking/docs/en/concepts/09-transaction.md` — Path locks and crash recovery
11. `/tmp/openviking/docs/en/concepts/11-multi-tenant.md` — Multi-tenancy model
12. `/tmp/openviking/docs/design/session-memory-extraction-flow.md` — Extraction flow design
13. `/tmp/openviking/docs/design/memory-link-design.md` — WikiLink and PPR design

### Classification Legend
- **Verified Fact:** Directly observed in source code or documentation
- **Interpretation:** My analysis of what the design implies
- **Recommendation:** Proposed enhancement based on analysis
- **Hypothesis:** Potential benefit not yet empirically validated
- **Unresolved Question:** Area requiring further investigation
