# PMA × AI Memory & Context Systems Evolution Research

## Scope Note

This is a research and architecture-analysis deliverable. It does not implement changes. The named external systems `dsh-mnemon`, `dsh-memory`, `dsh-engram`, `memsearch`, `deja-vu`, and `memory-eternal` could not be located as public repositories under the assumed owner in this environment, and a filesystem search did not find local checkouts. Hindsight's primary web source was inaccessible. The strongest directly available external reference was **OpenViking**, which PMA has already analyzed in `docs/research/openviking-evolution-research.md`. This report uses OpenViking as the primary external comparison and treats broader ecosystem patterns from agent memory systems, knowledge graphs, context engineering, and project-aware documentation practices as secondary evidence.

The goal is not to make PMA feature-rich. It is to determine which ideas would improve PMA's correctness, evidence quality, retrieval quality, project awareness, maintainability, and agent reliability without violating PMA's repository-native, evidence-first, low-redundancy identity.

---

## 1. Executive Summary

PMA is already architecturally stronger than most general agent-memory systems in the areas that matter for engineering work: evidence discipline, cross-source reconciliation, lifecycle states, canonical ownership, and repository-native progressive loading. It should not adopt external memory architectures wholesale.

The most valuable evolution direction is **not** a graph database, vector store, external service, or automatic memory extraction engine. It is a **small PMA-native layer of typed, verified relationships and audit-aware retrieval** that turns the existing Markdown/frontmatter store into a lightweight knowledge web:

- Keep PMA's Markdown, YAML frontmatter, domains, indexes, and Git-native storage.
- Strengthen `related:` from an optional loose link into a disciplined relationship layer with semantics, confidence, and verification rules.
- Treat knowledge relationships as evidence-bearing links, not arbitrary connectivity.
- Make retrieval follow typed relationships only when they reduce ambiguity or increase confidence.
- Add an optional relationship audit to `memory-verification` so bad links do not silently corrupt the store.
- Preserve PMA's strongest ideas: evidence before memory, one canonical owner, current/historical separation, Durable Bar compounding, and deterministic navigation.

PMA should evolve toward an **interconnected engineering memory system**, not a generic personal-assistant memory system. The honeycomb idea is useful only when connections are typed, evidence-backed, project-scoped, and retrievable. A graph database is not necessary.

---

## 2. Current PMA Architecture Assessment

### 2.1 Memory Architecture

PMA's memory architecture is repository-native. The primary entry point is `AGENTS.md`, which is intentionally kept short and navigation-oriented. Detailed knowledge lives in `docs/<domain>/`, with optional domain indexes, focused knowledge units, and skill instructions loaded on demand.

Observed current structure:

```text
AGENTS.md
  -> l0_domains one-line summaries
  -> docs/<domain>/README.md
  -> docs/<domain>/<topic>.md
  -> skills/<name>/SKILL.md
```

This is a progressive-loading system. Level 0 gives enough orientation to choose domains without loading full domain documentation. Level 1 gives domain orientation and read-when guidance. Level 2 gives focused knowledge units. Level 3 loads related knowledge only when needed.

Relevant evidence:

- `AGENTS.md` contains `l0_domains` and a navigation table.
- `docs/architecture.md` documents the two-component design: cross-platform skills/agents plus a DSH plugin.
- `skills/memory-architecture/SKILL.md` defines domains, progressive loading, canonical ownership, and document boundaries.
- `dsh-plugin/dsh/plugin.mjs` registers workspace skills, injects first-time-init hints, freshness warnings, and post-task compounding prompts.

### 2.2 Knowledge Model

PMA uses a 10-type knowledge model and a 9-state lifecycle, owned canonically by `knowledge-classification`.

Knowledge types:

```text
Current Fact, Architecture, Decision, Solution, Lesson, Constraint,
Workflow, Reference, History, Obsolete
```

Lifecycle states:

```text
Current, In Progress, Partial, Experimental, Deprecated, Superseded,
Abandoned, Historical, Unknown
```

The schema in `templates/schema.yaml` standardizes frontmatter across all types and adds:

- `type`
- `status`
- `confidence`
- `evidence`
- `related`
- `superseded_by`
- `consolidated_from`
- domain README freshness fields
- track-specific fields for Solutions, Decisions, Lessons, Constraints, Workflows, and Architecture

This is a strong knowledge model. It already supports typed relationships, evidence references, and lifecycle separation.

### 2.3 Retrieval Approach

PMA retrieval is mostly agent-driven deterministic navigation:

```text
Query
  -> AGENTS.md L0 summaries
  -> domain README
  -> knowledge unit
  -> related knowledge / evidence
```

The DSH plugin can warn about stale domain indexes using `pending_updates` and `last_indexed`. The optional `/project-memory --trace` mode records query-to-unit routing. `codebase-memory` / `cbm_*` tools provide graph-based code verification, but they are code evidence tools, not the memory graph itself.

### 2.4 Lifecycle and Compounding

PMA already has explicit lifecycle handling:

- `obsolete-knowledge` determines delete, historical, deprecated, or superseded treatment.
- `knowledge-compounding` extracts durable learnings using a Durable Bar counterfactual.
- `memory-edit` applies approved changes and appends to `docs/CHANGELOG-MEMORY.md`.
- `memory-verification` performs the final gate.

The audit log gives PMA a rare strength compared to many external systems: a durable, Git-visible record of what changed and why.

### 2.5 Project Awareness

PMA is project-aware by construction. It inventories existing knowledge across `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.windsurfrules`, `.github/copilot-instructions.md`, `.claude/`, `skills/`, `agents/`, `docs/`, ADRs, generated docs, and prior memory output. It treats all existing knowledge as candidate claims with provenance, not ground truth.

This is a major strength. Most agent-memory systems are workspace-scoped but not evidence-scoped; PMA is repository-scoped and evidence-scoped.

### 2.6 Agent Integration

PMA integrates across platforms:

- OpenCode, Codex, Claude, DSH, and global agent locations via `install.ps1`.
- DSH plugin mounts skills, registers `/project-memory`, and injects session lifecycle prompts.
- The orchestrator agent routes to specialized skills progressively.
- `codebase-memory` / `cbm_*` tools support evidence verification when available.

### 2.7 Existing Strengths

PMA's strongest capabilities:

1. **Evidence-first discipline**: memory claims are checked against source, tests, config, CI, and Git.
2. **Cross-source reconciliation**: it detects and resolves conflicting knowledge from multiple tools.
3. **Canonical ownership**: one primary home per concept; other locations reference it.
4. **Lifecycle separation**: current, historical, superseded, and obsolete are distinct.
5. **Compounding discipline**: Durable Bar prevents noise from becoming memory.
6. **Git-native storage**: human-readable, diffable, reviewable, and offline.
7. **Progressive loading**: avoids loading unrelated knowledge.
8. **Audit log**: `docs/CHANGELOG-MEMORY.md` supports review, rollback reasoning, and drift detection.

### 2.8 Current Limitations

Meaningful gaps:

1. **Typed relationships are underused**: schema supports `related:` types, but skills do not enforce link semantics strongly.
2. **No relationship verification gate**: broken or semantically wrong links can persist unless caught by generic link checks.
3. **No explicit relationship taxonomy beyond five types**: PMA has `belongs_to`, `caused_by`, `evolved_from`, `contradicts`, `derived_from`, but engineering memory also benefits from `resolves`, `affects`, `validates`, `supersedes`, `originates_from_session`, and `part_of`.
4. **Cross-agent memory is weak**: PMA shares project knowledge through repository files, but it has no explicit model for agent-originated learnings, provenance by agent/harness, or safe cross-harness extraction.
5. **Session-to-memory extraction is mostly reactive**: post-task prompting helps, but there is no structured bridge between session artifacts and durable memory without manual compounding.
6. **Prompt-injection resistance is not explicit**: memory content is untrusted data, but PMA does not define a formal quarantine model for instructions embedded in external docs or generated memory.
7. **Workspace-wide shared knowledge is repository-local by design**: PMA is excellent for one project, but it lacks a clean pattern for shared knowledge across related repositories.

---

## 3. External Systems Compared

### 3.1 OpenViking

OpenViking is the strongest directly available external reference. It is a context database for agents, not a repository documentation system.

