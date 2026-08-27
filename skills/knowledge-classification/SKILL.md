---
name: knowledge-classification
description: >
  Evidence-based project knowledge classification skill. Classifies verified
  repository findings — including claims sourced from existing multi-origin
  knowledge (AGENTS.md, CLAUDE.md, .cursor/rules/, .claude/, docs/, and
  similar) — into current facts, architecture, decisions, solutions,
  lessons, constraints, workflows, reference knowledge, historical
  knowledge, or obsolete knowledge; determines current-state status and
  knowledge value; resolves cross-source conflicts using evidence; separates
  durable engineering knowledge from temporary implementation noise; and
  provides classification decisions to the Project Memory orchestrator
  without modifying repository files.
---

# Knowledge Classification

You are responsible for determining **what verified information actually means
as project knowledge**.

Your input is evidence gathered from the repository, and — when applicable —
the Existing Knowledge Inventory produced by `knowledge-discovery` together
with the verification results produced by `repository-audit`.

Your output is a structured classification that allows the parent
`project-memory` Agent to decide what knowledge should be created, updated,
consolidated, superseded, preserved, or removed.

You do not own:

- repository discovery
- repository-wide evidence gathering
- existing-knowledge-source discovery and extraction
- documentation architecture
- documentation editing
- obsolete knowledge execution
- final post-change verification

Those responsibilities belong to other Project Memory skills.

---

# Core Principle

Do not classify information merely because it exists.

Classification must answer two separate questions:

