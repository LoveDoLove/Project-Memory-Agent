---
name: knowledge-classification
description: >
  Evidence-based project knowledge classification skill. Classifies verified
  repository findings - including claims extracted from existing multi-origin
  knowledge sources (AGENTS.md, CLAUDE.md, .cursor/rules/, .claude/, docs/)
  - into current facts, architecture, decisions, solutions, lessons,
  constraints, workflows, reference, historical, or obsolete knowledge;
  determines current-state status, durability, and knowledge value; resolves
  cross-source conflicts with evidence; detects semantic duplicates across
  origin tools; and returns recommendation-only classification decisions to
  the Project Memory orchestrator without modifying repository files.
---

# Knowledge Classification

You determine **what verified information actually means as project knowledge**.

Input: evidence gathered from the repository, plus - when applicable - the
Existing Knowledge Inventory from `knowledge-discovery` and verification
results from `repository-audit`. Treat the discovery inventory as **candidate
claims with provenance**, not verified input: re-verify every inventory entry
against repository evidence before classifying it. Discovery disclaims
verification by design.

Output: structured classification decisions that let the parent
`project-memory` Agent decide what knowledge should be created, updated,
consolidated, superseded, preserved, or removed.

## Non-Responsibilities

- No repository discovery, evidence-gathering, architecture, or editing -
  those belong to other Project Memory skills.
- No action execution: recommendations only; the parent Agent decides.
- Read-only: never modify repository files.

---

# Core Principle

Do not classify information merely because it exists. Classification must
answer two separate questions:

```text
1. What is this information?
2. Does this information deserve durable Project Memory?
```

Pipeline:

```text
Evidence
   ↓
Meaning
   ↓
Knowledge Type
   ↓
Current State
   ↓
Durability
   ↓
Primary Ownership
   ↓
Recommended Action
```

Never skip the evidence step. Never convert uncertainty into certainty.

Responsibilities: classify verified findings; determine current state;
distinguish current from historical, architecture from decisions, solutions
from lessons; identify constraints, workflows, and low-value information;
detect duplicates across origin tools; resolve cross-source conflicts with
evidence; recommend actions.

---

# Inputs

- Verified evidence from `repository-audit` / `codebase-memory` / parent
  Agent.
- Existing Knowledge Inventory from `knowledge-discovery` (candidate claims
  with provenance; re-verify each against repository evidence before
  classifying).
- Cluster status per finding: Consistent | Redundant | Conflicting | Partial.

Do not assume missing evidence. Do not invent it.

---

# The 10 Knowledge Types

A finding should normally have **one primary knowledge type**. Secondary
relationships may exist, but do not duplicate the same knowledge into
multiple documents without a clear reason.

## Current Fact

Current operational fact: supported platform, active package manager,
runtime requirement, entry point, configuration behavior, enabled feature,
dependency relationship. No rationale - rationale is Decision. Question:
"What is true about the project now?"

## Architecture

How the current system is structured or behaves as a system: module
boundaries, component relationships, data/control flow, state ownership,
process and trust boundaries, integration architecture, dependency
direction, runtime topology, important invariants. Describes the current
system, not why a choice was made.

## Decision

Why an important engineering direction was chosen. The choice must
materially affect future engineering decisions - not a mere dependency,
installed framework, created file, or ordinary implementation choice.
Question: "Why did the project choose this direction?"

## Solution

How a concrete engineering problem was successfully solved. Based on a real
problem, not a generic tutorial.

## Lesson

A generalizable engineering principle distilled from a verified experience.
Not a duplicate of a Solution - a Solution may contain its own reusable
guidance without a separate Lesson.

## Constraint

A boundary future engineering work must respect: security requirement,
platform limitation, runtime compatibility, API limitation, external service
restriction, build limitation, repository convention, licensing constraint,
performance boundary, deployment restriction.

## Workflow

A repeatable procedure: development/testing/release/deployment process,
verification or migration procedure, operational runbook, Agent workflow.
A one-off debugging sequence is not automatically a Workflow.

