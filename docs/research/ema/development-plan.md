# Engineering Memory Agent (EMA) — Development Plan

> **Status:** Implementation Planning Complete
> **Architecture Gate:** Architecture Approved ✅ (`docs/research/ema/architecture-approval-candidate.md`)
> **Development Phase:** Development Planning Complete (Pre-Implementation Planning Review)
> **Target System:** Engineering Memory Agent (EMA) evolved from Project Memory Agent (PMA)
> **Implementation State:** NOT STARTED (Strict Plan-Only Deliverable)
> **Date:** 2026-09-21

---

## 1. Current-State Findings (Actual PMA Repository Audit)

A comprehensive audit of `/home/lovedolove/projects/Project-Memory-Agent` was conducted across source code, configuration, tests, CI, templates, agent manifests, and Git history.

### 1.1 Repository Structure & Assets
1. **Core Pipeline Skills (`skills/`):**
   - 8 specialized skills present:
     - `knowledge-discovery`: inventories multi-origin knowledge sources without verification.
     - `repository-audit`: read-only evidence gathering across source, tests, config, git, docs.
     - `knowledge-classification`: evidence-based classification into 10 knowledge types.
     - `knowledge-compounding`: distills durable lessons, decisions, solutions from completed work.
     - `memory-architecture`: designs information architecture, progressive loading paths, L0-L3.
     - `memory-edit`: executes minimal, scoped, planned edits; logs to `docs/CHANGELOG-MEMORY.md`.
     - `memory-verification`: final verification gate with multi-tier checks (syntax, semantics, lifecycle, evidence).
     - `obsolete-knowledge`: audits stale/superseded knowledge, enforces deprecation vs preservation.
2. **Orchestrator Agent (`agents/`):**
   - `agents/project-memory.md`: DSH/Claude subagent orchestrator with comprehensive routing table.
   - `agents/project-memory.toml`: Codex orchestrator definition.
3. **DSH Bundle Plugin (`dsh-plugin/`):**
   - Package: `@lovedolove/dsh-project-memory` (v0.4.31).
   - `cordis.patch.yml`: Cordis bundle patch registering `project-memory-dsh` (`dsh/plugin.mjs`).
   - `dsh/plugin.mjs`: Runtime glue; registers workspace `skills/` with `ctx.skills.register()`, injects first-time initialization hints (`agent/pre-step`), posts post-task compounding prompts (`agent/post-step`), and monitors `session/start`.
   - `dsh/slash-project-memory.mjs`: Implements `/project-memory` command with automatic workflow prompt injection and `--trace` flag.
   - `dsh/codebase-memory-bridge.mjs`: Spawns persistent `codebase-memory-mcp` stdio child process providing `cbm_*` tools (semantic code graph search, snippets, trace path). Platform-aware for POSIX and Windows.
   - `lib/index.js`: Minimal no-op stub for npm package entry (`inject: []`).
   - `test/codebase-memory-bridge.test.mjs`: Uses `node:test` to test path slugging and mock MCP JSON-RPC round-trip.
4. **Templates & Schemas (`templates/`):**
   - `templates/schema.yaml`: Frontmatter schema defining 10 knowledge types (`fact`, `architecture`, `decision`, `solution`, `lesson`, `constraint`, `workflow`, `reference`, `history`, `obsolete`), status enum, 8 typed relationships (`supersedes`, `evolved_from`, `resolves`, `caused_by`, `affects`, `belongs_to`, `contradicts`, `derived_from`), and verification states.
   - `templates/TEMPLATE.md`: Standard document template for all knowledge types.
   - `templates/CONCEPTS.md`, `templates/SOLUTIONS.md`: Legacy specialized templates.
5. **CI & Packaging:**
   - `.github/workflows/publish.yml`: Publishes `dsh-plugin` to npm on pushes to `main` modifying `dsh-plugin/**`.
   - `install.ps1` & `install.tests.ps1`: Multi-agent installer seeding skills to Claude, OpenCode, Codex, and DSH directories.
6. **Canonical Storage (`docs/` & `AGENTS.md`):**
   - `AGENTS.md`: Level 0 entry point with `l0_domains` frontmatter and navigation table.
   - `docs/CHANGELOG-MEMORY.md`: Immutable audit log recording path, operation, reason, confidence, evidence source, and verifier.
   - Knowledge domains: `docs/architecture/`, `docs/solutions/`, `docs/lessons/`, and `docs/research/ema/`.

---

## 2. Documentation vs. Implementation Discrepancies

Evidence-first analysis reveals discrepancies between documented claims and repository implementation. Each is classified by nature:

| Topic | Documented Architecture | Actual Repository Implementation | Classification | Planning Impact |
|---|---|---|---|---|
| **Lifecycle States** | `docs/architecture.md` and `templates/schema.yaml` document a "9-state lifecycle" (`current`, `in_progress`, `partial`, `experimental`, `deprecated`, `superseded`, `abandoned`, `historical`, `unknown`). | `templates/TEMPLATE.md` lists only 4 states (`current`, `deprecated`, `superseded`, `historical`). Skills treat `obsolete` sometimes as a type and sometimes as a lifecycle state. | **Documentation Drift** | Normalize across all files to the approved 4-dimensional model (Lifecycle State, Validation State, Authority Level, Confidence Level). |
| **Vector Search / Indexing** | PMA documentation refers to semantic retrieval and TF-IDF / basic search. | No internal vector index or lexical search index exists in the PMA codebase. Search in PMA currently relies on `grep`, `glob`, file reads, or external `cbm_*` MCP tools. | **Implementation Drift** | Local vector index and lexical indexing must be created as new derived infrastructure in EMA. |
| **Cross-Project Scope** | `templates/schema.yaml` specifies `scope: [project, domain, component, subsystem]`. | Scope represents intra-repository architectural breadth, not repository/workspace/global boundaries. All skills assume a single repository workspace. | **Architectural Conflict** | Must refactor `scope` to represent Knowledge Scope (`project`, `workspace`, `global`) and keep Execution Scope (`session`, `task`) separate. |
| **Evidence Anchors** | `templates/schema.yaml` specifies `evidence: [{ path: string, type: enum }]`. Line numbers are embedded as strings (e.g. `src/file.ts:42`). | No URI/URN format exists. No logical anchor typing (`sym:`, `ast:`, `sec:`, `test:`, `cfg:`, `pr:`, `issue:`) is implemented in runtime or verification skills. | **Migration Requirement** | Implement parser, validator, and schema migration for `ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>`. |
| **Candidate Knowledge & Promotion** | PMA treats extracted knowledge as immediately canonical Markdown files written to disk via `memory-edit`. | No separate candidate queue or explicit promotion decision pipeline exists. Changes are applied directly to canonical docs. | **Migration Requirement** | Implement Candidate state, candidate persistence, validation workflow, and promotion audit trail. |
| **Plugin Skill Registration** | `docs/architecture.md` claims Cordis patch has two rows: `pma-skill-dir` (insert) and `project-memory-dsh`. | `dsh-plugin/cordis.patch.yml` actually only contains `project-memory-dsh` (one row); `pma-skill-dir` was removed because `cordis:plugin` was not a registered Cordis builtin. Skill registration is handled in `plugin.mjs` via `registerWorkspaceSkills`. | **Documentation Drift** | Update `docs/architecture.md` to reflect runtime dynamic registration in `plugin.mjs`. |
| **Isolation Boundaries** | Not addressed in PMA; single-repo assumption. | No isolation mechanisms exist. Multi-repo workspaces in DSH have no cross-repo boundaries in plugin. | **New Requirement** | Implement 6-boundary hard isolation (`ema_isolation: hard | soft`) in retrieval, storage, index, and query layers. |

