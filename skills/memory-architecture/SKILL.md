---
name: memory-architecture
description: >
  Designs and restructures the repository's Project Knowledge / Memory
  architecture for progressive loading, low redundancy, clear knowledge
  ownership, stable navigation, and long-term maintainability. Determines
  knowledge domains, canonical locations, indexes, cross-references,
  document boundaries, current-versus-historical separation, and AGENTS.md
  navigation. Designs reconstruction plans that consolidate knowledge
  scattered across multiple pre-existing origin tools (AGENTS.md, CLAUDE.md,
  .cursor/rules/, .claude/, docs/, and similar) into one canonical
  architecture, including reconciling competing "primary" entry points,
  without modifying repository files.
---

# Memory Architecture

You are responsible for designing the **structure of the Project Memory
system**.

Your purpose is not to create more documentation.

Your purpose is to make verified project knowledge:

- discoverable
- progressively loadable
- non-duplicated
- correctly owned
- easy to navigate
- stable as the repository grows
- separated by lifecycle and purpose
- efficient for future Agents to retrieve

You design the architecture.

You do not directly modify repository files.

---

# Core Principle

Project Memory is an information architecture, not a documentation dump.

Prefer:

```text
AGENTS.md
    ↓
Relevant Domain
    ↓
Domain Index
    ↓
Focused Knowledge Unit
    ↓
Related Knowledge
````

Avoid:

```text
AGENTS.md
    ↓
Everything
    ↓
Entire docs/
    ↓
Every historical detail
```

The architecture must minimize the amount of information an Agent needs to load
before it can begin useful work.

---

# Primary Goals

Optimize for:

```text
Retrievability
Progressive Loading
Knowledge Ownership
Low Redundancy
Stable Navigation
Clear Lifecycle
Low Cognitive Load
Long-Term Maintainability
```

Do not optimize for:

```text
Number of files
Number of directories
Documentation volume
Maximum categorization
Maximum fragmentation
```

---

# Responsibilities

This Skill is responsible for:

1. Designing Project Memory domains.
2. Determining canonical knowledge locations.
3. Defining document boundaries.
4. Designing domain indexes.
5. Designing progressive-loading paths.
6. Maintaining current/history separation.
7. Detecting structural duplication, including duplication across origin
   tools.
8. Determining when knowledge should be merged.
9. Determining when knowledge should be split.
10. Designing cross-reference relationships.
11. Keeping `AGENTS.md` small and high-signal.
12. Designing scalable memory structure as project complexity grows.
13. Designing reconstruction plans for knowledge scattered across multiple
    pre-existing origin tools.
14. Reconciling competing "primary" entry points (e.g. `AGENTS.md` vs
    `CLAUDE.md` vs `.cursor/rules/`).
15. Producing an architecture proposal for the parent Agent.

---

# Non-Responsibilities

Do not:

* perform broad repository evidence discovery
* discover or extract existing knowledge sources — that is
  `knowledge-discovery`
* determine whether a repository claim is true
* invent project knowledge
* modify documentation files
* edit `AGENTS.md`
* delete files
* move files
* write knowledge content
* perform final consistency verification
* treat file existence as evidence of knowledge validity

Use:

```text
knowledge-discovery
repository-audit
knowledge-classification
knowledge-compounding
memory-edit
memory-verification
```

when those responsibilities are required.

---

# Architecture Inputs

Use information supplied by:

```text
knowledge-discovery
knowledge-classification
knowledge-compounding
repository-audit
existing Project Memory
parent Agent
```

Relevant inputs include:

```text
Knowledge Type
Current State
Durability
Evidence Confidence
Source Provenance / Origin Tool
Existing Knowledge
Existing Locations
Duplicate Relationships (including cross-tool)
Conflict Resolutions
Historical Relationships
Navigation Requirements
Repository Complexity
```

Do not design structure from filenames alone.

---

# Canonical Ownership

Every durable knowledge concept should have one primary owner, regardless of
how many origin tools currently describe it.

Example:

```text
Primary:
docs/decisions/authentication.md

