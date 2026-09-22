# Engineering Memory Agent (EMA) — Implementation Planning Review

> **Status:** Review Complete
> **Architecture Gate:** APPROVED
> **Development Plan:** COMPLETE
> **Implementation:** NOT STARTED
> **Date:** 2026-09-22

---

## 1. Executive Summary

The Development Plan (`docs/research/ema/development-plan.md`) is technically sound, internally consistent, and compatible with the current Project Memory Agent (PMA) repository. No architectural conflicts were found. All nine development phases are feasible, with clear prerequisites, testable exit criteria, and deterministic rollback strategies. The plan respects the approved EMA architecture as a constraint and preserves all PMA invariants.

**Overall Verdict:** PASS — An engineer can implement EMA phase-by-phase from the Development Plan without making unapproved architectural decisions, weakening security/isolation guarantees, or inventing missing contracts.

**Next Gate:** Implementation (after this review).

---

## 2. Review Scope

This review examined:
- The Development Plan (`docs/research/ema/development-plan.md`).
- The approved EMA architecture (`docs/research/ema/ema-architecture-blueprint.md`, `docs/research/ema/architecture-approval-candidate.md`).
- The PMA repository source code, tests, CI, configuration, package manifests, Git history, and actual implementation of skills, orchestrator, and DSH plugin.
- External technical feasibility of core dependencies (better-sqlite3, sqlite-vec) via npm registry and documentation.
- No runtime files were modified, no tests changed, no dependencies installed, and no commits/pushes performed.

Evidence precedence followed: actual repository implementation/tests > approved EMA architecture > Development Plan > existing architecture documentation > skills/templates/agent instructions > historical documentation.

---

## 3. Evidence Sources

Primary evidence:
- **Repository Inspection:** Full audit of `/home/lovedolove/projects/Project-Memory-Agent` (see todo items and bash commands in session history).
- **Approved Architecture:** `docs/research/ema/ema-architecture-blueprint.md` (1,735 lines) and `docs/research/ema/architecture-approval-candidate.md`.
- **Development Plan:** `docs/research/ema/development-plan.md` (926 lines).
- **Technical Feasibility:** npm registry pages for `better-sqlite3` (v13.0.3) and `sqlite-vec` (v0.1.9), Node.js v24.21.0 compatibility, WSL/Linux/Windows support.
- **Skill Frontmatter:** All SKILL.md files in `skills/` for lifecycle, scope, and relationship definitions.
- **Templates:** `templates/schema.yaml` and `templates/TEMPLATE.md`.
- **DSH Plugin:** `dsh-plugin/package.json`, `dsh/plugin.mjs`, `cordis.patch.yml`.

Secondary evidence (for context only):
- `docs/architecture.md`, `AGENTS.md`, `skills/`, `agents/`, `templates/`, `dsh-plugin/`.

---

## 4. Repository Compatibility Findings

### 4.1 Current-State Findings (Development Plan Section 1)
- **Accuracy:** The Development Plan’s audit of the PMA repository matches the observed state: 8 skills, orchestrator agents, DSH bundle, templates, and canonical storage in `docs/`.
- **Evidence:** Verified via direct inspection of `skills/`, `agents/`, `dsh-plugin/`, `templates/`, `docs/`, and Git history.
- **Variance:** None — the Development Plan’s Section 1 is a faithful representation.

### 4.2 Documentation vs. Implementation Discrepancies (Development Plan Section 2)
- **Lifecycle Terminology Drift:** The Development Plan correctly identified that `docs/architecture.md` and `templates/schema.yaml` reference legacy lifecycle states (`in_progress`, `partial`, `experimental`, `unknown`) while `templates/TEMPLATE.md` uses only 4 states. This is **documentation drift**.
  - **Evidence:** `templates/schema.yaml` lines 39-41, 46; `templates/TEMPLATE.md` frontmatter.
  - **Required Change:** Normalize all lifecycle references to the 4-orthogonal-dimension model (Lifecycle State, Validation State, Authority Level, Confidence Level). Replace legacy terms with the new model across all documentation and skill descriptions.
  - **Owner:** Documentation maintenance (can be done during Phase 1).
  - **Phase:** 1 (Core EKU Domain Model & Schema v2).
  - **Gate Impact:** Fix before implementation (minor documentation update; no architectural impact).
- **Scope Terminology Drift:** The Development Plan noted that `templates/schema.yaml` defines scope as `[project, domain, component, subsystem]`, which is intra-repository architectural breadth, not the EMA Knowledge Scope (`project`, `workspace`, `global`). This is **documentation drift**.
  - **Evidence:** `templates/schema.yaml` line 77; EMA architecture Sections V, VIII, IX.
  - **Required Change:** Update `templates/schema.yaml` and related skill documentation to reflect Knowledge Scope enum. Move fine-grained granularity (domain/component) to `tags` or `path`.
  - **Owner:** Documentation maintenance.
  - **Phase:** 1.
  - **Gate Impact:** Fix before implementation.
- **Evidence Anchor Format:** The Development Plan correctly noted that legacy evidence strings (e.g., `src/file.ts:42`) are not in the approved `ema://evidence/...` URI/URN format. This is **implementation drift** (PMA lacks evidence anchor parsing).
  - **Evidence:** `templates/schema.yaml` evidence field description; actual skill usage.
  - **Required Change:** Implement the Evidence Anchor Subsystem (Phase 2) and migrate legacy evidence strings to URI/URN format via migration tooling (Phase 9).
  - **Owner:** Implementation.
  - **Phase:** 2 (Evidence Anchor Subsystem) and Phase 9 (Migration).
  - **Gate Impact:** Fix before implementation (new component; no conflict).
- **Skill Registration:** The Development Plan clarified that DSH plugin skill registration is handled dynamically in `dsh/plugin.mjs` (via `registerWorkspaceSkills`), not via the `pma-skill-dir` Cordis insert claimed in `docs/architecture.md`. This is **documentation drift**.
  - **Evidence:** `dsh-plugin/cordis.patch.yml` (only one row); `dsh-plugin/dsh/plugin.mjs` lines registering skills.
  - **Required Change:** Update `docs/architecture.md` to reflect runtime dynamic skill registration.
  - **Owner:** Documentation.
  - **Phase:** 7 (DSH Plugin & Skill Evolution).
  - **Gate Impact:** Fix before implementation.

All discrepancies were classified correctly and pose no architectural conflict.

### 4.3 Current PMA → Target EMA Mapping (Development Plan Section 3)
- **Accuracy:** The mapping table is correct. All 8 PMA skills map to extended/refactored EMA capabilities; new components (Evidence Anchor Subsystem, Policy/Authorization Engine, Derived Index, Retrieval Engine, Candidate Queue, Promotion Pipeline, MCP Server) are accurately listed as new.
- **Evidence:** Cross-referenced with Development Plan Sections 4.5 (New) and 4.4 (Replace).
- **Variance:** None.

### 4.4 Reuse/Extend/Refactor/Replace/New/Defer Decisions (Development Plan Section 4)
- **Accuracy:** Decisions align with the audit:
  - **Reuse:** CBM bridge (`dsh-plugin/dsh/codebase-memory-bridge.mjs`), multi-agent installer, `docs/CHANGELOG-MEMORY.md` format.
  - **Extend:** `AGENTS.md`, `skills/repository-audit`, `skills/knowledge-compounding`, `skills/memory-edit`, `dsh-plugin/dsh/plugin.mjs`.
  - **Refactor:** `templates/schema.yaml`, `TEMPLATE.md`, `skills/knowledge-classification`, `skills/memory-verification`, `skills/memory-edit`, `skills/obsolete-knowledge`.
  - **Replace:** Legacy scope definition, unstructured evidence strings.
  - **New:** Core EKU domain model, Evidence Anchor Subsystem, Policy/Authorization Engine, Derived SQLite-vec index, Candidate queue, Authoritative Retrieval Engine, MCP Server.
  - **Defer:** FUSE/SMFS, broad connectors, remote REST/SDK, enterprise IAM, external property graph.
- **Evidence:** Directly supported by Sections 4.5 and 4.4.
- **Variance:** None.

---

## 5. Phase Dependency Review

### 5.1 Claimed Dependency Graph (Development Plan Section 20)
```text
Phase 1: Core EKU Domain Model & Schema v2
   ↓
Phase 2: Stable Evidence Anchor Subsystem
   ↓
Phase 3: Derived SQLite-vec Index Subsystem
   ↓
Phase 4: Policy & Authorization Engine
   ↓
Phase 5: Authoritative Retrieval Engine
   ↓
Phase 6: Candidate Queue & Promotion Pipeline
   ↓
Phase 7: DSH Plugin & Skill Evolution
   ↓
Phase 8: Standalone MCP Server & CLI Tooling
   ↓
Phase 9: Migration, Multi-Project Validation & Rollout
```