Observed documented design:

- It stores resources, memories, and skills under `viking://`.
- It uses L0 abstracts, L1 overviews, and L2 full content.
- It performs directory-aware retrieval, with vector or semantic search over directory structure.
- It extracts session memories after commit.
- It supports relationships/links and retrieval traces.
- It requires a server, embedding models, and external infrastructure.

Useful ideas:

- L0/L1/L2 relevance before full content: PMA already adopted a lightweight version through `l0_domains` and domain READMEs.
- Retrieval trace: PMA already adopted an ephemeral trace via `--trace`.
- Freshness signals: PMA already adopted `last_indexed` and `pending_updates`.
- Session-to-memory compounding: PMA adopted a post-task compounding prompt.
- Typed relationships: PMA partially adopted typed `related:` links, but does not yet fully exploit them.
- Relationship graph retrieval: PMA should reject PPR/vector-graph infrastructure while keeping the semantic value of typed links.

Why not copy OpenViking:

- External service breaks PMA's offline, Git-native identity.
- User-centric memory types (preferences, identity, soul, cases, trajectories) are not appropriate for engineering project memory.
- Automatic extraction without verification conflicts with PMA's evidence discipline.
- Vector storage and multi-tenant ACLs are unnecessary for a repository-scoped knowledge system.

### 3.2 General Agent Memory Systems (Ecosystem Pattern)

Although the named local repositories were unavailable, modern agent-memory systems generally share several patterns:

- Short-term working memory and long-term memory separation.
- Automatic extraction from conversations or tasks.
- Semantic or vector retrieval.
- User profile and preference memory.
- episodic, semantic, and procedural memory distinctions.
- Memory consolidation after sessions.
- cross-session retrieval and multi-agent sharing.

For PMA, these patterns are mostly **reject or already covered**, because PMA is not a personal assistant. PMA should not learn user personality; it should learn durable engineering knowledge about a project.

### 3.3 Knowledge Graph and Graph-Like Retrieval

External knowledge systems often use explicit graph storage, edge weights, and graph traversal. PMA should not add a graph database. The graph-like behavior PMA needs can be implemented through:

- typed frontmatter links,
- verified relationship semantics,
- optional domain index relationship rows,
- deterministic link-following rules,
- audit checks.

This preserves PMA's simplicity while gaining some of the navigational value of a knowledge graph.

**Observed implementation:** PMA's `templates/schema.yaml` already defines typed `related:` objects with five link types.  
**Documented design:** `agents/project-memory.md` documents typed link usage and semantic navigation.  
**Interpretation:** The current schema is strong enough to support evidence-bearing relationships without a graph database.  
**Recommendation for PMA:** Operationalize typed relationships through verification, vocabulary discipline, and retrieval guidance.

### 3.4 Hindsight / Hindsight Coding Agents

The primary Hindsight source was not accessible in this environment. Based only on the name and common product positioning, it likely targets retrospective learning from past work. That is conceptually adjacent to PMA's `knowledge-compounding`, but PMA already has a stronger engineering-specific gate: the Durable Bar counterfactual. Recommendation: do not assume Hindsight's design; if it becomes available, compare its extraction and consolidation rules against PMA's compounding discipline. Classification: **Research Further**, not adopt.

### 3.5 `dsh-mnemon`, `dsh-memory`, `dsh-engram`, `memsearch`, `deja-vu`, `memory-eternal`

These names were not found as public repositories under the expected owner, nor as local checkouts. Because primary evidence is missing, this report does not make strong claims about their implementations. They should be treated as unavailable research targets unless their source becomes accessible. The report instead focuses on the closest available reference, OpenViking, plus general ecosystem patterns.

---

## 4. Important Architectural Ideas Discovered

### 4.1 Typed Relationships as Retrieval Aids, Not Connectivity Theaters

The most useful interconnected-memory idea is not "connect everything." It is:

> A relationship is useful only when it changes what a future agent should read, verify, or avoid.

Examples:

```text
Decision ── supersedes ── Old Decision
Solution ── resolves ── Bug
Bug ── caused_by ── Change/Architecture Assumption
Lesson ── derived_from ── Solution or Incident
Constraint ── affects ── Architecture
Memory ── derived_from ── Evidence
```