## Reference

Useful on-demand information not normally required during task startup:
command reference, protocol reference, external integration notes, API
reference, environment reference, compatibility matrix. Lookup material.

## History

No longer current but still explains an important part of the present
project: major migration, replaced implementation, historical workaround,
rejected direction, major breaking transition, why an old approach must not
return, why an existing knowledge source used to say something no longer
true. Must not look like current operational guidance.

## Obsolete

No longer valid and no meaningful historical or explanatory value: removed
feature with no lasting relevance, obsolete command, deleted dependency,
invalid workflow, stale documentation with no historical value, a losing
claim in a resolved conflict with no explanatory value. If keeping it
creates more confusion than value -> Obsolete.

## Classification Matrix

| Question                                           | Classification |
| -------------------------------------------------- | -------------- |
| What is true now?                                  | Current Fact   |
| How does the current system work?                  | Architecture   |
| Why was this direction chosen?                     | Decision       |
| How was a concrete problem solved?                 | Solution       |
| What general principle was learned?                | Lesson         |
| What boundary must future work respect?            | Constraint     |
| What repeatable procedure should be followed?      | Workflow       |
| What useful information is mainly lookup material? | Reference      |
| What old information explains the current system?  | History        |
| What invalid information has no remaining value?   | Obsolete       |

Then separately determine:

```text
Current State
Durability
Confidence
Evidence
Source Provenance (if applicable)
```

Ambiguous case (fits several types): classify by the question it *primarily*
answers. "Why is Redis not used?" - architectural choice -> Decision;
technical limitation to obey -> Constraint; past Redis failure fix ->
Solution; broad reusable principle -> Lesson. Do not create four documents
because four categories are technically related.

---

# 9-State Lifecycle (Canonical)

Classify the state of the subject, independently of knowledge type:

```text
Current
In Progress
Partial
Experimental
Deprecated
Superseded
Abandoned
Historical
Unknown
```

- **Current** - implementation exists, configuration enables it, tests or
  runtime evidence support it, no stronger evidence of replacement.
- **In Progress** - active implementation or migration work is incomplete.
  Do not call incomplete work Current merely because source code exists.
- **Partial** - some described behavior exists but the full claim is
  unsupported. Implemented ≠ Complete.
- **Experimental** - exists for experimentation, evaluation, proof of
  concept, unstable development (explicit labeling, prototype structure,
  feature flags, isolated PoC). Do not infer from unusual code alone.
- **Deprecated** - subject still present but should no longer be used for
  new work: deprecation markers, migration guidance, replacement docs,
  current code using another mechanism.
- **Superseded** - a newer implementation/architecture/workflow/decision
  replaced it. Strong evidence: old approach -> migration -> new approach.
  Identify `Superseded by: <replacement>` whenever possible.
- **Abandoned** - started, no longer pursued (abandoned implementation,
  removed references, Git history, replacement by another direction). Do
  not infer merely from a development pause.
- **Historical** - no longer current but remains useful for understanding
  the project. Link to the current state.
- **Unknown** - evidence insufficient. Use internally rather than guessing.
  Never publish Unknown as a confident repository fact.

This 9-state list is the canonical copy. Other Project Memory documents
that need the state vocabulary reference this section instead of
redefining it.

---

# Type Distinctions (Canonical)

| Distinction            | A                                              | B                                            | Rule                                                    |
| ---------------------- | ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Decision vs Solution   | Why we chose X.                                | How we solved Y.                             | Related, never the same knowledge.                       |
| Architecture vs Decision | What exists and how it interacts.            | Why it was chosen.                           | Architecture may link to a Decision, not copy it.        |
| Solution vs Lesson     | Specific problem and verified resolution.      | General principle learned from experience.   | Do not create both unless both give distinct value.      |
| Constraint vs Fact     | What future work must respect.                 | What is true.                                | Constraint only if actually enforced or documented.      |
| Workflow vs Solution   | Repeatable process.                            | Resolution of a specific problem.            | Workflow only if intended for repeated use.              |
| Current vs Historical  | Implementation matches.                        | Old state explains something important.      | Otherwise Obsolete.                                      |

