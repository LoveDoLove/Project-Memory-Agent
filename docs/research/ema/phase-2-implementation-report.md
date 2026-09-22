# Engineering Memory Agent (EMA) — Phase 2 Implementation Report

> **Target System:** Engineering Memory Agent (EMA)
> **Repository:** `LoveDoLove/Project-Memory-Agent`
> **Deliverable:** Phase 2 Implementation Report
> **Status:** Implementation Complete — Awaiting Independent Verification Review
> **Date:** 2026-09-22
> **Author:** EMA Phase 2 Implementation Engineer

---

## 1. Executive Summary

Phase 2 of the Engineering Memory Agent (EMA) evolution plan — **Evidence Anchors & Grounding Subsystem** — has been implemented strictly within its authorized scope boundary. Phase 2 establishes durable, verifiable evidence grounding between Engineering Knowledge Units (EKUs) and repository artifacts:

```text
EKU
 ↓
Evidence Anchor (ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>)
 ↓
Immutable Git Reference (commit SHA)
 ↓
Repository File / Logical Anchor (sym, ast, sec, test, cfg, pr, issue, line)
 ↓
Grounding Verification
 ↓
Fresh / Stale / Invalid Evidence State
```

All 12 Phase 2 functional requirements and 14 architecture invariants have been preserved. Crucially, evidence grounding is strictly decoupled from EKU validation: resolving an evidence anchor never automatically manufactures `validation_state: verified`.

The test suite contains 45 automated unit and integration tests (23 new Phase 2 tests, 19 Phase 1 regression tests, and 3 existing CBM bridge tests), all passing in 91 ms with zero external npm dependencies introduced.

---

## 2. Phase 2 Scope

The authorized scope of Phase 2 encompasses:
1. **Evidence-Anchor Domain Model:** Canonical representation `ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>`.
2. **Immutable Git Reference Validation:** Deterministic validation of commit SHAs (7 to 40 hex characters) and rejection of mutable references (`HEAD`, `main`, `master`, branches).
3. **Approved Logical Anchor Types:** Exactly 8 types: `sym`, `ast`, `sec`, `test`, `cfg`, `pr`, `issue`, `line`.
4. **Parser & Serializer:** Pure-ESM zero-dependency deterministic parser and serializer with semantic round-trip stability.
5. **Path Validation:** Repository-relative path safety rejecting `../` traversal, absolute POSIX paths, Windows drive paths, UNC shares, and URL-encoded traversal attempts.
6. **Evidence Resolver:** Grounding resolution against historical Git commit blobs and current working-tree content.
7. **Grounding & Staleness States:** Clean discrimination among `fresh`, `stale`, and `invalid` states with explicit staleness reasons.
8. **Rename & Refactor Behavior:** Historical anchors remain immutable; resolvers detect file moves and report rename metadata without mutating the anchor.
9. **Phase 1 EKU Integration:** Schema v2 integration validating embedded `ema://` evidence items while preserving legacy path strings.
10. **Documentation & Skill Updates:** Updated `skills/repository-audit/SKILL.md`, `templates/schema.yaml`, `AGENTS.md`, and `docs/CHANGELOG-MEMORY.md`.

---

## 3. Architecture References

The implementation is grounded in the approved EMA design and planning documents:
- `docs/research/ema/ema-architecture-blueprint.md` (Section 7: Stable Evidence Anchors)
- `docs/research/ema/architecture-approval-candidate.md` (Area 4: Stable Evidence Anchors & Grounding Model)
- `docs/research/ema/development-plan.md` (Phase 2: Stable Evidence Anchor Subsystem, lines 434–466 and 738–748)
- `docs/research/ema/implementation-planning-review.md` (Verdict: PASS)
- `docs/research/ema/phase-1-verification-review.md` (Verdict: PASS)

---

## 4. Repository Changes