PMA already has five relationship types. The gap is discipline: typed links should be recommended only when they reduce retrieval ambiguity and verified by `memory-verification`.

### 4.2 Honeycomb Memory Is Useful Only When Cells Are Project Knowledge

A workspace-wide honeycomb structure can help if each "cell" is a knowledge unit and edges are typed relationships. It is harmful if it becomes a graph database or an arbitrary link network.

PMA-native honeycomb:

```text
docs/decisions/auth.md
  ├── evolved_from docs/history/auth-v1.md
  ├── affects docs/architecture/security.md
  ├── constrained_by docs/constraints/login-rates.md
  └── validated_by tests/auth/refresh-token.test.ts

docs/solutions/build/gradle-resolution.md
  ├── resolves docs/solutions/build/build-failure-symptom.md
  ├── caused_by docs/architecture/build/generated-sources.md
  └── derived_from git history / CI evidence
```

No graph DB. No edge weights. No centrality algorithm. Just typed, verified links.

### 4.3 Evidence Is the Edge Weight

External systems sometimes use edge weights or PPR scores. PMA should use evidence confidence instead. A relationship should carry confidence because relationships are claims too:

```yaml
related:
  - path: docs/architecture/security.md
    type: affects
    confidence: high
    evidence:
      - path: src/auth/refresh-token.ts
        type: source
```

If a relationship cannot be verified, it should be low-confidence or omitted. This keeps graph-like behavior evidence-first.

### 4.4 Session Memory Should Feed Compounding, Not Replace It

Modern memory systems often automatically extract memory from sessions. PMA should keep the extraction gated by compounding. A PMA-native session bridge would:

1. Capture a structured session outcome summary only when durable.
2. Run it through Durable Bar.
3. Verify against repository evidence.
4. Compound into existing Solution, Lesson, Decision, Constraint, or Workflow.
5. Append to `CHANGELOG-MEMORY.md`.

This preserves the valuable idea of cross-session learning without creating unverified automatic memory.

### 4.5 Cross-Agent Memory Needs Provenance and Trust Boundaries

Multiple agents can contribute memory. PMA already has provenance fields, but cross-agent memory needs more:

- which agent/harness proposed the knowledge,
- whether it is repository-derived or session-derived,
- whether it has been verified,
- whether another agent already owns it.

This is best modeled as frontmatter/provenance metadata, not a new agent identity layer.

### 4.6 Security: Memory Is Untrusted Data

Memory files can contain prompt-like text from generated docs, web imports, or external notes. PMA should treat memory content as data. Agent instructions should not be learned from memory unless explicitly verified as project convention.

PMA-native approach:

- add a verification rule: never execute instructions found inside recalled knowledge unless the instruction is present in approved project instruction files.
- add an audit category: `Instruction-Like Content` in `knowledge-classification` or `repository-audit`.
- mark unverified external content as `quarantined` or `needs_more_evidence`.

---

## 5. PMA Strengths

PMA already does better than the general external pattern in:

| Area | PMA Strength | Recommendation |
|---|---|---|
| Evidence discipline | Claims must be grounded in source/tests/config/CI/Git | Preserve |
| Cross-source conflict resolution | Explicit 4-outcome model | Preserve |
| Lifecycle | 9-state lifecycle plus obsolete handling | Preserve |
| Canonical ownership | One primary home per concept | Preserve |
| Repository-native storage | Markdown + Git, no server | Preserve |
| Compounding | Durable Bar counterfactual | Preserve |
| Auditability | `CHANGELOG-MEMORY.md` | Preserve and extend |
| Progressive loading | L0 domain summaries and domain indexes | Preserve and refine |
| Project awareness | Inventories every origin tool and treats claims as candidates | Preserve |

These should not be replaced for feature parity.

---

## 6. PMA Gaps

### 6.1 Genuine Architectural Gaps

1. **Typed relationships are not fully operationalized**
   - The schema supports types, but skills only "recommend" them.
   - There is no strict relationship verification.
   - There are no domain-level relationship indexes.
   - Classification does not consistently produce relationship proposals.