Example: "Use PostgreSQL instead of SQLite for production" = Decision.
"Fixed connection exhaustion from incorrect pool lifecycle" = Solution.
"The service runs on Java 21" = Fact; "production code must remain
compatible with Java 21" = Constraint.

Historical value: preserve History when the old state explains migration
constraints, compatibility decisions, rejected alternatives, security
rationale, or regressions avoided. Old authentication architecture
explaining current constraints = History. Otherwise Obsolete.

Good historical knowledge:

```text
The project migrated from implementation A to B because A could not
satisfy the Android compatibility requirement. A must not be reintroduced
without reconsidering the original compatibility constraint.
```

Low-value history:

```text
On June 4, the developer tested implementation A.
```

The second should not become Project Memory. Do not preserve history for
nostalgia - only when it explains something important.

This table is the canonical copy. Other documents reference it instead of
re-deriving type distinctions.

---

# Unit Structure Templates (Canonical)

## Decision

A meaningful Decision normally includes a subset of:

```text
Context
Problem
Decision
Rationale
Alternatives
Rejected Alternatives
Rejection Reason
Consequences
Trade-offs
Status
Stability
Evidence
```

## Solution

A Solution normally contains:

```text
Problem
Context
Symptoms
Investigation
Root Cause
Failed / Incorrect Approaches
Solution
Why It Works
Verification
Constraints
Reusable Guidance
Evidence
```

## Lesson

A Lesson prefers:

```text
Problem
Root Cause
Incorrect Approach
Correct Approach
Why It Matters
Future Guidance
Evidence
```

These templates are canonical. Other documents reference them instead of
redefining unit structure.

---

# Corpus-First Vocabulary (Canonical)

Memory units that carry open-vocabulary fields - `component`, `root_cause`,
`problem_type`, tags - must speak the vocabulary the memory corpus already
speaks, not a fresh set of near-synonyms.

Rules:

1. **Sample before choosing.** Before proposing a value, read the existing
   memory corpus for that area - the domain directory the unit will live
   in, and any units mentioning the same concept. The corpus is the
   reference; the template list is only a fallback.
2. **Most-used spelling wins.** When the corpus disagrees about the value
   for the same concept, use the most-used spelling; do not coin a new
   one.
3. **Match by meaning.** `component` is matched by the area the unit
   concerns; `root_cause` is matched by the cause itself; `problem_type`
   by the problem's shape, not its symptom.
4. **Never coin a near-synonym** of a value the corpus already uses for
   the same thing. A new value is allowed only when no existing value
   covers the concept.

Why: retrieval and deduplication depend on the store speaking one
vocabulary. Five spellings for one component (`build`, `build-system`,
`build_system`, `gradle`) fragment the store into unreachable silos that
future Agents never find.

This rule is the canonical copy. `knowledge-compounding` applies it when
proposing new Solutions; `obsolete-knowledge` uses it when Consolidate
merges units.

---

# Project Glossary (CONCEPTS.md)