### 4.1 New Modules Added (`dsh-plugin/src/evidence/`)
- `dsh-plugin/src/evidence/constants.mjs`: Logical anchor types, grounding states, staleness reasons, commit SHA regex, and disallowed mutable reference lists.
- `dsh-plugin/src/evidence/anchor.mjs`: `EvidenceAnchor` class, `validateRepositoryRelativePath()`, `parseLogicalAnchor()`, `validateEvidenceAnchor()`, `createEvidenceAnchor()`, `serializeEvidenceAnchor()`, and `parseEvidenceAnchor()`.
- `dsh-plugin/src/evidence/staleness.mjs`: Content inspectors for symbol declarations, markdown section headings, test suites, configuration paths, AST nodes, PR/issue references, and line ranges.
- `dsh-plugin/src/evidence/git-resolver.mjs`: Safe Git child process execution (`git rev-parse`, `git cat-file`, `git log -M`) and local filesystem working-tree inspection.
- `dsh-plugin/src/evidence/resolver.mjs`: `resolveEvidenceAnchor()` and `checkStaleness()` orchestrating grounding verification.
- `dsh-plugin/src/evidence/index.mjs`: Barrel export for the evidence subsystem.

### 4.2 Core Subsystem Integration (`dsh-plugin/src/core/`)
- `dsh-plugin/src/core/schema.mjs`: Added evidence array validation hook in `validateEKU()` supporting canonical `ema://` URIs alongside legacy `{ path, type }` objects.
- `dsh-plugin/src/core/index.mjs`: Re-exported evidence subsystem symbols.

### 4.3 Documentation, Skills & Templates
- `skills/repository-audit/SKILL.md`: Added canonical `ema://evidence/...` URI specification to Evidence Inventory instructions.
- `templates/schema.yaml`: Added `anchor` property description under the `evidence` field specification.
- `AGENTS.md`: Updated Level 0 domain summaries to reflect Phase 2 Evidence Anchors.
- `docs/CHANGELOG-MEMORY.md`: Appended audit log entry for Phase 2 Implementation.

### 4.4 Automated Unit Tests
- `dsh-plugin/test/unit/evidence-anchor.test.mjs`: 23 comprehensive tests covering parsing, serialization, logical anchors, Git reference validation, path traversal rejection, staleness states, file rename preservation, grounding invariants, batch checking, EKU integration, and real repository Git execution.

---

## 5. Evidence Anchor Model

The canonical URI schema is:

```text
ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
```

### Components
1. **`<repo-id>`:** Repository identifier (e.g. `github.com/org/repo` or normalized directory/slug `Project-Memory-Agent`).
2. **`<git-ref>`:** Immutable commit SHA (7 to 40 hexadecimal characters).
3. **`<file-path>`:** Normalized POSIX repository-relative path (e.g. `src/auth/jwt.ts`).
4. **`#<logical-anchor>`:** Typed anchor fragment pointing to an internal structural element.

The `EvidenceAnchor` entity is instantiated via `createEvidenceAnchor()` or `parseEvidenceAnchor()`:

```javascript
const anchor = parseEvidenceAnchor(
  'ema://evidence/github.com/org/repo/9f8a2c1b4d8e/src/auth/jwt.ts#sym:verifyToken'
);
// anchor.repoId -> 'github.com/org/repo'
// anchor.gitRef -> '9f8a2c1b4d8e'
// anchor.filePath -> 'src/auth/jwt.ts'
// anchor.logicalAnchor -> { type: 'sym', value: 'verifyToken', raw: 'sym:verifyToken' }
```

---

## 6. Immutable Git Reference Handling

### Invariant: Immutability Required
Canonical evidence anchors require immutable Git references to guarantee that historical evidence remains auditable and reproducible over time.

- **Accepted:** Commit SHAs matching `/^[0-9a-fA-F]{7,40}$/` (both 40-character full SHAs and 7–39 character short SHAs).
- **Disallowed & Deterministically Rejected:**
  - `HEAD`
  - `main`, `master`, `trunk`
  - `develop`, `dev`
  - `feature/*`, `release/*`
  - `latest`
  - Any non-hexadecimal string

Attempting to parse or create an evidence anchor with a mutable reference throws a descriptive error:
```text
Mutable Git reference 'HEAD' is disallowed in canonical evidence. Must be an immutable commit SHA.
```