```text
1. What is this information?
2. Does this information deserve durable Project Memory?
````

Use:

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

Never skip the evidence step.

Never convert uncertainty into certainty.

---

# Responsibilities

This Skill is responsible for:

1. Classifying verified repository findings.
2. Determining current-state status.
3. Distinguishing current knowledge from historical knowledge.
4. Distinguishing architecture from decisions.
5. Distinguishing solutions from lessons.
6. Identifying constraints and workflows.
7. Identifying low-value or temporary information.
8. Detecting duplicate knowledge concepts, including duplicates that
   originate from different tools or Agents.
9. Resolving cross-source conflicts using verified evidence.
10. Determining whether information deserves long-term memory.
11. Recommending the appropriate knowledge action.

It may recommend an action, but repository modification is outside this Skill.

---

# Non-Responsibilities

Do not:

* perform broad repository discovery unless necessary to resolve classification
* discover or extract existing knowledge sources — that is `knowledge-discovery`
* modify files
* create documentation
* restructure `docs/`
* delete obsolete files
* move files
* rewrite `AGENTS.md`
* execute mechanical edits
* claim post-change verification
* invent missing evidence
* create knowledge solely because a file exists

---

# Classification Model

Use the following knowledge types.

```text
Current Fact
Architecture
Decision
Solution
Lesson
Constraint
Workflow
Reference
History
Obsolete
```

A finding should normally have **one primary knowledge type**.

Secondary relationships may exist, but do not duplicate the same knowledge into
multiple documents without a clear reason.

---

# Knowledge Type Definitions

## Current Fact

Use when the information describes a current operational fact.

Examples:

* current supported platform
* active package manager
* current runtime requirement
* current entry point
* current configuration behavior
* currently enabled feature
* current dependency relationship

Question:

> What is true about the project now?

Do not use Current Fact for rationale.

---

# Architecture

Use when the information explains how the current system is structured or behaves
as a system.

Examples:

* module boundaries
* component relationships
* data flow
* control flow
* state ownership
* process boundaries
* trust boundaries
* integration architecture
* dependency direction
* runtime topology
* important invariants

Question:

> How does the current system work?

Architecture should describe the current system, not merely explain why a choice
was made.

---

# Decision

Use when the information explains why an important engineering direction was
chosen.

A meaningful Decision normally includes some subset of:

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

Question:

> Why did the project choose this direction?

Do not create a Decision merely because:

* a dependency exists
* a framework is installed
* a file was created
* a feature was implemented
* a developer made an ordinary implementation choice

The choice must materially affect future engineering decisions.

---

# Solution

Use when the information documents how a concrete engineering problem has been
successfully solved.

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

Question:

> How was this concrete problem solved, and what should the next Agent know?

A Solution should be based on a real engineering problem rather than a generic
tutorial.

---

# Lesson

Use when a verified experience produces a generalizable engineering principle.

Prefer:

```text
Problem
Root Cause
Incorrect Approach
Correct Approach
Why It Matters
Future Guidance
Evidence
```

Question:

> What general principle should future Agents learn from this experience?

Do not create a Lesson when it merely duplicates a Solution.

A Solution may contain a reusable lesson without requiring a separate Lesson file.

---

# Constraint

Use when the information defines a boundary that future engineering work must
respect.

Examples:

```text
Security requirement
Platform limitation
Runtime compatibility
API limitation
External service restriction
Build limitation
Repository convention
Licensing constraint
Performance boundary
Deployment restriction
```

Question:

> What must future engineering work not violate?

---

# Workflow

Use when the information describes a repeatable procedure.

Examples:

* development workflow
* testing workflow
* release process
* deployment process
* verification procedure
* migration procedure
* operational runbook
* Agent workflow

Question:

> What repeatable sequence should someone follow?

A one-off debugging sequence is not automatically a Workflow.

---

# Reference

Use for useful on-demand information that does not belong in the other
categories and is not normally required during task startup.

Examples:

* command reference
* protocol reference
* external integration notes
* API reference
* environment reference
* compatibility matrix

Question:

> Is this useful information, but primarily something to look up when needed?

---

# History

Use when information is no longer current but still explains an important part of
the present project.

Examples:

* major architecture migration
* replaced implementation
* important dependency migration
* historical compatibility workaround
* rejected architectural direction
* major breaking transition
* reason an old approach must not return
* why an existing knowledge source used to say something that is no longer true

Question:

> Is this old information still useful for understanding why the project is
> the way it is today?

Historical knowledge must not look like current operational guidance.

---

# Obsolete

Use when information is no longer valid and provides no meaningful historical
or explanatory value.

Examples:

* removed feature with no lasting relevance
* obsolete command
* deleted dependency
* invalid workflow
* temporary workaround that no longer matters
* stale documentation with no historical value
* outdated project structure
* a losing claim in a resolved cross-source conflict with no explanatory value

Question:

> Would keeping this information create more confusion than value?

If yes, classify as Obsolete.

---

# Current-State Classification

In addition to knowledge type, classify the state of the subject.

Use:

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

---

## Current

Evidence indicates the implementation or knowledge is active and applicable.

Use when:

* implementation exists
* relevant configuration enables it
* tests or runtime evidence support it where appropriate
* no stronger evidence indicates replacement

---

## In Progress

Evidence indicates active implementation or migration work is incomplete.

Examples:

* migration partially completed
* feature branch work reflected in repository state
* implementation exists but required integration is missing

Do not call incomplete work Current merely because source code exists.

---

## Partial

Some of the described behavior exists, but the full claim is unsupported.

Use when:

```text
Implemented ≠ Complete
```

---

## Experimental

The implementation exists primarily for experimentation, evaluation, proof of
concept, or unstable development.

Indicators may include:

* explicit experimental labeling
* prototype structure
* temporary test harness
* feature flags
* isolated proof-of-concept implementation

Do not infer "experimental" solely from unusual code.

---

## Deprecated

The project still contains the subject, but evidence indicates it should no
longer be used for new work.

Look for:

* explicit deprecation markers
* migration guidance
* replacement documentation
* deprecation comments
* current code using another mechanism

---

## Superseded

A newer implementation, architecture, workflow, or decision has replaced it.

Strong evidence includes:

```text
Old approach
      ↓
Migration
      ↓
New approach
```

Whenever possible identify:

```text
Superseded by: <replacement>
```

---

## Abandoned

Work was started but is no longer being pursued.

Evidence may include:

* abandoned implementation
* removed references
* Git history
* explicit abandonment
* replacement by another direction

Do not infer abandonment merely because development has paused.

---

## Historical

The subject is no longer current but remains useful for understanding the project.

Historical information should normally be linked to the current state.

---

## Unknown

Evidence is insufficient.

Use this internally rather than guessing.

Never publish Unknown as a confident repository fact.

---

# Knowledge Value Test

For every candidate finding, ask:

> Would preserving this information materially improve a future Agent's
> engineering understanding or decision quality?

A candidate is usually worth preserving if it helps a future Agent:

* avoid rediscovery
* avoid repeating a known failure
* understand non-obvious behavior
* understand architectural rationale
* reuse a verified solution
* respect an important constraint
* understand a migration
* avoid reviving a rejected approach
* execute a recurring workflow correctly

---

# Reject Low-Value Knowledge

Do not promote information that is only:

```text
Temporary reasoning
Terminal output
Routine command execution
Ordinary implementation detail
One-off debugging noise
Unverified hypothesis
Generic programming advice
Task completion summary with no reusable insight
Information already obvious from nearby code
```

Example:

```text
"Ran npm install and it completed successfully."
```

Usually not durable knowledge.

But:

```text
"The project must use pnpm because npm-generated lockfile changes break the
repository's deterministic CI dependency graph."
```

Potentially durable knowledge if verified.

---

# Evidence Requirements

Classification must be evidence-backed.

For each classification, retain:

```text
Evidence
Scope
Confidence
Limitations
```

Do not classify from an isolated sentence in documentation when implementation
evidence is available.

---

# Source Provenance vs Evidence Confidence

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

# Evidence Hierarchy

Use:

```text
Current Source
    ↓
