# Memory Change Audit Log

Append-only log of all Project Memory knowledge changes. Each entry records
what changed, why, and with what confidence.

---

### 2026-09-08 — Architecture Evolution (Phase 1)

- **Path:** `AGENTS.md`, `dsh-plugin/dsh/slash-project-memory.mjs`, `skills/memory-edit/SKILL.md`, `docs/architecture.md`
- **Operation:** Update
- **Reason:** Add L0 domain summaries, retrieval trace mode (`--trace`), and knowledge change audit log per OpenViking evolution research
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — Frontmatter Schema Standardization (Phase 2)

- **Path:** `templates/schema.yaml`, `templates/TEMPLATE.md`, `templates/SOLUTIONS.md`
- **Operation:** Update
- **Reason:** Standardize frontmatter across all knowledge types; add `confidence` field; extend `related:` to support typed links; add `domain_readme` schema with freshness fields
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md (typed links proposal)
- **Verified By:** knowledge-classification

### 2026-09-08 — DSH Plugin Enhancements (Phase 3)

- **Path:** `dsh-plugin/dsh/plugin.mjs`
- **Operation:** Update
- **Reason:** Add post-task compounding prompt (agent/post-step listener), freshness warning on session start (checks pending_updates in domain READMEs), COMPOUNDING_ENABLED env var support
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — Agent Documentation Update

- **Path:** `agents/project-memory.md`
- **Operation:** Update
- **Reason:** Document new features: L0 summaries, retrieval trace, audit log, typed links, freshness indicators, post-task compounding
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — DSH Plugin Version Bump (0.4.28)

- **Path:** `dsh-plugin/package.json`
- **Operation:** Update
- **Reason:** Bump version 0.4.27 → 0.4.28; update nodeVersions compatibility (<25.0.0) for GitHub Actions Node 24 fallback; add dsh 0.1.5-alpha.1 to compatible releases
- **Confidence:** High
- **Evidence Source:** npm publish workflow failure (exit code 1); Node 20 deprecation warning
- **Verified By:** repository-audit
### 2026-09-09 — DSH Plugin Syntax Fix (v0.4.29)

- **Path:** `dsh-plugin/dsh/slash-project-memory.mjs`
- **Operation:** Fix
- **Reason:** Unescaped backtick in template literal string caused SyntaxError on dsh boot ("Unexpected identifier 'knowledge'"). The `knowledge-compounding` routing line used bare ` backticks instead of escaped `. Fixed by escaping all backticks in the compounding branch.
- **Confidence:** High
- **Evidence Source:** dsh web startup failure, node --check
- **Verified By:** syntax check

### 2026-09-14 — WSL/Linux support for DSH plugin (memory update)

- **Path:** `dsh-plugin/README.md` (updated with the feature), no `docs/` rewrite
- **Operation:** Update (record of repository change, not memory change)
- **Reason:** dsh-plugin 0.4.31 made `codebase-memory-bridge.mjs` platform-aware (POSIX
  `codebase-memory-mcp` on Linux/WSL, .exe on Windows; platform-specific project slugs).
  Existing Project Memory contains no platform-specific claims about the CBM bridge,
  so no stale/obsolete knowledge detected; memory stays current via README.
- **Confidence:** High
- **Evidence Source:** commit 61ee45514; `dsh-plugin/test/codebase-memory-bridge.test.mjs`
  (3/3 passing)
- **Verified By:** memory-verification

### 2026-09-21 — EMA Architecture Research Package

- **Path:** `docs/research/ema/` (5 new files), `AGENTS.md` (L0 domain + nav table updated)
- **Operation:** Add (new research domain)
- **Reason:** EMA Architecture Discovery goal — researched how PMA should evolve into
  Engineering Memory Agent. Deep-investigated Supermemory (supermemoryai/supermemory,
  primary source: repo code + CLAUDE.md + MCP server source). Produced: Supermemory
  deep investigation, Capability Matrix (PMA vs Supermemory), Gap Analysis (12 critical
  gaps), EMA Architecture Blueprint (32 architectural questions answered, all §12
  deliverables produced), Research Gate Checklist (all §15 items satisfied).
  Added `docs/research/ema/` as L0 domain in AGENTS.md.