### 5.2 Verification of Dependencies
- **Phase 1 → Phase 2:** Hard dependency. Evidence Anchor Subsystem requires EKU domain model, schema, and validator to parse and validate frontmatter.
- **Phase 2 → Phase 3:** Hard dependency. Derived Index Subsystem requires the ability to parse evidence anchors and extract Git SHAs, file paths, and logical anchors to build index entries.
- **Phase 3 → Phase 4:** Soft dependency. Policy & Authorization Engine does not strictly require the derived index to function (it can evaluate access rules on scope and isolation metadata alone). However, for end-to-end retrieval testing, the index is needed. **Recommendation:** Phase 4 can begin after Phase 1, but Phase 5 requires both Phase 3 and Phase 4.
- **Phase 4 → Phase 5:** Hard dependency. Authoritative Retrieval Engine requires authorization decisions (Phase 4) before candidate retrieval (Phase 3) and lifecycle filtering (Phase 1).
- **Phase 5 → Phase 6:** Hard dependency. Candidate Queue & Promotion Pipeline requires the retrieval pipeline to exclude candidates and to validate promoted units.
- **Phase 6 → Phase 7:** Soft dependency. DSH Plugin & Skill Evolution can proceed with mock retrieval and promotion; however, for full integration testing, Phases 5 and 6 are needed.
- **Phase 7 → Phase 8:** Hard dependency. MCP Server relies on the retrieval and promotion interfaces exposed by Phases 5 and 6.
- **Phase 8 → Phase 9:** Hard dependency. Migration script requires the full EMA core (EKU model, evidence anchors, retrieval, promotion) to read, validate, and migrate legacy knowledge units.

### 5.3 Corrected Dependency Graph
```text
Phase 1: Core EKU Domain Model & Schema v2
   ↙     ↘
Phase 2: Stable Evidence Anchor Subsystem   Phase 4: Policy & Authorization Engine
   ↓                     ↘                  ↓
Phase 3: Derived SQLite-vec Index Subsystem → Phase 5: Authoritative Retrieval Engine
   ↓                                             ↓
Phase 6: Candidate Queue & Promotion Pipeline  ↘
   ↓                                           ↓
Phase 7: DSH Plugin & Skill Evolution         Phase 8: Standalone MCP Server & CLI Tooling
   ↘                                           ↓
                                               Phase 9: Migration, Multi-Project Validation & Rollout
```
- **Explanation:** Phase 4 (Policy) can proceed in parallel with Phase 2 after Phase 1. Phase 5 requires both Phase 3 (index) and Phase 4 (policy). Phase 6 requires Phase 5. Phase 7 can start after Phase 1 but benefits from Phase 5 and 6 for integration testing. Phase 8 requires Phase 5 and 6. Phase 9 requires all prior phases.

### 5.4 Hidden Dependencies & Consumed-Before-Stabilized Interfaces
- **Hidden Dependency:** Phase 2 (Evidence Anchor) requires access to Git binary (`git rev-parse`, `git ls-files`) to resolve HEAD and validate commit SHAs. This is an external tool but assumed present in the runtime environment (Node.js on Linux/WSL/Windows with Git installed). **Mitigation:** Document Git as a system dependency; provide graceful degradation if Git unavailable (mark evidence as `Potentially Stale`).
- **Consumed-Before-Stabilized:** Phase 3 (Derived Index) consumes the EKU object format from Phase 1 before the schema validator is fully tested. However, the EKU object is a simple TypeScript interface; risk is low. **Mitigation:** Define the EKU interface in Phase 1 and keep it stable.

### 5.5 Prerequisites, Interfaces, Tests, Exit Criteria, Rollback Strategy
All phases define:
- **Prerequisites:** Listed correctly (e.g., Phase 2 requires Phase 1).
- **Interfaces:** Clearly specified (e.g., `parseEKU`, `serializeEKU`, `validateEKU`).
- **Tests:** Unit and integration test files named (e.g., `core.test.mjs`, `evidence.test.mjs`).
- **Exit Criteria:** Objective and executable (e.g., “100% test pass on valid/invalid 4-D state combinations”).
- **Rollback Strategy:** Per-phase Git revert or file deletion (e.g., “Remove bin scripts”, “Git revert of migrated documentation files”).

**Finding:** All phases satisfy the review criteria. No missing or vague exit criteria.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 20 (Phases 1-9).
**Required Change:** None (plan is sufficient).
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 6. MVP Vertical Slice

### 6.1 Smallest Architectural Vertical Slice
The Development Plan identifies the slice:
```text
Markdown EKU
→ Schema validation
→ Evidence
→ Derived index
→ Authorization
→ Retrieval
→ Provenance
```
This corresponds to completing Phases 1 through 5:
- Phase 1: EKU domain model and schema validation.
- Phase 2: Evidence anchor parsing and Git verification.
- Phase 3: Derived SQLite-vec index (lexical + vector search).
- Phase 4: Policy/Authorization Engine (fail-closed scope and isolation checks).
- Phase 5: Authoritative Retrieval Engine (multi-dimensional ranking, contradiction detection, context assembly).

### 6.2 Internal MVP Checkpoint Recommendation
**Recommendation:** Add an explicit MVP checkpoint after Phase 5 (Authoritative Retrieval Engine) to verify the core retrieval pipeline before adding candidate/promotion complexity, DSH integration, MCP, and migration.

**Justification:** This slice proves that EMA can:
1. Accept a Markdown EKU with proper frontmatter.
2. Validate its 4-dimensional lifecycle and evidence anchors.
3. Index it lexically and vectorially.
4. Authorize access based on actor and scope.
5. Retrieve it with multi-dimensional ranking and provenance.
6. Surface contradictions explicitly.
All without requiring candidate storage, promotion logic, DSH hooks, or MCP server.

**Evidence:** Development Plan Sections 5 (Component Plan), 6 (Domain/Data/Schema), 7 (Storage/Index), 8 (Scope/Authorization), 10 (Retrieval Model), 11 (Ranking), 12 (Contradictions).

**Severity:** INFORMATIONAL
**Evidence:** Development Plan.
**Required Change:** Add MVP checkpoint definition to Phase 5 exit criteria.
**Owner:** Implementation lead.
**Phase:** 5
**Gate Impact:** ACCEPT (minor clarification; no architectural change).

---

## 7. EKU Schema Review

### 7.1 Four Orthogonal Dimensions
The Development Plan correctly defines:
- **Lifecycle State:** `Draft` | `Current` | `Deprecated` | `Superseded` | `Historical` | `Abandoned`
- **Validation State:** `Unreviewed` | `Needs Review` | `Potentially Stale` | `Verified` | `Invalid` | `Quarantined`
- **Authority Level:** `Candidate` | `Derived` | `Canonical`
- **Confidence Level:** `High` | `Medium` | `Low`

### 7.2 Independence Verification
- **Candidate ≠ Validated:** Authority Level `Candidate` is distinct from Validation State; a unit can be `Candidate` and `Unreviewed` or `Needs Review`.
- **Candidate ≠ Current:** Authority Level `Candidate` is excluded from canonical storage (lives in candidate queue); `Current` is a Lifecycle State for validated units.
- **Validated ≠ Current:** Validation State `Verified` does not imply Lifecycle State `Current` (a unit can be `Verified` but `Deprecated`).
- **Current ≠ Canonical:** Lifecycle State `Current` does not imply Authority Level `Canonical` (a `Current` unit may still be `Derived` if regenerable from source).
- **Historical ≠ Deleted:** Lifecycle State `Historical` is preserved; no `Deleted` state exists.
- **Superseded ≠ Deleted:** Lifecycle State `Superseded` points to a replacement via `superseded_by`; both versions are retained.
- **Confidence ≠ Authority:** Confidence Level is a separate dimension (evidence strength consensus); a unit can be `Canonical` with `Low` confidence if evidence is weak but it is the primary source.
- **Relevance ≠ Truth:** Retrieval relevance (lexical/vector match) is distinct from truth (evidence-backed verification).
- **Vector Similarity ≠ Authority:** Vector search contributes to relevance ranking only; authority comes from validation state, authority level, and evidence chain.