---

## 3. Current PMA → Target EMA Mapping

```text
Current PMA Capability                     Target EMA Implementation                       Status
───────────────────────────────────────────────────────────────────────────────────────────────────
AGENTS.md L0 Entry Point                   AGENTS.md L0 + Scope Summary Header             Extend
docs/<domain>/ L1-L3 Markdown              Canonical EKU Markdown Store                    Extend
templates/schema.yaml                      EKU Schema v2 (4 Lifecycle Dimensions)          Refactor
skills/knowledge-discovery                 Multi-Scope Knowledge Discovery                 Extend
skills/repository-audit                    Evidence Gathering + Anchor Generator           Extend
skills/knowledge-classification            EKU 4-D Classifier + Scope Classifier           Refactor
skills/knowledge-compounding               Candidate EKU Distillation Engine               Extend
skills/memory-architecture                 Multi-Scope Architecture Designer               Extend
skills/memory-edit                         Canonical Store Writer + Lineage Tracker        Refactor
skills/memory-verification                 Multi-Tier Gate + Anchor/Staleness Verifier     Refactor
skills/obsolete-knowledge                  Lifecycle Transition & Quarantine Skill         Refactor
agents/project-memory.md                   EMA Multi-Scope Orchestrator Agent              Extend
dsh-plugin/dsh/plugin.mjs                  DSH EMA Plugin (Context Injection + Hooks)      Extend
dsh-plugin/dsh/slash-project-memory.mjs    /ema & /project-memory Commands                 Extend
dsh-plugin/dsh/codebase-memory-bridge.mjs  CBM Bridge (Unchanged, Coexists)                Reuse
(None in PMA)                              Derived Local Vector Index (SQLite-vec)         New
(None in PMA)                              Policy / Authorization Engine (Fail-Closed)     New
(None in PMA)                              Candidate Queue Manager                         New
(None in PMA)                              Stable Evidence Anchor Resolver                 New
(None in PMA)                              Promotion & Quarantine Pipeline                 New
(None in PMA)                              Authoritative Retrieval Engine (Multi-Dim)      New
(None in PMA)                              MCP Server (`ema_*` tool suite)                 New
```

---

## 4. Reuse / Extend / Refactor / Replace / New / Defer Decisions

### 4.1 Reuse (Keep existing implementation as-is)
- `dsh-plugin/dsh/codebase-memory-bridge.mjs`: Proven POSIX/Windows bridge to `codebase-memory-mcp`. Retained as a complementary structural code analysis tool.
- `install.ps1` & multi-agent distribution concept: Keep ability to seed skills to Claude, OpenCode, Codex, and DSH.
- `docs/CHANGELOG-MEMORY.md` core format: Append-only Markdown audit log format is retained and extended with promotion/quarantine records.

### 4.2 Extend (Augment existing code/skills with new capabilities)
- `AGENTS.md`: Extend L0 navigation table to summarize cross-project workspace references and scope boundaries.
- `skills/knowledge-discovery`: Add discovery of cross-repo workspace memory sources and candidate queues.
- `skills/repository-audit`: Extend to extract immutable Git commit SHAs, symbol paths, and test signatures for evidence anchor generation.
- `skills/knowledge-compounding`: Extend to generate `Candidate` EKUs instead of immediate canonical docs.
- `agents/project-memory.md`: Add routing for cross-scope promotion, candidate validation, and isolation policy checks.
- `dsh-plugin/dsh/plugin.mjs`: Extend lifecycle hooks to inject static engineering context (budget-capped) and monitor staleness triggers.

### 4.3 Refactor (Restructure existing capabilities to align with approved architecture)
- `templates/schema.yaml`: Refactor frontmatter from monolithic `status` into the 4 orthogonal dimensions: `status` (lifecycle), `validation_state`, `authority_level`, and `confidence`. Replace intra-repo `scope` with Knowledge Scope enum (`project`, `workspace`, `global`).
- `templates/TEMPLATE.md`: Update frontmatter block and guidelines to reflect the 4-D model and `ema://evidence/...` schema.
- `skills/knowledge-classification`: Refactor classification logic to output the 4 orthogonal dimensions and validate against invalid combinations.
- `skills/memory-edit`: Enforce that `memory-edit` writes canonical Markdown only for validated/promoted units; candidate additions route to candidate storage. Maintain `promoted_from` lineage.
- `skills/memory-verification`: Refactor to add Tier 6 (Evidence Anchor Syntax & Reachability), Tier 7 (Scope & Isolation Boundary Validation), and Tier 8 (Lifecycle Orthogonality Check).
- `skills/obsolete-knowledge`: Refactor to manage state transitions across `Deprecated`, `Superseded`, `Historical`, `Potentially Stale`, `Invalid`, and `Quarantined`.

### 4.4 Replace (Obsolete PMA constructs)
- Legacy scope definition (`[project, domain, component, subsystem]`): Replaced by Knowledge Scope (`project`, `workspace`, `global`). Component/domain granularity moves to `tags` or `path`.
- Unstructured evidence strings (`src/file.ts:42`): Replaced by URI/URN `ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>`.

### 4.5 New (Components to design and implement)
- **Core Domain Model (`src/core/` / `dsh-plugin/lib/core/`):** Types, schemas, and validators for Engineering Knowledge Units (EKU).
- **Evidence Anchor Subsystem (`src/evidence/`):** Parsing, generation, Git verification, and AST/symbol staleness checking.
- **Policy & Authorization Engine (`src/policy/`):** Fail-closed evaluation of actor operations against scope boundaries and hard isolation settings.
- **Derived Storage & Index Subsystem (`src/index/`):** SQLite-vec embedded database managing BM25 lexical search and vector similarity with scope partitioning.
- **Candidate & Promotion Subsystem (`src/promotion/`):** Candidate queue, validation pipeline, promotion decision logger, and quarantine coordinator.
- **Retrieval Engine (`src/retrieval/`):** Authoritative 6-stage pipeline (Authorization → Candidate Retrieval → Lifecycle Filtering → Multi-Dimensional Ranking → Contradiction Detection → Context Assembly).
- **MCP Server (`src/mcp/`):** Standalone stdio MCP server exposing `ema_recall`, `ema_add`, `ema_context`, `ema_validate`, `ema_promote`.

### 4.6 Defer (Explicitly postponed beyond initial implementation)
- Virtual filesystem driver (FUSE / SMFS interface).
- Broad connector ecosystem (Slack, Notion, Jira, Linear) — Git/docs remain authoritative.
- Remote REST API / external SDK — agent interfaces (DSH plugin + MCP) are prioritized.
- Enterprise IAM/OAuth integration — simple 4-actor matrix suffices.
- Distributed property graph database (Neo4j) — relationships remain in Markdown frontmatter and derived SQLite tables.

---

## 5. Component / Module Plan

To maintain zero runtime dependencies for the core skill markdown and minimal dependencies for the DSH plugin and MCP server, the repository will be structured as follows:

```
Project-Memory-Agent/
├── agents/                           # Agent definitions (DSH, Claude, Codex)
│   ├── project-memory.md             # Updated EMA multi-scope orchestrator
│   └── project-memory.toml
├── skills/                           # Level 3 Skill instructions (Zero-dependency markdown)
│   ├── knowledge-classification/
│   ├── knowledge-compounding/
│   ├── knowledge-discovery/
│   ├── memory-architecture/
│   ├── memory-edit/
│   ├── memory-verification/
│   ├── obsolete-knowledge/
│   └── repository-audit/
├── templates/                        # EKU v2 schemas and templates
│   ├── schema.yaml
│   └── TEMPLATE.md
├── docs/                             # Canonical knowledge base
│   ├── CHANGELOG-MEMORY.md           # Knowledge audit log
│   ├── architecture/
│   ├── solutions/
│   ├── lessons/
│   └── research/ema/                 # Research and architectural blueprints
├── dsh-plugin/                       # DSH Bundle & MCP Server package
│   ├── package.json
│   ├── cordis.patch.yml
│   ├── dsh/                          # DSH plugin entry points
│   │   ├── plugin.mjs                # Extended runtime glue
│   │   ├── slash-project-memory.mjs  # Slash commands (/project-memory, /ema)
│   │   └── codebase-memory-bridge.mjs# CBM MCP bridge
│   ├── src/                          # Shared Node.js/ESM implementation modules
│   │   ├── core/                     # EKU domain models, validation, types
│   │   │   ├── eku.mjs
│   │   │   ├── schema.mjs
│   │   │   └── constants.mjs
│   │   ├── evidence/                 # Evidence anchor parsing & staleness detection
│   │   │   ├── anchor.mjs
│   │   │   ├── git-resolver.mjs
│   │   │   └── staleness.mjs
│   │   ├── policy/                   # Fail-closed authorization engine
│   │   │   ├── authorization.mjs
│   │   │   └── isolation.mjs
│   │   ├── storage/                  # Canonical Markdown & candidate queue storage
│   │   │   ├── markdown-store.mjs
│   │   │   ├── candidate-store.mjs
│   │   │   └── changelog.mjs
│   │   ├── index/                    # Derived SQLite lexical + vector index
│   │   │   ├── db.mjs
│   │   │   ├── lexical-index.mjs
│   │   │   ├── vector-index.mjs
│   │   │   └── rebuild.mjs
│   │   ├── retrieval/                # 6-stage authoritative retrieval pipeline
│   │   │   ├── pipeline.mjs
│   │   │   ├── ranking.mjs
│   │   │   ├── contradiction.mjs
│   │   │   └── context-builder.mjs
│   │   ├── promotion/                # Promotion pipeline, lineage & quarantine
│   │   │   ├── pipeline.mjs
│   │   │   └── lineage.mjs
│   │   └── mcp/                      # Stdio MCP Server implementation
│   │       ├── server.mjs
│   │       └── tools.mjs
│   ├── bin/                          # CLI and MCP entry points
│   │   ├── ema-mcp.mjs               # Executable stdio MCP server
│   │   └── ema-cli.mjs               # Maintenance CLI (index, verify, rebuild)
│   └── test/                         # Unit, integration, and security tests
│       ├── core.test.mjs
│       ├── evidence.test.mjs
│       ├── policy.test.mjs
│       ├── retrieval.test.mjs
│       ├── isolation.test.mjs
│       └── mcp.test.mjs
```

---

## 6. Domain, Data, and Schema Plan

### 6.1 Engineering Knowledge Unit (EKU) Schema v2

The core conceptual object is the **Engineering Knowledge Unit (EKU)**, stored canonically as a UTF-8 Markdown file with strict YAML frontmatter:

```yaml
---
# Identity & Type
id: "eku-20260921-auth-jwt"           # Optional deterministic or UUID ID
title: "JWT Authentication Architecture & Key Rotation"
type: architecture                    # Enum: fact | architecture | decision | solution | lesson | constraint | workflow | reference | history | obsolete

# Four Orthogonal Dimensions
status: current                       # Lifecycle State: Draft | Current | Deprecated | Superseded | Historical | Abandoned
validation_state: verified            # Validation State: Unreviewed | Needs Review | Potentially Stale | Verified | Invalid | Quarantined
authority_level: canonical            # Authority Level: Candidate | Derived | Canonical
confidence: high                      # Confidence Level: High | Medium | Low

# Scope Hierarchy
scope: project                        # Knowledge Scope: project | workspace | global
scope_id: "project:github.com/org/repo" # Fully qualified scope URI
isolation: soft                       # Isolation Mode: soft | hard

# Stable Evidence Anchors
evidence:
  - anchor: "ema://evidence/github.com/org/repo/9f8a2c1b/src/auth/jwt.ts#sym:verifyToken"
    type: source
    verified_at: "2026-09-21T10:00:00Z"
  - anchor: "ema://evidence/github.com/org/repo/9f8a2c1b/tests/auth.test.ts#test:test_jwt_rotation"
    type: test
    verified_at: "2026-09-21T10:00:00Z"

# Typed Relationships
related:
  - type: supersedes
    target: "docs/architecture/auth-session.md"
    verification: Verified
  - type: contradicts
    target: "docs/decisions/basic-auth.md"
    verification: Quarantined
    notes: "Direct conflict regarding stateless vs stateful auth"

# Supersession Pointer
superseded_by: null                   # String path when status = superseded

# Promotion & Provenance Lineage
promoted_from:
  origin_scope: "project:github.com/org/sub-repo"
  origin_id: "docs/solutions/jwt-fix.md"
  validated_by: "agent:project-memory"
  promoted_by: "human:lead-dev"
  promoted_at: "2026-09-21T12:00:00Z"
  rationale: "Pattern validated across two services"
  min_sources_checked: 2
  audit_ref: "docs/CHANGELOG-MEMORY.md#2026-09-21-jwt-promotion"

# Metadata & Tags
tags:
  - auth
  - jwt
  - security
created: "2026-09-21"
last_verified: "2026-09-21"
---

# JWT Authentication Architecture & Key Rotation

Detailed engineering markdown content...
```

### 6.2 Schema Validation Rules & Invalid State Combinations
The parser/validator (`src/core/schema.mjs`) will enforce:
1. **Mutually Exclusive Authority & Lifecycle Combinations:**
   - `authority_level: Candidate` + `authority_level: Canonical` $\rightarrow$ INVALID.
   - `authority_level: Candidate` + `status: Current` (in canonical storage) $\rightarrow$ INVALID (candidates live in candidate queue).
   - `status: Current` + `status: Historical` $\rightarrow$ INVALID.
   - `validation_state: Unreviewed` + `validation_state: Verified` $\rightarrow$ INVALID.
2. **Promotion Preconditions:**
   - `scope: global` requires `min_sources_checked >= 2` (or explicit override flag) and `authority_level: canonical`.
3. **Supersession Invariant:**
   - When `status: superseded`, `superseded_by` MUST point to a valid, reachable target.
4. **Relationship Typing:**
   - Must use one of the 12 recognized relationship types (`supersedes`, `evolved_from`, `resolves`, `caused_by`, `affects`, `belongs_to`, `contradicts`, `derived_from`, `promoted_from`, `updates`, `extends`, `derives`).
   - Targets with `type: contradicts` automatically trigger `validation_state: Quarantined` or `Needs Review` on retrieval.

---

## 7. Storage, Index, and Technology Planning