Referenced by:
docs/architecture/security.md
AGENTS.md
CLAUDE.md (thin pointer)
```

Not:

```text
AGENTS.md
docs/architecture/security.md
README.md
CLAUDE.md
docs/decisions/authentication.md
```

all independently containing the same rationale.

---

# Single Source of Truth

For each important concept ask:

> If two documents disagree about this concept, which document should future
> Agents trust?

If the answer is unclear, the architecture is incomplete.

Assign:

```text
Canonical Owner
        ↓
References
        ↓
Navigation
```

Do not maintain parallel authoritative copies.

---

# Knowledge Domains

Use domains based on actual knowledge.

Common domains include:

```text
architecture
decisions
solutions
lessons
constraints
workflows
reference
history
```

These are patterns, not mandatory directories.

Do not create all of them automatically.

---

# Domain Creation Rule

Create a domain only when there is meaningful knowledge that benefits from
separate retrieval.

Bad:

```text
docs/
├── architecture/
├── decisions/
├── lessons/
├── workflows/
├── constraints/
├── reference/
└── history/
```

when most directories contain one trivial file.

Better:

```text
docs/
└── architecture/
    ├── README.md
    └── runtime-model.md
```

if Architecture is the only durable knowledge domain currently needed.

---

# Domain Maturity

Treat the memory system as capable of growing through stages.

## Stage 0 — Minimal

```text
AGENTS.md
```

Use when the repository has little durable project-specific knowledge.

---

## Stage 1 — Small

```text
AGENTS.md
docs/
└── architecture.md
```

Use when a small amount of structured knowledge exists but multiple domains are
not yet justified.

---

## Stage 2 — Domain-Based

```text
AGENTS.md

docs/
├── architecture/
│   ├── README.md
│   └── system.md
│
├── decisions/
│   ├── README.md
│   └── authentication.md
│
└── workflows/
    ├── README.md
    └── release.md
```

Use when multiple knowledge domains have meaningful content.

---

## Stage 3 — Nested Domains

```text
docs/
├── architecture/
│   ├── README.md
│   └── security/
│       ├── README.md
│       └── trust-boundaries.md
│
├── decisions/
│   ├── README.md
│   └── security/
│       ├── README.md
│       └── authentication.md
```

Use only when domain complexity makes nesting materially improve retrieval.

---

# Progressive Loading

Every structural decision should answer:

> What is the smallest amount of memory a future Agent needs to read to find
> the relevant knowledge?

Preferred:

```text
AGENTS.md
    ↓
docs/architecture/README.md
    ↓
docs/architecture/security/trust-boundaries.md
```

Avoid:

```text
AGENTS.md
    ↓
docs/architecture/README.md
    ↓
30 architecture documents
    ↓
Every related subsystem
```

Indexes should narrow retrieval.

---

# Progressive Loading Levels

Design around these levels.

## Level 0 — Always Read

`AGENTS.md`

Contains only:

```text
Project identity
Critical rules
Critical constraints
Minimal architecture orientation
Verification expectations
Memory navigation
```

---

## Level 1 — Domain Orientation

Domain:

```text
docs/<domain>/README.md
```

Contains:

```text
What this domain covers
Important knowledge units
When to read each unit
Relationships
```

It should not reproduce the underlying documents.

---

## Level 2 — Focused Knowledge

Example:

```text
docs/architecture/security/trust-boundaries.md
```

Contains one coherent knowledge unit.

---

## Level 3 — Related Detail

Only load related documents when the current task requires them.

Example:

```text
trust-boundaries.md
        ↓
authentication-decision.md
        ↓