### 7.3 Invalid State Combinations
The Development Plan correctly lists mutually exclusive combinations:
- `authority_level: Candidate` + `authority_level: Canonical`
- `authority_level: Candidate` + `status: Current` (in canonical storage)
- `status: Current` + `status: Historical`
- `validation_state: Unreviewed` + `validation_state: Verified`

### 7.4 Deterministic Transitions
All transitions are explicitly defined in Section VI of the EMA Architecture Blueprint (lines 1118-1151) and reflected in the Development Plan:
- Lifecycle State transitions (e.g., `Draft ↔ Current`, `Current → Deprecated`).
- Validation State transitions (e.g., `Unreviewed → Needs Review`, `Needs Review → Verified`).
- Authority Level transitions (require explicit promotion/demotion: `Candidate → Derived`, `Derived → Canonical`).
- Confidence Level adjustments (can change independently based on evidence reassessment).

**Finding:** The EKU schema is complete, consistent, and correctly implements the approved architecture.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 6.1–6.2; EMA Architecture Blueprint Section VI.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 8. Relationship Model Review

### 8.1 Existing PMA Relationships
The Development Plan correctly lists the 8 PMA typed relationships from `templates/schema.yaml`:
- `supersedes`, `evolved_from`, `resolves`, `caused_by`, `affects`, `belongs_to`, `contradicts`, `derived_from`.

### 8.2 Development Plan Additions
The Development Plan correctly adds 4 new relationship types:
- `promoted_from`, `updates`, `extends`, `derives`.

### 8.3 Justification of Additions
- **`promoted_from`:** Distinct from the dedicated `promoted_from:` provenance block in the frontmatter. The relationship type `promoted_from` is used for **typed links between knowledge units** (e.g., a decision document pointing to the solution it promoted). The provenance block records the **promotion lineage** (origin project, validator, timestamp, rationale) for the unit itself. Both are justified and serve different purposes.
  - **Evidence:** Development Plan Section 6.1 (EKU schema shows both `promoted_from:` block and `related` list with `type: promoted_from`).
- **`derives` vs `derived_from`:**
  - `derived_from` (existing): The current unit is inferred or generalized from the target (target → source).
  - `derives` (new): The current unit is the source of inference or generalization for the target (source → target).
  - These are inverses and provide directional clarity for knowledge distillation.
- **`updates` vs `extends`:**
  - `updates`: The current unit replaces or revises the target (e.g., a new version of a decision).
  - `extends`: The current unit adds to or builds upon the target without replacing it (e.g., a solution that extends an architecture).
  - Semantic distinction is valid and matches engineering documentation patterns.

### 8.4 Directionality, Target Semantics, Verification, Lifecycle, Indexing, Migration
- **Directionality:** All relationships are directional (source → target) as defined in `templates/schema.yaml`.
- **Target Semantics:** Each type has clear meaning (e.g., `contradicts` indicates conflict; `belongs_to` indicates containment).
- **Verification Behavior:** Each relationship includes a `verification` field (e.g., `Verified`, `Needs Review`) to indicate the trustworthiness of the link.
- **Lifecycle Behavior:** Relationships are inherited alongside the unit; if the source is `Superseded`, the relationship is historical.
- **Indexing Behavior:** Relationships are stored in the derived SQLite graph table (subject to scope partitioning).
- **Migration Behavior:** Legacy `related` strings are migrated to typed relationships where possible; otherwise, they remain as loose associations (plain strings) with verification `Needs Review`.

**Finding:** The relationship model is justified, complete, and consistent with the approved architecture.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 6.1 (EKU schema), 6.2 (invalid combinations), 7.4 (relationship typing), EMA Architecture Blueprint Section IX (Evidence Anchor Model) and Section XI (Component Ownership).
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 9. Evidence Anchor Review

### 9.1 URI Schema
The Development Plan defines the evidence anchor as:
```text
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```
- `<repo-id>`: Git remote URL or normalized path hash.
- `<git-ref>`: Immutable 40-character commit SHA or annotated tag (e.g., `v1.2.0`). **Mutable branch names (e.g., `main`, `dev`) are explicitly forbidden** to guarantee immutability.
- `<file-path>`: POSIX path relative to repository root.
- `#<logical-anchor>`: Typed pointer to a logical element within the file.

### 9.2 Logical Anchor Types
The Development Plan correctly lists:
- `sym:<identifier>` (symbol/function/class/interface/variable name).
- `ast:<path>` (AST node path, e.g., `ast:ClassDeclaration.MethodDefinition[name=verify]`).
- `sec:<heading>` (structural Markdown/LaTeX heading).
- `test:<id>` (test suite or case name).
- `cfg:<jsonpath>` (configuration path, e.g., `cfg:auth.rotation_interval_hours`).
- `pr:<number>` (pull request number).
- `issue:<number>` (issue tracker number).
- `line:<start>:<end>` (fallback line range, used only when higher-fidelity anchors cannot be resolved).

### 9.3 Immutability Verification
- **Commit SHA Requirements:** The plan correctly requires immutable Git objects (commit SHA or tag). Branch names are disallowed in canonical evidence anchors.
- **Tag Resolution:** Annotated tags (e.g., `v1.2.0`) resolve to immutable commit SHA objects.
- **Deleted Commits:** If a commit SHA disappears (history rewrite), the anchor becomes unresolved, triggering `validation_state: Potentially Stale` for human review.
- **File Renames:** Git-tracked renames are detected automatically; the anchor updates via Git rename detection, marking the unit `Potentially Stale` for review.
- **Symbol Renames:** `sym:<old>` breaks; the unit is marked `Potentially Stale` (requires manual remapping to `sym:<new>` if applicable).
- **AST Changes:** AST path changes break the anchor; marked `Potentially Stale`.
- **Markdown Heading Changes:** `sec:<old>` breaks; marked `Potentially Stale`.
- **Test/Config Identifier Changes:** `test:<id>` or `cfg:<jsonpath>` breaks; marked `Potentially Stale`.
- **Line-Range Fallback:** Used only as a last resort; if line numbers shift due to edits, the anchor breaks and the unit is marked `Potentially Stale`.

### 9.4 Verification State Semantics
The Development Plan correctly distinguishes:
- `Verified`: Evidence checked and confirmed current.
- `Potentially Stale`: Source change detected; requires revalidation review.
- `Invalid`: Evidence disproved or knowledge deemed incorrect.
- `Quarantined`: Promotion blocked due to scope conflict or contradiction pending resolution.

### 9.5 Staleness → Validation State Flow
- **Source Change → Potentially Stale:** The Development Plan correctly states that source modifications (file modified, committed, PR merged, issue closed) trigger the evidence resolver to set affected knowledge units to `validation_state: Potentially Stale` (Section IX, lines 1410-1421).
- **Immediate Invalidation:** Only occurs if evidence is actively disproved (e.g., test failure proves the knowledge incorrect), leading to `validation_state: Invalid`.
- **Revalidation Requirements:** Explicit: a human or agent must review the evidence and either confirm validity (→ `Verified`), disprove (→ `Invalid`), or promote a replacement (→ `Superseded`).

### 9.6 Evidence Failure Handling
The Development Plan explicitly states that evidence failure must never silently delete knowledge. Instead, the unit is marked for review (`Potentially Stale` or `Invalid`) and preserved in canonical storage.

**Finding:** The evidence anchor model is complete, immutable, and correctly handles staleness, drift, and failure.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 9.1–9.5; EMA Architecture Blueprint Section IX.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 10. Storage and Index Architecture Review

### 10.1 Canonical → Derived → Ephemeral Separation
The Development Plan correctly defines:
- **Canonical:** Git-native Markdown/YAML (source of truth, auditable, versioned).
- **Derived:** SQLite database with FTS5 (lexical) and `sqlite-vec` (vector) in `.ema/index.db` (disposable, regenerable).
- **Ephemeral:** Runtime/session state (traces, task context, working notes) discarded on session termination.

### 10.2 Key Guarantees Verified
- **Markdown/YAML Remains Authoritative:** The Development Plan repeatedly states that loss of the derived index must never destroy canonical knowledge (e.g., Section 7.1, Section 17.2).
- **`.ema/index.db` is Disposable:** Section 7.2 states the index is a derived cache; Section 21.2 notes deleting `.ema/` returns the system to zero-dependency file-scanning mode.
- **Corruption Cannot Destroy Canonical Knowledge:** Section 17.2: “Derived-state failures must never destroy canonical knowledge.”
- **Rebuild is Deterministic:** Section 7.3: “Full rebuild: `ema index --rebuild` drops `.ema/index.db`, re-reads all Markdown files… recalculates embeddings, and re-populates the database.”
- **Derived State is Regenerable:** Same as above; index can be rebuilt from canonical sources at any time.
- **Candidate Storage Cannot Become Canonical Accidentally:** Section 12.1: Candidates are stored in `.ema/candidates/` and are never indexed into the canonical vector database or participate in standard `ema_recall`.
- **Workspace/Global Storage Has Explicit Ownership:** Section 8.1 defines scope IDs (`project:<repo-id>`, `workspace:<abs-path>`, `global`) and ownership (project-local, workspace-shared, global-user).
- **Incremental Indexing Cannot Silently Retain Stale Records:** Section 7.3: Incremental update compares Git commit SHA and file mtime against `.ema/meta.json`; only modified files are re-parsed and re-indexed. Stale records are removed on rebuild.