### 7.1 Separation of Storage Tiers
```text
┌────────────────────────────────────────────────────────────────────────┐
│ CANONICAL STORAGE (Git-Native Markdown + YAML)                         │
│ • Source of Truth                                                      │
│ • docs/<domain>/<topic>.md                                             │
│ • docs/CHANGELOG-MEMORY.md                                             │
│ • Completely auditable, versioned, survives index destruction          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Ingestion / Parsing / Rebuild
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DERIVED STORAGE & INDEX (SQLite / SQLite-vec in .ema/)                 │
│ • Disposable, regenerable cache                                        │
│ • FTS5 table: Lexical BM25 search                                      │
│ • Vec0 virtual table: Cosine similarity vector search                  │
│ • Graph table: EKU relationship edges and verification states          │
│ • Rebuildable anytime with `ema index --rebuild`                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Retrieval & Assembly
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ EPHEMERAL STATE (In-Memory / Session Runtime)                          │
│ • Session traces & query logs                                          │
│ • Task working notes & context windows                                 │
│ • Discarded upon session termination                                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Derived Index Technology Evaluation

| Technology | Portability & Platform | Local / Offline | Dependency Footprint | Maintenance & Complexity | Decision |
|---|---|---|---|---|---|
| **SQLite + FTS5 + sqlite-vec** | Pure C library, precompiled binaries for Linux, macOS, Windows/WSL. | 100% local, no external daemon. | Single npm dependency (`better-sqlite3` + `sqlite-vec`). | Very low. Single file database (`.ema/index.db`). | **ADOPT (Primary Choice)** |
| **LanceDB** | Rust core with Node/Python bindings. Cross-platform. | 100% local, file-based. | Heavier native binary dependencies. | Low-medium. Columnar storage excellent for large scale. | **Alternative / Layer 2** (if scale exceeds 100k EKUs) |
| **ChromaDB / Milvus** | Requires running Python or Docker container daemon. | Local daemon required. | High dependency overhead (Python runtime, networking). | High operational overhead for a local agent CLI/plugin. | **REJECT** |
| **PostgreSQL + pgvector**| Requires Postgres server setup and maintenance. | Local or remote server. | Heavy external infrastructure. | Unacceptable for standalone developer repos and CLI usage. | **REJECT** |

**Selection:** Embedded **SQLite with `sqlite-vec` and `FTS5`**.
- Zero running daemons.
- Works across POSIX, Linux, WSL, and Windows.
- Pure file-backed database in `.ema/index.db`.
- Easily excluded from Git via `.gitignore`.
- Capable of indexing 10,000 EKUs in under 2 seconds.

### 7.3 Incremental Update & Rebuild Strategy
- **Change Detection:** Compares Git commit SHA and file modification times (`mtime`) against `.ema/meta.json`.
- **Incremental Sync:** When `dsh-plugin` starts or `ema index` runs, only files modified since the last check are re-parsed and re-indexed.
- **Full Rebuild:** `ema index --rebuild` drops `.ema/index.db`, re-reads all Markdown files in `docs/` and AGENTS.md, extracts frontmatter and content, recalculates embeddings, and re-populates the database.
- **Zero Data Loss Guarantee:** If `.ema/index.db` is corrupted or deleted, canonical knowledge remains completely intact in `docs/*.md`.

---

## 8. Scope and Authorization Plan

### 8.1 Scope Definitions & Mapping
1. **Knowledge Scope (Persistence):**
   - `project:<repo-id>`: Local repository knowledge. Stored in repo root `docs/` and `AGENTS.md`. Default scope.
   - `workspace:<abs-path>`: Multi-repo workspace knowledge. Stored in workspace-level `.ema-workspace/` directory or shared central memory directory.
   - `global`: Universal engineering principles. Stored in user-level global configuration `~/.ema/global/` or an explicit dedicated Git repository (`ema-global-knowledge`).
2. **Execution Scope (Ephemeral Context):**
   - `session:<id>`: The active DSH session or CLI process. Ephemeral trace mode only.
   - `task:<id>`: The active agent goal or subtask. Context assembly lives in memory only.

### 8.2 Scope Inheritance & Traversal
When a query executes from a project repository within a workspace:
```text
Task Scope (Execution)
   ↓ (inherits context)
Project Scope (Knowledge: project:repoA) ──[Authorization Check]──► Read Project EKUs
   ↓ (if authorized)
Workspace Scope (Knowledge: workspace:W) ──[Authorization Check]──► Read Workspace EKUs
   ↓ (if authorized)
Global Scope (Knowledge: global)         ──[Authorization Check]──► Read Global EKUs
```
- **Fail-Closed Principle:** If caller authorization fails at any step, the traversal halts for that scope. No results from that scope or wider scopes are returned.

### 8.3 Authorization Evaluation & Enforcement Points
The Policy/Authorization Engine (`src/policy/authorization.mjs`) evaluates access before query execution:
```javascript
function authorize(actor, operation, targetScope, isIsolated) {
  // 1. Hard Isolation Rule: If target is hard-isolated and caller is not within target scope -> DENY
  if (isIsolated && actor.currentScope !== targetScope) {
    return { allowed: false, reason: "HARD_ISOLATION_BOUNDARY", code: 403 };
  }

  // 2. Actor Matrix Check
  const allowedOps = ACTOR_PERMISSIONS[actor.type]?.[targetScope.level];
  if (!allowedOps || !allowedOps.includes(operation)) {
    return { allowed: false, reason: "INSUFFICIENT_PERMISSIONS", code: 403 };
  }

  return { allowed: true };
}
```

---

## 9. Hard-Isolation Plan (`ema_isolation: hard | soft`)

To prevent intellectual property leaks, credential leakage, or contamination between sensitive projects in the same workspace:

```text
Boundary         Soft Isolation Implementation                  Hard Isolation Implementation
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
1. Storage       Shared workspace directory with scope tags.    Physically separate directory or distinct Git repo.
2. Index         Shared SQLite DB, filtered by WHERE scope = ?. Dedicated separate SQLite DB file (e.g., .ema/isolated.db).
3. Query         Excluded by SQL query filter.                  Zero-knowledge: not even probed or loaded into memory.
4. Authorization Scope tag verification.                        Fail-closed barrier: returns empty set + error; no existence probe.
5. Promotion     Standard promotion pipeline allowed.           Forbidden. Automatic promotion blocked; requires admin export.
6. Export        Standard export via tools.                     Pattern scrubbing (keys, secrets, paths) + audit sign-off.
```

### Information Leakage Prevention
- **Counts / Cardinality:** Search queries to workspace/global do not include counts of hard-isolated records.
- **Rankings & Embeddings:** Embeddings of hard-isolated records are never stored in the shared index; impossible to infer similarity.
- **Error Messages:** When an unauthorized query specifies a hard-isolated scope ID, the system returns `ScopeNotFound` rather than `AccessDenied` to prevent existence discovery.

---

## 10. Evidence & Provenance Plan

### 10.1 Stable Evidence Anchor URI Schema
Evidence anchors follow the formal URI format:
```text
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```
- `<repo-id>`: Canonical Git remote URL (e.g. `github.com/org/repo`) or normalized path hash.
- `<git-ref>`: Immutable 40-character commit SHA or annotated release tag (e.g. `9f8a2c1b4d...` or `v1.2.0`). **Mutable branch names (like `main`, `dev`) are explicitly forbidden in canonical evidence anchors** to guarantee immutability.
- `<file-path>`: POSIX path relative to repository root (`src/auth/jwt.ts`).
- `#<logical-anchor>`: One of the supported typed logical anchors:
  - `sym:<identifier>`: Function, class, interface, or variable name.
  - `ast:<path>`: AST node path (e.g., `ast:ClassDeclaration.MethodDefinition[name=verify]`).
  - `sec:<heading>`: Structural Markdown heading (e.g., `sec:Token Verification`).
  - `test:<id>`: Test suite or case name (e.g., `test:should_rotate_keys`).
  - `cfg:<jsonpath>`: Configuration path (e.g., `cfg:auth.rotation_interval_hours`).
  - `pr:<number>`: Pull request reference (e.g., `pr:142`).
  - `issue:<number>`: Issue tracker reference (e.g., `issue:89`).
  - `line:<start>:<end>`: Fallback line range (used only when symbol/ast cannot be resolved).

### 10.2 Staleness & Drift Detection Flow
1. **Trigger:** Git commit, push, or file modification detected by connector or `/ema audit` run.
2. **Anchor Resolution:** The evidence resolver (`src/evidence/staleness.mjs`) reads the current file content at HEAD and checks if the logical anchor is still intact:
   - For `sym:<name>`: Scans AST / ctags / regex for the symbol definition.
   - For `sec:<heading>`: Checks if heading exists in document.
   - For `test:<id>`: Checks test definitions.
3. **Drift Classification:**
   - **Intact:** Anchor points to equivalent code $\rightarrow$ `validation_state: Verified`.
   - **Shifted / Renamed:** Git rename detected or symbol moved $\rightarrow$ Anchor updated, marked `validation_state: Potentially Stale`.
   - **Broken / Deleted:** Anchor target disappeared $\rightarrow$ Marked `validation_state: Potentially Stale` with flag `REASON_EVIDENCE_UNRESOLVED`.
4. **Audit Logging:** Any staleness transition is logged to `docs/CHANGELOG-MEMORY.md`.

---

## 11. Authoritative Retrieval Plan

The retrieval pipeline strictly enforces the approved 6-stage sequence:

```text
Query Request (query, scope, caller_identity, filters)
   │
   ▼
[Stage 1: Authorization Gate (Fail-Closed)]
   ├─ Determine caller's authorized scopes (caller_identity + current_repo)
   ├─ Check hard isolation barriers
   ├─ IF unauthorized: Return empty set with auth error metadata. HALT.
   ▼
[Stage 2: Candidate Retrieval (Authorized Scopes Only)]
   ├─ Parallel Execution:
   │   ├─ BM25 Lexical Search (SQLite FTS5 on authorized partition)
   │   ├─ Vector Similarity Search (sqlite-vec on authorized partition)
   │   └─ Relationship Traversal (related graph edges from seeds)
   ├─ Reciprocal Rank Fusion (RRF) to merge candidate lists
   ▼
[Stage 3: Lifecycle & Maintenance Filtering]
   ├─ Strictly Exclude:
   │   ├─ authority_level == Candidate (NEVER return as authoritative)
   │   ├─ status in [Draft, Superseded, Historical, Abandoned]
   │   └─ validation_state in [Invalid, Quarantined]
   ├─ Allow with Warning Annotation:
   │   ├─ validation_state in [Potentially Stale, Needs Review]
   │   └─ status in [Deprecated, Experimental]
   ├─ Allow Clean:
   │   └─ status == Current AND validation_state == Verified
   ▼
[Stage 4: Multi-Dimensional Authority Ranking]
   ├─ Compute separate dimensional components (NO single opaque score!):
   │   ├─ relevance_score: RRF lexical/vector match [0.0 - 1.0]
   │   ├─ evidence_strength: primary source / tests vs indirect [0.0 - 1.0]
   │   ├─ validation_tier: Verified (1.0) > Needs Review (0.5) > Unreviewed (0.2)
   │   ├─ scope_proximity: Project (1.0) > Workspace (0.8) > Global (0.6)
   │   ├─ freshness_tier: based on last_verified timestamp decay
   │   └─ confidence_score: High (1.0) > Medium (0.6) > Low (0.3)
   ├─ Order results by composite priority vector
   ▼
[Stage 5: Conflict & Contradiction Detection]
   ├─ Inspect `related` fields of candidate set for `contradicts` edges
   ├─ Identify semantic contradictions between retrieved EKUs
   ├─ IF contradiction found:
   │   ├─ Surface BOTH units explicitly
   │   └─ Attach Banner: "[CONTRADICTION: EKU-A contradicts EKU-B — see provenance]"
   │   └─ DO NOT silently suppress either unit!
   ▼
[Stage 6: Context Construction & Provenance Annotation]
   ├─ Apply progressive loading token budget (L0, L1, L2, L3)
   ├─ Format output with provenance headers:
   │   `[Scope: project | Status: current | Validated: 2026-09-21 | Anchor: ema://...]`
   ├─ Output retrieval explainability log (reasons for inclusion)
```

---

## 12. Candidate & Promotion Plan

### 12.1 Candidate Knowledge Pipeline
1. **Creation:** Agents extracting knowledge during tasks call `ema_add` or run `knowledge-compounding`.
2. **Storage:** Stored in `.ema/candidates/` as pending EKU candidate JSON/YAML files (not in canonical `docs/` until validated).
3. **Isolation:** Candidates are never indexed into the canonical vector database and never participate in standard `ema_recall`.

### 12.2 Promotion Workflow & Authority Matrix

```text
Promotion Step        Eligible Actors       Required Evidence                  Target Location
────────────────────────────────────────────────────────────────────────────────────────────────────────
Candidate → Project   Agent or Human        1 source evidence anchor           docs/<domain>/<topic>.md
Project → Workspace   Human Project-Admin   Multi-repo applicability evidence  .ema-workspace/docs/
Workspace → Global    Human Project-Admin   ≥2 independent project anchors     ~/.ema/global/docs/
Any → Quarantine      Agent or Human        Contradiction / conflict evidence  Marked in frontmatter
```

### 12.3 Lineage & Independence Enforcement
- When promoting to `Global`, the promotion engine checks `min_sources_checked`:
  - Must verify that the $\ge 2$ evidence anchors reside in **different repository IDs** (`repo-id`).
  - Prevents double-counting multiple files within the same repository.
- Generates a permanent `promoted_from` block in the frontmatter recording the complete lineage chain and appends an entry to `docs/CHANGELOG-MEMORY.md`.

---

## 13. DSH and MCP Integration Plan

### 13.1 DSH Plugin Integration (`dsh-plugin/`)
The existing `@lovedolove/dsh-project-memory` package will be evolved into `@lovedolove/dsh-engineering-memory`:
1. **Session Start (`session/start`):**
   - Automatically loads L0 context (`AGENTS.md` summary + scope header).
   - Injects static engineering rules (configurable token budget, default 500 tokens).
   - Runs background staleness check; if stale units exist, injects non-blocking notification.
2. **Skill Registration (`ctx.skills.register`):**
   - Registers updated 8 skills in the workspace.
3. **Slash Commands:**
   - Retains `/project-memory` for backward compatibility.
   - Adds `/ema` (`/ema recall`, `/ema status`, `/ema verify`, `/ema promote`).

### 13.2 Standalone MCP Server (`dsh-plugin/bin/ema-mcp.mjs`)
Provides standard JSON-RPC over stdio for external agents (Cursor, Claude Code, OpenCode):

#### MCP Tools Contract:
1. **`ema_recall`**:
   - Inputs: `{ query: string, scope?: string, limit?: number, include_warnings?: boolean }`
   - Output: `{ results: Array<EKUResult>, explainability: object, contradictions: Array<object> }`
2. **`ema_add`**:
   - Inputs: `{ title: string, type: string, content: string, evidence_path: string, confidence?: string }`
   - Output: `{ candidate_id: string, status: "candidate_created" }` (Always creates `Candidate`, never canonical!)
3. **`ema_context`**:
   - Inputs: `{ task_description?: string, token_budget?: number }`
   - Output: `{ context_markdown: string, token_count: number, scope_breakdown: object }`
4. **`ema_validate`**:
   - Inputs: `{ candidate_id: string, decision: "approve"|"reject", rationale: string }`
   - Output: `{ eku_id: string, status: "promoted_to_project"|"rejected" }`
5. **`ema_promote`**:
   - Inputs: `{ eku_path: string, target_scope: "workspace"|"global", rationale: string, independent_evidence?: string[] }`
   - Output: `{ success: boolean, new_scope: string, audit_ref: string }`

#### MCP Resources:
- `ema://project/memory`: Live stream of project-level EKUs.
- `ema://workspace/memory`: Workspace-level shared EKUs.
- `ema://global/memory`: Global engineering rules.
- `ema://scope`: Current actor scope and isolation status.

---

## 14. Non-Destructive Migration Plan

### 14.1 Principles
- **Zero Loss of Knowledge:** No file in `docs/` is deleted or overwritten without Git history.
- **Incremental & Reversible:** Legacy frontmatter remains readable by legacy tooling; new fields are added non-destructively.

### 14.2 Migration Phases for Knowledge Units
1. **Phase A: Frontmatter Transformation Tooling (`bin/ema-migrate.mjs`):**
   - Automatically reads existing `docs/**/*.md` files.
   - Maps legacy `status` to new 4-D model:
     - `status: current` $\rightarrow$ `status: current`, `validation_state: verified`, `authority_level: canonical`.
     - `status: in_progress` $\rightarrow$ `status: current`, `validation_state: needs_review`, `authority_level: canonical`.
     - `status: deprecated` $\rightarrow$ `status: deprecated`, `validation_state: verified`, `authority_level: canonical`.
     - `status: superseded` $\rightarrow$ `status: superseded`, `validation_state: verified`, `authority_level: canonical`.
     - `status: historical` $\rightarrow$ `status: historical`, `validation_state: verified`, `authority_level: canonical`.
   - Maps legacy `scope` (`project | domain | component`) to `scope: project`, moving fine-grained labels to `tags`.
   - Converts legacy evidence `src/file.ts:42` to placeholder anchor `ema://evidence/local/HEAD/src/file.ts#line:42:42`.
