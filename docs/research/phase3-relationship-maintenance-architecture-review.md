# Phase 3 Architecture Review — Lifecycle-aware Relationship Maintenance

> Research and architecture decision only. No repository files, schemas, or
> tests are modified. The working tree remains unchanged.
>
> Phase 1 + Phase 2 are committed at `5338d16f1`. This review builds on that
> and defers to a future implementation task.

---

## 1. Current Architecture Understanding

### 1.1 What Phase 1 established (committed)

Eight directional typed relationship types on `related:`:

```text
supersedes, evolved_from, resolves, caused_by,
affects, belongs_to, contradicts, derived_from
```

All typed links carry **only** `path` and `type` (verified in
`templates/schema.yaml` `core.related.items.oneOf[1].properties`). No
per-link `confidence`, no per-link `evidence`, no per-link state.

`superseded_by` is the canonical lifecycle field; a `supersedes` typed
link may coexist but must agree with it.

### 1.2 What Phase 2 established (committed)

A four-tier, declarative verification gate inside
`skills/memory-verification/SKILL.md`:

| Tier | Checks | Outcome |
|---|---|---|
| 1 Syntactic | path present, type in 8, target exists, well-formed | else Invalid |
| 2 Semantic/Direction | source→target fits type | else Invalid |
| 3 Lifecycle | superseded/obsolete target not presented current; `superseded_by` agreement | else Invalid / Stale |
| 4 Evidence | high-impact types (`supersedes`,`resolves`,`caused_by`,`contradicts`) have evidence | else Needs Review |

Four derived trust states, **reported but not stored**: `Verified`,
`Needs Review`, `Invalid`, `Untyped/Legacy`. The gate explicitly states these
are derived and written to the verification receipt, never frontmatter.

Per-link `confidence` is explicitly deferred to Phase 3
(§"Per-Link confidence — Deferred" in `memory-verification`).

### 1.3 Existing primitives a Phase 3 design must build on

Three Git-native, Markdown-compatible primitives already exist in the repo.
Phase 3 should extend these, not replace them:

1. **Document freshness.** Domain `README.md` frontmatter carries
   `last_indexed` + `pending_updates`. The DSH plugin
   (`dsh-plugin/dsh/plugin.mjs`, `buildFreshnessWarning`) injects a
   session-start warning when `pending_updates > 0`. This is a
   Git-native, content-free staleness signal.

2. **Audit-log-driven drift.** `docs/CHANGELOG-MEMORY.md` is the append-only
   knowledge-change audit log. `skills/obsolete-knowledge/SKILL.md` already
   implements a **document-level** drift rule: *"When a knowledge unit's
   `last_verified` date is older than the most recent audit entry referencing
   it, flag that unit for re-validation."* This is the strongest evidence in
   the repo that PMA's drift model is audit-log-based, not content-hash-based.

3. **Verification receipt.** `memory-verification` returns a Markdown
   receipt with `## Result`, `## Knowledge Consistency`, `## Lifecycle
   Verification`, `## Failures`, `## Warnings`. The gate already adds a
   per-relationship line to this receipt.

These three primitives together mean PMA can detect "this knowledge changed
since it was verified" using Git + a date + an append-only log — no new
storage, no fingerprints, no background worker.

---

## 2. Relationship-Level Trust Analysis

### 2.1 What document-level metadata cannot represent

Document-level `evidence`, `confidence`, `last_verified`, and the receipt
capture **trust in the claim the document makes**. They do not capture trust
in **the relationship edge itself**. A relationship is a separate claim:
"source and target stand in relation R to each other." Two documents can
both be fully verified while the edge between them is wrong, reversed, or
unsupported. This is the gap Phase 2's Tier 4 exposes but does not close:
Tier 4 can only say "evidence missing → Needs Review"; it has no durable
place to record *that a specific edge was checked* at a specific time.

### 2.2 Which of the eight types actually need independent trust

Not all eight need it. The split is exactly the high-impact vs.
low-impact split already used by Tier 4:

- **High-impact (need independent trust):** `supersedes`, `resolves`,
  `caused_by`, `contradicts`. These are material claims that change what an
  agent may rely on; a wrong edge actively misleads. This set is already
  load-bearing in the Phase 2 gate.
- **Low-impact (no independent trust needed):** `belongs_to`, `affects`,
  `evolved_from`, `derived_from`. These are navigational; a wrong edge is
  annoying, not misleading. Tier 3 already bounds them (target must exist,
  lifecycle-compatible). No separate per-edge trust state is justified.