---

## 7. Logical Anchor Model

Phase 2 implements exactly the 8 approved logical anchor types:

| Type | Syntax | Description | Validation Rule |
|------|--------|-------------|-----------------|
| `sym` | `sym:<name>` | Symbol identifier | Non-empty string; checks function, class, type, interface, or variable declaration |
| `ast` | `ast:<path>` | AST node path | Non-empty selector string |
| `sec` | `sec:<heading>` | Markdown heading | Non-empty string; supports URL-decoded matching against `#` headings |
| `test` | `test:<id>` | Test case identifier | Non-empty string; matches test suites (`describe`, `test`, `it`, `def test_`) |
| `cfg` | `cfg:<jsonpath>` | Config key path | Non-empty string; matches dotted JSON/YAML config keys |
| `pr` | `pr:<num>` | Pull Request number | Strictly positive integer digits (`/^\d+$/`) |
| `issue` | `issue:<num>` | Issue tracker number | Strictly positive integer digits (`/^\d+$/`) |
| `line` | `line:<start>:<end>` or `line:<start>` | Line number range | Positive integers $\ge 1$; requires `start <= end` |

Unrecognized anchor types (e.g. `foo:bar`), missing values (e.g. `sym:`), inverted line ranges (e.g. `line:50:20`), and non-numeric PR/issue anchors are rejected at parse time.

---

## 8. Parser / Serializer

Deterministic ESM functions:
- `parseEvidenceAnchor(uriOrObject)`: Parses canonical URI strings or structured objects into `EvidenceAnchor` instances.
- `serializeEvidenceAnchor(anchor)`: Emits canonical `ema://evidence/...` strings.
- `createEvidenceAnchor(fields)`: Validates and constructs an `EvidenceAnchor`.
- `validateEvidenceAnchor(anchor)`: Evaluates all 4 components returning `{ valid, errors }`.

Round-trip identity is formally proven by automated tests:
```text
Structured Object → Canonical URI → Parsed Object (identity preserved)
```

---

## 9. Path Validation

Path safety is enforced by `validateRepositoryRelativePath(filePath)`:
- **Disallowed & Rejected:**
  - `../` or `/../` directory traversal
  - Absolute POSIX paths (`/etc/passwd`)
  - Windows drive letters (`C:\file.ts`, `D:/file.js`)
  - UNC network shares (`\\server\share\file.ts`)
  - URL-encoded traversal (`%2e%2e%2f`, `%2e%2e%5c`, `..%2f`)
- Path validation is purely structural and does not require filesystem I/O.

---

## 10. Evidence Resolver

The evidence resolver is implemented in `dsh-plugin/src/evidence/resolver.mjs` via `resolveEvidenceAnchor(anchorInput, options)`.

Resolution flow:
1. **Syntax Validation:** Parses and validates the anchor structure.
2. **Historical Commit Resolution:** Queries Git (via `git cat-file -p <gitRef>:<filePath>` or custom `commitReader`) to verify that the commit existed and that the file existed at that commit. Verifies that the logical anchor was present in the historical commit blob.
3. **Current Working-Tree Resolution:** Queries the active working tree (via filesystem read or `currentFileReader`) to check whether the file exists and whether the content matches.
4. **Drift & Rename Detection:** If the working-tree file is missing, queries Git history (`git log -M --follow`) to detect renames. If the file was modified, inspects whether the logical anchor still resolves or has shifted.

---

## 11. Grounding State

The resolver outputs three mutually exclusive grounding states:

```text
GROUNDING_STATES:
├── fresh: Resolvable at commit and identical in active working tree (or intact with zero drift)
├── stale: File content changed, line shifted, symbol moved, or file renamed
└── invalid: Commit missing, file missing at commit, or logical anchor unresolved at commit
```

Grounding result schema:
```javascript
{
  state: 'fresh' | 'stale' | 'invalid',
  reason: string | null,
  anchor: EvidenceAnchor,
  historicalLine?: number,
  currentLine?: number,
  matchText?: string,
  renameDetected?: { from: string, to: string },
  error?: string,
  verifiedAt: string // ISO timestamp
}
```

