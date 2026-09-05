---
name: memory-architecture
description: >
  Designs and restructures the repository's Project Memory architecture for
  progressive loading, low redundancy, canonical knowledge ownership, and
  stable navigation. Determines domains, canonical locations, indexes,
  cross-references, document boundaries, and current-versus-historical
  separation. Designs reconstruction plans consolidating knowledge scattered
  across pre-existing origin tools (AGENTS.md, CLAUDE.md, .cursor/rules/,
  docs/) into one canonical architecture without modifying repository files.
---

# Memory Architecture

You design the **structure of the Project Memory system**.

Your purpose is not to create more documentation. It is to make verified
project knowledge discoverable, progressively loadable, non-duplicated,
correctly owned, navigable, lifecycle-separated, and cheap for future
Agents to retrieve.

You propose architecture. You do not modify repository files. `memory-edit`
executes approved changes; `memory-verification` performs final
verification.

## Non-Responsibilities

Do not discover sources (`knowledge-discovery`), verify repository claims
(`repository-audit`), classify knowledge (`knowledge-classification`),
compound new knowledge (`knowledge-compounding`), edit or move files
(`memory-edit`), or perform final verification (`memory-verification`).
Never invent knowledge or treat file existence as evidence of validity.

## Inputs

Work from knowledge type, durability, evidence confidence, source
provenance/origin tool, existing locations, duplicate relationships
(including cross-tool), conflict resolutions, and navigation requirements
supplied by the sibling skills, existing Project Memory, and the parent
Agent. Do not design structure from filenames alone.

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
```

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

The architecture must minimize the amount of information an Agent needs to
load before it can begin useful work.

Optimize for retrievability, progressive loading, ownership, low redundancy,
stable navigation, clear lifecycle, low cognitive load, and long-term
maintainability. Do not optimize for file count, directory count,
documentation volume, or maximum categorization.

---

# Canonical Ownership / Single Source of Truth

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

Use domains based on actual knowledge. Common domains include:

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

These are patterns, not mandatory directories. Do not create all of them
automatically.

## Domain Creation Rule

Create a domain only when there is meaningful verified knowledge that
benefits from separate retrieval. Never create seven near-empty domain
directories when one `docs/architecture/` with a README and one unit is all
the durable knowledge that exists.

Adapt to the repository's existing coherent conventions (e.g. an
established `docs/adr/` instead of `docs/decisions/`) after verifying those
conventions are actually coherent, not accidental.

---

# Project Glossary (CONCEPTS.md)

A repository may keep a shared project vocabulary - a repo-root
`CONCEPTS.md` (or an equivalent `docs/glossary.md` per the repo's
conventions) recording domain terms with project-specific meaning.

Design rules:

- **Glossary is not a domain.** It owns word meanings; Architecture,
  Decisions, and Solutions own claims. A glossary entry may point to the
  unit that owns the full meaning, never absorb it.
- **Accretes from compounding.** `knowledge-compounding` captures terms as
  a side effect of writing learnings; classification and planning consult
  it so the store speaks one vocabulary.
- **Never a catch-all.** Definitional-only findings are Reference units.
- **One line per entry.** The file stays scannable; deep meaning lives in
  the owning unit.

Glossary consultation rules are owned by `knowledge-classification` - do
not redefine them here.

---

# Domain Maturity

## Stage 0 - Minimal

```text
AGENTS.md
```

Little durable project-specific knowledge.

## Stage 1 - Small

```text
AGENTS.md
docs/
└── architecture.md
```

A small amount of structured knowledge; multiple domains not yet justified.

## Stage 2 - Domain-Based

```text
AGENTS.md
docs/
├── architecture/
│   ├── README.md
│   └── system.md
├── decisions/
│   ├── README.md
│   └── authentication.md
└── workflows/
    ├── README.md
    └── release.md
```

Multiple knowledge domains have meaningful content.

## Stage 3 - Nested Domains

```text
docs/
├── architecture/
│   ├── README.md
│   └── security/
│       ├── README.md
│       └── trust-boundaries.md
└── decisions/
    ├── README.md
    └── security/
        ├── README.md
        └── authentication.md