Conclusion: if relationship-level trust is introduced at all, it should apply
to the four high-impact types only. That keeps the model minimal.

### 2.3 Can a relationship be `Needs Review` while both endpoints are valid?

Yes, and this is the decisive case for a dedicated relationship-level state.
Example: two current documents, both verified. One claims
`FixA resolves BugB`. `FixA`'s own evidence is solid; `BugB`'s own evidence
is solid. But there is no evidence that `FixA` actually fixes `BugB` — the
*edge* is unverified. Neither endpoint is stale, so no document-level
drift signal fires, yet the relationship is the least trustworthy part.
Document-level `last_verified` on both documents is silent here. This is a
case that **only a relationship-level state can represent.**

### 2.4 Can relationships from the same document have different states?

Yes. A document can carry `supersedes X` (verified, evidence-backed) and
`resolves Y` (Needs Review, no evidence). The relationship state is a
property of the edge, not of the source document. This confirms that
relationship trust, where represented, must live **on the edge**, not be
derived from the source's `confidence` alone.

### 2.5 Is per-link `confidence` necessary, useful, redundant, or harmful?

- **Not necessary** for Phase 3's stated purpose (drift detection). Drift is
  about *staleness*, not *certainty*. A relationship can be certain and yet
  stale (its evidence moved). `confidence` does not detect drift.
- **Redundant with `confidence` + `last_verified`** for trust, because the
  existing receipt already derives a trust level from those two plus the
  audit log.
- **Harmful if added naively:** a per-link confidence enum is exactly the
  "minimal metadata" violation the architecture principles forbid, and it
  opens a confidence-scoring rabbit hole the gate explicitly avoids.

**Decision:** Do **not** introduce per-link `confidence` in Phase 3. Keep
the deferred note as-is. What Phase 3 may add (if at all) is a **binary
verification-receipt marker on high-impact edges**, not a confidence score —
see §4, §6.

### 2.6 Minimum representation if relationship-level state is genuinely required

The smallest honest representation is **not a new schema field on every
typed link.** It is:

- For the four high-impact types: the **verification receipt** (Markdown,
  already part of the repo) records, per edge, a `last_verified` timestamp and
  a reference to the audit-log entry that checked it. No new frontmatter.
- No state is persisted on low-impact types.

This satisfies "no hidden state" because the receipt is human-readable and
committed; it satisfies "Git-native" because it is a file in the repo; it
satisfies "minimal metadata" because it adds at most one timestamp + one log
reference per high-impact edge, only when one actually exists.

---

## 3. Verification Drift Analysis

### 3.1 What "drift" means for a relationship

A previously verified relationship becomes suspect when any of its
**supporting conditions** change:

| Changed input | Effect on relationship |
|---|---|
| source knowledge edited | edge may no longer hold |
| target knowledge edited | edge may no longer hold |
| source `evidence` changed | Tier 4 support may be gone |
| target `evidence` changed | endpoint validity may be in question |
| target `superseded_by` changed | Tier 3 lifecycle agreement may break |
| relationship type flipped | Tier 2 semantics may now be Invalid |
| direction reversed | Tier 2 Invalid |
| target path moved/renamed | Tier 1 broken target |
| `last_verified` older than a new audit entry | stale (existing doc rule) |

Key observation: **six of these nine are already detectable by re-running
the Phase 2 gate.** The gate already recomputes every tier from the current
files. The only case the gate does *not* catch on its own is the subtle one:
"nothing looks wrong now, but this edge was verified three months ago and the
evidence it relied on has since changed." That is the **staleness** case, and
it is the only case that actually needs a new mechanism.

### 3.2 Drift detection options, grounded in the repo

**A. Derived during verification (re-run the gate).**
Always available; the gate already does Tiers 1–3 from current files. Catches
structural/semantic/lifecycle drift for free. It does **not** catch pure
staleness (a still-valid-looking edge whose supporting evidence moved).
Cost: O(edges) per verification run — acceptable, no new state.

**B. Content/version fingerprint (hash source+target).**
Compute a hash of each endpoint and compare against a stored hash to detect
"endpoint changed since verification." This is the most precise signal, but:
- It requires **storing** a fingerprint per edge — a new frontmatter field or
  a sidecar file. That violates minimal-metadata and Git-diff readability.
