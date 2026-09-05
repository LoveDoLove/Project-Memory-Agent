# Project Vocabulary

This file defines project-specific terms that future Agents must understand
identically. Every entry answers "what does this word mean here?" — never
"what is true / why".

---

# How This File Evolves

This vocabulary uses **accretion** — terms are added incrementally as they
are encountered in compounding or discovery. It is not a static glossary
written once and forgotten.

## Seeding

Seed this file from the codebase and existing documentation:

1. Read `docs/`, `README.md`, `CONTRIBUTING.md`, and domain indexes
2. Extract terms with project-specific meaning
3. Add each as a glossary entry

Seed only terms future work will trip on. A term every reader already
shares is noise.

## Accretion

During compounding or discovery, flag domain terms with project-specific
meaning:

- Terms the codebase, docs, and future work must mean the same thing by
- Names that would confuse a future Agent without context
- Abbreviations or acronyms specific to this project

Add each as a glossary entry tagged for the parent Agent to apply alongside
the learning.

## Mutations

Terms can evolve over time. Mutations are explicit changes to existing
entries:

### Add

```markdown
### Term Name

Definition.
```

### Refine

When a term's definition becomes more precise through experience:

```markdown
### Term Name

**Updated:** YYYY-MM-DD
**Previous:** <old definition>

<new, more precise definition>
```

### Fold

When two terms are discovered to mean the same thing:

```markdown
### Term Name A

**Folded into:** Term Name B

<same definition as Term Name B>
```

### Retire

When a term is no longer used in the project:

```markdown
### Term Name

**Retired:** YYYY-MM-DD
**Reason:** <why the term is no longer relevant>

<original definition for historical reference>
```

### Delete

When a term was added in error or is completely obsolete:

```markdown
### Term Name

**Deleted:** YYYY-MM-DD
**Reason:** <why the term was removed>
```

---

# Glossary

## Architecture Terms

### Solution

A specific, evidence-backed answer to a difficult engineering problem.
Solutions are durable — they remain useful after the current task is
forgotten.

### Lesson

A general engineering principle revealed through experience. Unlike
Solutions, Lessons are not tied to specific code or incidents.

### Decision

A choice made among alternatives, with rationale. Decisions capture why
something was done, not just what was done.

### Constraint

A limitation or requirement that future work must respect. Constraints
prevent future Agents from breaking assumptions.

### Workflow

A sequence of steps that reliably produces a specific outcome. Workflows
capture recurring processes.

### Architecture

Structural patterns and relationships in the codebase. Architecture
documents capture non-obvious design decisions.

### History

Knowledge that was once current but is now superseded. History preserves
rationale for past decisions.

## Process Terms

### Durable Bar

The counterfactual test that determines whether knowledge belongs in Project
Memory: "If this disappeared, would a future Agent still repeat the mistake
or redo substantial investigation?"

### Evidence Confidence

A scale (High / Medium / Low / Unknown) indicating how strongly evidence
supports a claim.

### Compounding Value

A scale (High / Medium / Low / None) indicating how much future engineering
value knowledge provides.

### Lifecycle State

The current status of knowledge: active, superseded, deprecated, or
historical.

### Primary Ownership

The one canonical location for a piece of knowledge. Everything else
references it.

## Technical Terms

### Frontmatter

YAML metadata at the top of a Markdown file that describes the document's
type, status, and relationships.

### Dual-Track

The two categories of Solutions: Bug track (for diagnosed defects) and
Knowledge track (for practice gaps).

### Progressive Loading

Loading knowledge incrementally — starting with high-level orientation and
drilling down into details as needed.

### Thin Pointer

A minimal reference that points to the canonical location of knowledge,
used to maintain entry points without duplicating content.

---

# Adding New Terms

1. During compounding or discovery, identify a term with project-specific
   meaning
2. Verify the term is not already defined (search this file)
3. Add the entry in the appropriate section
4. Tag the parent Agent to apply the change via `memory-edit`

## Quality Rules

- Capture terms, not claims. A glossary entry answers "what does this word
  mean here?", never "what is true / why".
- Only terms future work will trip on. A term every reader already shares
  is noise.
- Never a catch-all. Definitional findings are Reference units or stay in
  the learning's own body; the glossary is not a knowledge dump.
- Glossary rules are owned by `knowledge-classification` — do not redefine
  them here.

---

# References

- `references/concepts-vocabulary.md` — detailed vocabulary rules
- `knowledge-classification` — knowledge type definitions
- `knowledge-compounding` — extraction workflow