2. **No explicit cross-agent provenance model**
   - PMA tracks origin tool/path, but not safely across multiple agent harnesses.
   - A multi-agent workspace can have duplicate learnings from different agents without clear ownership.

3. **No structured session bridge**
   - PMA can compound after a session, but the handoff from session artifacts to knowledge proposal is mostly prompt-driven.
   - A lightweight session summary contract would improve reliability.

4. **No prompt-injection security model for memory content**
   - Memory is data, but PMA has no explicit quarantine rule.

### 6.2 Optional Features, Not Core Gaps

- graph database: not needed,
- vector search: not needed unless repository docs become too large for agent navigation,
- automatic memory extraction: not desirable,
- multi-tenant ACLs: not appropriate,
- user preference memory: out of PMA's purpose,
- daily report generation: optional observability, not core.

---

## 7. Adopt / Adapt / Research Further / Reject Recommendations

### 7.1 Typed Relationship Links

**External/system idea:** OpenViking and graph-based systems use typed links for semantic navigation.

**Why it matters:** Relationships between decisions, bugs, fixes, constraints, architecture, sessions, and evidence reduce retrieval ambiguity.

**Relevance to PMA:** High. PMA already has schema support and a few link types.

**Classification:** **Adopt**, but adapt PMA-native.

**PMA-native approach:**

- expand the relationship vocabulary from five types to a minimal evidence-bearing set:
  - `supersedes`
  - `resolves`
  - `caused_by`
  - `affects`
  - `belongs_to`
  - `evolved_from`
  - `contradicts`
  - `derived_from`
- make `related:` typed links optional but recommended when semantics matter.
- allow optional `confidence` and `evidence` on relationships.
- update `knowledge-classification` to propose relationship types.
- update `memory-verification` to validate relationship targets and flag semantically weak links.
- do not introduce edge weights, centrality, or graph traversal algorithms.

### 7.2 Relationship Verification Gate

**External/system idea:** Graph databases need referential integrity.

**Why it matters:** A wrong typed link can mislead retrieval more than no link.

**Classification:** **Adopt**.

**PMA-native approach:**

- `memory-verification` checks:
  - relationship target exists,
  - relationship type is valid,
  - `supersedes`/`superseded_by` targets exist,
  - `contradicts` links are resolved or explicitly marked unresolved,
  - stale superseded links are corrected,
  - relationship confidence is not higher than claim confidence.

This is a small, high-value extension.

### 7.3 Evidence-Weighted Links, Not PPR

**External/system idea:** PageRank-like retrieval over knowledge graphs.

**Why it matters:** It can improve recall in large knowledge bases.

**Classification:** **Reject** for PMA's current scale.

**Reason:** PPR requires maintained weights, graph infrastructure, and probabilistic retrieval. PMA's deterministic navigation plus typed links is simpler and more auditable.

**PMA-native adaptation:** use confidence, type, and freshness as human-readable ranking signals, not computed centrality.

### 7.4 Session-to-Knowledge Bridge

**External/system idea:** Automatic session extraction into memory.

**Why it matters:** Captures learning while it is fresh.

**Classification:** **Adapt**.

**PMA-native approach:**

- keep automatic extraction out of the core loop.
- add a lightweight optional session summary contract:
  - task outcome,
  - verified learnings,
  - rejected approaches,
  - changed subsystems,
  - evidence pointers,
  - candidate knowledge type.
- feed that summary into `knowledge-compounding`.
- Durable Bar still gates promotion.

This preserves compounding discipline while improving reliability.

### 7.5 Cross-Agent Memory Provenance

**External/system idea:** Multi-agent memory sharing.

**Why it matters:** Different harnesses can learn the same project facts independently.

**Classification:** **Adapt**.

**PMA-native approach:**

- extend provenance fields:
  ```yaml
  proposed_by:
    agent: <agent/harness identifier, optional>
    session: <optional session id>
    source: repository | session | external_note
  ```
- `knowledge-discovery` detects multiple agent-originated claims.
- `knowledge-classification` resolves duplicates.
- `memory-edit` keeps one canonical owner.
- Do not create a separate cross-agent memory DB.