historical-authentication.md
```

Do not force Level 3 knowledge into initial context.

---

# Document Boundary

One file should normally represent one independently retrievable knowledge unit.

Examples:

```text
One architecture concept
One important decision
One difficult solution
One reusable lesson
One workflow
One constraint
One historical transition
```

Use this test:

> Can a future Agent retrieve this file independently to answer a specific
> engineering question?

If yes, it is a candidate for a separate file.

If no, keep the concept together.

---

# Avoid Over-Fragmentation

Do not split tightly coupled information merely to satisfy a category.

Bad:

```text
authentication-overview.md
authentication-flow.md
authentication-state.md
authentication-error.md
authentication-security.md
authentication-rationale.md
```

when these are normally understood together.

Prefer:

```text
authentication.md
```

with a related Decision referenced separately when necessary.

---

# Split Criteria

Split a document when one or more apply:

```text
Different future retrieval questions
Different lifecycle
Different ownership
Different update frequency
Different audience
Large enough to create retrieval noise
One section is frequently needed without the others
```

---

# Merge Criteria

Merge documents when:

```text
They are always retrieved together
They answer the same future question
They have the same lifecycle
They share the same owner
Splitting creates navigation overhead
Neither document is independently useful
```

---

# Size Is Not the Primary Metric

Do not split solely because a file is long.

Do not merge solely because files are short.

Optimize for:

```text
Retrieval Boundary
Knowledge Coherence
Update Boundary
Ownership
```

A large coherent architecture document may be better than many tiny files.

---

# Index Design

When a domain contains multiple focused knowledge units, create:

```text
README.md
```

or:

```text
index.md
```

The index is a navigation map.

It is not a summary database.

---

# Good Index

```markdown
# Architecture

## Read First

- [System Overview](./system.md)

## Security

- [Trust Boundaries](./security/trust-boundaries.md)

## Runtime

- [Process Model](./runtime/process-model.md)

## Related Decisions

- [Authentication Decision](../decisions/authentication.md)
```

---

# Bad Index

Avoid:

```markdown
# Architecture

The system uses X because...
The authentication subsystem contains...
The process model works by...
The security layer...
```

followed by the same content in the actual documents.

That creates duplicate knowledge.

---

# Index Requirements

A useful index should answer:

```text
What is here?
What should I read first?
What should I read for task X?
Where is the authoritative document?
What related knowledge exists?
```

It should not answer every engineering question itself.

---

# Read-When Navigation

Use retrieval-oriented labels when helpful.

Examples:

```markdown
## Read When

- Changing authentication → `security/authentication.md`
- Modifying background execution → `runtime/background.md`
- Changing persistence → `data/storage.md`
- Investigating build failures → `../solutions/build/`
```

This is often more useful to Agents than a generic table of contents.

---

# Cross-References

Cross-references should express relationships.

Useful relationships include:

```text
Decision
    ↓
Architecture

Solution
    ↓
Lesson

Current
    ↓
History

Current
    ↓
Superseded Knowledge

Constraint
    ↓
Decision

Workflow
    ↓
Constraint
```

Do not add links merely to increase connectivity.

---

# Reference Direction

Prefer:

```text
General
    ↓
Specific
```

Example:

```text
AGENTS.md
    ↓
Architecture Index
    ↓
Architecture Topic
```

Avoid:

```text
Every document
    ↔
Every other document
```

Excessive cross-linking creates a graph that is difficult to navigate.

---

# Link Density

Use links when they reduce retrieval cost.

Avoid links that:

* duplicate information
* create circular navigation
* point to irrelevant context
* force unnecessary reading
* make the document difficult to scan

A document should remain understandable without following every link.

---

# Current vs Historical Architecture

Current and historical knowledge must not compete for the same retrieval position.

Prefer:

```text
docs/architecture/
    current-system.md

docs/history/
    authentication-migration.md
```

or:

```text
docs/architecture/security/
    authentication.md

docs/history/security/
    authentication-v1.md
```

Historical knowledge may be linked from current knowledge:

```markdown
See [Authentication Migration History](../../history/security/authentication-v1.md)
for the rationale behind the current design.
```

---

# Superseded Knowledge

When an existing knowledge unit has been replaced:

```text
Old Knowledge
    ↓
Superseded by
    ↓
Current Knowledge
```

The old document must not appear as equally current.

Use explicit status metadata or wording when appropriate:

```text
Status: Superseded
Superseded by: <path>
```

---

# Lifecycle-Aware Architecture

Structure should reflect knowledge lifecycle.

Prefer:

```text
Current
    ↓
Current architecture / decisions / workflows

Historical
    ↓
history/

Obsolete
    ↓
removed
```

Do not create a permanent `deprecated/` archive unless the repository genuinely
needs one.

Usually:

```text
Superseded
    ↓