---

## 12. Staleness Detection

Staleness reasons (`STALENESS_REASONS`):
- `content_changed`: File content in working tree differs from historical commit blob.
- `anchor_shifted`: Logical anchor remains intact in working tree, but its line number shifted.
- `anchor_unresolved`: Logical anchor existed at commit, but cannot be located in current file.
- `file_renamed`: File no longer exists at historical path, but Git detected a rename to a new path.
- `file_deleted`: File no longer exists in working tree and was not renamed.
- `commit_missing`: The commit SHA does not exist in the local Git repository.
- `file_missing_at_commit`: The file was not present in the historical commit.
- `anchor_unresolved_at_commit`: The logical anchor was not present in the historical commit blob.
- `syntax_invalid`: Malformed URI or anchor syntax.

### Rename Invariant: Historical Anchors Remain Immutable
When a file rename is detected, the historical evidence anchor is **never** mutated:
```javascript
assert.strictEqual(res.anchor.filePath, 'src/auth.ts'); // Unchanged!
assert.deepStrictEqual(res.renameDetected, {
  from: 'src/auth.ts',
  to: 'src/security/auth.ts',
});
```
Any updated anchor must be created separately as a new evidence item during an audit/compounding operation.

---

## 13. Phase 1 Integration

The Phase 1 EKU validator (`dsh-plugin/src/core/schema.mjs`) was extended with check 14:
- Validates any evidence item starting with `ema://evidence/` or containing an `anchor` string property using `parseEvidenceAnchor()`.
- Rejects malformed anchors or mutable references in EKU frontmatter.
- Continues to accept legacy `{ path, type }` objects seamlessly.

---

## 14. Backward Compatibility

Phase 2 preserves 100% backward compatibility:
1. **Legacy Evidence Paths:** Plain relative paths (e.g. `path: "tests/auth/token.test.ts:42"`) continue to parse, validate, and serialize without warnings or errors.
2. **Deterministic Defaults:** No existing EKU is broken or rejected due to missing canonical anchors.
3. **Zero Destruction:** Historical evidence without commit SHAs is preserved as-is.

---

## 15. Tests Added

A comprehensive unit test suite was added in `dsh-plugin/test/unit/evidence-anchor.test.mjs`:
1. `Anchor Parsing: parses valid canonical evidence URI into EvidenceAnchor`
2. `Anchor Round-Trip: structured object -> canonical URI -> parsed object preserves identity`
3. `Logical Anchors: accepts all eight approved anchor types`
4. `Logical Anchors: rejects malformed and unapproved anchor forms`
5. `Git References: accepts valid 40-char full SHA and 7-char short SHA`
6. `Git References: rejects mutable branch references (HEAD, main, master, dev)`
7. `Git References: rejects malformed non-hex references`
8. `Path Validation: accepts valid nested repository-relative paths`
9. `Path Validation: rejects path traversal, absolute paths, Windows drives, UNC and encoded traversals`
10. `Staleness Resolver: resolves symbols, headings, tests, configs, and line ranges in text`
11. `Evidence Resolver: returns fresh for matching historical and current content`
12. `Evidence Resolver: returns stale with anchor_shifted when lines drift`
13. `Evidence Resolver: returns stale with anchor_unresolved when symbol deleted`
14. `Evidence Resolver: returns stale with file_deleted when file missing in working tree`
15. `Evidence Resolver: preserves historical anchor and detects rename when file renamed`
16. `Evidence Resolver: returns invalid when commit is missing in repository`
17. `Grounding Invariant: resolving an anchor does not set EKU validation_state to Verified`
18. `Batch Staleness: checks multiple anchors and aggregates results accurately`
19. `EKU Integration: validator rejects malformed embedded evidence anchors`
20. `EKU Integration: validator accepts valid embedded canonical anchors and legacy items`
21. `Anchor Parsing: rejects missing URI components and bad schemes`
22. `Staleness Resolver: resolves sec, test, cfg, pr, and ast in realistic texts`
23. `End-to-End Real Git: resolves real commit blob and heading anchor from repo`

