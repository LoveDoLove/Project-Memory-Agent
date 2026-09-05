---
name: memory-edit
description: >
  Applies approved Project Memory changes to repository documentation —
  scoped additions, modifications, moves, merges, deletions, thin-pointer
  conversions, and navigation updates, including multi-source
  reconstruction consolidating pre-existing origin tools (AGENTS.md,
  CLAUDE.md, .cursor/rules/, .claude/) into one canonical location while
  preserving canonical ownership, historical boundaries, and reference
  integrity. Delegates bounded mechanical edits to cavecrew-builder;
  never performs blind bulk rewrites.
---

# Memory Edit

Execute approved Project Memory changes.

You do not decide what the repository should remember. You translate an
approved memory architecture and knowledge classification into precise
repository changes.

Keep the change set scoped, deliberate, minimal, traceable, structurally
consistent, easy to verify.

---

# Core Principle

Only `memory-edit` writes Project Memory changes. Every edit requires an
approved plan and is the smallest valid change that executes it.

Do not edit by improvisation. Expected flow:

```text
knowledge-discovery → repository-audit → knowledge-classification
    → knowledge-compounding → memory-architecture
    → Approved Edit Plan → memory-edit → memory-verification
```

`memory-edit` executes the approved plan. It does not silently redesign
the memory system during execution. It is the hands of the system, not its
brain.

Not responsible for: determining repository truth, broad auditing
(`repository-audit`), discovering sources (`knowledge-discovery`), deciding
knowledge value (`knowledge-classification`), memory architecture design
(`memory-architecture`), obsolete-action semantics and formats
(`obsolete-knowledge`), final verification (`memory-verification`). Do not
modify source code unless explicitly included in the approved task.

---

# Required Input

Before editing, obtain an approved edit plan.

The plan should identify, where applicable:

```text
Target
Action
Reason
Knowledge Owner
Source
Destination
Replacement
Content Scope
Reference Impact
Historical Treatment
Origin Tool(s) Involved (for multi-source reconstruction edits)
```

Example:

```text
Action:
Move

Source:
docs/authentication-old.md

Destination:
docs/history/authentication-migration.md

Reason:
Superseded by current authentication architecture.

Historical Value:
High

References:
AGENTS.md
docs/architecture/README.md
```

Multi-source plans carry a per-source disposition:

```text
Action:
Merge + Thin-Pointer Conversion

Sources:
AGENTS.md (§ Authentication)
CLAUDE.md (§ Authentication)
.cursor/rules/auth.md

Destination:
docs/architecture/security/authentication.md

Reason:
Three origin tools independently described the same authentication flow;
repository evidence confirms only one description matches current code.

Disposition:
AGENTS.md   → keep pointer + minimal orientation, link to destination
CLAUDE.md   → convert to thin pointer to AGENTS.md
.cursor/rules/auth.md → delete (fully redundant once merged)
```

If the required information is missing and the edit cannot be performed
safely, stop and report the missing decision.

Do not guess.

---

# Edit Classification

Classify each requested change as:

```text
Create
Modify
Move
Merge
Delete
Mark Deprecated
Mark Superseded
Thin-Pointer Conversion
Reference Update
Navigation Update
Rename
```

A change may contain multiple operations.

---

# Edit Order

Prefer this order:

```text
1. Establish target structure
2. Create new canonical knowledge
3. Move or consolidate existing knowledge (across all origin tools)
4. Convert non-canonical origin sources to thin pointers, or remove them
5. Update references
6. Update indexes
7. Update AGENTS.md
8. Remove obsolete copies
9. Re-read affected files
10. Produce edit receipt
```

Do not delete the only copy of valuable knowledge before its replacement or
destination has been established.

---

# Atomic Migration Principle

For migrations:

```text
Create / establish destination
        ↓
Transfer knowledge
        ↓
Update references
        ↓
Verify destination
        ↓
Remove obsolete source
```

Forbidden:

```text
Delete source → hope replacement exists
```