History + explicit replacement
```

is sufficient.

---

# AGENTS.md Architecture

`AGENTS.md` is the primary entry point.

Keep it:

```text
Short
Stable
High-Signal
Operational
Navigation-Oriented
```

It should contain:

```text
1. Project identity
2. Critical always-read rules
3. Minimal architecture orientation
4. Critical constraints
5. Verification requirements
6. Memory navigation
```

---

# What Does NOT Belong in AGENTS.md

Do not put:

```text
Detailed architecture
Long decisions
Complete troubleshooting guides
Historical timelines
Large API references
Detailed implementation notes
Every workflow
Full knowledge indexes
```

Use links.

---

# AGENTS.md Stability

Avoid frequently changing `AGENTS.md` for information that belongs in a
specialized document.

Prefer:

```text
AGENTS.md
    ↓
Stable navigation
```

rather than:

```text
AGENTS.md
    ↓
Frequently changing implementation details
```

This reduces context churn for future Agents.

---

# Repository Root vs docs/

Use repository root files for information that Agents must discover immediately.

Use `docs/` for deeper durable knowledge.

Typical structure:

```text
AGENTS.md
README.md
docs/
```

Do not duplicate the same knowledge between `README.md` and `AGENTS.md`.

Determine the canonical owner.

---

# README.md vs AGENTS.md

Use:

```text
README.md
=
Human-oriented project introduction and usage
```

Use:

```text
AGENTS.md
=
Agent-oriented operational entry point
```

They may reference each other, but should not become duplicate knowledge bases.

---

# Decision Architecture

Decisions should normally live under:

```text
docs/decisions/
```

when there are enough decisions to justify a domain.

Possible structure:

```text
docs/decisions/
├── README.md
├── authentication.md
├── persistence.md
└── deployment.md
```

For larger systems:

```text
docs/decisions/
├── README.md
├── security/
│   ├── README.md
│   └── authentication.md
└── infrastructure/
    ├── README.md
    └── deployment.md
```

Do not create one directory per decision.

---

# Architecture Architecture

Architecture knowledge should normally live under:

```text
docs/architecture/
```

Use topic boundaries based on actual system boundaries.

Example:

```text
docs/architecture/
├── README.md
├── system-overview.md
├── runtime/
│   ├── README.md
│   └── process-model.md
└── security/
    ├── README.md
    └── trust-boundaries.md
```

Do not force architecture to mirror the source-code directory tree.

Documentation structure should optimize knowledge retrieval, not filesystem
symmetry.

---

# Solutions Architecture

Solutions should normally live under:

```text
docs/solutions/
```

Possible organization:

```text
docs/solutions/
├── README.md
├── build/
├── runtime/
├── networking/
└── tooling/
```

Only create subdomains when solution volume justifies them.

---

# Lessons Architecture

Lessons should normally live under:

```text
docs/lessons/
```

Do not create a Lesson for every Solution.

A Lesson exists only when the generalized principle has independent value.

---

# Constraints Architecture

Constraints should normally live under:

```text
docs/constraints/
```

Potential grouping:

```text
docs/constraints/
├── README.md
├── platform.md
├── security.md
└── compatibility.md
```

Avoid duplicating constraints inside every Decision.

Reference the canonical Constraint.

---

# Workflow Architecture

Workflows should normally live under:

```text
docs/workflows/
```

Potential grouping:

```text
docs/workflows/
├── README.md
├── development.md
├── testing.md
└── release.md
```

Use domain nesting only when retrieval benefits from it.

---

# Reference Architecture

Reference information should normally live under:

```text
docs/reference/
```

Use it for lookup material.

Do not allow Reference documents to become a dumping ground.

Every reference document should have a clear retrieval purpose.

---

# History Architecture

Historical knowledge should normally live under:

```text
docs/history/
```

Potential structure:

```text
docs/history/
├── README.md
├── migrations/
├── architecture/
└── incidents/
```

Use categories only when the history volume justifies them.

---

# Domain Index Threshold

Do not create an index for a domain containing only one useful document unless
the index materially improves navigation.

For example:

```text
docs/architecture/
└── authentication.md
```

may not require:

```text
docs/architecture/README.md
```

Yet:

```text
docs/architecture/
├── authentication.md
├── runtime.md
├── storage.md
└── security.md
```

should generally have an index.

---

# Structural Duplication

Detect duplication at the architecture level.

Potential duplication includes:

```text
Same concept
Same rationale
Same workflow
Same constraint
Same historical explanation
Same solution
```

stored in multiple places — including multiple places produced by different
origin tools.

Do not solve structural duplication by simply adding links while leaving
conflicting canonical copies.

Choose:

```text
Primary Owner
    ↓