---

## 16. Test Execution Results

```text
$ node --test dsh-plugin/test/codebase-memory-bridge.test.mjs dsh-plugin/test/unit/eku-schema.test.mjs dsh-plugin/test/unit/evidence-anchor.test.mjs

✔ Windows drive-lettered paths keep the drive-letter prefix (existing behavior) (0.724684ms)
✔ Linux/WSL paths slug without a drive prefix (0.119373ms)
✔ createClient spawns a POSIX executable and completes an MCP round-trip (28.145721ms)
✔ Domain Construction: creates an EKU with defaults (1.00383ms)
✔ Round-Trip: preserves all EKU fields and markdown body accurately (1.788973ms)
✔ Four Dimensions: operates independently without conflation (0.175068ms)
✔ Validation: rejects Candidate + canonical Current in canonical storage (0.21084ms)
✔ Validation: rejects Superseded without superseded_by (0.170751ms)
✔ Validation: accepts Superseded with valid superseded_by (0.157891ms)
✔ Scope Validation: accepts project, workspace, global (0.212833ms)
✔ Scope Validation: rejects legacy intra-repo scopes (domain, component, subsystem) (1.269875ms)
✔ Global Scope: requires min_sources_checked >= 2 in promoted_from (0.235075ms)
✔ Relationships: accepts all 12 approved relationship types (0.32027ms)
✔ Relationships: accepts legacy plain string paths in related (0.152457ms)
✔ Relationships: rejects invalid relationship types (0.11496ms)
✔ Backward Compatibility: derives safe defaults for legacy frontmatter without manufacturing Verified (0.208412ms)
✔ Backward Compatibility: maps legacy status values to 4-D model safely (0.254146ms)
✔ Storage Mode: candidate authority allowed when storageMode is candidate_queue (0.12812ms)
✔ Validation: rejects invalid confidence value (e.g. unknown or invalid string) (0.178829ms)
✔ Validation: rejects invalid isolation mode (0.097336ms)
✔ Validation: rejects malformed created or last_verified dates (0.12114ms)
✔ Frontmatter: parses complex promoted_from and evidence arrays cleanly (0.855018ms)
✔ Anchor Parsing: parses valid canonical evidence URI into EvidenceAnchor (2.168048ms)
✔ Anchor Round-Trip: structured object -> canonical URI -> parsed object preserves identity (0.249421ms)
✔ Logical Anchors: accepts all eight approved anchor types (0.246282ms)
✔ Logical Anchors: rejects malformed and unapproved anchor forms (0.416259ms)
✔ Git References: accepts valid 40-char full SHA and 7-char short SHA (0.196456ms)
✔ Git References: rejects mutable branch references (HEAD, main, master, dev) (0.371713ms)
✔ Git References: rejects malformed non-hex references (0.188982ms)
✔ Path Validation: accepts valid nested repository-relative paths (0.10348ms)
✔ Path Validation: rejects path traversal, absolute paths, Windows drives, UNC and encoded traversals (0.156293ms)
✔ Staleness Resolver: resolves symbols, headings, tests, configs, and line ranges in text (0.964306ms)
✔ Evidence Resolver: returns fresh for matching historical and current content (0.728242ms)
✔ Evidence Resolver: returns stale with anchor_shifted when lines drift (0.182609ms)
✔ Evidence Resolver: returns stale with anchor_unresolved when symbol deleted (0.164067ms)
✔ Evidence Resolver: returns stale with file_deleted when file missing in working tree (0.195728ms)
✔ Evidence Resolver: preserves historical anchor and detects rename when file renamed (0.711217ms)
✔ Evidence Resolver: returns invalid when commit is missing in repository (0.127616ms)
✔ Grounding Invariant: resolving an anchor does not set EKU validation_state to Verified (1.03064ms)
✔ Batch Staleness: checks multiple anchors and aggregates results accurately (0.732572ms)
✔ EKU Integration: validator rejects malformed embedded evidence anchors (0.271747ms)
✔ EKU Integration: validator accepts valid embedded canonical anchors and legacy items (0.097585ms)
✔ Anchor Parsing: rejects missing URI components and bad schemes (0.155781ms)
✔ Staleness Resolver: resolves sec, test, cfg, pr, and ast in realistic texts (0.346468ms)
✔ End-to-End Real Git: resolves real commit blob and heading anchor from repo (5.626091ms)

ℹ tests 45
ℹ suites 0
ℹ pass 45
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 91.137016
```