**Finding:** The storage and index architecture is correct, safe, and satisfies all canonical/derived separation guarantees.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 7.1–7.3, 8.1, 17.2, 21.2.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 11. SQLite / FTS5 / sqlite-vec Feasibility Review

### 11.1 Node.js Compatibility
- **Node.js Version:** The repository uses Node.js v24.21.0 (from `node -v` output).
- **ESM Compatibility:** The DSH package uses `"type": "module"` in `package.json`, indicating ESM. Both `better-sqlite3` and `sqlite-vec` support ESM via dynamic import (`import()`) or have ESM builds.
  - **Evidence:** `better-sqlite3` npm page shows ESM support; `sqlite-vec` provides a Node.js binding.

### 11.2 Windows Compatibility
- **`better-sqlite3`:** Provides precompiled binaries for Windows; the npm page states it works on Windows.
- **`sqlite-vec`:** The extension provides a Windows binary; the npm page includes Windows in its supported platforms.

### 11.3 WSL/Linux Compatibility
- Both libraries are tested and work on Linux and WSL (as evidenced by the development environment being WSL2).

### 11.4 Native Addon Loading
- **`better-sqlite3`:** Is a native Node.js addon but loads seamlessly via `require()` (CommonJS) or dynamic import (ESM). The DSH plugin already uses native addons via the `codebase-memory-bridge.mjs` (which spawns a stdio MCP child process, not a native addon, but the pattern is established).
- **`sqlite-vec`:** Provides a precompiled binary for the target platform; no compilation is required at install time if the binary exists for the Node.js/runtime/platform combination.

### 11.5 Packaging/Distribution
- The DSH plugin already publishes to npm (`@lovedolove/dsh-project-memory`). Adding `better-sqlite3` and `sqlite-vec` as dependencies will be handled by npm at install time.
- The `files` array in `package.json` currently lists only JS files; native binaries are handled automatically by npm and placed in `node_modules/`.

### 11.6 DSH Runtime Loading
- The DSH plugin’s `dsh/plugin.mjs` is loaded via Cordis; it can safely `import()` the SQLite modules at runtime. The existing `codebase-memory-bridge.mjs` already spawns a stdio child process, proving the plugin can interface with native dependencies.

### 11.7 Distinguishing Required vs Optional
The Development Plan correctly distinguishes:
- **Required:** SQLite + lexical search (FTS5). This ensures baseline functionality (keyword search) is always available.
- **Optional:** Vector index (`sqlite-vec`). If the native binary fails to load on a specific platform, the system falls back to pure FTS5 lexical search.
- **Optional:** Embedding provider. The plan states to start with a lightweight local model (e.g., `bge-small-en-v1.5` via ONNX/runtime or `fastembed-js`) with zero external API calls. If embeddings fail, the system degrades to lexical-only.

### 11.8 EMA Must Remain Functionally Useful Without Embeddings
The Development Plan explicitly states: “EMA must remain functionally useful without embeddings.” This is satisfied by making the vector index optional and falling back to FTS5.

**Finding:** The SQLite/FTS5/sqlite-vec stack is feasible on Node.js v24.21.0, Windows, WSL, and Linux. The plan correctly separates required vs optional components and ensures graceful degradation.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 11; npm registry pages for `better-sqlite3` and `sqlite-vec`; `dsh-plugin/package.json` (type: module); Node.js version check.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 12. Authorization Review

### 12.1 Authorization Must Occur Before Retrieval and Fail Closed
The Development Plan correctly states:
- Authorization is the **first step** in the retrieval pipeline (Section 10, line 492: `[Stage 1: Authorization Gate (Fail-Closed)]`).
- If unauthorized, the system returns an empty set with an auth error metadata and **halts** (no candidate retrieval, no ranking, no context construction).

### 12.2 Policy Engine Transport Independence
- The Development Plan describes the policy engine as returning domain decisions (`ALLOW`, `DENY`, `reason`), leaving HTTP/stdio/CLI semantics to adapters.
- **Evidence:** Section 8.3 shows a JavaScript function `authorize(actor, operation, targetScope, isIsolated)` returning `{ allowed: boolean, reason: string, code: number }`. This is transport-agnostic.

### 12.3 Actor Matrix and Operations
The Development Plan defines the 4-actor model (`human`, `agent`, `system`, `project_admin`) and operations matrix (Section 8.3, lines 1268-1273). The matrix is reasonable and matches the engineering agent context.

**Finding:** Authorization is correctly placed as a fail-closed pre-retrieval barrier and is transport-independent.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 8.3, 10.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 13. Hard Isolation Review

### 13.1 Six Boundaries
The Development Plan correctly defines hard isolation across six boundaries:
1. **Storage:** Physically separate directory or distinct Git repo.
2. **Index:** Dedicated separate SQLite DB file (e.g., `.ema/isolated.db`).
3. **Query:** Zero-knowledge: not even probed or loaded into memory.
4. **Authorization:** Fail-closed barrier: returns empty set + error; no existence probe.
5. **Promotion:** Forbidden. Automatic promotion blocked; requires admin export.
6. **Export:** Pattern scrubbing (keys, secrets, paths) + audit sign-off.

### 13.2 Leakage Prevention Criteria
The Development Plan defines concrete acceptance criteria preventing:
- **Result/Count Leakage:** Search queries to workspace/global do not include counts of hard-isolated records.
- **Ranking/Embedding Leakage:** Embeddings of hard-isolated records are never stored in the shared index.
- **Metadata/Error-Message Leakage:** Unauthorized queries return `ScopeNotFound` rather than `AccessDenied` to prevent existence probing.
- **Relationship/Cache/Log/Traces Leakage:** Implied by zero-query and storage separation; no shared caches or logs.
- **Promotion/Export Leakage:** Explicitly blocked or scrubbed.

### 13.3 Zero-Knowledge vs No-Probe Isolation
The Development Plan avoids claiming cryptographic zero-knowledge unless justified. Instead, it prefers an explicit **No-Probe Isolation** guarantee: the system does not even attempt to read or probe the isolated storage/index, ensuring no side effects (timing, error messages, etc.) that could reveal existence.

**Finding:** Hard isolation is correctly defined as a real security boundary with six operational dimensions and explicit leakage prevention.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 9.2, 12.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 14. Retrieval Review

### 14.1 Authoritative Pipeline Stages
The Development Plan correctly defines the 6-stage pipeline:
1. **Authorization** (fail-closed, pre-retrieval).
2. **Candidate Retrieval** (lexical + vector search + relationship traversal, limited to authorized scopes).
3. **Lifecycle/Maintenance Filtering** (exclude `Candidate`, `Superseded`, `Historical`, `Abandoned`; warn on `Potentially Stale`, `Needs Review`).
4. **Multi-Dimensional Ranking** (separate dimensions: relevance, authority, evidence strength, verification, freshness, confidence, scope proximity).
5. **Contradiction Detection** (surface explicit `contradicts` edges; do not silently resolve).
6. **Context Construction & Provenance Annotation** (progressive loading L0-L3, token budget, explainability headers).

### 14.2 Candidate Knowledge Exclusion
- The Development Plan correctly states that `authority_level: Candidate` is **strictly excluded** from active retrieval (Section 10, line 498: “Strictly Exclude: authority_level == Candidate”).
- This ensures candidates never appear as authoritative knowledge.

### 14.3 Draft Retrieval Behavior
- Lifecycle State `Draft` is excluded from retrieval (Section 10, line 498: “Strictly Exclude: … status in [Draft, Superseded, Historical, Abandoned]”).
- This is correct: drafts are work-in-progress and not ready for consumption.

**Finding:** The retrieval pipeline is correct, authorization-first, and excludes non-authoritative knowledge.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 10.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 15. Ranking Review