References
```

---

# Semantic Duplication

Two files can be duplicates even when their text is different.

Example:

```text
docs/architecture/auth.md
docs/decisions/authentication-choice.md
CLAUDE.md (§ Authentication)
```

If all three contain the same rationale, they overlap.

Possible solution:

```text
Architecture:
How authentication works.

Decision:
Why this authentication architecture was selected.

CLAUDE.md:
Thin pointer to both.
```

Then link them.

---

# Knowledge Boundary Test

For each proposed file ask:

### Question 1

What future task would cause an Agent to retrieve this?

### Question 2

What knowledge does it own?

### Question 3

What should NOT be stored here?

### Question 4

Which document is authoritative for related knowledge?

### Question 5

Can this file be loaded independently?

If these questions cannot be answered, the boundary is probably unclear.

---

# Retrieval Scenario Testing

Do not validate the architecture only by looking at the tree.

Simulate future Agent tasks.

Example:

```text
Task:
"Modify authentication."

Expected retrieval:

AGENTS.md
    ↓
docs/architecture/README.md
    ↓
security/authentication.md
    ↓
decisions/authentication.md
```

Another:

```text
Task:
"Fix recurring Gradle build failure."

Expected retrieval:

AGENTS.md
    ↓
docs/solutions/README.md
    ↓
solutions/build/gradle-resolution.md
```

If an Agent must read 20 unrelated files, the architecture is too broad.

---

# Retrieval Cost

Consider:

```text
Initial Context Cost
+
Navigation Cost
+
Irrelevant Knowledge Loaded
+
Duplicate Reading
```

A good architecture minimizes these costs.

---

# Searchability

File names should be:

```text
Specific
Predictable
Stable
Meaningful
```

Prefer:

```text
authentication.md
process-model.md
gradle-toolchain.md
```

over:

```text
notes.md
misc.md
stuff.md
final.md
new.md
architecture-v2.md
```

---

# Naming Rules

Prefer nouns or clear knowledge concepts.

Good:

```text
authentication.md
runtime-model.md
dependency-resolution.md
release-workflow.md
```

Avoid temporal or personal names:

```text
john-notes.md
new-architecture.md
latest-fix.md
current-final.md
```

unless the repository has a legitimate reason.

---

# Stable Paths

Knowledge paths should not change frequently.

Avoid encoding temporary state into paths:

```text
docs/architecture/v2/
docs/architecture/new/
docs/architecture/final/
```

Prefer stable semantic paths:

```text
docs/architecture/security/
```

Lifecycle belongs in content/status/history, not arbitrary versioned directory
names.

---

# Migration Architecture

When restructuring existing memory:

```text
Existing Knowledge
       ↓
Classify Ownership
       ↓
Identify Duplicates
       ↓
Determine Canonical Locations
       ↓
Design New Navigation
       ↓
Plan Migration
```

Do not design the new tree before understanding what existing knowledge it must
contain.

---

# Reconstruction Architecture (Multi-Source Consolidation)

When the input is an Existing Knowledge Inventory spanning multiple origin
tools (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `docs/`, etc.), design
the target architecture around **verified knowledge clusters**, not around
the files that happened to contain them.

For every cluster classified by `knowledge-classification`, produce a
mapping:

```text
Cluster Subject
      ↓
Canonical Type (Architecture | Decision | Solution | Lesson | Constraint |
                Workflow | Reference | History)
      ↓
Canonical Target Path
      ↓
Origin Sources → Disposition
    <origin path 1> → Merge into canonical
    <origin path 2> → Delete (fully redundant once merged)
    <origin path 3> → Preserve as Historical (explains a past divergence)
    <origin path 4> → Keep as thin pointer to canonical (tool-specific
                       entry point that must remain, e.g. CLAUDE.md)