- **Confidence:** High (primary source code verified; SMFS benchmark claim unverifiable/internal)
- **Evidence Source:** github.com/supermemoryai/supermemory (main, 2026-09),
  docs/research/ema/supermemory-deep-investigation.md
- **Verified By:** docs/research/ema/research-gate-checklist.md
- **Development Gate:** Research complete. Architecture Review required before implementation.

### 2026-09-21 — EMA Architecture Revision → Architecture Approval Candidate

- **Path:** `docs/research/ema/ema-architecture-blueprint.md` (revised), `docs/research/ema/architecture-approval-candidate.md` (new), `docs/research/ema/revision-plan.md` (new), `AGENTS.md` (updated)
- **Operation:** Update / Add (Architecture Approval Candidate)
- **Reason:** Resolved all six blocking architectural areas identified in Architecture Review:
  1. Lifecycle normalization (4 orthogonal dimensions: Lifecycle, Validation, Authority, Confidence)
  2. Scope semantics (Knowledge Scope: Project/Workspace/Global vs Execution Scope: Session/Task)
  3. Promotion policy (formal pipeline, authority matrix, lineage, ≥2 project defensible default)
  4. Stable evidence anchors (URI/URN schema `ema://evidence/...`, logical anchors, source-change flow)
  5. Hard isolation (6 explicit operational boundaries: Storage, Index, Query, Auth, Promotion, Export)
  6. Policy and retrieval authorization (Policy Layer, fail-closed authorization-first retrieval pipeline)
  Produced Architecture Approval Candidate and verified all approval readiness items.
- **Confidence:** High (all blocking assumptions resolved; no code implemented; PMA invariants preserved)
- **Evidence Source:** `docs/research/ema/architecture-approval-candidate.md`, `docs/research/ema/ema-architecture-blueprint.md`
- **Verified By:** Approval Readiness Checklist (24/24 items ✅)
- **Development Gate:** Architecture Revision complete. Architecture Approval required before Development Planning.

### 2026-09-22 — EMA Development Plan Complete

- **Path:** `docs/research/ema/development-plan.md` (new)
- **Operation:** Add (Development Planning deliverable)
- **Reason:** Completed Implementation Planning phase for Engineering Memory Agent (EMA) based on approved Architecture Approval Candidate. Produced a dependency-aware, phased development plan covering component mapping, storage/index plans, scope/authorization, hard isolation, evidence/subsystem, retrieval, candidate/promotion, DSH/MCP integration, migration strategy, testing/security, benchmarking, failure/recovery, observability, risks, and rollout strategy. No runtime code changes performed; this is a plan-only artifact.
- **Confidence:** High (derived directly from approved architecture and actual PMA repository audit)
- **Evidence Source:** `docs/research/ema/development-plan.md`
- **Verified By:** Development Planning Gate checklist (28/28 items ✅)
- **Development Gate:** Development Planning complete. Implementation Planning Review required before implementation begins.

### 2026-09-22 — EMA Implementation Planning Review (PASS)

- **Path:** `docs/research/ema/implementation-planning-review.md` (new)
- **Operation:** Add (Implementation Planning Review deliverable)
- **Reason:** Conducted comprehensive 31-section review of `docs/research/ema/development-plan.md` against approved architecture and repository implementation. Verified phase dependencies, internal MVP vertical slice, 4-D lifecycle model, relationship typing, evidence identity, disposable derived SQLite-vec index, authorization-first retrieval pipeline, No-Probe isolation across 6 boundaries, and Node.js v24 runtime feasibility. Gate verdict: PASS.
- **Confidence:** High
- **Evidence Source:** `docs/research/ema/implementation-planning-review.md`
- **Verified By:** Implementation Planning Review Gate (31/31 sections verified)
- **Development Gate:** Implementation Planning Review: PASS. Implementation authorized to begin with Phase 1.

