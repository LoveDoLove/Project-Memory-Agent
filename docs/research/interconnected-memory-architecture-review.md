# Interconnected Memory Architecture Review — PMA

## Status

Architecture research and design review only. This document does not modify PMA
implementation, schemas, skills, plugin code, or existing knowledge. The only
permitted repository artifact is this review.

## Scope

This review evaluates whether PMA can evolve toward an interconnected,
"honeycomb-like" engineering memory system while preserving its current
identity as a project-aware, evidence-backed, Git-native, low-redundancy
knowledge system.

It critically reviews the priorities proposed in
`docs/research/ai-memory-context-systems-evolution-research.md`, treats that
report as input rather than settled design, and determines the smallest safe
next architectural foundation.

---

## 1. Executive Summary

PMA already has the substrate for useful interconnected memory: Markdown
knowledge units, YAML frontmatter, typed `related:` objects, `superseded_by`,
`consolidated_from`, domain indexes, audit log, lifecycle states, and a
verification gate.

The recommended next evolution is therefore not a graph database, vector
store, external memory service, automatic extraction engine, or full
relationship verification gate. The smallest correct foundation is:

> **A disciplined, optional typed-relationship convention that keeps
> relationships evidence-bearing, semantically limited, and lifecycle-aware.**

Concretely, PMA should first define a **Minimal Relationship Model** with:

1. A small, bounded set of relationship types.
2. Directional, typed `related:` links.
3. Optional per-relationship confidence.
4. Explicit lifecycle interaction rules: what happens when either endpoint is
   superseded, deprecated, or obsolete.
5. A trust distinction between "system believes related" and "PMA has
   evidence that related".
6. A verification boundary that treats relationships as claims, not as free
   connectivity.

The previous report ranked a **Relationship Verification Gate** first. This
review disagrees with that ordering. The verification gate is valuable, but it
is premature if the relationship vocabulary and lifecycle semantics are not
defined first. A gate that checks links before the links have a stable model
would enforce the wrong contract.

**Decision: C — Smaller Prerequisite.**

The direction is correct, but Candidate 1 (Relationship Verification Gate)
is premature. The smaller prerequisite that must come first is Candidate 2:
the **Minimal Typed Relationship Model / Relationship Vocabulary**.

The recommended next implementation task is therefore not "implement
relationship verification". It is:

> Define and document the Minimal Relationship Model for PMA's existing
> `related:` mechanism, including allowed types, when typed links are
> appropriate, per-type verification expectations, lifecycle behavior, and
> trust states.

---

## 2. Research Findings Relevant to Architecture

### 2.1 Findings From the Previous Report

The previous report (`ai-memory-context-systems-evolution-research.md`) makes
these findings relevant to this decision:

- PMA's strongest identity is evidence discipline, canonical ownership,
  lifecycle separation, and Git-native storage.
- The report recommends typed `related:` links with optional confidence and
  evidence.
- The report recommends a relationship verification gate in
  `memory-verification`.
- The report rejects graph DB, PPR, vector search, automatic session
  extraction, user-preference memory, and ACLs for PMA's core.

**Research Finding:** The report is directionally correct about preserving
PMA's identity and rejecting heavy infrastructure.

**Interpretation:** The report's strongest claim — that relationships should
be "evidence-bearing" and "verified" — is correct, but its ordering is too
fast. It proposes a gate before settling on the relationship model itself.

**Evidence limitation:** The previous report could not access primary evidence
for `dsh-mnemon`, `dsh-memory`, `dsh-engram`, `memsearch`, `deja-vu`,
`memory-eternal`, or Hindsight. It uses OpenViking as the strongest available
external reference. This uncertainty should remain explicit; no architecture
choice here should rely on those unavailable systems.

### 2.2 OpenViking and Ecosystem Pattern

OpenViking and similar agent-memory systems support the intuition that typed
relationships improve retrieval. They also show the failure mode: without
evidence discipline, typed links become arbitrary connectivity.