```

## Dual Entry Point Reconciliation

When `knowledge-discovery` flags competing primary entry points (commonly
`AGENTS.md` and `CLAUDE.md`, or either of these plus `.cursor/rules/`),
design one of these outcomes — do not leave the ambiguity unresolved:

```text
Option A — Single Canonical Entry Point
AGENTS.md becomes the sole source of navigation and critical rules.
Other tool-specific files become thin pointers:

  CLAUDE.md:
    "See AGENTS.md for project rules and navigation. This file exists
    only for Claude-specific tooling notes, if any."

Option B — Synchronized Parallel Entry Points
Only when the repository has a genuine reason to need tool-specific
divergence (rare). Requires an explicit Decision recording why parallel
entry points are necessary and how they will be kept in sync. Absent that
justification, prefer Option A.
```

Do not silently pick Option B by default because it requires less editing.
Option A is the default; Option B requires justification.

## Reconstruction Is Not Deletion-by-Default

A reconstruction plan must not treat "the file existed before Project
Memory ran" as a reason to preserve it, nor as a reason to delete it. Each
origin source's disposition follows from its cluster's verified
classification, exactly as it would for newly discovered knowledge.

---

# Migration Safety

For every moved or consolidated knowledge unit ensure:

```text
Original knowledge preserved where required
        ✓
Canonical owner identified
        ✓
References updated
        ✓
Old navigation removed
        ✓
Historical status preserved
        ✓
No duplicate copy remains, across all origin tools
```

Actual migration belongs to `memory-edit`.

---

# Empty Structure Policy

Never recommend empty scaffolding merely for symmetry.

Do not create:

```text
docs/
├── architecture/
├── decisions/
├── lessons/
├── solutions/
├── constraints/
├── workflows/
├── reference/
└── history/
```

unless those domains have meaningful content.

---

# Progressive Growth

The architecture should grow only when retrieval needs grow.

Example:

```text
Initial:

AGENTS.md
docs/architecture.md
```

Later:

```text
AGENTS.md
docs/
├── architecture/
│   ├── README.md
│   ├── system.md
│   └── security.md
└── decisions/
    ├── README.md
    └── authentication.md
```

Later:

```text
docs/
├── architecture/
│   ├── README.md
│   ├── runtime/
│   │   ├── README.md
│   │   └── process-model.md
│   └── security/
│       ├── README.md
│       └── trust-boundaries.md
```

Do not jump directly to the most complex structure.

---

# Compound Engineering Compatibility

When used after an engineering task, architecture should absorb durable knowledge
without turning every completed task into a new document.

Use:

```text
Engineering Work
    ↓
Knowledge Compounding
    ↓
Durable Knowledge
    ↓
Knowledge Classification
    ↓
Memory Architecture
```

Then decide:

```text
Existing Knowledge
       ↓
Strengthen
```

or:

```text
New Knowledge
       ↓
Create focused unit
```

The architecture should evolve from accumulated engineering knowledge rather
than from arbitrary documentation templates.

---

# Architecture Proposal

Return an architecture proposal rather than editing files.

Use:

````markdown
## Memory Architecture Proposal

### Current Structure

```text
<current relevant structure, including all origin tools found>
````

### Problems

* <duplication>
* <navigation issue>
* <ownership issue>
* <progressive-loading issue>
* <competing entry points>

### Proposed Structure

```text
<proposed structure>
```

### Canonical Ownership

| Knowledge   | Primary Owner | Related References |
| ----------- | -------------- | ------------------- |
| <knowledge> | <path>         | <paths>             |

### Existing Source Disposition

| Origin Source | Disposition | Canonical Target |
|---|---|---|
| `<path>` | Merge / Delete / Historical / Thin Pointer | `<target path or N/A>` |

### Progressive Loading

```text
AGENTS.md
    ↓
<domain index>
    ↓
<focused knowledge>
```

### Documents To Create

* <path> — <purpose>

### Documents To Merge

* <paths> → <canonical path>

### Documents To Move

* <source> → <destination>

### Documents To Remove

* <path> — <reason>

### AGENTS.md Changes

* <navigation change>

### Migration Notes

* <important migration consideration>

### Retrieval Scenarios

#### Scenario 1

Task: <task>

Expected path:

```text
<path>
```

#### Scenario 2

Task: <task>

Expected path:

```text
<path>
```

### Structural Risks

* <risk>

### Recommendation

<Create | Restructure | Consolidate | Keep Current Structure>

````

---

# Minimal Proposal Mode

If the existing architecture is already good, do not redesign it for the sake
of change.

Return:

```markdown
## Memory Architecture

Status: Keep Current Structure

Reason:

- Knowledge ownership is clear, across all origin tools examined.
- Progressive loading is adequate.
- No significant duplication was identified.
- Existing navigation is sufficient.
- No competing entry points requiring reconciliation.

Recommended Changes:

- None.
````

---

# Architecture Quality Checklist

Evaluate:

## Discoverability

Can an Agent find the relevant knowledge from `AGENTS.md`?

## Progressive Loading

Can the Agent avoid loading unrelated knowledge?

## Ownership

Does each important concept have one canonical home, across all origin
tools?

## Duplication

Is the same rationale stored in multiple places, including across
different origin tools?

## Lifecycle

Are current and historical knowledge clearly separated?

## Boundaries

Does each document represent a meaningful retrieval unit?

## Navigation

Do indexes help an Agent choose what to read?

## Entry Points

Is there exactly one canonical Agent-facing entry point, with any others
reduced to thin pointers or explicitly justified as synchronized parallels?

## Stability

Are paths based on stable concepts rather than temporary project states?

## Scalability

Can the structure grow without becoming a giant tree?

## Retrieval Cost

Can common tasks reach relevant knowledge with minimal context?

---

# Hard Rules

* Do not create structure for structure's sake.
* Do not create empty domains.
* Do not create placeholder files.
* Do not force every knowledge category into every repository.
* Do not mirror the source-code directory tree automatically.
* Do not duplicate knowledge across documents, including across different
  origin tools.
* Do not create multiple canonical owners.
* Do not put detailed knowledge into `AGENTS.md`.
* Do not turn indexes into duplicate knowledge databases.
* Do not over-fragment related concepts.
* Do not merge unrelated concepts merely to reduce file count.
* Do not preserve current and historical knowledge as equal current references.
* Do not use temporary version names as permanent architecture.
* Do not design from filenames alone.
* Do not invent knowledge.
* Do not determine repository truth without evidence.
* Do not leave two files simultaneously acting as the canonical entry point
  or the canonical description of the same concept without an explicit,
  justified reason.
* Do not default to preserving a pre-existing file's location or role
  merely because reconstruction requires more effort than leaving it alone.
* Do not modify repository files.
* Do not claim migration completion.
* Do not claim final verification.
* Prefer stable semantic paths.
* Prefer progressive loading.
* Prefer one canonical owner.
* Prefer references over duplicated content.
* Prefer the smallest architecture that solves the retrieval problem.

---

# Completion Criteria

The architecture task is complete when:

```text
Knowledge inputs understood
        ✓
Current structure inspected, across all origin tools
        ✓
Canonical ownership considered
        ✓
Duplicate structure identified, including cross-tool duplication
        ✓
Competing entry points reconciled
        ✓
Document boundaries evaluated
        ✓
Progressive loading designed
        ✓
Current/history separation considered
        ✓
AGENTS.md role preserved
        ✓
Indexes designed where justified
        ✓
Cross-references designed
        ✓
Retrieval scenarios tested conceptually
        ✓
Growth path considered
        ✓
Existing source disposition mapped
        ✓
No unnecessary scaffolding proposed
        ✓
No repository files modified
        ✓
Architecture proposal returned
        ✓
```

---

# Final Principle

The Project Memory architecture should make the repository's accumulated
engineering knowledge — however many different tools and Agents produced
it — behave like a well-designed information system.

The desired model is:

```text
Engineering Knowledge (any origin)
        ↓
Canonical Ownership
        ↓
Stable Structure
        ↓
Progressive Loading
        ↓
Low Retrieval Cost
        ↓
Better Future Agent Decisions
```

The best architecture is not the one with the most categories.

It is the one where a future Agent can reliably answer:

> "I need to understand X. What is the smallest amount of authoritative
> knowledge I need to load — and is there only one place that could be?"