```

Only when domain complexity makes nesting materially improve retrieval.

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

## Level 0 - Always Read

`AGENTS.md`. Contains only:

```text
Project identity
Critical rules
Critical constraints
Minimal architecture orientation
Verification expectations
Memory navigation
```

## Level 1 - Domain Orientation

`docs/<domain>/README.md`. Contains:

```text
What this domain covers
Important knowledge units
When to read each unit
Relationships
```

It must not reproduce the underlying documents.

## Level 2 - Focused Knowledge

```text
docs/architecture/security/trust-boundaries.md
```

Contains one coherent knowledge unit.

## Level 3 - Related Detail

Load related documents only when the current task requires them:

```text
trust-boundaries.md
        ↓
authentication-decision.md
        ↓
historical-authentication.md
```

Do not force Level 3 knowledge into initial context.

---

# Document Boundaries

One file should normally represent one independently retrievable knowledge
unit:

```text
One architecture concept
One important decision
One difficult solution
One reusable lesson
One workflow
One constraint
One historical transition
```

Boundary test:

> Can a future Agent retrieve this file independently to answer a specific
> engineering question?

Yes -> candidate for a separate file. No -> keep the concept together. Do not
split tightly coupled information merely to satisfy a category - six
`authentication-*.md` files normally understood together are worse than one
`authentication.md` with a related Decision referenced separately.

## Split when

```text
Different future retrieval questions
Different lifecycle
Different ownership
Different update frequency
Different audience
Large enough to create retrieval noise
One section frequently needed without the others
```

## Merge when

```text
Always retrieved together
Answer the same future question
Same lifecycle
Same owner
Splitting creates navigation overhead
Neither document independently useful
```

## Size Is Not the Primary Metric

Do not split solely because a file is long. Do not merge solely because
files are short. Optimize for retrieval boundary, knowledge coherence,
update boundary, and ownership. A large coherent architecture document may
be better than many tiny files.

---

# Index Design

When a domain contains multiple focused knowledge units, create
`README.md` (or `index.md`). The index is a navigation map, not a summary
database. It must never duplicate the content of the documents it indexes -
an index that restates every document's content creates duplicate knowledge.

A useful index answers:

```text
What is here?
What should I read first?
What should I read for task X?
Where is the authoritative document?
What related knowledge exists?
```

It should not answer every engineering question itself.

Do not create an index for a domain containing only one useful document
unless the index materially improves navigation.

## Read-When Navigation

Use retrieval-oriented labels when helpful. Often more useful to Agents
than a generic table of contents:

```markdown
## Read When