**Research Finding:** Typed relationships are useful only when they are
bounded, semantically meaningful, and retrievable.

**Interpretation:** PMA should not copy OpenViking's link infrastructure. It
should borrow the minimal semantic idea: follow typed relationships when they
reduce ambiguity.

**Recommendation:** PMA-native relationships should remain a small part of the
existing frontmatter model, not a separate graph subsystem.

---

## 3. Current PMA Relationship Model

### 3.1 Observed Implementation

The current `related:` mechanism in `templates/schema.yaml` supports:

```yaml
related:
  - docs/decisions/authentication.md              # plain path, backward compatible
  - path: docs/architecture/security.md
    type: belongs_to
  - path: docs/decisions/auth-v1.md
    type: evolved_from
```

Observed typed values:

```text
belongs_to
caused_by
evolved_from
contradicts
derived_from
```

Observed sibling fields:

```text
superseded_by: <path or null>
consolidated_from: [paths]
evidence: [paths]
confidence: high | medium | low
```

**Observed:** `related:` already supports both plain strings and typed
objects. Typed links are optional. `superseded_by` is required when status is
`superseded`.

### 3.2 Documented Design

`agents/project-memory.md`, `knowledge-classification`, and
`memory-architecture` document typed links as semantic navigation aids.

Observed documented rules:

- Typed links enable semantic navigation.
- `evolved_from` can locate the current version of a superseded decision.
- `knowledge-classification` should recommend typed links only when they
  reduce retrieval ambiguity.
- `memory-verification` checks that `related` paths resolve to existing files.
- `memory-verification` checks `superseded_by` targets.

**Documented design:** PMA already intends typed relationships to be
retrieval aids, not a full knowledge graph.

### 3.3 Gap

**Observed gap:** The current model supports typed relationships, but it does
not yet define:

- which relationships are first-class,
- which relationships may remain plain metadata,
- which types require evidence,
- how relationships behave when a target becomes stale or superseded,
- what trust state a relationship has,
- whether a typed link alone is sufficient for retrieval.

**Interpretation:** The missing piece is not a new storage system. The missing
piece is a small architecture contract around the existing `related:`
field.

---

## 4. Definition of Interconnected / Honeycomb Memory for PMA

For PMA, interconnected memory should mean:

> A set of project knowledge units that are meaningfully connected through
> typed, evidence-aware relationships, so a future agent can move from one
> relevant fact to the next related fact without guessing.

It should **not** mean:

- Every memory is connected to every other memory.
- A graph database or graph query engine exists.
- Relationships are automatically inferred at scale.
- Relationship presence is a quality metric in itself.
- PMA becomes a generic RAG or personal-memory system.

### 4.1 Relationship Candidate Space

The goal lists many possible relationship endpoints: memories, projects,
architecture decisions, technologies, bugs, fixes, commits, sessions, agents,
tools, and evidence.

Not all of these need first-class PMA relationships.

**Recommendation:** PMA should distinguish three tiers.

#### Tier 1 — Knowledge-to-Knowledge Relationships

These are the primary relationships for PMA.

```text
Decision ── supersedes ── Decision
Solution ── resolves ── Solution/Bug knowledge
Bug knowledge ── caused_by ── Architecture/Change knowledge
Constraint ── affects ── Architecture
Lesson ── derived_from ── Solution/Decision
Architecture ── belongs_to ── Architecture domain
```

These relationships improve retrieval and lifecycle handling.

**Recommendation:** Keep these as first-class typed `related:` relationships.

#### Tier 2 — Evidence Provenance

Evidence should generally remain ordinary metadata, not a new relationship
ontology.

```text
memory.evidence:
  - path: src/auth/token.ts
  - path: tests/auth/token.test.ts
```

The previous report proposes `Fix ── validated_by ── Evidence` as a
relationship. For PMA, that is better modeled as:

```yaml
type: solution
evidence:
  - path: tests/...
    type: test
```

**Recommendation:** Do not create a generic `validated_by` relationship type.
Use the existing `evidence` field for evidence links. This preserves
simplicity.

#### Tier 3 — Entity Provenance

Agents, tools, sessions, commits, and technologies are often useful
context, but not all need first-class relationship edges.

```text
session -> learned lesson
agent -> proposed memory
tool -> generated note
commit -> changed architecture
```

**Recommendation:**

- Sessions and agents should remain lightweight provenance metadata, not
  global graph nodes.
- Commits can appear inside `evidence` when a change is the evidence.
- Technologies can appear in tags or reference units, but should not become a
  separate entity ontology unless a project genuinely needs it.

### 4.2 Explicit, Inferred, or Hybrid?

**Interpretation:** PMA should use a hybrid, explicitly bounded model:

- **Explicit relationships:** human or agent-authored typed `related:` links.
  These are the main supported path.
- **Inferred relationships:** permitted only as optional, clearly marked
  suggestions; they must not be trusted for retrieval until verified.
- **Hybrid:** a relationship may start as inferred and later become explicit
  and verified.

**Recommendation:** The first implementation should support explicit typed
links only. Inferred relationships should not be part of the initial
foundation because they increase false-relationship risk.

---

## 5. Relationship Model Options

### Option A — Keep Current `related:` as Is

**Description:** Continue using the existing five types with plain and typed
links, no new trust model.

**Pros:**
- Minimal change.
- Already implemented.

**Cons:**
- No lifecycle semantics for relationships.
- No trust distinction.
- No guidance on which types are high-value.
- Verification remains shallow.

**Assessment:** Insufficient for interconnected memory.

### Option B — Expand Types Without a Trust Model

**Description:** Add more relationship types, possibly per-relation confidence
and evidence.

**Pros:**
- More expressive.

**Cons:**
- More types increase ambiguity and maintenance burden.
- Without trust states, links may become arbitrary.
- Verification would have no stable contract.

**Assessment:** Useful only after the minimal model is defined.

### Option C — Minimal Typed Relationship Model with Trust States

**Description:** Keep `related:` as the only relationship store, but define a
bounded vocabulary, directional semantics, per-type verification expectations,
and a lightweight trust lifecycle.

**Pros:**
- Smallest correct foundation.
- Compatible with existing frontmatter.
- Supports future verification without changing storage.
- Preserves PMA's Git-native identity.

**Cons:**
- Requires skill and template updates before implementation.
- If overused, can create noisy links.

**Assessment:** Recommended.

### Option D — Replace `related:` with a New Relationship Abstraction

**Description:** Add a separate relationship store or new document type.

**Pros:**
- Could support richer graph semantics.

**Cons:**
- Breaks PMA's single-store, Git-native model.
- Creates duplicate ownership.
- Adds operational complexity.
- Violates the goal's minimal-complexity constraint.

**Assessment:** Rejected.

### Option E — Add Graph Database or External Memory Service

**Pros:**
- Could support large-scale traversal.

**Cons:**
- New source of truth.
- New infrastructure.
- Conflict with PMA's human-readable, Git-native purpose.

**Assessment:** Rejected.

---

## 6. Recommended Minimal Relationship Model

The recommended model is a **strengthened, extended version of the existing
`related:` field**, not a replacement.

### 6.1 Minimum Viable Relationship Model

```yaml
related:
  - path: docs/decisions/auth-v2.md
    type: supersedes
    confidence: high
    note: "Optional human-readable context; not required."
```

Fields:

| Field | Required? | Purpose |
|---|---:|---|
| `path` | Yes | Target knowledge document |
| `type` | Yes for typed link | Relationship semantics |
| `confidence` | Recommended when typed | Relationship trust level |
| `note` | Optional | Human-readable explanation |