---

## 17. Phase Boundary Verification

A strict code audit confirmed that **zero** Phase 3+ runtime functionality has been implemented:
- **No SQLite / FTS5 / sqlite-vec:** Zero database code in `dsh-plugin/src/`.
- **No Vector Indexes / Embeddings:** Zero vector generation, indexing, or cosine similarity logic.
- **No Retrieval / BM25 / Ranking:** Zero search ranking algorithms.
- **No Candidate Queue / Promotion Runtime:** Zero promotion pipelines or queue schedulers.
- **No Scope Isolation Engine:** Zero hard-isolation query firewalls (reserved for Phase 4).
- **No DSH Hook Integration:** Runtime hooks remain untouched (reserved for Phase 8).
- **No MCP Adapters / External Networks:** Zero network/HTTP calls or MCP protocols.

---

## 18. Dependency Audit

`dsh-plugin/package.json` was inspected:
- Added dependencies: **0**
- Modified dependencies: **0**
- Removed dependencies: **0**
- `git diff dsh-plugin/package.json` output: empty.
All parsing, validation, path checking, logical anchor matching, and Git interactions utilize native Node.js 24 APIs (`node:child_process`, `node:fs`, `node:path`, `node:test`, `node:assert`).

---

## 19. Security / Safety Review

1. **Path Traversal Defenses:** `validateRepositoryRelativePath()` strictly rejects `..`, leading `/`, Windows drive letters, UNC shares, and URL-encoded traversal (`%2e%2e%2f`).
2. **Command Injection Prevention:** All Git execution in `git-resolver.mjs` uses `execFileSync` with explicit argument arrays (e.g. `['cat-file', '-p', `${gitRef}:${filePath}`]`). Shell invocation (`sh`, `bash`, `cmd.exe`) is never used.
3. **No Unsafe Dynamic Evaluation:** Zero `eval()` or `new Function()` invocations.
4. **Immutability Protection:** Historical anchors are strictly read-only and never mutated during rename or drift events.
5. **No Certainty Manufacturing:** Resolving evidence anchors does not mutate or manufacture `validation_state: verified` on EKUs.

---

## 20. Architecture Invariant Regression Review

| Invariant | Status | Evidence |
|-----------|--------|----------|
| 1. Four orthogonal lifecycle dimensions preserved | PRESERVED | `dsh-plugin/test/unit/eku-schema.test.mjs` (4-D tests passing) |
| 2. Candidate $\ne$ Current in canonical storage | PRESERVED | Invariant enforced in `schema.mjs` |
| 3. Verified $\ne$ Current | PRESERVED | EKU schema maintains separate dimensions |
| 4. Current $\ne$ Canonical | PRESERVED | EKU schema maintains separate dimensions |
| 5. Confidence does not determine Authority | PRESERVED | EKU schema maintains separate dimensions |
| 6. Historical knowledge is preservable | PRESERVED | Preserved in schema and test suite |
| 7. Superseded requires `superseded_by` | PRESERVED | Invariant enforced in `schema.mjs` |
| 8. Knowledge Scope separate from Execution Scope | PRESERVED | `[project, workspace, global]` only |
| 9. Active scopes restricted to project/workspace/global | PRESERVED | Legacy scopes rejected |
| 10. Markdown/YAML remains canonical source of truth | PRESERVED | Zero database/index files introduced |
| 11. Phase 2 does not require an index/database | PRESERVED | Implemented with native ESM and Git |
| 12. Legacy compatibility does not manufacture certainty | PRESERVED | Legacy items default to `unreviewed` |
| 13. Resolving evidence anchor never manufactures `Verified` | PRESERVED | Verified in `evidence-anchor.test.mjs` |
| 14. Phase 3–9 runtime functionality is absent | PRESERVED | Boundary audit confirmed 0 leakage |