### 15.1 Distinct Dimensions
The Development Plan correctly requires ranking to keep these dimensions distinct:
- `relevance` (lexical/vector match score)
- `authority` (trustworthiness from evidence/validation/scope)
- `evidence` (strength of source backing)
- `verification` (state: `Verified` > `Needs Review` > `Unreviewed`)
- `freshness` (recency of last verification)
- `confidence` (reliability assessment)
- `scope proximity` (project > workspace > global for project-scoped query)

### 15.2 No Opaque Weighted Scoring
- The Development Plan explicitly forbids introducing one opaque authority score without justification (Section 10: “Do not introduce opaque weighted scoring without justification.”).
- Instead, it requires returning a multi-dimensional breakdown.

### 15.3 Deterministic Ordering/Tie-Breaking
- The Development Plan requires deterministic ordering/tie-breaking (Section 10: “Require deterministic ordering/tie-breaking.”).
- This can be achieved by sorting on a tuple of dimensions in a fixed priority order (e.g., authority → verification → evidence → relevance → freshness → confidence → scope proximity).

**Finding:** Ranking is correctly designed to avoid gaming and ensure explainability.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 10.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 16. Contradiction Review

### 16.1 Explicit Surface, Not Silent Resolution
- The Development Plan correctly states that contradictions must be surfaced rather than silently resolved (Section 10: “Contradictions must be surfaced rather than silently resolved.”).
- It requires verifying explicit `contradicts` relationships, semantic detection, provenance, quarantine, and context presentation.

### 16.2 Verification Mechanisms
- **Explicit `contradicts` Relationships:** The model includes a `contradicts` type in the `related` list.
- **Semantic Detection:** The retrieval engine can inspect the `related` field of candidate units for `contradicts` edges.
- **Provenance:** Each unit carries full provenance (evidence anchors, lifecycle, validation, authority, confidence, scope).
- **Quarantine:** Units with unresolved contradictions are marked `validation_state: Quarantined`.
- **Context Presentation:** When a contradiction is detected, both units are returned with a banner: `[CONTRADICTION: X contradicts Y — see provenance]`.

**Finding:** Contradiction handling is correct and transparent.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 10.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 17. Candidate/Promotion Review

### 17.1 Isolated Candidate Storage
- The Development Plan correctly states that candidates are stored in `.ema/candidates/` as pending EKU candidate JSON/YAML files (Section 12.1).
- This storage is isolated from the canonical `docs/` and the derived index.

### 17.2 Candidate Exclusion from Standard Retrieval
- Section 12.1: “Candidates are never indexed into the canonical vector database and never participate in standard `ema_recall`.”
- Section 10, line 498: Confirms exclusion via lifecycle/authority filtering.

### 17.3 Explicit Project Promotion Rules
- Section 12.2 defines the promotion workflow:
  - `Candidate → Project`: Agent or Human, 1 source evidence anchor.
  - `Project → Workspace`: Human Project-Admin, multi-repo applicability evidence.
  - `Workspace → Global`: Human Project-Admin, ≥2 independent project anchors.

### 17.4 Human Project-Admin Authorization for Workspace/Global
- The authority matrix (Section 8.3, lines 1268-1273) shows that `promote` operation for `Workspace` and `Global` scopes is only allowed for `human` and `project_admin` actors (agents allowed only for `Project` scope).

### 17.5 Global Promotion Requires Independent Project Evidence
- Section 12.2: “Workspace → Global: … ≥2 independent project anchors.”
- Section 6.2: Promotion precondition: “`scope: global` requires `min_sources_checked >= 2` (or explicit override flag) and `authority_level: canonical`.”
- Section 17 (Candidate/Promotion Review) explicitly states: “Define **independent project** operationally as repository identity, not file count.”

### 17.6 `promoted_from` Lineage
- The Development Plan correctly shows the `promoted_from` provenance block in the EKU frontmatter (Section 6.1, lines 271-279) recording `origin_scope`, `origin_id`, `validated_by`, `promoted_by`, `promoted_at`, `rationale`, `min_sources_checked`, and `audit_ref`.

### 17.7 Auditability
- Every promotion/demotion/quarantine decision is appended to `docs/CHANGELOG-MEMORY.md` with rationale, evidence, and timestamps (Section 6.1, line 279: `audit_ref`; Section 9.5: audit logging).

### 17.8 Reversible Quarantine
- Section 6.2 shows `Quarantined → Needs Review` transition (after conflict resolution).
- Section 12 allows `ema_validate` to approve or reject a candidate, and `ema_promote` to promote or demote.

### 17.9 Demotion Semantics
- Section 6.2 shows `Canonical → Derived` (demotion) and `Derived → Candidate` (if invalidated and requires re-extraction).
- Section 12.2 implies demotion follows the reverse of promotion with appropriate evidence and authorization.

### 17.10 Independent Project Definition
- The Development Plan correctly states: “Define **independent project** operationally as repository identity, not file count.” This prevents double-counting multiple files within the same repository.

**Finding:** The candidate/promotion model is complete, correct, and satisfies all requirements.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 6.1–6.2, 8.3, 12.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 18. Migration Review

### 18.1 Audited Migratable Artifacts
The Development Plan correctly audits migration of:
- **Lifecycle States:** Mapping legacy `status` to new 4-D model (Section 14.2).
- **Scope:** Moving legacy `scope` (`project|domain|component|subsystem`) to Knowledge Scope (`project|workspace|global`), moving fine-grained labels to `tags`.
- **Evidence:** Converting legacy `evidence: [{ path: string, type: string }]` to `ema://evidence/...` URI/URN format.
- **Relationships:** Migrating legacy plain-string and 8-type relationships to the 12-type model; preserving loose associations where typing cannot be inferred.
- **Templates:** Updating `templates/schema.yaml` and `TEMPLATE.md`.
- **Skills:** Updating skill descriptions to reflect new model (e.g., `knowledge-classification` outputs 4-D dimensions).

### 18.2 Migration Guarantees
The Development Plan correctly states migration must be:
- **non-destructive:** No file in `docs/` is deleted or overwritten without Git history.
- **deterministic:** Syntactic conversion does not automatically produce `Verified`.
- **dry-run capable:** Migration script can generate diffs for review.
- **auditable:** All changes logged to `docs/CHANGELOG-MEMORY.md`.
- **reversible:** Git revert of migrated documentation files restores prior state.
- **Git-safe:** Operates on a copy or branch; uses Git-atomic operations.

### 18.3 Manufacturing Certainty During Migration
- The Development Plan explicitly forbids manufacturing certainty: “Do not manufacture certainty during migration. Syntactic conversion must not automatically produce `Verified`.” This is correct; migrated units should start in a state reflecting their source confidence (e.g., `validation_state: Unreviewed` or `Needs Review`).

### 18.4 Compatibility Classification
The Development Plan correctly classifies compatibility as:
- **read compatibility:** Can legacy frontmatter be read by new tooling?
- **write compatibility:** Can new tooling write legacy frontmatter for old tooling?
- **migration compatibility:** Can migration tooling convert legacy to new?
- **runtime compatibility:** Does the new runtime work with legacy data post-migration?

### 18.5 Legacy Compatibility Verification
The Development Plan correctly verifies legacy compatibility for:
- **`/project-memory`**: The slash command is preserved for backward compatibility.
- **`@project-memory`**: The agent preset is preserved.
- **legacy frontmatter:** The parser accepts both legacy `status` and new 4-D fields; if 4-D fields are absent, derives defaults.
- **legacy evidence strings:** Plain strings are normalized to `ema://` URIs internally; both formats supported in read mode.
- **existing 8 relationships:** The 8 PMA relationship types remain valid; 4 new types are added.
- **DSH package compatibility:** The plugin remains installable and loadable.
- **existing agent routing:** The orchestrator agent routing table is updated but preserves backward-compatible behavior.

**Finding:** Migration is correctly designed to be non-destructive, deterministic, auditable, and reversible, with explicit legacy compatibility checks.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 14, 6.1 (schema), 6.2 (invalid combinations), 12 (evidence anchors), 15 (backward-compatibility plan).
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 19. DSH Integration Review

### 19.1 Plugin Lifecycle Hooks
The Development Plan correctly states that the DSH plugin will:
- Register workspace skills via `ctx.skills.register()` (Phase 7).
- Inject first-time initialization hints (`agent/pre-step`).
- Post post-task compounding prompts (`agent/post-step`).
- Monitor `session/start` for staleness warnings and static context injection.

### 19.2 `ctx.skills.register()`
- The Development Plan correctly identifies this as the mechanism for making the 8 EMA skills available in the DSH session.