**Recommendation:** Do not add a large per-relationship `evidence` array in
the first step. Relationship evidence should use the document's existing
`evidence:` field when the relationship is a material claim. A future
enhancement can add per-link evidence if needed.

**Reason:** This keeps the model small. PMA's unit-level `evidence` field is
the canonical evidence mechanism.

### 6.2 Initial Relationship Vocabulary

The previous report proposed many possible types. For the smallest correct
foundation, PMA should start with **eight types**, not more:

```text
supersedes
evolved_from
resolves
caused_by
affects
belongs_to
contradicts
derived_from
```

Rationale:

- `supersedes`: first-class lifecycle relationship. PMA already has
  `superseded_by`, so the inverse relationship should be explicit.
- `evolved_from`: already supported; useful for versioned knowledge.
- `resolves`: high engineering value for solutions/bugs.
- `caused_by`: high value for root-cause navigation.
- `affects`: high value for decision-to-architecture reasoning.
- `belongs_to`: already supported; useful for hierarchy without duplication.
- `contradicts`: necessary for conflict surfacing.
- `derived_from`: already supported; useful for distilled knowledge.

**Recommendation:** Defer these from the initial implementation:

- `validates`: use `evidence` instead.
- `part_of`: use `belongs_to` or domain indexes.
- `originates_from_session`: use provenance metadata instead of a relationship.
- `related_to`: too generic; not useful for retrieval.
- `uses`, `projects`, `technologies`, `commits`, `tools`: ordinary metadata
  unless a concrete project proves otherwise.

### 6.3 Directional Semantics

Each relationship is directional from the source document to the target:

```yaml
# In docs/decisions/auth-v2.md:
related:
  - path: docs/decisions/auth-v1.md
    type: supersedes
```

**Interpretation:** The source document states the relationship. This avoids
dual maintenance. Reverse navigation can be computed later if needed, but the
first model does not require bidirectional storage.

### 6.4 Relationship Trust Model

Each typed relationship should be treated as a claim. PMA needs two trust
states initially:

```text
suggested   - link exists but has not been verified
verified    - link was checked against repository evidence or explicit memory
              architecture
```

A third state may be needed later:

```text
stale       - link or target is no longer current
```

**Recommendation:** Do not add `verified` as a stored YAML field in the first
step. Use `confidence` plus existing `last_verified` and audit log as the
initial trust signals. A future verification gate can introduce an explicit
relationship verification state if needed.

**Reason:** This preserves the smallest model. PMA's existing verification
receipts and `CHANGELOG-MEMORY.md` can record that a relationship was checked
without inventing a new per-link storage field.

### 6.5 Lifecycle Interaction

When knowledge units change lifecycle, relationships must behave predictably.

```text
Superseded unit:
  - Keep the unit as historical or superseded.
  - Its outgoing `supersedes` or `resolves` links may remain for navigation.
  - Its incoming `supersedes` links must point to the new current unit where
    appropriate.
  - Retrieval must not present superseded units as current.

Deprecated unit:
  - Relationships remain usable as historical context.
  - New current knowledge should prefer links to current units.

Obsolete unit:
  - Relationships should not be used as trusted retrieval aids.
  - They may remain only if historical navigation value is documented.
```

**Recommendation:** The relationship model should require that typed links
from current units prefer current targets when the target's lifecycle state
matters. Stale targets are a verification issue.

---

## 7. Relationship Verification Model

### 7.1 What Verification Means

Verification must distinguish between:

> "The system believes these memories are related."
>
> and
>
> "PMA has sufficient evidence that these memories are related."

For PMA, a typed relationship is **verified** when:

1. The target path exists.
2. The relationship type is valid.
3. The relationship is directionally sensible.
4. The target's lifecycle state does not make the relationship misleading.
5. For high-impact relationships (`supersedes`, `resolves`, `contradicts`,
   `caused_by`), repository or memory evidence supports the relationship.