- PMA deliberately avoids content-addressed change detection; its existing
  drift model (`obsolete-knowledge`) uses **audit-log recency**, not hashes.
- Failure mode: hashing large docs, or re-hashing after a rename that
  preserves content, creates false staleness.
Verdict: precise but expensive in metadata and inconsistent with PMA's
established audit-log drift convention. Not recommended as the primary
mechanism.

**C. Timestamp-based drift (last_verified vs. audit log).**
Reuse the *existing* `obsolete-knowledge` rule: flag an edge for re-check when
the edge's `last_verified` (or, if none, the source/target document's
`last_verified`) is older than the most recent `CHANGELOG-MEMORY.md` entry
that touches either endpoint. This is Git-native, content-free, and
identical in spirit to PMA's existing document drift rule. It is a
**sufficient, cheap, deterministic** signal: it says "something in this
neighborhood changed since we last looked; re-run the gate."
Verdict: the best fit. It extends an established primitive instead of
inventing one.

**D. Document-level invalidation without relationship metadata.**
When a document is edited, mark any relationship touching it as "needs
re-verification." This is essentially option C's consequence expressed as a
write-time rule. It needs no per-edge storage: the audit log already records
which paths each edit touched, so "relationships whose endpoint was just
edited" is derivable from the audit log.
Verdict: clean, and it is how PMA's existing document model already reasons
about drift. Recommended as the *write-time* complement to option C.

### 3.3 Which option the evidence supports

The repository's own drift primitive is **audit-log recency**
(`obsolete-knowledge`). The cleanest, most PMA-consistent Phase 3 design is
therefore:

> **Primary mechanism: timestamp/audit-log drift (C) + document-level
> invalidation (D), checked when verification runs, with the Phase 2 gate
> re-run as the authoritative recomputation (A).**
>
> Per-edge fingerprints (B) are **rejected** as the primary mechanism
> because they require new stored state that contradicts PMA's minimal-
> metadata and Git-native principles, and because PMA already reasons about
> drift by audit-log recency.

This keeps Phase 3 Git-native, Markdown-readable, deterministic, and free of
hidden state and new infrastructure.

---

## 4. Architectural Option Comparison

No rankings or scores — trade-offs and an evidence-supported selection.

### Option 1 — Fully derived relationship trust

- **Representation:** No new storage. Trust is always recomputed by the gate
  from current files (Tiers 1–4). Drift = "re-run the gate."
- **Lifecycle:** Edges have no independent lifecycle; they live and die with
  endpoints. A stale edge is only detected *when* verification runs.
- **Verification:** Deterministic and cheap, but it can never say "this edge
  is still fine" *without* running, and it cannot distinguish "just verified"
  from "verified long ago and evidence has since moved."
- **Schema compatibility:** None — no schema change.
- **Operational complexity:** Minimal.
- **Failure modes:** Staleness is invisible until a full verification pass.
  High-impact edges have no record of *when* they were last proven, so there
  is no recency signal.
- **Git friendliness:** Excellent.
- **Migration:** None.
- **Hidden state:** None.
- **Fit:** Correct floor, but it cannot represent the "edge is unverified
  while both endpoints are valid" case (§2.3), which is the whole point of
  relationship-level trust. Insufficient on its own.

### Option 2 — Persisted relationship verification metadata

- **Representation:** A new frontmatter field on high-impact edges
  (e.g., `verified` + `last_verified`).
- **Lifecycle:** Edge can outlive its last check; stale metadata possible.
- **Verification:** Fast staleness read without full re-run.
- **Schema compatibility:** **Breaks** the committed Phase 1/2 invariant that
  typed links carry only `path`+`type`. Would need a schema migration.
- **Operational complexity:** Moderate — someone must keep the field in
  sync with the receipt; desync is a new failure class.
- **Failure modes:** Field drifts from reality (hidden state); more fields
  = more divergence; conflicts with "no new frontmatter fields."
- **Git friendliness:** Good, but a mutable per-edge timestamp that can go
  stale is exactly the hidden-state risk the principles forbid.
- **Migration:** Required (schema + any existing edges).
- **Fit:** Overreach. The receipt already records edge results; persisting a
  second copy invites desync.

### Option 3 — Content/version fingerprint

- See §3.2 B. Precise, but new stored state, inconsistent with PMA's
  audit-log drift convention, and a false-staleness failure mode after
  content-preserving moves.