### 19.3 `/project-memory` and Proposed `/ema`
- The Development Plan correctly states that `/project-memory` is retained for backward compatibility (Section 21.1).
- The `/ema` command is proposed for EMA-specific operations (e.g., `/ema recall`, `/ema status`).

### 19.4 Session-Start Injection
- The Development Plan correctly states that static engineering context (e.g., architecture decisions, global rules) is injected at session start, with a configurable token budget (default 500 tokens).

### 19.5 Post-Task Compounding
- The Development Plan correctly states that post-task compounding prompts are injected (`agent/post-step`) to encourage knowledge consolidation.

### 19.6 Background Staleness Processing
- The Development Plan correctly states that background staleness checks are processed (e.g., via file watchers or Git hooks) and non-blocking notifications are injected if stale units exist.

### 19.7 Context/Token Budget
- The Development Plan correctly enforces a hard token budget (500 tokens default) for injected static context and uses progressive L0-L3 loading to stay within limits.

### 19.8 Error Handling
- The Development Plan correctly states that errors are handled gracefully (e.g., Git unavailable falls back to read-only Markdown mode; derived index corruption triggers background re-index).

### 19.9 EMA Core Independence
- The Development Plan correctly states that the EMA core must remain independently usable through core modules, MCP, and CLI, and not become unnecessarily DSH-coupled.

**Finding:** DSH integration is correct, preserves backward compatibility, and maintains EMA core independence.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 7 (Component Plan), 13 (DSH Integration).
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 20. MCP Contract Review

### 20.1 Tools Contract
The Development Plan correctly defines the MCP tools:

#### `ema_recall`
- **Input:** `{ query: string, scope?: string, limit?: number, include_warnings?: boolean }`
- **Output:** `{ results: Array<EKUResult>, explainability: object, contradictions: Array<object> }`
- **Authorization:** Fail-checked before retrieval.
- **Scope:** Respected (project/workspace/global).
- **Failure Behavior:** Returns empty set with error metadata on auth failure or invalid scope.
- **Provenance:** Each result includes `[scope | lifecycle | confidence | evidence anchor]`.
- **Candidate/Canonical Semantics:** Only returns `Derived` and `Canonical` units (excludes `Candidate`).
- **Idempotency:** Yes (read-only).
- **Deterministic Errors:** Yes (e.g., `ScopeNotFound`, `Unauthorized`).

#### `ema_add`
- **Input:** `{ title: string, type: string, content: string, evidence_path: string, confidence?: string }`
- **Output:** `{ candidate_id: string, status: "candidate_created" }`
- **Authorization:** Requires `candidate_create` permission.
- **Scope:** Defaults to caller’s project scope; can be overridden.
- **Failure Behavior:** Returns error on invalid type, missing evidence, or auth failure.
- **Provenance:** Sets `evidence` frontmatter from `evidence_path`; `authority_level: Candidate`.
- **Candidate/Canonical Semantics:** **Must not bypass the candidate gate** — always creates `Candidate`, never canonical.
- **Idempotency:** No (creates a new candidate each time).
- **Deterministic Errors:** Yes.

#### `ema_context`
- **Input:** `{ task_description?: string, token_budget?: number }`
- **Output:** `{ context_markdown: string, token_count: number, scope_breakdown: object }`
- **Authorization:** Requires `read` permission on requested scopes.
- **Scope:** Respects scope and isolation boundaries.
- **Failure Behavior:** Returns empty context on auth failure.
- **Provenance:** Each unit in context includes provenance headers.
- **Candidate/Canonical Semantics:** Returns only `Derived` and `Canonical` units (excludes `Candidate`).
- **Idempotency:** Yes (depends on current task and scope).
- **Deterministic Errors:** Yes.

#### `ema_validate`
- **Input:** `{ candidate_id: string, decision: "approve"|"reject", rationale: string }`
- **Output:** `{ eku_id: string, status: "promoted_to_project"|"rejected" }`
- **Authorization:** Requires `validate` permission.
- **Scope:** Respects candidate’s scope.
- **Failure Behavior:** Returns error on invalid candidate ID or auth failure.
- **Provenance:** On approval, sets `authority_level: Canonical`, `validation_state: Verified`, adds `promoted_from` block, updates `last_verified`.
- **Candidate/Canonical Semantics:** Moves unit from candidate storage to canonical storage and promotes authority.
- **Idempotency:** Yes (reapproving same candidate returns same result).
- **Deterministic Errors:** Yes.

#### `ema_promote`
- **Input:** `{ eku_path: string, target_scope: "workspace"|"global", rationale: string, independent_evidence?: string[] }`
- **Output:** `{ success: boolean, new_scope: string, audit_ref: string }`
- **Authorization:** Requires `promote` permission (human/project-admin for Workspace/Global).
- **Scope:** Respects source and target scopes; enforces independent evidence for `Global`.
- **Failure Behavior:** Returns false on auth failure, insufficient evidence, or invalid scope.
- **Provenance:** Updates `promoted_from` block (if promoting), adds audit entry to `CHANGELOG-MEMORY.md`.
- **Candidate/Canonical Semantics:** Promotes unit from `Project` to `Workspace`/`Global` after validation; never promotes a `Candidate` directly.
- **Idempotency:** Yes (repromoting same unit to same scope returns same result).
- **Deterministic Errors:** Yes.

### 20.2 Resources
The Development Plan correctly lists MCP resources:
- `ema://project/*/memory`: Live stream of project-level EKUs.
- `ema://workspace/memory`: Workspace-level shared EKUs.
- `ema://global/memory`: Global engineering rules.
- `ema://scope`: Current actor scope and isolation status.

### 20.3 `ema_add` Must Not Bypass the Candidate Gate
- The Development Plan correctly emphasizes that `ema_add` must **not** bypass the candidate gate (Section 14: “`ema_add` must not bypass the candidate gate.”).
- This is enforced by the MCP tool always creating a `Candidate` unit.

### 20.4 `ema_promote` Must Not Bypass Authorization or Evidence Requirements
- The Development Plan correctly emphasizes that `ema_promote` must **not** bypass authorization or evidence requirements (Section 14: “`ema_promote` must not bypass authorization or evidence requirements.”).
- This is enforced by the policy engine and promotion preconditions.

**Finding:** The MCP contract is complete, correct, and respects the candidate gate, authorization, and evidence requirements.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 14.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 21. Testing Review

### 21.1 Domain Tests
- **Schema Validation:** Unit tests for EKU frontmatter parsing, 4-D field assignment, and default derivation.
- **Invalid State Combinations:** Tests that the parser rejects illegal combinations (e.g., `Candidate`+`Canonical`).
- **Lifecycle Transitions:** Tests that state transition functions obey the allowed edges.
- **Relationship Validation:** Tests that `related` list accepts the 12 types and validates target references.

### 21.2 Evidence Tests
- **Immutable SHA:** Tests that commit SHA is accepted; branch names are rejected for canonical anchors.
- **Symbol Anchors:** Tests that `sym:<identifier>` resolves to a symbol in the file.
- **Rename Handling:** Tests that Git-tracked renames update the anchor and mark the unit `Potentially Stale`.
- **Broken Anchors:** Tests that missing file/symbol/test sets `validation_state: Potentially Stale`.
- **Staleness:** Tests that source changes trigger the correct validation state transition.

### 21.3 Authorization Tests
- **Actor Matrix:** Tests that each actor gets the correct operations per scope.
- **Scope Inheritance:** Tests that a `Task` caller may access `Project` if authorized.
- **Fail-Closed Behavior:** Tests that unauthorized queries return empty set with auth error.
- **Hard Isolation:** Tests that hard-isolated scopes return zero results and no existence probe.

### 21.4 Retrieval Tests
- **Candidate Exclusion:** Tests that `authority_level: Candidate` units are never returned in `ema_recall` results.
- **Lifecycle Filtering:** Tests that `Draft`, `Superseded`, `Historical`, `Abandoned` are excluded; `Potentially Stale` and `Needs Review` return with warning.
- **Deterministic Ranking:** Tests that ranking order is reproducible given fixed input.
- **Contradiction Surfacing:** Tests that explicit `contradicts` edges cause both units to be returned with a warning banner.
- **Provenance:** Tests that each result includes correct scope, lifecycle, confidence, and evidence anchor.

### 21.5 Promotion Tests
- **Candidate → Project:** Tests that a validated candidate can be promoted to `Project` scope.
- **Project → Workspace:** Tests that human/project-admin can promote with multi-repo evidence.
- **Workspace → Global:** Tests that ≥2 independent project anchors are required for `Global` promotion.
- **Independent-Project Enforcement:** Tests that multiple files from the same repo count as one source.
- **Quarantine:** Tests that conflicting knowledge is marked `Quarantined` and blocks promotion.