6. The relationship is recorded in a verification receipt or audit log when
   it is checked.

**Interpretation:** Not all relationship types require the same evidence level.

### 7.2 Per-Type Verification Expectations

| Type | Minimum Check | High-Confidence Check |
|---|---|---|
| `supersedes` | target exists; source status is not superseded | target is current; audit log explains replacement |
| `evolved_from` | target exists | target is historical/superseded; current chain is clear |
| `resolves` | target exists and is plausible bug/solution knowledge | evidence shows the resolution mechanism |
| `caused_by` | target exists | evidence supports root-cause mechanism |
| `affects` | target exists | repository or decision evidence shows impact |
| `belongs_to` | target exists and is broader in scope | domain index or architecture confirms placement |
| `contradicts` | target exists and conflict is explicit | conflict is classified and resolution path exists |
| `derived_from` | target exists | distilled content is traceable to target |

**Recommendation:** A relationship without evidence is not automatically
false. It is `suggested`. It may be useful for navigation, but it should not
be treated as high-confidence.

### 7.3 Where Verification Lives

**Observed:** `memory-verification` already has a generic link check: related
paths must resolve.

**Documented design:** `memory-verification` is the final gate.

**Recommendation:** Relationship verification should be an extension of
`memory-verification`, not a separate subsystem. The first implementation
should add a small set of relationship rules to that skill.

**Boundary:** PMA should not automatically infer relationships during
verification. Verification checks the links that exist.

### 7.4 What Verification Should Trust and Reject

Trust:

- target exists,
- type is valid,
- direction is consistent with document type,
- lifecycle state is compatible,
- claim confidence is not overstated.

Reject or flag:

- broken target,
- unknown relationship type,
- current unit linked to superseded target as if it were current,
- `contradicts` without an explicit unresolved/resolved status,
- relationship confidence higher than source document confidence,
- link added only for connectivity, with no engineering reason.

### 7.5 Friction Assessment

**Interpretation:** A full relationship verification gate can create workflow
friction if it blocks every ordinary link.

**Recommendation:** Verification should be tiered:

- Low friction: plain `related:` paths exist.
- Medium friction: typed links have valid type and target.
- High friction: only high-impact typed relationships require evidence.

This keeps the model usable.

---

## 8. Lifecycle and Supersession

### 8.1 Relationship Lifecycle

Relationships follow a lifecycle derived from the endpoints:

```text
Suggested / Inferred
        ↓
Verified
        ↓
Trusted for Retrieval
        ↓
Stale / Invalid / Superseded
```

**Recommendation:** PMA should not store `suggested`, `verified`, and `trusted`
as separate YAML fields initially. It should derive trust from:

- document `confidence`,
- relationship `confidence`,
- target lifecycle state,
- `last_verified`,
- audit log entries,
- verification receipt.

This avoids expanding the schema unnecessarily.

### 8.2 Supersession

The most important lifecycle relationship is `supersedes`.

**Observed:** PMA already has `superseded_by` and lifecycle states.

**Recommendation:** Add an explicit `supersedes` type as the inverse of
`superseded_by` in the relationship vocabulary. This makes version chains
navigable in both directions.

```yaml
# Old unit
status: superseded
superseded_by: docs/decisions/auth-v2.md

# New unit
related:
  - path: docs/decisions/auth-v1.md
    type: supersedes
```

**Interpretation:** `supersedes` is the closest PMA relationship to a
first-class lifecycle edge. It is the smallest correct foundation for
honeycomb-style knowledge evolution.

### 8.3 Handling Stale Relationships

A relationship becomes stale when:

- target becomes obsolete,
- target moves,
- source unit becomes historical but relationship still implies current
  relevance,
- evidence for the relationship no longer matches repository reality.

**Recommendation:** Stale relationships are not deleted automatically. They
are flagged by verification and either:

- removed if no navigation value,
- converted to historical context if they explain a past decision,
- re-verified if they may still be current.

---

## 9. Evidence and Provenance

### 9.1 Evidence

**Observed:** PMA's canonical evidence mechanism is the document-level
`evidence:` field:

```yaml
evidence:
  - path: src/auth/token.ts
    type: source
  - path: tests/auth/token.test.ts
    type: test
```

**Recommendation:** Relationships should inherit this discipline. A typed
relationship is a claim. For high-impact relationships, the source document's
`evidence` field or a verification receipt should support it.

**Recommendation:** Do not add a per-relationship `evidence:` array in the
initial model. It is likely unnecessary complexity.

### 9.2 Provenance

The previous report proposes cross-agent provenance metadata:

```yaml
provenance:
  proposed_by:
    agent: project-memory
    session: optional-id
  origin: session | repository | external
```

**Interpretation:** This is useful later, but not a prerequisite for
interconnected memory. PMA's current `consolidated_from` and audit log already
record where merged knowledge came from.

**Recommendation:** Cross-agent provenance should remain an optional future
extension. It should not block the relationship model.

---

## 10. Future Retrieval Implications

This review does not propose changing retrieval implementation now. It
assesses what future retrieval would need.

### 10.1 Desired Retrieval Pattern

```text
Query
  ↓
Primary memory retrieval
  ↓
Follow relevant verified relationships
  ↓
Retrieve related context
  ↓
Respect evidence and lifecycle
  ↓
Construct agent context
```

### 10.2 Architectural Prerequisites

Before PMA can reliably follow relationships for retrieval, it needs:

1. A bounded relationship vocabulary.
2. Directional, typed links.
3. A trust distinction between suggested and verified relationships.
4. Lifecycle-aware handling of superseded and obsolete targets.
5. Verification receipts or audit log entries for high-impact links.
6. A deterministic follow rule: only follow typed relationships that reduce
   ambiguity.

**Recommendation:** No vector search, graph database, PPR, embeddings, or
complex graph algorithms are required.

**Interpretation:** PMA can provide graph-like behavior through Markdown
frontmatter and skill-driven navigation. The graph is not a separate
infrastructure layer. It is a property of how knowledge units are linked.

### 10.3 What Should Not Drive Retrieval

- Presence of a link alone.
- High link count.
- Arbitrary `related_to` links.
- Unverified inferred links.
- Superseded or obsolete targets presented as current.

---

## 11. Candidate 1 Architecture Review

**Candidate 1 from the previous report:** Relationship Verification Gate.

### 11.1 What Concrete PMA Problem Does It Solve?

It solves:

- broken typed links,
- semantically weak links,
- false relationships that mislead retrieval,
- stale links that persist after lifecycle changes.

**Observed:** The problem exists in principle because PMA supports typed links
and expects path validity.

**Interpretation:** The problem is real but not the first problem.

### 11.2 Does That Problem Exist Today?

**Observed:** PMA's `memory-verification` already checks that `related` paths
resolve and that `superseded_by` targets exist. It does not yet check
relationship semantics, per-type expectations, lifecycle compatibility, or
relationship trust.

**Interpretation:** A semantic relationship gate is useful, but it requires a
stable relationship model first.

### 11.3 Where Should the Conceptual Boundary Be?

The gate should check:

- target validity,
- type validity,
- direction consistency,
- lifecycle compatibility,
- confidence consistency,
- high-impact evidence support.

The gate should not:

- infer new relationships,
- automatically fix links,
- require evidence for every loose link,
- block ordinary navigation.

### 11.4 What Information Does It Require?

It requires:

- relationship type,
- target path,
- target status,
- source status,
- source confidence,
- relationship confidence,
- audit log / verification receipt.

### 11.5 What Should It Trust and Reject?

Trust:

- valid types,
- existing targets,
- lifecycle-compatible links,
- links with appropriate confidence.

Reject:

- unknown types,
- broken targets,
- links that imply current relevance to obsolete targets,
- confidence-overstated relationships,
- connectivity-only links.

### 11.6 How Does It Interact With Existing Verification?

**Observed:** `memory-verification` is the final gate. It already checks
supersession and related paths.

**Recommendation:** Relationship verification should be a small extension of
`memory-verification`, not a separate system.

### 11.7 Should It Cover All Relationships?

**Interpretation:** No. It should cover typed relationships. Plain `related:`
strings should remain lightweight backward-compatible links.

### 11.8 Is a Smaller Prerequisite Required First?

**Yes.**

The smaller prerequisite is the **Minimal Relationship Model**: a bounded
vocabulary, directional semantics, trust distinction, and lifecycle rules.

Without that, a verification gate would enforce an undefined or inconsistent
contract.

**Recommendation:** Implement the minimal model first. Then implement the
verification gate.

---

## 12. Risks and Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Too many relationship types | Agents follow ambiguous links | Start with eight bounded types |
| Links become connectivity theater | Memory quality drops | Require engineering reason for typed links |
| Superseded targets mislead retrieval | Agents use obsolete knowledge | Lifecycle-aware verification |
| Verification creates friction | Agents stop adding useful links | Tiered checks; plain links remain lightweight |
| Confidence field misuse | Overstated trust | Rule: relationship confidence <= source confidence |
| Evidence duplication | More maintenance | Use existing `evidence:` field, not per-link evidence initially |
| Graph complexity creep | PMA loses simplicity | No graph DB, no PPR, no vector search |
| External system uncertainty | Bad design import | Do not rely on unavailable named systems |

---

## 13. Architecture Decision

**Decision: C — Smaller Prerequisite.**

The previous report's direction is correct, but its Candidate 1 ordering is
premature. The smallest safe next step is not the verification gate. The
smaller prerequisite is Candidate 2: the **Minimal Relationship Model /
Relationship Vocabulary**.

The recommended next implementation task is therefore not "implement
relationship verification". It is:

> Define and document the Minimal Relationship Model for PMA's existing
> `related:` mechanism, including allowed types, when typed links are
> appropriate, per-type verification expectations, lifecycle behavior, and
> trust states.

### Rationale

1. **Preserves PMA identity.** The model uses existing Markdown/frontmatter,
   not new infrastructure.
2. **Smallest correct foundation.** It defines what relationships mean before
   verifying them.
3. **Reduces false relationships.** A bounded vocabulary and trust distinction
   prevents connectivity theater.
4. **Sets up future verification.** The verification gate becomes a natural,
   smaller follow-up once the contract exists.
5. **Avoids over-engineering.** No graph DB, vector search, automatic
   inference, or per-link evidence arrays are required.
6. **Respects evidence uncertainty.** It does not assume the unavailable
   external systems justify a larger architecture.

### Critique of the Previous Report's Ordering

The previous report listed:

1. Relationship verification gate
2. Minimal typed relationship vocabulary
3. Session outcome contract
4. Cross-agent provenance metadata
5. Memory-as-untrusted-data security rule

**Assessment:**

- Candidate 2 should come before Candidate 1.
- Candidate 3 should remain later.
- Candidate 4 should remain optional.
- Candidate 5 is valuable but independent of relationships.

**Recommended revised ordering:**

```text
1. Minimal typed relationship model
2. Relationship verification rules
3. Lifecycle-aware relationship handling
4. Optional cross-agent provenance
5. Memory-as-untrusted-data security rule
6. Later: session outcome contract
```

---

## 14. Recommended Future Implementation Scope

This is the intended scope for a **future implementation task**. It is not an
implementation.

### 14.1 Intended Behavior

PMA's `related:` field should support a small set of typed relationships:

```text
supersedes, evolved_from, resolves, caused_by, affects,
belongs_to, contradicts, derived_from
```

Each typed link should be:

- optional,
- directional,
- bounded,
- lifecycle-aware,
- trust-aware.

Plain `related:` strings remain valid for loose, low-stakes navigation.

### 14.2 Intended Boundary

The implementation should:

- extend `templates/schema.yaml` with the bounded relationship vocabulary and
  optional `confidence` on typed links,
- update `templates/TEMPLATE.md` with examples,
- update `knowledge-classification` to recommend the appropriate type,
- update `memory-verification` with tiered relationship checks,
- update `memory-edit` to record relationship changes in
  `docs/CHANGELOG-MEMORY.md`,
- document lifecycle behavior for superseded and obsolete targets.

It should not:

- introduce a new graph store,
- add a separate relationship database,
- add PPR or vector retrieval,
- require per-link evidence arrays in the first step,
- automatically infer relationships,
- require cross-agent provenance,
- change existing superseded units.

### 14.3 Prerequisites

- Confirm that the relationship vocabulary is the smallest useful set.
- Confirm that `confidence` on relationships is optional, not required.
- Confirm that `supersedes` is the inverse of `superseded_by` without
  duplicating lifecycle semantics.
- Confirm that plain `related:` remains backward-compatible.

### 14.4 Acceptance Direction

A future implementation task should be considered ready when:

- the eight relationship types are documented,
- typed links can express lifecycle, resolution, cause, impact, and derivation,
- verification rules distinguish plain links from typed links,
- high-impact typed links require appropriate evidence or verification receipt,
- superseded and obsolete targets are handled without misleading retrieval,
- no new infrastructure or dependency is introduced.

---

## 15. Answer to the Final Question

> **What is the smallest architectural change that can make PMA's memories
> meaningfully interconnected and more useful to agents while keeping
> relationships trustworthy, evidence-aware, project-aware, human-readable,
> and maintainable?**

**Answer:**

The smallest correct change is a **minimal typed relationship model on top of
PMA's existing `related:` frontmatter field**:

1. A bounded vocabulary of eight relationship types:
   `supersedes`, `evolved_from`, `resolves`, `caused_by`, `affects`,
   `belongs_to`, `contradicts`, `derived_from`.
2. A directional, optional, evidence-aware convention for typed links.
3. A trust distinction between suggested and verified relationships, using
   existing confidence, lifecycle, and audit-log signals rather than a new
   storage subsystem.
4. Lifecycle-aware rules that prevent superseded and obsolete targets from
   misleading retrieval.
5. A future verification gate that extends `memory-verification` with
   tiered relationship checks.

The next concrete implementation task is to define and document this minimal
relationship model. A separate follow-up task should then extend
`memory-verification` to enforce it.

---

## 16. Evidence Map

### Observed

- `templates/schema.yaml`: existing `related:` typed link support, five types,
  `superseded_by`, `consolidated_from`, `confidence`, `evidence`.
- `templates/TEMPLATE.md`: usage examples and quality checklist.
- `agents/project-memory.md`: documented typed link features and navigation
  model.
- `skills/knowledge-classification/SKILL.md`: typed link recommendation rules.
- `skills/memory-verification/SKILL.md`: existing link and supersession
  checks.
- `docs/CHANGELOG-MEMORY.md`: audit log practice.

### Research Finding

- OpenViking and similar systems show that typed relationships can improve
  retrieval, but PMA should not copy their infrastructure.
- Previous PMA research recommends typed relationships and a verification
  gate, but orders the gate before settling the vocabulary.

### Interpretation

- The missing piece is a relationship contract, not a new graph system.
- The previous report's Candidate 1 is premature without Candidate 2.
- PMA can achieve graph-like behavior through Markdown/frontmatter links
  without a graph database.

### Recommendation

- Implement the Minimal Relationship Model first.
- Implement the relationship verification gate as a follow-up.
- Keep cross-agent provenance and session outcome contracts as later,
  optional extensions.