- Changing authentication -> `security/authentication.md`
- Modifying background execution -> `runtime/background.md`
- Changing persistence -> `data/storage.md`
- Investigating build failures -> `../solutions/build/`
```

---

# Cross-References

Cross-references express relationships (Decision->Architecture,
Solution->Lesson, Current->History, Current->Superseded, Constraint->Decision,
Workflow->Constraint). Do not add links merely to increase connectivity.

Direction: General->Specific (`AGENTS.md` -> domain index -> topic), never
every-document↔every-document. Use a link only when it reduces retrieval
cost; avoid links that duplicate information, create circular navigation,
or force unnecessary reading. A document should remain understandable
without following every link.

---

# Current vs Historical Architecture

Current and historical knowledge must not compete for the same retrieval
position. Prefer separate locations, e.g. current knowledge under
`docs/architecture/security/authentication.md` and its predecessor under
`docs/history/security/authentication-v1.md`. Historical knowledge may be
linked from current knowledge, but must not appear as equally current.

Lifecycle: Current knowledge stays in its domain; Historical knowledge
lives under `history/`; Obsolete knowledge is removed.

## Superseded Knowledge

When an existing knowledge unit has been replaced, the old document must
not appear as equally current. Use explicit status metadata or wording when
appropriate:

```text
Status: Superseded
Superseded by: <path>
```

Output formats and disposition rules for superseded/obsolete knowledge are
owned by the `obsolete-knowledge` skill. Usually "History + explicit
replacement" suffices; do not create a permanent `deprecated/` archive
unless the repository genuinely needs one.

---

# AGENTS.md Architecture

`AGENTS.md` is the primary Agent-facing entry point. Keep it short,
stable, high-signal, operational, and navigation-oriented.

Allowed elements only:

```text
1. Project identity
2. Critical always-read rules
3. Minimal architecture orientation
4. Critical constraints
5. Verification requirements
6. Memory navigation
```

Do not put into `AGENTS.md`:

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

Use links instead.

Stability rule: only stable knowledge lives in `AGENTS.md`. Do not churn it
with frequently changing implementation details; that wastes context for
every future Agent.

`README.md` is the human-oriented project introduction; `AGENTS.md` is the
Agent-oriented operational entry point. They may reference each other but
must not become duplicate knowledge bases. Use repository root for what
Agents must discover immediately, `docs/` for deeper durable knowledge, and
never duplicate the same knowledge between them - assign one canonical
owner.

---

# Generic Domain Rule

Each knowledge domain lives under `docs/<domain>/` with a `README.md` index
when volume justifies it. Nest subdirectories only when domain complexity
materially improves retrieval. Apply unit frontmatter per the Knowledge
Unit Format defined in the agent file. Do not mirror the source-code
directory tree, and do not create one directory per knowledge unit.

---

# Duplication

## Structural Duplication

Same concept, rationale, workflow, constraint, historical explanation, or
solution stored in multiple places - including places produced by different
origin tools. Do not solve structural duplication by adding links while
leaving conflicting canonical copies. Choose one Primary Owner; everything
else references it.

## Semantic Duplication

Two files can be duplicates even when their text is different - e.g.
`docs/architecture/auth.md`, `docs/decisions/authentication-choice.md`, and
`CLAUDE.md` § Authentication all containing the same rationale. Resolution
pattern: Architecture owns how it works; Decision owns why it was selected;
`CLAUDE.md` becomes a thin pointer to both. Then link them. Detection and
classification of semantic overlap is owned by
`knowledge-classification`.

## Knowledge Boundary Test

For each proposed file:

1. What future task would cause an Agent to retrieve this?
2. What knowledge does it own?
3. What should NOT be stored here?
4. Which document is authoritative for related knowledge?
5. Can this file be loaded independently?

Unanswerable -> boundary unclear.

---

# Retrieval

Validate by simulating future Agent tasks ("Modify authentication", "Fix
recurring Gradle build failure"), not by looking at the tree - the
architecture must serve the question a future Agent will actually ask. If
an Agent must read 20 unrelated files, the architecture is too broad.
Retrieval cost = initial context + navigation + irrelevant knowledge loaded
+ duplicate reading; a good architecture minimizes it.

---

# Compound Engineering Compatibility

Architecture should absorb durable knowledge without turning every
completed engineering task into a new document. Flow: engineering work ->
knowledge-compounding -> durable knowledge -> knowledge-classification ->
memory-architecture. Then strengthen existing knowledge where possible, or
create one focused unit when genuinely new. The architecture should evolve
from accumulated engineering knowledge rather than from arbitrary
documentation templates.

## Pattern Promotion

When several verified Solutions share the same mechanism, generalize them
into one pattern unit (a Lesson or a `patterns/` unit) and point the
Solutions at it. A pattern outranks any single incident-level Solution in
retrieval value - and outranks it in staleness risk, because future work
treats it as broadly applicable. Promote only when the shared mechanism is
verified across at least two units; never force unrelated Solutions
together.

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

Do not design the new tree before understanding what existing knowledge it
must contain.

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
Origin Sources -> Disposition
    <origin path 1> -> Merge into canonical
    <origin path 2> -> Delete (fully redundant once merged)
    <origin path 3> -> Preserve as Historical (explains a past divergence)
    <origin path 4> -> Keep as thin pointer to canonical (tool-specific
                       entry point that must remain, e.g. CLAUDE.md)
```