Tests
    ↓
Active Configuration
    ↓
Build / CI
    ↓
Verified Git History
    ↓
Current Documentation
    ↓
Historical Documentation
```

This is not an automatic precedence rule.

Conflicts require investigation.

---

# Conflict Resolution

When evidence conflicts, investigate:

```text
Is implementation current?
Is it complete?
Is it enabled?
Is it tested?
Is it experimental?
Is it temporary?
Was it replaced?
Does Git show a migration?
Does configuration activate it?
Is documentation stale?
Is documentation historical?
```

Do not simply choose the newest file.

Do not simply choose the source code.

Determine what the evidence collectively supports.

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
      OR
Claims apply to different scopes (not a real conflict)
      OR
None of the claims match current reality
      ↓
Classification + Recommended Action
```

Possible outcomes:

```text
One source correct, others wrong
    → Correct source becomes/strengthens the canonical knowledge unit.
    → Incorrect sources: Obsolete (delete) or Historical (if the
      divergence itself has explanatory value, e.g. "CLAUDE.md still
      referenced the old build tool after the migration").

Scope-dependent, not actually conflicting
    → Classify as Current Fact with explicit scope in each case
      (e.g. "development uses X; production uses Y").

None of the sources match current reality
    → All sources: Obsolete or Historical, depending on explanatory value.
    → New Current Fact created from verified evidence, not from any of the
      conflicting sources.

Cannot be resolved with available evidence
    → Needs More Evidence. Do not pick a side by default.
```

Record the resolution explicitly — a future Agent should be able to see
*why* one source won and the others didn't, not just that they don't match
anymore.

---

# Current vs Historical

A document should be classified as historical when:

```text
Current implementation differs
AND
the old state explains something important
```

Examples:

```text
Old authentication architecture
        ↓
Current authentication architecture
```

The old architecture may remain valuable if it explains:

* migration constraints
* compatibility decisions
* rejected alternatives
* security rationale
* important regressions avoided

If the old information provides no such value, classify it as Obsolete.

---

# Decision vs Solution

Use this distinction:

```text
Decision
=
Why we chose X.

Solution
=
How we solved Y.
```

Example:

```text
Decision:
Use PostgreSQL instead of SQLite for production persistence.

Solution:
Fixed connection exhaustion caused by an incorrect connection-pool lifecycle.
```

They may be related, but they are not the same knowledge.

---

# Solution vs Lesson

Use:

```text
Solution
=
Specific problem and verified resolution.

Lesson
=
General principle learned from experience.
```

Example:

```text
Solution:
Fixed Gradle dependency resolution failure caused by repository ordering.

Lesson:
Build tooling failures should first be checked against repository resolution
order before changing dependency versions.
```

Do not create both unless both provide distinct future value.

---

# Architecture vs Decision

Use:

```text
Architecture
=
What exists and how it interacts.

Decision
=
Why it was chosen.
```

An Architecture document may link to a Decision.

It should not copy the entire Decision.

---

# Constraint vs Fact

Use:

```text
Fact
=
What is true.

Constraint
=
What future work must respect.
```

Example:

```text
Fact:
The service currently runs on Java 21.

Constraint:
Production code must remain compatible with Java 21.
```

Only classify the second as a Constraint if the compatibility requirement is
actually enforced or documented as a project boundary.

---

# Workflow vs Solution

Use:

```text
Workflow
=
Repeatable process.

Solution
=
Resolution of a specific problem.
```

A troubleshooting sequence becomes a Workflow only if it is intended for
repeated use.

---

# Duplicate Knowledge Detection

Look for semantic duplication, not just identical text — including
duplication that spans different origin tools (e.g. the same rationale
appearing independently in `AGENTS.md`, `CLAUDE.md`, and
`docs/architecture/`).

Potential duplication exists when two documents answer substantially the same
future question.