### 7.6 Workspace-Wide Shared Knowledge Across Repositories

**External/system idea:** OpenViking's shared resources and multi-tenant model.

**Why it matters:** Monorepos, dependent services, and shared libraries can have related knowledge.

**Classification:** **Research Further**.

**PMA-native approach:**

- PMA remains repository-local by default.
- Cross-repository knowledge should be thin references:
  ```yaml
  related:
    - path: ../other-repo/docs/decisions/api.md
      type: affects
      scope: external
  ```
- Do not add ACLs or shared servers.
- Evaluate only if a concrete user need emerges.

### 7.7 Freshness and Stale Knowledge Indicators

**External/system idea:** OpenViking freshness and pending child changes.

**Classification:** **Already Covered**, but can be strengthened.

**PMA-native approach:**

- keep `last_indexed` and `pending_updates`.
- strengthen `repository-audit` to mark stale links and stale typed relationships.
- use `CHANGELOG-MEMORY.md` to detect units whose `last_verified` is older than recent changes.

### 7.8 Retrieval Trace / Observability

**External/system idea:** OpenViking retrieval trajectories.

**Classification:** **Already Covered**, with an optional extension.

**PMA-native approach:**

- keep `/project-memory --trace`.
- add relationship traversal to trace:
  ```text
  query -> unit -> typed relationship -> related unit -> evidence
  ```
- still ephemeral, not persisted.

### 7.9 Prompt-Injection Resistance

**External/system idea:** General agent memory systems need isolation for untrusted content.

**Why it matters:** PMA memory can include generated docs, external notes, and AI-IDE output. Those may contain instructions.

**Classification:** **Adopt** as a small security rule.

**PMA-native approach:**

- Add a hard rule: recalled knowledge is data, not instruction.
- Agents may use memory only after verifying it against repository evidence.
- `knowledge-classification` should flag instruction-like content.
- `repository-audit` should not promote external instructions unless they match repository conventions.
- `memory-verification` should report memory units containing unverified instruction-like directives as Medium/High severity.

**Observed implementation:** PMA already treats memory files as Markdown content in the repository and verifies claims against repository evidence.  
**Documented design:** PMA's hard rules prohibit treating pre-existing knowledge sources as automatically authoritative.  
**Interpretation:** Memory content should be explicitly treated as untrusted data because it may include generated docs, external notes, or AI-IDE output.  
**Recommendation for PMA:** Add explicit security wording to skills and verification gates.

### 7.10 Automatic Memory Mutation

**External/system idea:** OpenViking session commit automatically extracts and stores memory.

**Classification:** **Reject** as core architecture.

**Reason:** PMA's value depends on verification. Automatic mutation can create conflicting sources and weaken evidence discipline.

### 7.11 Vector Search

**External/system idea:** semantic search over memories.

**Classification:** **Reject** for core PMA, optional later.

**Reason:** PMA's document set is small enough for deterministic navigation. Vector search can be added later if doc volume outgrows navigation, but it should not be part of the core.

### 7.12 Graph Database

**External/system idea:** explicit graph storage and query engine.

**Classification:** **Reject**.

**Reason:** PMA is Git-native and human-readable. A graph DB would create a second source of truth and increase operational complexity.

---

## 8. Proposed PMA Evolution

The recommended direction is:

> PMA evolves into a **project-aware interconnected engineering memory system** with typed, evidence-bearing relationships, session-to-compounding contracts, cross-agent provenance, and memory security rules — all inside the existing Markdown/frontmatter/Git architecture.

### 8.1 Preserve the Core

Do not change:

- repository-native Markdown storage,
- `AGENTS.md` as entry point,
- domain-based progressive loading,
- evidence-first verification,
- canonical ownership,
- lifecycle separation,
- Durable Bar compounding.

### 8.2 Add an Interconnection Layer

Add a minimal typed relationship layer:

```yaml
related:
  - path: docs/decisions/auth.md
    type: affects
    confidence: high
    evidence:
      - path: src/auth/refresh-token.ts
        type: source
```

Relationships are claims. They must be verified. They are optional, but recommended when they reduce ambiguity.

### 8.3 Improve Session-to-Memory Extraction