### 2026-09-22 — EMA Phase 1: Core EKU Domain Model & Schema v2

- **Path:** `dsh-plugin/src/core/constants.mjs` (new), `dsh-plugin/src/core/schema.mjs` (new), `dsh-plugin/src/core/eku.mjs` (new), `dsh-plugin/src/core/index.mjs` (new), `templates/schema.yaml` (updated), `templates/TEMPLATE.md` (updated), `dsh-plugin/test/unit/eku-schema.test.mjs` (new)
- **Operation:** Add / Update (Phase 1 implementation)
- **Reason:** Implemented foundational EMA EKU domain model, Schema v2, and the 4-orthogonal-dimension lifecycle model (Lifecycle State, Validation State, Authority Level, Confidence Level). Implemented zero-dependency YAML frontmatter parser, serializer, and semantic validator. Enforced deterministic invariants (Candidate cannot be Current in canonical storage, Superseded requires superseded_by, Global scope requires min_sources_checked >= 2, all 12 relationship types supported). Resolved RC-001 (lifecycle terminology normalization) and RC-002 (knowledge scope normalization). All 19 unit tests passing.
- **Confidence:** High
- **Evidence Source:** `dsh-plugin/test/unit/eku-schema.test.mjs`, `templates/schema.yaml`, `templates/TEMPLATE.md`
- **Verified By:** `node --test dsh-plugin/test/unit/eku-schema.test.mjs` (19/19 passing)
- **Development Gate:** Phase 1 complete. Next Gate: Phase 1 Verification Review.

### 2026-09-22 — EMA Phase 1 Verification Review (PASS)

- **Path:** `docs/research/ema/phase-1-verification-review.md` (new)
- **Operation:** Add (Phase 1 verification review)
- **Reason:** Conducted independent 25-section verification review of Phase 1 implementation against approved architecture, development plan, and repository evidence. Verified 4-D orthogonal lifecycle dimensions, schema validation, supersession rules, 12 directional relationship types, Knowledge Scope normalization (project, workspace, global), RC-001 and RC-002 resolution, backward compatibility, canonical storage preservation (zero DB/vector dependencies), phase boundaries, and 14 architecture invariants. Independent test execution confirmed 22/22 tests passing. Verdict: PASS.
- **Confidence:** High
- **Evidence Source:** `docs/research/ema/phase-1-verification-review.md`
- **Verified By:** Phase 1 Verification Review Gate (PASS)
- **Development Gate:** Phase 1 verified. Phase 2 Authorization granted.

### 2026-09-22 — EMA Phase 2: Evidence Anchors & Grounding Subsystem