2. **Phase B: Dry-Run & Audit Log:**
   - Generates diffs for developer review.
   - Appends migration record to `docs/CHANGELOG-MEMORY.md`.
3. **Phase C: Verification:**
   - Runs `memory-verification` to validate all links and schemas.

---

## 15. Backward-Compatibility Plan

| Capability | Legacy PMA Behavior | EMA Compatibility Strategy |
|---|---|---|
| **Frontmatter Parsing** | Expects single `status` string. | Schema parser accepts both legacy `status` and new 4-D fields. If 4-D fields are absent, derives defaults dynamically. |
| **Skill Invocation** | `@project-memory` and `/project-memory`. | Fully preserved. `/project-memory` routes to the updated workflow transparently. |
| **Evidence Format** | Plain path strings in `evidence`. | Parser normalizes plain strings to `ema://` URIs internally; both formats supported in read mode. |
| **Relationships** | Untyped string paths or 8 typed links. | Untyped strings remain valid for loose associations; existing 8 typed links work identically, 4 new types added. |
| **DSH Plugin Name** | `@lovedolove/dsh-project-memory`. | Retain package name or provide seamless alias/re-export to prevent breaking user DSH configurations. |

---

## 16. Testing, Security, and Invariant Strategy

### 16.1 Test Suite Structure
```text
dsh-plugin/test/
├── unit/
│   ├── eku-schema.test.mjs            # Schema validation & invalid state combinations
│   ├── lifecycle-transitions.test.mjs # 4-D state machine transitions
│   ├── evidence-anchors.test.mjs      # URI parsing, AST/symbol resolution, hash stability
│   ├── policy-authorization.test.mjs  # Fail-closed actor permission matrix
│   └── ranking-dimensions.test.mjs    # Multi-dimensional ranking calculations
├── integration/
│   ├── git-staleness.test.mjs         # Git commit modification triggers Potentially Stale
│   ├── derived-index.test.mjs         # SQLite-vec indexing, FTS5 lexical matching, rebuild
│   ├── retrieval-pipeline.test.mjs    # Full 6-stage retrieval with mock DB
│   ├── candidate-promotion.test.mjs   # Candidate -> Project -> Workspace -> Global flow
│   ├── mcp-server.test.mjs            # JSON-RPC protocol round-trip over stdio
│   └── dsh-plugin-hooks.test.mjs      # Cordis event listeners & context injection
└── security/
    ├── hard-isolation.test.mjs        # Proves 0 results returned across hard boundaries
    ├── authorization-bypass.test.mjs  # Proves unauthorized queries fail closed
    ├── leakage-embeddings.test.mjs    # Proves no vector leakage of isolated knowledge
    └── contradiction-surface.test.mjs # Proves conflicting knowledge is never hidden
```