Keep compounding gated, but standardize a lightweight session outcome contract:

```yaml
session_outcome:
  task:
  subsystem:
  verified_learnings:
  rejected_approaches:
  evidence:
  candidate_type:
```

This helps multi-agent and cross-harness usage without automatic unverified memory.

### 8.4 Add Cross-Agent Provenance

Use optional metadata:

```yaml
provenance:
  proposed_by:
    agent: project-memory
    harness: dsh
  origin: session | repository | external
```

This does not create a new agent identity system. It only records who proposed a claim and where it came from.

### 8.5 Add Memory Security Rules

Memory content is data. Instructions found in memory are not automatically valid. Verification must come from repository evidence and approved instruction files.

### 8.6 Do Not Add Infrastructure

No graph DB, vector store, server, ACLs, or user-profile memory. The evolution should remain inspectable in Git.

---

## 9. Risks and Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Typed links create false relationships | Agents follow wrong knowledge | Relationship verification gate and confidence rules |
| Relationship vocabulary grows too large | Schema complexity | Keep minimal types; allow plain `related:` for loose links |
| Link evidence becomes stale | Misleading navigation | `last_verified`, audit log, `repository-audit` freshness checks |
| Automatic session extraction leaks unverified memory | Memory quality drops | Keep Durable Bar and verification mandatory |
| Cross-agent provenance adds complexity | More metadata fields | Optional fields, not required for existing units |
| Prompt-injection through memory | Agents may follow embedded instructions | Treat memory as data; verify before use |
| Over-generalization across projects | Weakens project awareness | Keep PMA repository-local; cross-repo links optional |
| Feature parity temptation | PMA becomes generic | Evaluate only value to correctness, evidence, retrieval, and reliability |
| Maintenance burden | Skills and templates diverge | One canonical owner per rule; update skills together |

---

## 10. Prioritized Next Steps

The goal asks for a concise set of future implementation candidates. The smallest PMA-native candidates are:

### Candidate 1: Relationship Verification Gate (Highest Priority)

**Expected value:** High. Improves retrieval quality and prevents false relationships.  
**Architectural fit:** Excellent. Uses existing `related:` schema.  
**Complexity:** Low to medium.  
**Risk:** Low.  
**Evidence strength:** Strong. PMA already supports typed links.

Future task:

- Add `memory-verification` checks for typed relationships.
- Add `knowledge-classification` guidance for when to use each relationship type.
- Add examples in `templates/TEMPLATE.md`.

### Candidate 2: Minimal Relationship Vocabulary Expansion

**Expected value:** Medium-high. Improves semantic navigation for engineering relationships.  
**Architectural fit:** Good.  
**Complexity:** Low.  
**Risk:** Low if additions are limited.  
**Evidence strength:** Strong from PMA schema and classification model.

Future task:

- Add `supersedes`, `resolves`, `affects`, and optionally `validates` to the relationship schema.
- Keep existing types backward-compatible.

### Candidate 3: Session Outcome Contract

**Expected value:** Medium. Improves cross-agent/cross-session learning without automatic memory.  
**Architectural fit:** Good.  
**Complexity:** Medium.  
**Risk:** Medium if made mandatory. Make it optional.  
**Evidence strength:** Moderate; external session-memory systems support the idea, but PMA has no current concrete session artifact model.

Future task:

- Define a lightweight session outcome format.
- Use it as input to `knowledge-compounding`.
- Preserve Durable Bar as the gate.

### Candidate 4: Cross-Agent Provenance Metadata

**Expected value:** Medium. Useful for multi-agent workspaces.  
**Architectural fit:** Good.  
**Complexity:** Low.  
**Risk:** Low.  
**Evidence strength:** Moderate.

Future task:

- Add optional `provenance.proposed_by` fields.
- Use them only to resolve duplicate agent-originated claims.

### Candidate 5: Memory Security Rule

**Expected value:** High for reliability.  
**Architectural fit:** Good.  
**Complexity:** Low.  
**Risk:** Low.  
**Evidence strength:** Strong; memory is untrusted data.

Future task:

- Add a hard rule that recalled memory is data, not instruction.
- Add verification/reporting of instruction-like content in memory units.