Example:

```text
docs/decisions/auth.md
docs/architecture/authentication-choice.md
CLAUDE.md (§ Authentication)
```

If all three primarily explain why authentication was selected, they may be
duplicates even if the wording differs.

Prefer one canonical owner.

Use references between related documents.

---

# Knowledge Ownership

For every durable finding, determine:

```text
Primary Type
Primary Location Candidate
Related Knowledge
```

Do not assign multiple primary homes.

Example:

```text
Primary:
docs/solutions/build/gradle-resolution.md

Related:
docs/lessons/build/dependency-resolution.md
docs/architecture/build-system.md
```

If the Lesson contains no distinct information, do not create it.

---

# Classification Matrix

Use this decision matrix:

| Question                                           | Classification |
| --------------------------------------------------- | -------------- |
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

---

# Classification Procedure

## Step 1 — Read the Evidence

Start from the evidence supplied by:

```text
knowledge-discovery
repository-audit
codebase-memory
parent Agent
```

Do not assume missing evidence.

---

## Step 2 — Identify the Subject

Define what is actually being classified.

Examples:

```text
Authentication architecture
Gradle migration
Token refresh failure
Production deployment command
Java version requirement
Old caching implementation
Which entry point is canonical (AGENTS.md vs CLAUDE.md)
```

Avoid classifying vague concepts.

---

## Step 3 — Determine Knowledge Type

Ask:

```text
What future question does this information answer?
```

Then select the primary type.

---

## Step 4 — Determine Current State

Classify:

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

---

## Step 5 — Evaluate Durability

Determine:

```text
High
Medium
Low
None
```

### High

Likely useful across many future tasks.

Examples:

* architecture
* important decision
* security constraint
* reusable solution

### Medium

Useful for a specific subsystem or recurring situation.

### Low

Potentially useful but narrow or temporary.

### None

No meaningful long-term value.

Do not preserve None.

---

## Step 6 — Evaluate Evidence

Use:

```text
High
Medium
Low
Unknown
```

Never upgrade evidence merely because the conclusion seems reasonable, and
never upgrade evidence merely because a source looked authoritative.

---

## Step 7 — Detect Duplication and Cross-Source Conflict

Ask:

```text
Does equivalent knowledge already exist?
Does it exist in more than one origin tool?
Do the multiple copies agree?
```

If duplicated and consistent:

```text
Existing Primary Knowledge
        ↓
Update / Link / Consolidate
```

If duplicated and conflicting, use Cross-Source Conflict Resolution above.

Do not create a duplicate document.

---

## Step 8 — Determine Action

Recommend:

```text
Create
Update
Consolidate
Supersede
Preserve as History
Delete
Ignore
Needs More Evidence
```

This is a recommendation to the parent Agent.

Do not execute it.

---

# Action Definitions

## Create

Use when:

* durable knowledge is missing
* evidence is sufficient
* no existing primary knowledge owns it

---

## Update

Use when existing knowledge is useful but incomplete or stale.

---

## Consolidate

Use when multiple documents — regardless of origin tool — contain overlapping
knowledge.

---

## Supersede

Use when existing knowledge is still useful but no longer current.

The replacement should be identified.

---

## Preserve as History

Use when information is obsolete operationally but valuable for understanding
the current system.

---

## Delete

Use when information is invalid and has no meaningful historical value.

---

## Ignore

Use when information is valid but not worth long-term memory.

---

## Needs More Evidence

Use when classification cannot be safely determined.

Do not guess.

---

# Confidence Model

Use:

```text
High
Medium
Low
Unknown
```

## High

Multiple independent evidence sources agree.

Example:

```text
Source + Tests + Configuration
```

## Medium

Strong direct evidence exists but independent corroboration is limited.

Example:

```text
Implementation + Documentation
```

## Low

Evidence is indirect, incomplete, or historical.

Example:

```text
Commit message only
```

## Unknown

Evidence is insufficient to support classification.

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

---

# Batch Classification

When classifying multiple findings, do not repeat large explanations.

Use a table:

| Subject               | Type         | State      | Durability | Confidence | Action   |
| ---------------------- | ------------ | ---------- | ---------- | ---------- | -------- |
| Authentication flow    | Architecture | Current    | High       | High       | Update   |
| Token refresh failure  | Solution     | Historical | High       | High       | Create   |
| Old OAuth flow         | History      | Superseded | Medium     | High       | Preserve |
| Old command             | Obsolete     | Abandoned  | None       | High       | Delete   |
| Package manager (cluster: AGENTS.md/CLAUDE.md/.cursor conflict) | Current Fact | Current | High | High | Create + Supersede losing claims |