- **Path:** `dsh-plugin/src/evidence/constants.mjs` (new), `dsh-plugin/src/evidence/anchor.mjs` (new), `dsh-plugin/src/evidence/staleness.mjs` (new), `dsh-plugin/src/evidence/git-resolver.mjs` (new), `dsh-plugin/src/evidence/resolver.mjs` (new), `dsh-plugin/src/evidence/index.mjs` (new), `dsh-plugin/src/core/schema.mjs` (updated), `dsh-plugin/src/core/index.mjs` (updated), `skills/repository-audit/SKILL.md` (updated), `templates/schema.yaml` (updated), `AGENTS.md` (updated), `dsh-plugin/test/unit/evidence-anchor.test.mjs` (new)
- **Operation:** Add / Update (Phase 2 implementation)
- **Reason:** Implemented stable evidence anchor subsystem establishing verifiable grounding from EKU to immutable Git commit references and logical anchors (`ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>`). Supported all 8 approved logical anchor types (`sym`, `ast`, `sec`, `test`, `cfg`, `pr`, `issue`, `line`). Enforced immutable Git commit SHA validation (rejecting mutable references `HEAD`, `main`, `master`, `dev`, etc.). Implemented strict repository-relative path validation (rejecting traversal, absolute POSIX, Windows drive, UNC, encoded traversal). Built evidence resolver and grounding engine distinguishing `fresh`, `stale`, and `invalid` states. Preserved historical anchors as immutable during file renames while detecting rename metadata. Enforced invariant that evidence resolution never manufactures EKU `validation_state: Verified`. Zero dependencies added; all 45 unit and integration tests passing.
- **Confidence:** High
- **Evidence Source:** `dsh-plugin/test/unit/evidence-anchor.test.mjs`, `dsh-plugin/src/evidence/`
- **Verified By:** `node --test dsh-plugin/test/codebase-memory-bridge.test.mjs dsh-plugin/test/unit/eku-schema.test.mjs dsh-plugin/test/unit/evidence-anchor.test.mjs` (45/45 passing)
- **Development Gate:** Phase 2 complete. Next Gate: Phase 2 Verification Review.

### 2026-09-22 — EMA Phase 3: Derived Storage & Index Engine
- **Path:** `dsh-plugin/src/index/db.mjs`, `dsh-plugin/src/index/lexical-index.mjs`, `dsh-plugin/src/index/vector-index.mjs`, `dsh-plugin/src/index/rebuild.mjs`, `dsh-plugin/src/index/index.mjs`, `dsh-plugin/test/integration/derived-index.test.mjs`
- **Operation:** Add (Phase 3 implementation)
- **Reason:** Implemented SQLite + FTS5 + sqlite-vec derived index in `.ema/index.db`. Pure derived cache that can be dropped and rebuilt with zero canonical data loss. FTS5 parameterized query sanitization, idempotent upserting, WAL mode. Verified 28/28 tests.
- **Confidence:** High
- **Verified By:** Phase 3 Verification Review (PASS)

### 2026-09-22 — EMA Phase 4: Policy & Authorization Engine
- **Path:** `dsh-plugin/src/policy/constants.mjs`, `dsh-plugin/src/policy/authorization.mjs`, `dsh-plugin/src/policy/isolation.mjs`, `dsh-plugin/src/policy/index.mjs`, `dsh-plugin/test/unit/policy-authorization.test.mjs`, `dsh-plugin/test/security/hard-isolation.test.mjs`
- **Operation:** Add (Phase 4 implementation)
- **Reason:** Implemented 4-Actor Authorization Engine (human, agent, system, project_admin) and 6-Boundary Hard Isolation (Storage, Index, Query, Authorization, Promotion, Export). Fail-closed evaluation, zero-knowledge 404 ScopeNotFound, export pattern scrubbing. Verified 29/29 tests.
- **Confidence:** High
- **Verified By:** Phase 4 Verification Review (PASS)

### 2026-09-22 — EMA Phase 5: Authoritative 6-Stage Retrieval Engine
- **Path:** `dsh-plugin/src/retrieval/ranking.mjs`, `dsh-plugin/src/retrieval/contradiction.mjs`, `dsh-plugin/src/retrieval/context-builder.mjs`, `dsh-plugin/src/retrieval/pipeline.mjs`, `dsh-plugin/src/retrieval/index.mjs`, `dsh-plugin/test/integration/retrieval-pipeline.test.mjs`, `dsh-plugin/test/security/contradiction-surface.test.mjs`
- **Operation:** Add (Phase 5 implementation)
- **Reason:** Implemented 6-stage retrieval pipeline: Stage 1 Authorization Gate -> Stage 2 Candidate Retrieval -> Stage 3 Lifecycle Filtering -> Stage 4 Multi-Dimensional Ranking -> Stage 5 Contradiction Surfacing -> Stage 6 Context Assembly. Enforced zero silent contradiction resolution. Verified 9/9 tests.
- **Confidence:** High
- **Verified By:** Phase 5 Verification Review (PASS)