- **Fit:** Not selected as primary; kept only as an optional hardening for a
  future, opt-in "pin exact revision" feature, not core Phase 3.

### Option 4 — Timestamp-based drift (audit-log recency)

- **Representation:** No new per-edge field. Reuse the **verification
  receipt** and the **audit log**: an edge is flagged for re-check when the
  most recent `CHANGELOG-MEMORY.md` entry touching either endpoint is newer
  than the edge's last verification (recorded in the receipt).
- **Lifecycle:** Staleness derived from Git + audit log; no hidden state.
- **Verification:** Deterministic, cheap, reuses `obsolete-knowledge`'s
  established recency rule.
- **Schema compatibility:** Full — no schema change; receipt already
  carries per-edge lines.
- **Operational complexity:** Low — one comparison per high-impact edge.
- **Failure modes:** Under-detection if an edit isn't logged in
  `CHANGELOG-MEMORY.md` (same limitation PMA already has for document
  drift); coarse (says "neighborhood changed," not "which property").
- **Git friendliness:** Excellent.
- **Migration:** None for detection.
- **Fit:** **Selected as the primary drift mechanism.** It extends an
  existing PMA primitive and keeps every principle intact.

### Option 5 — Document-level invalidation without relationship metadata

- **Representation:** Write-time rule: when `memory-edit` logs a path change
  to the audit log, relationships whose endpoints were touched are marked
  for re-verification. No per-edge storage.
- **Fit:** **Selected as the write-time complement** to Option 4. It is the
  same idea expressed at edit time; the audit log already records the touched
  paths, so "which edges need re-checking" is derivable.

### Evidence-supported selection

The available repository evidence supports a **combination**:

> **Option 4 (audit-log/timestamp recency) + Option 5 (document-level
> invalidation) + Option 1 (re-run the gate as authoritative), with
> Options 2 and 3 rejected for the core path.**

Reasoning: PMA's existing drift model is audit-log recency
(`obsolete-knowledge`). The relationship gate already recomputes Tiers 1–4.
The only genuinely new need is a *recency signal for high-impact edges* that
does **not** require a new frontmatter field. The verification receipt —
already a committed, human-readable Markdown artifact — is the natural place
to record "this edge was last verified at T, via audit entry E," making
staleness derivable without any new schema, fingerprint, or worker.

---

## 5. Evidence-Supported Phase 3 Architecture

**Name: Lifecycle-aware Relationship Maintenance, receipt-based.**

Three pieces, all extending existing primitives:

1. **Recency detection (read-time).** In `memory-verification`, for each
   **high-impact** typed edge (`supersedes`, `resolves`, `caused_by`,
   `contradicts`), compare the edge's last-verified time (from the receipt /
   audit log) against the most recent `CHANGELOG-MEMORY.md` entry that
   touches its source or target. If the audit entry is newer, the edge is
   `Stale` and must be re-run through the gate. Low-impact edges are not
   recency-tracked (they are re-checked structurally by the gate).

2. **Invalidation (write-time).** In `memory-edit`, when a path is edited and
   logged, append the relationship impact to the audit entry (which typed
   edges reference it). No new field on the edges themselves — the audit log
   is the source of truth.

3. **State transitions (see §7).** `Verified → Stale → (re-run gate) →
   Verified | Needs Review | Invalid`. The gate remains the only thing that
   can set `Verified`; drift only ever *downgrades* to `Stale`, never
   silently deletes or rewrites.

No new relationship type, no graph, no retrieval, no background worker, no
content hash, no confidence score.

---

## 6. Minimal Schema / Metadata Changes, if Any

**None to the schema.** `templates/schema.yaml` typed-link object stays
`{ path, type }`. Per-link `confidence` remains deferred.

The only additions are **receipt and audit-log conventions** (Markdown, not
frontmatter):

- The verification receipt gains, for each high-impact edge already listed, a
  `last_verified` date + audit-log entry id.
- The audit-log entry for an edit that touches a relationship endpoint gains
  one line naming the affected typed edge(s) so recency can be computed.

These are documentation/contract changes to `memory-verification` and
`memory-edit`, not schema fields. This is the minimum representation that
makes relationship-level trust (§2.6) and drift (§3.2) possible without
violating minimal-metadata.

---

## 7. Verification and Lifecycle State Transitions