---

## 11. Recommended Evolution Statement

PMA should not become "the best existing memory system." It should become a better **engineering memory system** by:

1. keeping Markdown, Git, evidence-first, and canonical ownership as the foundation;
2. making relationships typed, optional, verified, and evidence-bearing;
3. adding a relationship verification gate;
4. standardizing lightweight session outcomes for reliable compounding;
5. adding cross-agent provenance metadata;
6. treating memory content as untrusted data with explicit security rules;
7. rejecting graph databases, vector stores, external servers, and automatic unverified memory.

The most valuable interconnected-memory idea is not a knowledge graph in the database sense. It is a **honeycomb of verified project knowledge cells**, where each cell is a Markdown knowledge unit and each edge is a typed, confidence-bearing relationship that helps the next agent choose what to read and what to verify.

---

## 12. Classification Summary

| Idea | Classification |
|---|---|
| Typed `related:` links | Adopt / Adapt |
| Relationship verification gate | Adopt |
| Relationship vocabulary expansion (`supersedes`, `resolves`, `affects`, `validates`) | Adapt |
| PPR / graph traversal / graph DB | Reject |
| Vector search / external memory server | Reject for core |
| Automatic session memory extraction | Reject for core |
| Gated session outcome contract for compounding | Adapt |
| Cross-agent provenance metadata | Adapt |
| Cross-repository shared knowledge | Research Further |
| Freshness indicators | Already Covered |
| Retrieval trace | Already Covered |
| Prompt-injection resistance for memory content | Adopt |
| User preference / personal assistant memory types | Reject |
| Multi-tenant ACLs | Reject |

---

## 13. Evidence Map

### Evidence Distinction Legend

- **Observed implementation:** directly seen in PMA source, skills, schema, templates, DSH plugin, or repository files.
- **Documented design:** described in PMA or OpenViking documentation/README as intended architecture.
- **Interpretation:** my architectural reading of the evidence.
- **Recommendation for PMA:** proposed future improvement, not implemented.

### PMA Primary Evidence

- `AGENTS.md`: L0 domain summaries, navigation, critical rules.
- `docs/architecture.md`: system architecture, DSH plugin, progressive loading.
- `agents/project-memory.md`: orchestrator, knowledge model, workflow, typed relationship features.
- `skills/knowledge-discovery/SKILL.md`: existing knowledge inventory and provenance.
- `skills/knowledge-classification/SKILL.md`: 10 knowledge types, 9 lifecycle states, conflict resolution, typed link recommendation.
- `skills/knowledge-compounding/SKILL.md`: Durable Bar, compounding discipline, session history and auto-memory references.
- `skills/memory-architecture/SKILL.md`: domains, progressive loading, canonical ownership, retrieval.
- `skills/obsolete-knowledge/SKILL.md`: lifecycle handling, drift detection, audit log use.
- `skills/memory-edit/SKILL.md`: edit plans, thin pointers, `CHANGELOG-MEMORY.md` audit log.
- `skills/memory-verification/SKILL.md`: final gate, trace mode, link checks.
- `templates/schema.yaml`: typed `related:` fields, confidence, evidence, freshness fields.
- `templates/TEMPLATE.md`: usage examples for typed links and frontmatter.
- `dsh-plugin/dsh/plugin.mjs`: DSH lifecycle hooks, compounding prompt, freshness warning.
- `docs/research/openviking-evolution-research.md`: prior PMA/OpenViking analysis.

### External Primary Evidence

- OpenViking repository README: `viking://`, L0/L1/L2, directory-aware retrieval, session memory extraction, DSH plugin, benchmark results, and service requirements.
- OpenViking research papers referenced in README: VikingMem, directory-aware retrieval, VikingRAG. These support the value of structured retrieval and memory evolution, but PMA does not need to adopt the infrastructure.

### Unavailable or Inaccessible Targets

- `dsh-mnemon`, `dsh-memory`, `dsh-engram`, `memsearch`, `deja-vu`, `memory-eternal`: public repository not found under expected owner; local filesystem not found. No strong claims made.
- Hindsight: primary web source returned a challenge/redirect and no reliable content. Classified as Research Further.