### 16.2 Invariant Verification Tests
Every core architectural invariant will have an explicit automated test asserting its guarantee:
1. `test('Invariant: Retrieval != Truth')`: Verifies unvalidated search results never become canonical.
2. `test('Invariant: Embedding != Authority')`: Verifies high vector similarity cannot elevate candidate to canonical.
3. `test('Invariant: Historical != Deleted')`: Verifies superseded/historical records remain readable and preserved in history.
4. `test('Invariant: Newest != Correct')`: Verifies newer timestamp does not override verified canonical record with stronger evidence.
5. `test('Invariant: Derived Failure != Data Loss')`: Verifies deleting `.ema/index.db` leaves 100% of canonical Markdown intact.

---

## 17. Performance and Token Budget Planning

| Dimension | Baseline / Target | Measurement Method | Benchmark Gate |
|---|---|---|---|
| **Retrieval Latency** | $< 50\text{ ms}$ (hybrid search across 5,000 EKUs) | Benchmark harness measuring SQLite FTS5 + vec query execution. | Phase 3 Gate |
| **Startup Context Injection** | $\le 500\text{ tokens}$ (default static context) | Tokenizer count in `dsh-plugin/plugin.mjs` on session start. | Phase 5 Gate |
| **Progressive L0 Token Cost**| $< 200\text{ tokens}$ (`AGENTS.md` L0 summary table) | Tokenizer count of root `AGENTS.md`. | Phase 1 Gate |
| **Initial Indexing Time** | $< 10\text{ ms / EKU}$ ($< 5\text{ s}$ for 500 documents) | Wall-clock time of `ema index --rebuild`. | Phase 3 Gate |
| **Incremental Indexing** | $< 100\text{ ms}$ on single-file change | Wall-clock time on Git hook / file watcher event. | Phase 3 Gate |
| **Database Storage Footprint**| $< 2\text{ MB}$ per 1,000 EKUs (SQLite DB) | File size of `.ema/index.db`. | Phase 3 Gate |

---

## 18. Failure, Recovery, and Observability Plan

### 18.1 Failure Modes & Degradation Paths
- **Git Binary / History Unavailable:** Falls back to read-only canonical Markdown mode using file modification times. Emits warning `GIT_METADATA_UNAVAILABLE`.
- **Derived Index Corrupted / Missing:** Automatically falls back to lexical keyword scanning across Markdown files. Triggers background asynchronous re-indexing (`ema index --rebuild`).
- **Embedding Generation Failure (Offline/No Model):** Degrades gracefully to pure BM25 lexical search (FTS5). Retains full authorization, lifecycle filtering, and provenance.
- **Evidence Anchor Target Missing:** Marks affected EKU as `validation_state: Potentially Stale` with reason `ANCHOR_TARGET_NOT_FOUND`. Never deletes the EKU.
- **Authorization Engine Error:** Always fails closed (returns 0 results, logs audit warning).

### 18.2 Observability & Audit Log Triad
1. **Operational Logs (Ephemeral):** Console logs in DSH plugin / MCP stderr for debugging and performance profiling.
2. **Audit Records (Durable Append-Only):** `docs/CHANGELOG-MEMORY.md` records all promotions, demotions, quarantines, migrations, and schema upgrades.
3. **Retrieval Traces (Session-Ephemeral):** Printed when running `/project-memory --trace` or `/ema recall --trace`; never persisted to Git.