Keep every migration reversible until its destination is established.

---

# Minimal Edit Principle

Change only what the approved plan requires — the smallest valid edit, no
unrequested changes. Every unrelated change increases verification cost.

Preserve repository conventions (heading, terminology, link, and formatting
style; established frontmatter and status-metadata schemas). Do not invent
metadata fields or perform opportunistic formatting.

---

# Operations

## Create

Create a new knowledge unit only when approved by the architecture plan.
A new file needs clear purpose, clear ownership, a useful retrieval
boundary, correct location, correct navigation.

Check whether an existing document — regardless of origin tool — already
owns the knowledge; if so, reference it instead of creating another copy.

Do not create placeholder content (`TODO`, `TBD`, example content presented
as fact, unverified claims). If required information is missing, stop and
return the requirement to the parent Agent.

## Modify

```text
Read → locate exact target → apply smallest valid change → re-read section
```

Do not edit based solely on a filename or search result. Preserve all
approved durable knowledge unless the plan explicitly removes it.

## Move

```text
Source → read → destination → preserve knowledge → update references
    → verify destination → remove source
```

Do not create duplicate long-term copies unless explicitly required.
Prefer a clean move over delete-and-recreate to preserve file history.

## Merge

Consolidating documents — including documents from different origin tools:

```text
Identify canonical owner → combine unique durable knowledge
    → remove duplicated content → preserve important historical context
    → update references → remove or thin-point obsolete documents
```

Do not concatenate documents blindly.

Before deleting a merged source, confirm every item:

```text
Unique knowledge transferred
Important rationale preserved
Links migrated
Historical status preserved
References updated
No important section lost
```

## Multi-Source Reconstruction

Execute an approved reconstruction plan spanning multiple origin tools
(e.g. consolidating `AGENTS.md` + `CLAUDE.md` + `.cursor/rules/` into one
canonical document plus a thin pointer) with the same Atomic Migration
Principle, applied across tool boundaries:

```text
1. Establish canonical destination content from verified knowledge
2. Write canonical destination
3. Convert non-canonical origin sources to thin pointers, or remove them,
   per the approved disposition — one file at a time
4. Update AGENTS.md navigation
5. Re-read every touched origin file
6. Produce edit receipt covering all origin tools touched
```

### Thin-Pointer Default

Do not delete a competing entry point (`CLAUDE.md`, `.cursor/rules/`, etc.)
outright unless the approved plan says so. The default disposition for a
tool-specific entry point that must keep existing for the tool to function
is **thin pointer**, not deletion:

```markdown
<!-- CLAUDE.md -->
See [AGENTS.md](./AGENTS.md) for project rules, architecture orientation,
and documentation navigation. This file is intentionally kept minimal.
```

Treat a thin-pointer conversion as a `Modify`, and record it in the edit
receipt under both `Modified` and a dedicated `Reconciled` entry noting
which dual-entry-point finding it resolves.

Never route a multi-source reconstruction touching 3+ origin files through
`cavecrew-builder` — it requires the deliberate scoped workflow, never
mechanical delegation.

## Delete

Delete only when the deletion is explicitly supported by the approved
plan. Typical valid reasons:

```text
Obsolete with no historical value
Duplicate after successful consolidation
Invalid placeholder
Superseded document with no remaining value
Migrated document whose canonical replacement is verified
A losing claim in a resolved cross-source conflict with no historical value
```

Do not delete merely because a file appears unused, and do not delete a
pre-existing knowledge source merely because it originated from a different
Agent, Skill, or AI IDE.

Before deleting:

```text
Read file
    ↓
Identify outgoing references
    ↓
Check incoming references (including from other origin tools)
    ↓
Confirm replacement where applicable
    ↓
Confirm historical value decision
    ↓
Delete
```

If references cannot be reasonably assessed, do not blindly delete —
report the limitation.

## Lifecycle Marks

Mark deprecated or superseded knowledge per the approved plan, using the
repository's established status convention — never invent a new one.
Preserve content unless the plan says otherwise; identify the replacement
for superseded knowledge; never invent a replacement.