---

## 21. Findings

```text
ID: FIND-P2-001
Finding: Real Git repository verification in git-resolver.mjs requires git CLI in PATH.
Severity: LOW
Evidence: git-resolver.mjs relies on execFileSync('git', ...). If git is absent, isGitAvailable() returns false and resolver falls back to provided commitReader/currentFileReader or returns invalid.
Impact: In environments without git CLI (e.g. minimal container runtime), grounding verification requires injected commitReader/currentFileReader options.
Required Action: Document dependency on git CLI for local CLI runtime in development plan.
Phase: Phase 2
```

---

## 22. Known Limitations

1. **AST Path Resolution Depth:** The AST anchor resolver (`ast:<path>`) performs token and path component scanning. Deep semantic AST evaluation using Babel/TypeScript AST parsers is deferred to Phase 8 / CBM bridge integration.
2. **Git Commit History Dependency:** Historical resolution requires the Git object database (`.git/objects`) to be accessible locally. Shallow clones (`--depth 1`) may not contain historical commit blobs referenced by older anchors.

---

## 23. Phase 2 Exit Criteria

### Functional
- [x] Evidence-anchor domain model implemented (`dsh-plugin/src/evidence/anchor.mjs`).
- [x] Canonical immutable evidence URI implemented (`ema://evidence/...`).
- [x] Immutable Git-reference validation implemented (`COMMIT_SHA_REGEX`, mutable refs rejected).
- [x] All 8 approved logical anchor types implemented (`sym`, `ast`, `sec`, `test`, `cfg`, `pr`, `issue`, `line`).
- [x] Deterministic parser implemented (`parseEvidenceAnchor`).
- [x] Deterministic serializer implemented (`serializeEvidenceAnchor`).
- [x] Evidence validation implemented (`validateEvidenceAnchor`).
- [x] Repository-relative path validation implemented (`validateRepositoryRelativePath`).
- [x] Evidence resolver implemented within approved scope (`resolveEvidenceAnchor`).
- [x] Fresh/stale/invalid states distinguishable (`GROUNDING_STATES`).
- [x] Historical anchors remain immutable during file renames.
- [x] Rename/refactor staleness behavior implemented (`detectGitRename`, `renameDetected`).
- [x] Phase 1 EKU semantics remain intact (validation hook added, regression tests pass).

### Testing
- [x] Phase 2 tests pass (23/23 tests pass).
- [x] Phase 1 regression tests pass (19/19 tests pass).
- [x] Malformed/boundary cases covered.
- [x] Immutable Git-reference behavior covered.
- [x] Path traversal/absolute paths covered.
- [x] Logical anchor validation covered.
- [x] Rename/staleness behavior covered.
- [x] Grounding cannot manufacture `Verified` covered.

### Architecture
- [x] Markdown/YAML remains canonical source of truth.
- [x] No database/index/vector runtime introduced.
- [x] No Phase 3+ runtime implemented.
- [x] Phase 1 four-dimensional model remains orthogonal.
- [x] Existing PMA relationships remain compatible.
- [x] No architecture silently changed.

### Safety
- [x] No destructive migration performed.
- [x] No silent anchor mutation.
- [x] No secret exposure.
- [x] No unsafe dynamic execution (`eval`).
- [x] No unauthorized dependency installation (0 dependencies added).
- [x] No cross-project access mechanism introduced.

---

## 24. Final Status

```text
Phase 2 Implementation: COMPLETE

Architecture: APPROVED
Development Plan: COMPLETE
Phase 1 Verification: PASS
Phase 2 Authorization: GRANTED
Phase 2 Implementation: COMPLETE

Dependencies Installed: NO
Runtime Changes Beyond Phase 2: NO
Commit: NOT CREATED
Push: NOT PERFORMED
Deployment: NOT PERFORMED

Next Gate: Phase 2 Verification Review
```