---

## 19. Dependency Graph Across Development Phases

```text
Phase 1: Core EKU Domain Model & Schema v2
   │
   ▼
Phase 2: Stable Evidence Anchor Subsystem ────────┐
   │                                              │
   ▼                                              ▼
Phase 3: Derived SQLite-vec Index Subsystem    Phase 4: Policy & Authorization Engine
   │                                              │
   └──────────────────────┬───────────────────────┘
                          ▼
Phase 5: Authoritative 6-Stage Retrieval Engine
   │
   ▼
Phase 6: Candidate Queue & Promotion Pipeline
   │
   ▼
Phase 7: DSH Plugin & Skill Evolution
   │
   ▼
Phase 8: Standalone MCP Server & CLI Tooling
   │
   ▼
Phase 9: Migration, Multi-Project Validation & Rollout
```

---

## 20. Concrete Development Phases

### Phase 1: Core EKU Domain Model & Schema v2
- **Objective:** Establish the foundational TypeScript/ESM domain models, frontmatter parser, and 4-D lifecycle validator.
- **Prerequisites:** Architecture Approval ✅.
- **Scope:**
  - Create `dsh-plugin/src/core/constants.mjs`, `schema.mjs`, `eku.mjs`.
  - Update `templates/schema.yaml` and `templates/TEMPLATE.md`.
- **Interfaces Introduced:** `parseEKU(markdownString)`, `validateEKU(ekuObject)`, `serializeEKU(ekuObject)`.
- **Tests:** `dsh-plugin/test/unit/eku-schema.test.mjs`.
- **Exit Criteria:** 100% test pass on valid/invalid 4-D state combinations and schema validation.
- **Rollback Strategy:** Revert files via Git; no runtime impact.

### Phase 2: Stable Evidence Anchor Subsystem
- **Objective:** Implement URI/URN evidence anchor parsing, Git commit resolution, and AST/symbol staleness checking.
- **Prerequisites:** Phase 1 complete.
- **Scope:**
  - Create `dsh-plugin/src/evidence/anchor.mjs`, `git-resolver.mjs`, `staleness.mjs`.
  - Update `skills/repository-audit` instructions to output `ema://` URIs.
- **Interfaces Introduced:** `parseAnchor(uri)`, `formatAnchor(object)`, `resolveAnchor(anchor, repoPath)`, `checkStaleness(anchorList)`.
- **Tests:** `dsh-plugin/test/unit/evidence-anchors.test.mjs`, `dsh-plugin/test/integration/git-staleness.test.mjs`.
- **Exit Criteria:** Stable anchor resolution on Git commits, symbol moves, and file renames.
- **Rollback Strategy:** Revert files via Git.

### Phase 3: Derived Storage & SQLite-vec Index Subsystem
- **Objective:** Implement the derived SQLite database with FTS5 lexical indexing and `sqlite-vec` vector similarity search.
- **Prerequisites:** Phase 1 complete.
- **Scope:**
  - Create `dsh-plugin/src/index/db.mjs`, `lexical-index.mjs`, `vector-index.mjs`, `rebuild.mjs`.
  - Add `better-sqlite3` and `sqlite-vec` dependencies to `dsh-plugin/package.json`.
- **Interfaces Introduced:** `initIndex(dbPath)`, `indexEKU(eku)`, `searchLexical(query, scope)`, `searchVector(vector, scope)`, `rebuildIndex(docsPath)`.
- **Tests:** `dsh-plugin/test/integration/derived-index.test.mjs`.
- **Exit Criteria:** Index rebuild completes in $< 5\text{ s}$ for 500 documents; index failure does not damage markdown.
- **Rollback Strategy:** Delete `.ema/index.db`, uninstall npm dependencies.

### Phase 4: Policy & Authorization Engine (Fail-Closed)
- **Objective:** Implement the 4-actor authorization engine, scope inheritance traversal, and 6-boundary hard isolation.
- **Prerequisites:** Phase 1 complete.
- **Scope:**
  - Create `dsh-plugin/src/policy/authorization.mjs`, `isolation.mjs`.
- **Interfaces Introduced:** `evaluateAccess(actor, operation, scope, isIsolated)`, `getAuthorizedScopes(actor, context)`.
- **Tests:** `dsh-plugin/test/unit/policy-authorization.test.mjs`, `dsh-plugin/test/security/hard-isolation.test.mjs`.
- **Exit Criteria:** Security tests prove zero cross-scope info leakage across hard isolation boundaries.
- **Rollback Strategy:** Revert policy modules.

### Phase 5: Authoritative 6-Stage Retrieval Engine
- **Objective:** Connect authorization, candidate retrieval, lifecycle filtering, multi-dimensional ranking, contradiction detection, and context assembly.
- **Prerequisites:** Phases 2, 3, 4 complete.
- **Scope:**
  - Create `dsh-plugin/src/retrieval/pipeline.mjs`, `ranking.mjs`, `contradiction.mjs`, `context-builder.mjs`.
- **Interfaces Introduced:** `emaRecall(query, options)`, `buildContext(options)`.
- **Tests:** `dsh-plugin/test/integration/retrieval-pipeline.test.mjs`, `dsh-plugin/test/security/contradiction-surface.test.mjs`.
- **Exit Criteria:** Multi-dimensional score returned; contradictions surfaced explicitly; Candidate records excluded.
- **Rollback Strategy:** Revert retrieval modules.

### Phase 6: Candidate Queue & Promotion Pipeline
- **Objective:** Implement candidate extraction queue, validation gate, promotion decision logging, and quarantine coordinator.
- **Prerequisites:** Phases 1, 4, 5 complete.
- **Scope:**
  - Create `dsh-plugin/src/storage/candidate-store.mjs`, `dsh-plugin/src/promotion/pipeline.mjs`, `lineage.mjs`.
  - Update `skills/knowledge-compounding`, `skills/memory-edit`, `skills/obsolete-knowledge`.
- **Interfaces Introduced:** `createCandidate(data)`, `validateCandidate(id, decision)`, `promoteScope(id, targetScope, rationale)`.
- **Tests:** `dsh-plugin/test/integration/candidate-promotion.test.mjs`.
- **Exit Criteria:** Promotion requires explicit decision and evidence; $\ge 2$ independent sources enforced for Global.
- **Rollback Strategy:** Revert promotion modules and skill updates.

### Phase 7: DSH Plugin & Skill Evolution
- **Objective:** Update DSH plugin hooks, slash commands, context injection, and agent routing for EMA.
- **Prerequisites:** Phases 5, 6 complete.
- **Scope:**
  - Update `dsh-plugin/dsh/plugin.mjs`, `slash-project-memory.mjs`.
  - Update `agents/project-memory.md` routing table and instructions.
- **Interfaces Introduced:** `/ema` slash command, dynamic static-context injection.
- **Tests:** `dsh-plugin/test/integration/dsh-plugin-hooks.test.mjs`.
- **Exit Criteria:** Context injection stays under 500 tokens; `/project-memory` and `/ema` work seamlessly.
- **Rollback Strategy:** Revert plugin modifications to v0.4.31 baseline.

### Phase 8: Standalone MCP Server & CLI Tooling
- **Objective:** Build stdio MCP server (`ema_recall`, `ema_add`, etc.) and maintenance CLI (`ema index`, `ema verify`).
- **Prerequisites:** Phases 5, 6 complete.
- **Scope:**
  - Create `dsh-plugin/src/mcp/server.mjs`, `tools.mjs`, `dsh-plugin/bin/ema-mcp.mjs`, `bin/ema-cli.mjs`.