## Obsolete Handling

Execute the approved disposition (delete / historical / superseded /
deprecated / thin-pointer) as classified — action semantics and formats are
owned by `obsolete-knowledge`. Do not change the classification during
editing unless new evidence makes the plan impossible or unsafe.

---

# Reference Updates

Whenever a file is:

```text
Moved
Renamed
Deleted
Merged
Superseded
Converted to a thin pointer
```

inspect references that may be affected. Reference locations include:

```text
AGENTS.md
CLAUDE.md
.cursor/rules/
README.md
Domain README and index files
Architecture, decision, and workflow documents
Other Markdown documents
Agent instructions and skills
```

Update only references affected by the approved change. For each affected
reference, determine:

```text
Valid
Needs Update
Intentionally Historical
No Longer Needed
```

Do not redirect historical references to current knowledge if doing so
destroys historical meaning — keep the historical destination explicit.

---

# Navigation, Indexes, AGENTS.md

When adding, moving, or removing a knowledge unit, update the appropriate
navigation: `AGENTS.md` → domain README → focused knowledge. Keep indexes
concise — one-line links, never copied document content; update paths on
move, remove entries on delete.

### Index-Row Contract

Every Create / Move / Merge / Delete / Supersede carries its navigation
row in the **same change set**: domain README rows for created, moved, and
removed units; AGENTS.md pointer changes for entry-point shifts. An index
that lists a deleted unit, or omits a created one, silently misleads —
treat the row update as part of the edit, not a follow-up.

Treat `AGENTS.md` as high-impact. Modify it only when the approved
architecture requires: new navigation, changed critical rule or constraint,
changed architecture orientation or verification requirement, or
entry-point reconciliation. Pointer over detail:

```markdown
For authentication architecture, see:
`docs/architecture/security/authentication.md`
```

Detailed knowledge belongs in its canonical document.

---

# cavecrew-builder Delegation

Use `cavecrew-builder` for bounded mechanical edits only:

```text
1 file ideal
2 files acceptable
3+ never
```

Appropriate:

```text
Typo, path, or wording correction
Single status update
One-link update
Small formatting-preserving edit
Single thin-pointer conversion (1 file, text already drafted)
```

Never delegate changes requiring:

```text
Broad architecture reasoning
Repository-wide restructuring
Large multi-file migration
Multi-source knowledge consolidation
Knowledge classification
Historical interpretation
```

If the change affects more than two files, use a deliberate scoped edit
workflow.

Required flow:

```text
Delegate → Read → smallest valid edit → Re-read → Receipt
```

Treat the receipt as edit evidence only; it does not prove repository-wide
correctness.

---

# Multi-File Editing

For larger changes:

```text
1. Define exact affected files (across all origin tools)
2. Read each relevant file; establish dependency/order
3. Apply scoped changes; re-read each changed file
4. Check navigation relationships; produce edit receipt
```

Splitting: split by retrieval boundary, not line count — identify knowledge
units, assign canonical ownership, create focused documents, move knowledge,
update references, remove redundant original content. Consolidation: keep
unique knowledge, remove duplicate rationale, preserve important history,
explicit decisions, useful constraints, and references.

Do not perform blind global replacements.

---

# Search Before Replace

Search exact old paths and terminology; understand the match set before
replacing. Never replace short ambiguous strings (common words, generic
paths, short identifiers, status labels), and never perform repository-wide
bulk replacement without explicit approval.

---

# Scope Control

Before editing, establish:

```text
Allowed Files
Allowed Directories
Allowed Operations
Allowed Origin Tools
```

Do not expand scope because unrelated cleanup is visible. Do not fix
unrelated:

```text
Typos
Links
Formatting
Naming
Architecture
Code
```

unless the approved change requires it — a focused change is easier to
verify.

---

# Unexpected Discovery

If editing reveals new information that materially changes the
architecture:

```text
Stop → report discovery → return to classification / architecture
```