Existing Phase 2 states: `Verified | Needs Review | Invalid |
Untyped/Legacy`. Phase 3 adds one transition source, not a new state type:

```text
Stale  =  (edge last_verified) < (newest audit entry touching an endpoint)
```

Transitions:

- `Verified → Stale`  when an audit entry newer than the edge's
  `last_verified` touches source, target, their evidence, or
  `superseded_by`. **Automatic downgrade; no human action.**
- `Stale → Verified`  only after the gate re-runs all Tiers and they pass,
  and the receipt/audit log record the new `last_verified`.
- `Stale → Needs Review` when the gate re-runs and Tier 4 (evidence) cannot
  be satisfied with available evidence.
- `Stale → Invalid` when Tiers 1–3 fail after re-run (broken target,
  reversed direction, lifecycle disagreement, `superseded_by` conflict).

Guarantees preserved:

- `superseded_by` remains the canonical lifecycle field; a `superses` edge
  that disagrees with it is `Invalid` (Tier 3), not merely `Stale`.
- A `Stale` edge never restores an obsolete target to authoritative status —
  lifecycle status is still read from the target document.
- Drift **only downgrades**; it never auto-rewrites, auto-deletes, or
  auto-trusts a relationship. Every re-`Verified` is a gate decision, not a
  timestamp.

---

## 8. Backward-Compatibility Strategy

- **Legacy plain-string `related:`** stays `Untyped/Legacy`, existence-only,
  unchanged. Phase 3 adds no requirement to it.
- **Existing typed edges** require **no data migration**. Recency is derived
  from the audit log + receipt; an edge with no recorded `last_verified` is
  treated as "unverified → re-run the gate" (i.e., default to the existing
  Phase 2 gate result). No backfill of timestamps is forced.
- **Schema is untouched**, so previously committed knowledge remains valid.
- **Low-impact edges** are unaffected by recency tracking; they keep Tier 3
  behavior only.

---

## 9. Migration Requirements

None. Detection is derived (Option 4/5) and storage is receipt/audit-log
only. If a later task wants content-pinning (Option 3), that is an opt-in
addition and not a migration of existing data.

---

## 10. Security Considerations

- Relationship endpoints and their content remain **untrusted data**. Phase 3
  drift detection reads only paths, dates, and audit-log lines — it never
  executes, follows URLs, or interprets memory content as instructions.
- A `Stale` downgrade is a *signal*, not an action: it tells verification to
  re-run the gate; it does not fetch, run, or obey anything in the target.
- The audit log is append-only; recency detection cannot be gamed by editing
  past entries (that would itself be a logged edit, advancing recency
  correctly).
- No new privilege boundary or hidden state is introduced, consistent with
  "no hidden state."

---

## 11. Explicit Non-Goals

Phase 3 does **not**:

- Add per-link `confidence` or any confidence scoring.
- Add a new relationship type or alter the eight-type model.
- Add frontmatter fields to typed links.
- Implement relationship-aware retrieval, graph traversal, PPR, vectors,
  embeddings, or Honeycomb search (Phase 4).
- Do automatic relationship discovery/inference.
- Run background verification workers or cron.
- Content-addressed/fingerprint every edge as the primary mechanism.
- Auto-delete or auto-rewrite knowledge.
- Migrate legacy `related:` entries.

---

## 12. Open Questions and Evidence Gaps

1. **Recency granularity.** The audit log is per-edit, not per-field. If one
   edit touches many paths, all their edges become `Stale`. Is that coarse
   downgrade acceptable, or does a high-traffic repo generate too much
   `Stale` churn? Evidence gap: no data on PMA's typical edit fan-out.
   This is a friction risk, not a correctness risk, and it matches PMA's
   existing document-drift behavior.

2. **`last_verified` source for edges with no receipt entry.** An edge
   verified before the receipt convention is adopted has no recorded
   `last_verified`. Proposed default: treat as unverified (re-run gate). This
   is a policy choice, not yet exercised.

3. **External evidence on fingerprint vs. audit-log drift.** Web research was
   unavailable this round (firecrawl 403 / rate-limited, same limitation as
   the earlier research round). The decision rests on **in-repo evidence**:
   PMA's `obsolete-knowledge` already uses audit-log recency, which is
   strong internal grounding but would benefit from external confirmation
   that Git-native knowledge systems generally prefer audit-recency over
   content-hash for cross-reference staleness.