- **Interfaces Introduced:** MCP tools (`ema_recall`, `ema_add`, `ema_context`, `ema_validate`, `ema_promote`).
- **Tests:** `dsh-plugin/test/integration/mcp-server.test.mjs`.
- **Exit Criteria:** Passes official MCP inspector validation; completes tool calls over stdio JSON-RPC.
- **Rollback Strategy:** Remove bin scripts.

### Phase 9: Migration, Multi-Project Validation & Rollout
- **Objective:** Migrate existing repository knowledge docs, run full verification gate, validate multi-project workspace behavior.
- **Prerequisites:** Phases 1-8 complete.
- **Scope:**
  - Run migration script on PMA's own `docs/`.
  - Update `AGENTS.md` and `docs/CHANGELOG-MEMORY.md`.
  - Perform multi-project workspace isolation test across two repos.
- **Tests:** Full test suite regression + `memory-verification` run.
- **Exit Criteria:** All docs pass verification gate; zero warnings on schema; changelog updated.
- **Rollback Strategy:** Git revert of migrated documentation files.

---

## 21. Rollout and Rollback Plan

### 21.1 Staged Rollout Strategy
1. **Stage 1 (Internal Alpha in PMA Repo):** Run the new core schema and SQLite derived index locally within this repository. Validate with `memory-verification`.
2. **Stage 2 (DSH Plugin Dual Mode):** Publish `@lovedolove/dsh-project-memory` v0.5.0 with backward-compatible PMA fallbacks. DSH users can opt into EMA features via `/ema`.
3. **Stage 3 (MCP Standalone Availability):** Distribute `ema-mcp` executable for Cursor and Claude Code users.
4. **Stage 4 (Workspace & Global Promotion Activation):** Enable multi-repo workspace linking and global knowledge sharing with human sign-off.

### 21.2 Rollback Plan
- **Per-Phase Rollback:** Every phase is isolated to specific modules and backed by Git.
- **Canonical Storage Protection:** Because canonical storage remains standard Markdown files in `docs/`, rolling back code never locks or corrupts knowledge.
- **Derived Index Reset:** If SQLite-vec encounters platform incompatibilities, deleting `.ema/` immediately returns the system to zero-dependency file-scanning mode.

---

## 22. Risks and Mitigations

| Risk | Severity | Probability | Mitigation Strategy |
|---|---|---|---|
| **Native Binary Issues (SQLite-vec on Windows/WSL)** | High | Medium | Provide pure FTS5 lexical fallback if native `sqlite-vec` binary fails to load on a specific platform architecture. |
| **Token Context Bloat** | Medium | High | Enforce strict hard token budgets (500 tokens default) for injected static context; use progressive L0-L3 loading. |
| **Git Anchor Invalidation from History Rewrites** | Medium | Low | If a commit SHA disappears after a squash/rebase, the anchor resolver flags the EKU as `Potentially Stale` for human review rather than crashing. |
| **Performance Overhead on Large Workspaces** | Medium | Medium | Run derived index updates asynchronously in background; query execution uses indexed FTS5/Vec tables with pagination. |
| **Silent Contradiction Resolution** | High | Low | Stage 5 of retrieval pipeline explicitly detects `contradicts` edges and surfaces both units with an unmissable warning banner. |

---

## 23. Open Non-Blocking Questions (For Implementation Phasing)

These questions do **not** block development planning and will be finalized during their respective phases:
1. **Cross-Repo Workspace Storage Path (Phase 6):** Default to `<workspace-root>/.ema-workspace/docs/` for multi-repo workspace storage, with optional config override in DSH.
2. **Embedding Model Selection (Phase 3):** Start with lightweight local `bge-small-en-v1.5` or `all-MiniLM-L6-v2` via ONNX runtime / fastembed-js, with zero external API calls.
3. **Candidate Queue Storage Format (Phase 6):** Store in `.ema/candidates/*.json` (local, fast, git-ignored) with export capability to Git if auditability is required before validation.

---

## 24. Development Planning Gate (28/28 Verified)

```text
[✓] Repository current state inspected (source, tests, CI, config, git history)
[✓] Approved architecture mapped to implementation
[✓] Repository/documentation discrepancies identified & classified
[✓] Reuse/Extend/Refactor/Replace/New/Defer decisions documented
[✓] Domain/schema changes defined (EKU Schema v2 with 4 orthogonal dimensions)
[✓] Canonical storage defined (Git-native Markdown + YAML frontmatter)
[✓] Derived index boundaries defined (SQLite + FTS5 + sqlite-vec in .ema/)
[✓] Knowledge/execution scopes defined separately (Project/Workspace/Global vs Session/Task)
[✓] Authorization enforcement points defined (fail-closed, pre-retrieval)
[✓] Hard isolation defined across all six boundaries (Storage, Index, Query, Auth, Promotion, Export)
[✓] Lifecycle implementation defined (Draft, Current, Deprecated, Superseded, Historical, Abandoned)
[✓] Validation implementation defined (Unreviewed, Needs Review, Potentially Stale, Verified, Invalid, Quarantined)
[✓] Authority/confidence separation preserved (Candidate, Derived, Canonical vs High, Medium, Low)
[✓] Evidence-anchor implementation defined (ema://evidence/<repo>/<sha>/<path>#<anchor>)
[✓] Staleness/revalidation defined (source-change triggers Potentially Stale)
[✓] Candidate pipeline defined (creation, isolation from search, human/agent validation)
[✓] Promotion/demotion/quarantine defined (authority matrix, >=2 sources for Global)
[✓] Retrieval implementation defined (6-stage pipeline, multi-dimensional ranking)
[✓] Contradiction handling defined (surface both, never silently resolve)
[✓] Provenance/explainability defined (retrieval log + frontmatter lineage)
[✓] DSH ownership boundary defined (session, task, tools, skills, runtime context)
[✓] MCP contracts defined (ema_recall, ema_add, ema_context, ema_validate, ema_promote)
[✓] Migration strategy defined (non-destructive, automated tooling, auditable)
[✓] Backward compatibility defined (PMA skills, legacy frontmatter, /project-memory)
[✓] Unit/integration/security testing defined
[✓] PMA/EMA invariants tested
[✓] Performance/token benchmarks defined
[✓] Failure/recovery behavior defined (fail-closed auth, graceful index degradation)
[✓] Observability/audit defined (CHANGELOG-MEMORY.md + operational logs)
[✓] Dependency-aware phases defined (9 structured phases from core schema to rollout)
[✓] Rollback strategy defined
[✓] Phase exit criteria defined
[✓] No runtime implementation performed (documentation-only plan)
[✓] No architectural redesign performed (approved architecture treated as constraint)
[✓] No unresolved blocking development-planning decision remains
```

---

## 25. Final Status & Recommendation

```text
Status: COMPLETE
Architecture: APPROVED
Development Plan: COMPLETE & VERIFIED
Implementation: NOT STARTED
```

**Next Workflow Gate:**
```text
Research Gate ✓
  → Architecture Discovery ✓
  → Architecture Review ✓
  → Architecture Revision ✓
  → Architecture Approval Candidate ✓
  → Architecture Approval ✓
  → Development Planning ✓ (CURRENT DELIVERABLE)
  → Implementation Planning Review (NEXT GATE)
  → Implementation (NOT STARTED)
```

**Recommendation:**
Submit `docs/research/ema/development-plan.md` to **Implementation Planning Review**. Do not start runtime coding or dependency installations until this implementation plan is formally approved.