### 2026-09-22 — EMA Phase 6: Candidate Queue & Promotion Pipeline
- **Path:** `dsh-plugin/src/storage/candidate-store.mjs`, `dsh-plugin/src/promotion/lineage.mjs`, `dsh-plugin/src/promotion/pipeline.mjs`, `dsh-plugin/src/promotion/index.mjs`, `skills/knowledge-compounding/SKILL.md`, `skills/memory-edit/SKILL.md`, `skills/obsolete-knowledge/SKILL.md`, `dsh-plugin/test/unit/candidate-store.test.mjs`, `dsh-plugin/test/integration/candidate-promotion.test.mjs`
- **Operation:** Add / Update (Phase 6 implementation)
- **Reason:** Implemented candidate extraction queue in `.ema/candidates/`, validation gate (`validateCandidate`), scope promotion (`promoteScope`), lineage tracking (`promoted_from`), global scope source independence (>= 2 distinct repo IDs), and contradiction quarantine (`quarantineUnit`). Verified 16/16 tests.
- **Confidence:** High
- **Verified By:** Phase 6 Verification Review (PASS)

### 2026-09-22 — EMA Phase 7: DSH Plugin & Skill Evolution
- **Path:** `dsh-plugin/dsh/plugin.mjs`, `dsh-plugin/dsh/slash-ema.mjs`, `agents/project-memory.md`, `dsh-plugin/test/integration/dsh-plugin-hooks.test.mjs`
- **Operation:** Add / Update (Phase 7 implementation)
- **Reason:** Added `/ema` slash command (recall, status, verify, promote), static L0 context injection strictly under 500 tokens, and updated agent routing table. Verified 5/5 tests.
- **Confidence:** High
- **Verified By:** `dsh-plugin/test/integration/dsh-plugin-hooks.test.mjs`

### 2026-09-22 — EMA Phase 8: Standalone MCP Server & CLI Tooling
- **Path:** `dsh-plugin/src/mcp/tools.mjs`, `dsh-plugin/src/mcp/server.mjs`, `dsh-plugin/bin/ema-mcp.mjs`, `dsh-plugin/bin/ema-cli.mjs`, `dsh-plugin/package.json`, `dsh-plugin/test/integration/mcp-server.test.mjs`
- **Operation:** Add / Update (Phase 8 implementation)
- **Reason:** Implemented JSON-RPC 2.0 stdio MCP server exposing 5 tools (`ema_recall`, `ema_add`, `ema_context`, `ema_validate`, `ema_promote`) and maintenance CLI (`ema index`, `ema verify`, `ema status`, `ema recall`). Verified 8/8 tests.
- **Confidence:** High
- **Verified By:** `dsh-plugin/test/integration/mcp-server.test.mjs`

### 2026-09-22 — EMA Phase 9: Migration, Multi-Project Validation & Rollout
- **Path:** `docs/architecture.md`, `docs/lessons/cordis-inject-contract.md`, `docs/solutions/dsh-plugin-troubleshooting.md`, `dsh-plugin/bin/migrate-docs.mjs`, `dsh-plugin/test/integration/multi-project-isolation.test.mjs`, `docs/CHANGELOG-MEMORY.md`
- **Operation:** Update / Add (Phase 9 implementation)
- **Reason:** Migrated PMA v0.4 canonical documentation to EKU Schema v2; rebuilt `.ema/index.db` derived index; performed multi-project workspace isolation test across two repos. Zero verification warnings; all 172 regression tests passing.
- **Confidence:** High
- **Verified By:** Full test suite regression (172/172 passing) + `ema verify docs` (0 issues).
- **Development Gate:** All Development Plan phases (Phases 1-9) COMPLETE & VERIFIED.