4. **Interaction with domain `pending_updates`.** The plugin's freshness
   signal (`pending_updates`) is per-domain, not per-edge. Phase 3's edge
   recency is independent; whether to also surface "domain N has M stale
   edges" in the session-start warning is a small UX question, not an
   architectural one.

---

## 13. Phase 3 Implementation Boundary

Concrete enough for a later coding agent to implement without reopening the
architecture.

### What the implementation task should change

1. **`skills/memory-verification/SKILL.md`** — extend the Typed
   Relationship Verification Gate with a **Tier 5 (Drift/Recency)** for the
   four high-impact types:
   - For each such edge, read its `last_verified` + audit-entry id from the
     receipt.
   - Compare against the newest `CHANGELOG-MEMORY.md` entry touching
     source/target.
   - If the audit entry is newer, mark the edge `Stale`; require a gate
     re-run before it may be reported `Verified`.
   - Add `Stale` to the receipt's per-edge state vocabulary and to the
     lifecycle section of the receipt.
   - Document the state transitions (§7) in the skill.

2. **`skills/memory-edit/SKILL.md`** — when an edit that touches a
   relationship endpoint is logged, add one line to the audit entry naming
   the typed edge(s) affected, so recency is computable. No field on the
   edge itself.

3. **`skills/memory-architecture/SKILL.md`** — add one checklist item:
   "high-impact typed edges have a recency record; Stale edges are flagged,
   not silently trusted."

4. **`templates/TEMPLATE.md`** — add one checklist line: "high-impact typed
   links are recency-tracked in the verification receipt (Tier 5)."

### What it may add

- The `Stale` transition and Tier 5 (a *tier*, consistent with Phase 2's
  four tiers, not a parallel system).
- A `last_verified` + audit-entry-id **receipt column** for high-impact edges
  (Markdown, not frontmatter).
- An audit-log line format for "affected typed edges."

### What it must preserve

- The eight-type model unchanged.
- Typed links remain `{ path, type }` in the schema (no new field).
- `superseded_by` remains the canonical lifecycle field.
- `Verified` is only ever set by a full gate pass.
- Drift downgrades only; it never rewrites/deletes knowledge.
- Legacy plain-string `related:` stays existence-only.
- Git-native, Markdown, no graph/vector/embedding/worker, no hidden state.

### What it explicitly must not implement

- No per-link `confidence` (still deferred; revisit only with evidence).
- No content-hash/fingerprint as the primary drift mechanism.
- No automatic relationship inference.
- No relationship-aware retrieval or any Phase 4 behavior.
- No background workers or scheduled verification.
- No schema/frontmatter migration.
- No new infrastructure.

### Known dependency on a future phase (identified, not designed)

If a future phase makes `Stale` churn a real friction problem (§12.1),
that phase — not Phase 3 — would decide whether to add content-pinning
(fingerprint option) or edge-scoped recency. Phase 3 deliberately leaves
that open and does not build for it.

---

## 14. Research Discipline — Source Labels

| Claim | Source |
|---|---|
| 8 types, `{path,type}` only, gate tiers, 4 trust states, deferred `confidence` | **Repo (committed `5338d16f1`)** |
| `last_indexed`/`pending_updates` freshness in plugin | **Repo (`plugin.mjs`)** |
| Audit-log recency drift in `obsolete-knowledge` | **Repo** |
| Receipt structure | **Repo (`memory-verification`)** |
| Option selection (4+5+1, reject 2/3 primary) | **Architectural deduction** from repo evidence |
| `Stale` transition + Tier 5 design | **Proposed decision** |
| No per-link confidence in Phase 3 | **Proposed decision**, consistent with committed deferral |
| Git-native systems generally prefer audit-recency over content-hash for staleness | **Unresolved** — external research unavailable this round; internal grounding strong |

Existing implementation vs. proposed architecture: the receipt, audit log,
and gate tiers are **existing**; Tier 5 / `Stale` / recency record are
**proposed** and not yet present in the repository.

---

## 15. Final Verification Notes

- Working tree confirmed **unchanged** by this task (no edits made).
- Phase 1/Phase 2 assumptions confirmed against `5338d16f1` and the live
  files.
- Git history inspected (`5338d16f1`, `4624bf43b`).
- No Phase 4 behavior designed; the one Phase 4-relevant dependency
  (`Stale` churn / content-pinning) is explicitly deferred, not built.