Then provide detailed notes only for ambiguous cases.

---

# Ambiguous Classification

Some information legitimately belongs near multiple categories.

Use the question it primarily answers.

Example:

```text
"Why is Redis not used?"
```

If the answer explains an architectural choice:

```text
Decision
```

If the answer is a technical limitation future work must obey:

```text
Constraint
```

If it records how a previous Redis-related failure was fixed:

```text
Solution
```

If it explains a broad reusable principle:

```text
Lesson
```

Do not create four documents because four categories are technically related.

---

# Compound Engineering Compatibility

When the input comes from completed engineering work, evaluate whether the
experience should become durable memory.

Use:

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

Promote when the answer is yes.

Reject when the work contains no meaningful reusable learning.

---

# Historical Classification Rules

Do not preserve history for nostalgia.

Preserve historical knowledge only when it explains something important.

Good historical knowledge:

```text
The project migrated from implementation A to B because A could not satisfy
the Android compatibility requirement. A must not be reintroduced without
reconsidering the original compatibility constraint.
```

Low-value history:

```text
On June 4, the developer tested implementation A.
```

The second should normally not become Project Memory.

---

# Obsolete Classification Rules

Classify as Obsolete when all are true:

```text
No longer valid
AND
No current operational value
AND
No meaningful historical value
AND
Keeping it could mislead future Agents
```

If historical value exists, use History instead.

If replacement exists and the old knowledge still helps explain the transition,
use Superseded / History rather than simply deleting it.

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

into durable project knowledge — regardless of which tool or Agent produced
the original claim.

Use:

```text
Needs More Evidence
```

when necessary.

---

# Handoff

Return classification decisions to the parent `project-memory` Agent.

The parent may then load:

```text
knowledge-compounding
memory-architecture
obsolete-knowledge
memory-edit
memory-verification
```

depending on the recommended action.

---

# Hard Rules

* Do not classify without evidence.
* Do not guess.
* Do not invent history.
* Do not treat documentation as automatically current.
* Do not treat source code as automatically sufficient proof.
* Do not treat an existing knowledge source as authoritative because of its
  origin tool or apparent polish.
* Do not confuse Architecture with Decision.
* Do not confuse Solution with Lesson.
* Do not confuse Fact with Constraint.
* Do not confuse Workflow with Solution.
* Do not create multiple primary homes for one piece of knowledge, even when
  it currently exists in multiple origin tools.
* Do not promote ordinary debugging noise.
* Do not promote terminal output.
* Do not promote unverified hypotheses.
* Do not create a Decision merely because a dependency exists.
* Do not create a Solution merely because a task was completed.
* Do not create a Lesson merely because a Solution exists.
* Do not preserve history without explanatory value.
* Do not delete historical knowledge merely because it is old.
* Do not classify incomplete evidence as Current.
* Do not treat a paused implementation as Abandoned without evidence.
* Do not treat a newer file as automatically authoritative.
* Do not resolve a cross-source conflict by preference instead of evidence.
* Do not modify repository files.
* Do not execute the recommended action.
* Do not claim post-change verification.
* Do not hide uncertainty.

---

# Completion Criteria

The classification task is complete when applicable:

```text
Subject identified
        ✓
Evidence reviewed
        ✓
Primary knowledge type assigned
        ✓
Current state assigned
        ✓
Durability evaluated
        ✓
Evidence confidence evaluated
        ✓
Source provenance recorded where applicable
        ✓
Duplicate knowledge checked (including cross-source)
        ✓
Cross-source conflicts resolved with evidence
        ✓
Historical value evaluated
        ✓
Recommended action determined
        ✓
Primary ownership identified
        ✓
Limitations recorded
        ✓
No repository changes made
        ✓
```

If classification cannot be safely completed, return:

```text
Needs More Evidence
```

rather than guessing.

---

# Final Principle

The purpose of classification is not to make the repository contain more
documents.

It is to ensure that:

```text
Important Knowledge
        ↓
Correct Type
        ↓
Correct State
        ↓
Correct Owner
        ↓
Correct Evidence
        ↓
Correct Future Action
```

regardless of how many different tools, Agents, or people originally wrote
it down.

The best classification is the one that gives future Agents the clearest answer
to:

> "What is this, is it still true, why does it matter, and where should I look
> for the authoritative knowledge?"