Do not silently redesign the system while editing. Examples:

```text
A supposedly obsolete document is still referenced by active workflows
A supposed duplicate contains unique historical rationale
A replacement path does not exist
The target file is already modified unexpectedly
An origin tool not in the approved plan contains the same knowledge
```

---

# Concurrent Changes

If a target file has changed unexpectedly since the plan was created,
re-read the current file; do not overwrite blindly. On meaningful
conflict: stop, report, request an updated plan.

---

# Edit Receipt

After editing, produce an edit receipt:

````markdown
## Memory Edit Receipt

### Created

- `<path>` — <purpose>

### Modified

- `<path>` — <summary>

### Moved

- `<source>` → `<destination>`

### Merged

- `<sources>` → `<canonical destination>`

### Reconciled (Dual/Competing Sources)

- `<origin path>` — converted to thin pointer to `<canonical path>`

### Deleted

- `<path>` — <reason>

### Deprecated

- `<path>` — <reason>

### Superseded

- `<path>` → `<replacement>`

### Navigation Updated

- `<path>` — <change>

### References Updated

- `<path>` — <change>

### Files Re-read

- `<path>`

### Scope

Files intentionally changed:

```text
<paths>
```

### Limitations

* <anything not verified>

### Verification Status

Edit-level verification only.

Repository-wide verification remains the responsibility of
`memory-verification`.
````

The receipt must describe what actually happened. Do not claim "all links
valid", "repository consistent", "memory fully migrated", or "architecture
correct" unless a separate verification phase established those facts.

---

# Edit-Level Verification

Before returning control:

```text
Re-read every changed file
Check created files exist
Check moved destination exists
Check deleted source is gone
Check thin-pointer conversions actually point to the canonical destination
Check obvious affected links
Check index entries
Check AGENTS.md references
```

This is edit-level verification, not final repository verification.

---

# Post-Edit Handoff

After editing, provide the parent Agent with:

```text
Changed / Created / Moved / Deleted Files
Reconciled Files (thin-pointer conversions)
Updated References
Remaining Known References
Unexpected Findings
Verification Limitations
```

This allows `memory-verification` to perform the final audit.

---

# Failure and Partial Migration

If an edit fails, do not pretend success. Report:

```text
Target
Operation
Failure
Partial Changes
Current State
Recommended Recovery
```

Identify partial changes clearly.

If a migration cannot be completed safely, preserve the source and report
the incomplete migration — never delete the source merely to make the tree
look clean.

---

# Hard Rules

1. Do not edit before an approved edit plan exists; do not guess missing
   decisions, replacement paths, or knowledge.
2. Do not independently classify knowledge or redesign the memory
   architecture; stop when new evidence invalidates the plan.
3. Never delete the only copy of valuable knowledge, and never remove a
   migration source, before its replacement or destination is established
   and verified.
4. Do not blindly delete or blindly rewrite documents, including
   pre-existing sources from other tools or Agents; if references cannot
   be assessed, report instead of deleting.
5. Prefer the smallest valid edit: no opportunistic cleanup, no unrelated
   files, no unrequested formatting or metadata changes.
6. No repository-wide replacement without explicit approval.
7. Do not duplicate canonical knowledge across origin tools; thin pointer
   is the default disposition for tool-specific entry points.
8. Preserve historical rationale and boundaries; never turn historical
   knowledge into current guidance or redirect historical meaning away.
9. Do not put detailed knowledge into `AGENTS.md` — pointer over detail.
10. `cavecrew-builder`: bounded mechanical edits only; never 3+ files,
    never multi-source consolidation or restructuring.

---

# Completion Criteria

The edit phase is complete when:

```text
Approved plan understood; scope incl. all origin tools established
Approved changes applied; canonical ownership and historical
    boundaries preserved
No unrelated changes introduced
References and navigation updated; thin-pointer conversions
    verified to point correctly
Changed files re-read
Edit receipt produced; verification limitations reported
Final repository verification deferred to memory-verification
```