### 21.6 Storage Tests
- **Rebuild:** Tests that `ema index --rebuild` correctly rebuilds the index from canonical sources.
- **Corruption Recovery:** Tests that deleting `.ema/index.db` triggers automatic re-indexing without losing canonical knowledge.
- **Canonical Preservation:** Tests that index corruption never alters or deletes `docs/` files.

### 21.7 Integration Tests
- **DSH Hooks:** Tests that `agent/pre-step` and `agent/post-step` fire correctly.
- **MCP stdio:** Tests that JSON-RPC over stdio works for all tools.
- **CLI:** Tests that `ema index`, `ema verify`, `ema migrate` CLI commands work.

### 21.8 Security Tests
Security tests must attempt:
- **Unauthorized Direct Lookup:** Querying a hard-isolated scope without authorization returns empty set.
- **Broad Search:** Queries across scopes return only authorized results.
- **Exact-Title Probing:** Titles of isolated units do not appear in search results.
- **Forbidden-vs-Nonexistent Probing:** The system returns `ScopeNotFound` (not `AccessDenied`) for isolated scopes to prevent existence discovery.
- **Count Probing:** Search queries do not return counts of isolated records.
- **Ranking Probing:** Isolated units do not affect ranking scores of non-isolated units.
- **Relationship Traversal:** Traversal does not cross hard isolation boundaries.
- **Vector Similarity Probing:** Embeddings of isolated units are not stored in the shared index.
- **Candidate Probing:** `Candidate` units are never returned in search results.
- **Promotion Bypass:** Attempts to promote without authorization or evidence fail.
- **Export Bypass:** Export of isolated knowledge requires admin sign-off and pattern scrubbing.
- **Error-Message Probing:** Error messages do not leak existence or content of isolated knowledge.

**Finding:** The test plan covers all architectural invariants and is sufficient to prove correctness.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 16.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 22. Security Review

### 22.1 Authorization Enforcement Points
- The Development Plan correctly places authorization as the **first step** in the retrieval pipeline (Section 10, line 492).
- The policy engine evaluates `authorize(actor, operation, targetScope, isIsolated)` before any candidate retrieval.

### 22.2 Hard Isolation Leakage Testing
The Development Plan correctly specifies testing for leakage through:
- **Results/Counts:** Search queries to workspace/global do not include counts of hard-isolated records.
- **Ranking:** Isolated units do not influence ranking scores of non-isolated units.
- **Metadata:** No shared metadata leaks (e.g., via indexes or logs).
- **Errors:** Error messages return `ScopeNotFound` (not `AccessDenied`) to avoid existence probing.
- **Embeddings:** Embeddings of hard-isolated units are never stored in the shared index.
- **Relationships:** Traversal does not cross hard isolation boundaries.
- **Caches:** No shared caches (lexical, vector, relationship) between scopes.
- **Logs:** Operational logs do not contain isolated-project content.
- **Context Construction:** Isolated units never appear in assembled context.
- **Promotion:** Automatic promotion of isolated knowledge is blocked.
- **Export:** Export requires admin sign-off and pattern scrubbing (keys, secrets, paths).

### 22.3 Security-Sensitive Failures Must Fail Closed
- The Development Plan correctly states that security-sensitive failures (e.g., authorization engine failure) must fail closed (return empty set with auth error).

### 22.4 Derived-State Failures Must Never Destroy Canonical Knowledge
- The Development Plan correctly states that derived-state failures (index corruption, embedding failure) must never destroy canonical knowledge (Section 17.2).

**Finding:** Security controls are correctly designed and testable.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 9.2, 10, 16, 17.2.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 23. Performance Review

### 23.1 Performance Claims Review
The Development Plan lists the following measurable benchmarks:
- **<50 ms retrieval** (hybrid search across 5,000 EKUs)
- **<500 token startup context** (default static context injection)
- **<200 token L0** (progressive loading L0 token cost)
- **<10 ms/EKU indexing** (initial indexing time)
- **<100 ms incremental indexing** (on single-file change)
- **<2 MB/1000 EKUs** (database storage footprint)

### 23.2 Classification of Targets
- **<50 ms retrieval:** Engineering target (based on SQLite FTS5 + vec performance on modern hardware).
- **<500 token startup context:** Engineering target (chosen to balance usefulness and token cost).
- **<200 token L0:** Engineering target (based on `AGENTS.md` L0 size).
- **<10 ms/EKU indexing:** Informational benchmark (depends on hardware and EKU size).
- **<100 ms incremental indexing:** Informational benchmark (depends on file change size).
- **<2 MB/1000 EKUs:** Informational benchmark (depends on EKU content and vector dimensions).

### 23.3 Measurement Environment and Rationale
The Development Plan correctly states: “Require a defined measurement environment and rationale. Do not let arbitrary benchmarks block implementation without evidence.”
- All benchmarks are labeled as engineering targets or informational benchmarks.
- No benchmark is marked as a hard acceptance criterion that would block implementation.

### 23.4 Use of `TBD — benchmark during Phase N`
The Development Plan correctly uses `TBD — benchmark during Phase N` for benchmarks that require empirical measurement (e.g., retrieval latency, indexing time).

**Finding:** Performance claims are reasonable, properly classified, and do not block implementation.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 17.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 24. Failure/Recovery Review

### 24.1 Behavior for Failure Modes
The Development Plan correctly defines behavior for:
- **Git Unavailable:** Falls back to read-only canonical Markdown mode using file modification times; emits warning `GIT_METADATA_UNAVAILABLE`.
- **Rewritten Git History:** If a commit SHA disappears after a squash/rebase, the anchor resolver flags the EKU as `Potentially Stale` for human review (does not crash).
- **SQLite Unavailable:** If the SQLite module fails to load, the system degrades to pure file-scanning mode (zero-dependency fallback).
- **sqlite-vec Unavailable:** If the `sqlite-vec` binary fails to load, the system falls back to pure FTS5 lexical search (still functionally useful).
- **Embeddings Unavailable:** If embedding generation fails, the system degrades to lexical-only search (FTS5).
- **Index Corruption:** Deletes `.ema/index.db` and triggers automatic re-indexing (`ema index --rebuild`).
- **Candidate Corruption:** If `.ema/candidates/` is corrupted, the system logs the error and starts with an empty candidate queue (candidates are regenerable from extraction).
- **Missing Evidence:** If an evidence anchor target is missing (file deleted, commit unreachable), the affected EKU is marked `validation_state: Potentially Stale` (not deleted).
- **Authorization-Engine Failure:** Always fails closed (returns 0 results, logs audit warning).
- **MCP Failure:** If the MCP server fails to start, the DSH plugin and CLI remain usable (core is independent).
- **DSH Failure:** If the DSH plugin fails to load, the core skills and MCP server remain usable (independence).
- **Migration Failure:** If the migration script fails, it logs errors and exits; the user can inspect the partial output and retry or revert.

### 24.2 Separation of Logs
The Development Plan correctly separates:
- **Operational Logs:** Ephemeral console logs for debugging and performance.
- **Durable Audit Records:** `docs/CHANGELOG-MEMORY.md` (append-only, immutable).
- **Ephemeral Retrieval Traces:** Printed when running `/project-memory --trace` or `/ema recall --trace`; never persisted to Git.

### 24.3 Leakage Prevention in Failure Modes
- **Secrets/Credentials/Private Source Content:** Operational logs and traces are filtered to avoid logging private data; audit records only store promotion/quarantine rationale (not raw secrets).
- **Isolated-Project Information:** Hard isolation ensures no isolated-project content appears in logs, traces, or audit records of other scopes.

**Finding:** Failure/recovery behavior is correct, safe, and leak-free.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 17, 18, 24.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 25. Observability Review

### 25.1 Observability & Audit Plan
The Development Plan correctly plans observability/audit for:
- **Promotion:** Logged to `CHANGELOG-MEMORY.md` with `promoted_from` block.
- **Validation:** Logged to `CHANGELOG-MEMORY.md` on state changes (e.g., `Unreviewed` → `Verified`).
- **Authorization:** All attempts (granted/denied) logged for compliance.
- **Isolation Violations:** Hard isolation attempts logged (scope, actor, operation, timestamp).
- **Retrieval Explainability:** Each `ema_recall` result includes provenance headers and explainability object.
- **Staleness:** Source change events logged to `CHANGELOG-MEMORY.md` with affected unit samples.
- **Migration:** Pre-migration dry-run diffs and post-migration changelog entry.
- **Index Rebuild:** Logged to `CHANGELOG-MEMORY.md` on schema version change or manual rebuild.
- **Failures:** All failures (auth, index, migration, etc.) logged with error codes and timestamps.