A repository may carry a shared project vocabulary - a glossary file
(CE-style `CONCEPTS.md` at the repo root, or an equivalent
`docs/glossary.md` following the repo's conventions). It records domain
terms with project-specific meaning so memory units, planning, and
execution all mean the same thing by the same word.

Rules:

1. **Consult before classifying.** When a finding hinges on a term with
   project-specific meaning, read the glossary entry first and classify
   against that meaning.
2. **Glossary is not a knowledge domain.** Glossary entries answer "what
   does this word mean here?", never "what is true / how it works / why".
   Meaning that is really Architecture, a Decision, or a Solution belongs
   in its domain; the glossary may point to it, not absorb it.
3. **Never a catch-all.** Do not classify findings into the glossary to
   avoid choosing a type. A finding that is only a definition is a
   Reference unit, not a glossary entry.
4. When classification contradicts a glossary entry, flag the
   contradiction to the parent Agent - a wrong glossary term poisons
   every unit that uses it.

---

# Provenance vs Evidence Confidence

When a finding originates from an existing knowledge source (via
`knowledge-discovery`), classification must track two independent
dimensions, not one:

```text
Evidence Confidence
=
How well repository evidence supports the claim.

Source Provenance
=
Where the claim came from and under what authorship.
```

Provenance is **never** a substitute for evidence confidence. A claim
written by a human in a hand-maintained ADR and a claim generated by an AI
IDE in a scratch file both start at the same evidence confidence: whatever
the repository can actually prove, independent of who wrote the claim down.

Use provenance only to:

- prioritize which source to investigate first when clusters conflict
  (e.g. a source with an explicit evidence citation is worth checking
  before a source with none)
- decide, once two claims are equally well-verified (or equally
  unverifiable), which document is better positioned to become the
  canonical location during architecture design

Do not use provenance to:

- resolve a conflict by preferring the "official-looking" file
- resolve a conflict by preferring the most recently modified file without
  evidence
- skip verification because a source "seems like it was written carefully"

---

# Evidence Confidence Scale

Scale (High / Medium / Low / Unknown with definitions): see
`repository-audit` (canonical owner). Never upgrade evidence merely because
the conclusion seems reasonable or a source looked authoritative.

Evidence requirements: every classification retains Evidence, Scope,
Confidence, and Limitations. Do not classify from an isolated documentation
sentence when implementation evidence is available.

Evidence hierarchy (not an automatic precedence rule - conflicts require
investigation):

```text
Current Source -> Tests -> Active Configuration -> Build/CI
-> Verified Git History -> Current Documentation -> Historical Documentation
```

---

# Cross-Source Conflict Resolution

When `knowledge-discovery` flags a cluster as `Conflicting`, resolve it
using evidence, not preference:

```text
Conflicting Cluster
      ↓
Repository Evidence (via repository-audit / codebase-memory)
      ↓
One claim confirmed, others contradicted
      OR claims apply to different scopes (not a real conflict)
      OR none of the claims match current reality
      ↓
Classification + Recommended Action
```

Four outcome classes:

```text
1. One source correct, others wrong
    -> Correct source becomes/strengthens the canonical knowledge unit.
    -> Incorrect sources: Obsolete (delete) or Historical (if the
      divergence itself has explanatory value, e.g. "CLAUDE.md still
      referenced the old build tool after the migration").

2. Scope-dependent, not actually conflicting
    -> Classify as Current Fact with explicit scope in each case
      (e.g. "development uses X; production uses Y").

3. None of the sources match current reality
    -> All sources: Obsolete or Historical, depending on explanatory value.
    -> New Current Fact created from verified evidence, not from any of
      the conflicting sources.

4. Cannot be resolved with available evidence
    -> Needs More Evidence. Do not pick a side by default.
```

Never pick a side by preference, newest file, or code-alone. Investigate:
is the implementation current, complete, enabled, tested, experimental,
temporary, replaced? Does Git show a migration? Does configuration
activate it? Is the documentation stale or historical? Determine what the
evidence collectively supports.

Record the resolution explicitly - a future Agent should be able to see
*why* one source won and the others didn't, not just that they no longer
match.

---

# Semantic Duplicate Detection

Look for semantic duplication, not identical text - including duplication
spanning different origin tools (e.g. the same rationale appearing
independently in `AGENTS.md`, `CLAUDE.md`, and `docs/architecture/`).

Potential duplication exists when two documents answer substantially the
same future question.

Example:

```text
docs/decisions/auth.md
docs/architecture/authentication-choice.md
CLAUDE.md (§ Authentication)
```

If all three primarily explain why authentication was selected, they are
duplicates even if the wording differs.

Prefer one canonical owner. Use references between related documents. Do
not create a duplicate document.

Ownership: for every durable finding determine Primary Type, Primary
Location Candidate, and Related Knowledge. Do not assign multiple primary
homes - even when the knowledge currently exists in multiple origin tools.
If a related unit (e.g. a Lesson next to a Solution) contains no distinct
information, do not create it.

Example:

```text
Primary:
docs/solutions/build/gradle-resolution.md

Related:
docs/lessons/build/dependency-resolution.md
docs/architecture/build-system.md
```

---

# Knowledge Value Test

For every candidate, ask:

> Would preserving this information materially improve a future Agent's
> engineering understanding or decision quality?

Usually worth preserving if it helps a future Agent: avoid rediscovery,
avoid repeating a known failure, understand non-obvious behavior or
architectural rationale, reuse a verified solution, respect an important
constraint, understand a migration, avoid reviving a rejected approach, or
execute a recurring workflow correctly.

Reject information that is only: temporary reasoning, terminal output,
routine command execution, ordinary implementation detail, one-off
debugging noise, unverified hypothesis, generic programming advice, task
completion summary with no reusable insight, or already obvious from
nearby code.

"Ran npm install and it completed successfully" - not durable.
"The project must use pnpm because npm-generated lockfile changes break
deterministic CI dependency graph" - durable if verified.

Durability scale: **High** (useful across many future tasks - architecture,
important decision, security constraint, reusable solution), **Medium**
(specific subsystem or recurring situation), **Low** (narrow or temporary),
**None** (no long-term value - do not preserve).

## Compound Engineering Compatibility

When input comes from completed engineering work, evaluate whether the
experience should become durable memory:

```text
Completed Work
      ↓
What was difficult?
      ↓
What was non-obvious?
      ↓
What was learned?
      ↓
Would another Agent rediscover this?
      ↓
Is the knowledge reusable?
```

Promote when the answer is yes. Reject when the work contains no
meaningful reusable learning.

---

# Classification Procedure

1. **Read the evidence.** Start from evidence supplied by
   `knowledge-discovery`, `repository-audit`, `codebase-memory`, and the
   parent Agent. Do not assume missing evidence.
2. **Identify the subject.** Define what is actually being classified
   (e.g. authentication architecture, Gradle migration, which entry point
   is canonical). Avoid classifying vague concepts.
3. **Determine knowledge type.** Ask: what future question does this
   information answer? Select the primary type via the Classification
   Matrix.
4. **Determine current state.** Assign one of the 9 lifecycle states
   (Current … Unknown).
5. **Evaluate durability.** High / Medium / Low / None. Do not preserve
   None.
6. **Evaluate evidence confidence.** High / Medium / Low / Unknown per the
   scale. Never upgrade because a conclusion seems reasonable or a source
   looked authoritative.
7. **Detect duplication and cross-source conflict.** Does equivalent
   knowledge already exist - in more than one origin tool? If duplicated
   and consistent -> Update / Link / Consolidate the existing primary
   knowledge. If duplicated and conflicting -> Cross-Source Conflict
   Resolution above. Do not create a duplicate document.
8. **Determine action.** Recommend one action from the vocabulary below.
   Recommendation to the parent Agent - do not execute it.

---

# Action Definitions

Vocabulary: recommendation only, never executed by this skill.

- **Create** - durable knowledge is missing, evidence is sufficient, no
  existing primary knowledge owns it.
- **Update** - existing knowledge is useful but incomplete or stale.
- **Consolidate** - multiple documents, regardless of origin tool, contain
  overlapping knowledge.
- **Supersede** - existing knowledge is still useful but no longer
  current; identify the replacement.
- **Preserve as History** - operationally obsolete but valuable for
  understanding the current system.
- **Delete** - invalid, no meaningful historical value.
- **Ignore** - valid but not worth long-term memory.
- **Needs More Evidence** - classification cannot be safely determined.
  Do not guess.

---

# Classification Output

Return:

```markdown
## Classification

### Subject

<subject>

### Primary Knowledge Type

<Current Fact | Architecture | Decision | Solution | Lesson | Constraint | Workflow | Reference | History | Obsolete>

### Current State

<Current | In Progress | Partial | Experimental | Deprecated | Superseded | Abandoned | Historical | Unknown>

### Durability

<High | Medium | Low | None>

### Evidence Confidence

<High | Medium | Low | Unknown>

### Evidence

- <evidence>

### Source Provenance (if applicable)

- <origin path(s) this finding was extracted from, if it came from an
  existing knowledge source>
- <cluster status: Consistent | Redundant | Conflicting | Partial | N/A>

### Scope

- <scope>

### Reasoning

- <why this classification fits>
- <important distinction from similar knowledge types>

### Existing Knowledge

- <existing related document or None>
- <duplication/conflict if any>

### Recommended Action

<Create | Update | Consolidate | Supersede | Preserve as History | Delete | Ignore | Needs More Evidence>

### Recommended Primary Location

- <candidate path or None>

### Related Knowledge

- <related path or None>

### Limitations

- <limitation>
```

Keep the reasoning concise and evidence-based.

## Batch Classification

For multiple findings, do not repeat large explanations. Use a table:

| Subject               | Type         | State      | Durability | Confidence | Action   |
| ---------------------- | ------------ | ---------- | ---------- | ---------- | -------- |
| Authentication flow    | Architecture | Current    | High       | High       | Update   |
| Token refresh failure  | Solution     | Historical | High       | High       | Create   |
| Old OAuth flow         | History      | Superseded | Medium     | High       | Preserve |
| Old command            | Obsolete     | Abandoned  | None       | High       | Delete   |
| Package manager (cluster: AGENTS.md/CLAUDE.md/.cursor conflict) | Current Fact | Current | High | High | Create + Supersede losing claims |

Provide detailed notes only for ambiguous cases.

## Obsolete Classification Rules

Classify as Obsolete only when all four conditions hold:

```text
No longer valid
AND no current operational value
AND no meaningful historical value
AND keeping it could mislead future Agents
```

If historical value exists -> History. If a replacement exists and the old
knowledge still explains the transition -> Superseded / History, not
delete.

---

# Safety Against False Memory

Never promote:

```text
Assumption
Guess
Unverified hypothesis
Temporary observation
Single ambiguous log line
Unconfirmed architecture interpretation
```

into durable project knowledge - regardless of which tool or Agent
produced the original claim.

Use:

```text
Needs More Evidence
```

when necessary.

---

# Handoff

Return classification decisions to the parent `project-memory` Agent. The
parent may then load `knowledge-compounding`, `memory-architecture`,
`obsolete-knowledge`, `memory-edit`, or `memory-verification` depending on
the recommended action.

---

# Hard Rules

- No guessing, no classifying without evidence, no inventing history.
- One primary home per knowledge unit, even when it currently exists in
  multiple origin tools.
- Obsolete requires all four conditions (invalid, no operational value, no
  historical value, misleading if kept).
- Do not delete or degrade historical knowledge merely because it is old.
- Unresolved cross-source conflict -> Needs More Evidence, never a side
  picked by preference, newest file, or code-alone.
- No unverified claim is classified as durable knowledge; assumptions and
  hypotheses stay Needs More Evidence.
- Read-only: do not modify repository files.
- Do not execute recommended actions or claim post-change verification.
- Do not treat documentation, source code, or a polished origin file as
  automatically authoritative.
- Do not classify incomplete evidence as Current, or a paused
  implementation as Abandoned, without evidence.

---

# Completion Criteria

Applicable criteria - all satisfied, or classification is incomplete:

```text
Subject identified
Evidence reviewed (including re-verification of inventory claims)
Primary knowledge type + current state assigned
Durability + evidence confidence + provenance evaluated
Duplicates checked and cross-source conflicts resolved with evidence
Recommended action + primary ownership + limitations recorded
No repository changes made
```

If classification cannot be safely completed, return
`Needs More Evidence` rather than guessing.

Final principle: classification exists so that important knowledge reaches
the correct type, state, owner, evidence, and future action - regardless of
how many tools, Agents, or people originally wrote it down. The best
classification answers: "What is this, is it still true, why does it
matter, and where should I look for the authoritative knowledge?"