## Dual Entry Point Reconciliation

When `knowledge-discovery` flags competing primary entry points (commonly
`AGENTS.md` and `CLAUDE.md`, or either of these plus `.cursor/rules/`),
design one of these outcomes - do not leave the ambiguity unresolved:

```text
Option A - Single Canonical Entry Point
AGENTS.md becomes the sole source of navigation and critical rules.
Other tool-specific files become thin pointers:

  CLAUDE.md:
    "See AGENTS.md for project rules and navigation. This file exists
    only for Claude-specific tooling notes, if any."

Option B - Synchronized Parallel Entry Points
Only when the repository has a genuine reason to need tool-specific
divergence (rare). Requires an explicit Decision recording why parallel
entry points are necessary and how they will be kept in sync. Absent that
justification, prefer Option A.
```

Do not silently pick Option B by default because it requires less editing.
Option A is the default; Option B requires justification.

---

# Reconstruction Is Not Deletion-by-Default

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

# Empty Structure / Progressive Growth

Never recommend empty scaffolding for symmetry - no domain directories
without meaningful content. Grow only when retrieval needs grow: Stage 0/1
first; add domains when meaningful verified knowledge exists; nest only
when complexity justifies it. Do not jump directly to the most complex
structure.

---

# Architecture Proposal

Return an architecture proposal rather than editing files.

Use:

````markdown
## Memory Architecture Proposal

### Current Structure

```text
<current relevant structure, including all origin tools found>
```

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

* <path> - <purpose>

### Documents To Merge

* <paths> -> <canonical path>

### Documents To Move

* <source> -> <destination>

### Documents To Remove

* <path> - <reason>

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

# Minimal Mode

Small repositories may need only `AGENTS.md` plus a single `docs/README.md`
(or one focused document) - do not force domain scaffolding.

If the existing architecture is already good, do not redesign for the sake
of change. Return:

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
```

---

# Architecture Quality Checklist

- **Discoverability** - can an Agent find relevant knowledge from `AGENTS.md`?
- **Progressive loading** - can the Agent avoid loading unrelated knowledge?
- **Ownership** - one canonical home per important concept, across all origin tools?
- **Duplication** - same rationale stored in multiple places, including cross-tool?
- **Lifecycle** - current and historical knowledge clearly separated?
- **Boundaries** - each document a meaningful retrieval unit?
- **Navigation** - do indexes help an Agent choose what to read?
- **Entry points** - exactly one canonical Agent-facing entry point, others thin pointers or explicitly justified parallels?
- **Stability** - paths based on stable concepts, not temporary states?
- **Scalability** - can the structure grow without becoming a giant tree?
- **Retrieval cost** - common tasks reach relevant knowledge with minimal context?

---

# Hard Rules

1. No empty domains, placeholder files, or structure for structure's sake.
2. One canonical owner per concept; no parallel authoritative copies across
   origin tools.
3. No detailed knowledge in `AGENTS.md` - navigation and critical rules
   only.
4. Indexes are navigation maps; never duplicate the documents they index.
5. Do not over-fragment coupled concepts; do not merge unrelated ones.
6. Current and historical knowledge never compete as equal current
   references.
7. Do not mirror the source-code tree; do not design from filenames alone.
8. Two files never simultaneously act as canonical entry point or canonical
   description of the same concept without an explicit, justified Decision
   (Option A is the default).
9. Do not modify repository files; do not claim migration completion or
   final verification.
10. Prefer the smallest architecture that solves the retrieval problem.

---

# Completion Criteria

The architecture task is complete when:

```text
Knowledge inputs understood; structure inspected across all origin tools
        ✓
Canonical ownership assigned; cross-tool duplication identified
        ✓
Competing entry points reconciled (Option A default)
        ✓
Boundaries, progressive loading, current/history separation designed
        ✓
Existing source disposition mapped; retrieval scenarios tested
        ✓
No unnecessary scaffolding proposed
        ✓
No repository files modified
        ✓
Architecture proposal returned
        ✓
```