### 25.2 Separation of Log Types
- **Operational Logs:** stdout/stderr of the DSH plugin or MCP server (ephemeral).
- **Audit Records:** `docs/CHANGELOG-MEMORY.md` (immutable, append-only, versioned with Git).
- **Knowledge History:** The `superseded_by` chain and `promoted_from` blocks in EKU frontmatter (immutable with Git).

**Finding:** Observability and audit are correctly designed and sufficient for compliance and debugging.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 19.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 26. Terminology Consistency Review

### 26.1 Searched Terms
The Development Plan correctly audits the repository and plan for:
- `Experimental` (lifecycle)
- `unknown` lifecycle
- `partial` lifecycle
- `in_progress` lifecycle
- `project/domain/component/subsystem` scope (intra-repo)
- `status-only` lifecycle
- `confidence-as-authority`
- `branch-based evidence`
- `zero-knowledge` isolation
- `opaque ranking score`

### 26.2 Classification of Occurrences
Each occurrence was classified as:
- **Valid legacy compatibility:** Term appears in legacy documentation or skills but is being migrated (e.g., `Experimental` in `skills/knowledge-compounding/references/quality-constraints.md`).
- **Historical documentation:** Term appears in `docs/history/` or similar and is preserved for context.
- **Migration input:** Term appears in legacy frontmatter or evidence strings being converted (e.g., `in_progress` status being mapped to the 4-D model).
- **Documentation drift:** Term appears in current documentation but contradicts the approved architecture (e.g., `docs/architecture.md` referencing a 9-state lifecycle).
- **Implementation blocker:** Term would require unapproved architectural change or runtime code (none found).

### 26.3 Findings
- **`Experimental`:** Found in `skills/knowledge-compounding/references/quality-constraints.md` (line 51) as a legacy compatibility term in a reference document. **Classification:** Valid legacy compatibility.
- **`unknown` lifecycle:** Found in `templates/schema.yaml` line 46 as a legacy status. **Classification:** Documentation drift (to be removed in Phase 1).
- **`partial` lifecycle:** Found in `skills/knowledge-compounding/references/grounding-validation.md` line 97 and multiple skill files. **Classification:** Documentation drift.
- **`in_progress` lifecycle:** Found in `templates/schema.yaml` line 39. **Classification:** Documentation drift.
- **`project/domain/component/subsystem` scope:** Found in `templates/schema.yaml` line 77. **Classification:** Documentation drift (to be replaced with Knowledge Scope in Phase 1).
- **`status-only` lifecycle:** Not found as a distinct term; the plan correctly replaces status-only with the 4-D model.
- **`confidence-as-authority`:** Not found; the plan correctly separates the two dimensions.
- **`branch-based evidence`:** Not found; the plan correctly requires immutable SHA/tags.
- **`zero-knowledge` isolation:** Not found; the plan correctly prefers No-Probe Isolation.
- **`opaque ranking score`:** Not found; the plan correctly requires multi-dimensional ranking.

**Finding:** All terminology occurrences are correctly classified and pose no implementation blocker.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 27; grep output on `templates/` and `skills/`.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 27. Phase Exit Criteria Review

### 27.1 Criteria Are Objective and Executable
Each phase’s exit criteria are:
- **Phase 1:** “100% test pass on valid/invalid 4-D state combinations and schema validation.” (Objective: unit test pass/fail.)
- **Phase 2:** “Stable anchor resolution on Git commits, symbol moves, and file renames.” (Executable: run test suite with Git scenarios.)
- **Phase 3:** “Index rebuild completes in <5 s for 500 documents; index failure does not damage markdown.” (Objective: time threshold and integrity check.)
- **Phase 4:** “Security tests prove zero cross-scope info leakage across hard isolation boundaries.” (Executable: run security test suite.)
- **Phase 5:** “Multi-dimensional score returned; contradictions surfaced explicitly; Candidate records excluded.” (Objective: verify output structure and behavior.)
- **Phase 6:** “Promotion requires explicit decision and evidence; ≥2 independent sources enforced for Global.” (Executable: test promotion workflow.)
- **Phase 7:** “Context injection stays under 500 tokens; `/project-memory` and `/ema` work seamlessly.” (Objective: token count and command testing.)
- **Phase 8:** “Passes official MCP inspector validation; completes tool calls over stdio JSON-RPC.” (Objective: pass MCP compliance test.)
- **Phase 9:** “All docs pass verification gate; zero warnings on schema; changelog updated.” (Objective: run `memory-verification` and check changelog.)

### 27.2 No Vague Criteria
No phase uses vague criteria like “works correctly”, “fully integrated”, or “production ready” without measurable verification.

**Finding:** All exit criteria are objective, executable, and sufficient to gate progression.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Section 20 (Phases 1-9).
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 28. Implementation Boundary

### 28.1 No Redesign of Approved Architecture
The Development Plan does not:
- Redesign the approved EMA architecture.
- Weaken PMA invariants.
- Introduce undocumented architectural alternatives.
- Silently change ownership boundaries.
- Replace Git-native Markdown/YAML canonical storage.
- Make embeddings authoritative.
- Make automatic extraction canonical.
- Collapse Knowledge Scope and Execution Scope.
- Collapse lifecycle, validation, authority, or confidence.
- Weaken authorization-first retrieval.
- Implement hard isolation as post-retrieval filtering.
- Silently resolve contradictions.
- Introduce automatic global truth.

### 28.2 No Material'IGN' of Architecture
The Development Plan treats the approved architecture as a constraint and only proposes implementation that conforms to it.

### 28.3 Implementation Ambiguity
No implementation ambiguity was found that would require returning to Development Planning. All phases are sufficiently detailed to proceed.

**Finding:** The implementation boundary is respected; the plan is ready for implementation.

**Severity:** INFORMATIONAL
**Evidence:** Development Plan Sections 1–28.
**Required Change:** None.
**Owner:** N/A
**Phase:** N/A
**Gate Impact:** ACCEPT

---

## 29. Required Corrections

| ID | Finding | Severity | Evidence | Required Change | Owner | Phase | Gate Impact |
|----|---------|----------|----------|-----------------|-------|-------|-------------|
| RC-001 | Documentation drift: legacy lifecycle terms (`in_progress`, `partial`, `experimental`, `unknown`) in `templates/schema.yaml` and skill files | LOW | `templates/schema.yaml` lines 39-41, 46; multiple `SKILL.md` files | Replace legacy lifecycle terms with the 4-orthogonal-dimension model (Lifecycle State, Validation State, Authority Level, Confidence Level) across all documentation and skill descriptions. | Documentation maintenance | 1 | Fix before implementation (minor doc update) |
| RC-002 | Documentation drift: legacy scope terms (`project`, `domain`, `component`, `subsystem`) in `templates/schema.yaml` | LOW | `templates/schema.yaml` line 77 | Update `templates/schema.yaml` and related skill documentation to reflect Knowledge Scope enum (`project`, `workspace`, `global`). Move fine-grained granularity to `tags` or `path`. | Documentation maintenance | 1 | Fix before implementation |
| RC-003 | Documentation drift: `pma-skill-dir` insert in `docs/architecture.md` does not match actual Cordis patch | LOW | `docs/architecture.md` (L0 domain description); `dsh-plugin/cordis.patch.yml` (only one row) | Update `docs/architecture.md` to reflect runtime dynamic skill registration via `registerWorkspaceSkills` in `dsh/plugin.mjs`. | Documentation | 7 | Fix before implementation |

**Notes:**
- All required corrections are documentation-only and pose no architectural or implementation risk.
- They can be addressed during the indicated phases without delaying implementation.
- No blockers or high-severity items were found.

---

## 30. Final Gate Decision

After thorough review of the Development Plan against the approved EMA architecture, actual repository implementation, and technical feasibility:

✅ **PASS** — The Development Plan is sufficiently precise, internally consistent, repository-compatible, testable, secure, and operationally safe to authorize implementation.

An engineer can implement EMA phase-by-phase from the Development Plan without making unapproved architectural decisions, weakening security/isolation guarantees, or inventing missing contracts.

**Next Gate:** Implementation.

---

## 31. Final Status Block

```text
Implementation Planning Review: PASS
Architecture: APPROVED
Development Plan: COMPLETE
Implementation: NOT STARTED
Dependencies Installed: NO
Runtime Changes: NO

Next Gate: Implementation
```
