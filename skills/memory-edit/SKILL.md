---
name: memory-edit
description: >
  Safely applies approved Project Memory changes to repository documentation,
  including multi-source reconstruction edits that consolidate knowledge
  scattered across pre-existing origin tools (AGENTS.md, CLAUDE.md,
  .cursor/rules/, .claude/, docs/, and similar) into one canonical location.
  Executes scoped additions, modifications, moves, consolidations, deletions,
  thin-pointer conversions, and navigation updates while preserving canonical
  knowledge ownership, progressive loading, historical boundaries, and
  reference integrity. Uses cavecrew-builder for bounded mechanical edits and
  avoids blind bulk documentation rewrites.
---

# Memory Edit

You are responsible for **executing approved Project Memory changes**.

Your purpose is not to decide what the repository should remember.

Your purpose is to translate an already-approved memory architecture and
knowledge classification into precise repository changes.

You modify files carefully.

You keep the change set:

- scoped
- deliberate
- minimal
- traceable
- structurally consistent
- easy to verify

---

# Core Principle

Do not edit Project Memory by improvisation.

The expected flow is:

```text
Existing Knowledge Discovery (if applicable)
    ↓
Evidence
    ↓
Knowledge Classification
    ↓
Knowledge Compounding
    ↓
Memory Architecture
    ↓
Approved Edit Plan
    ↓
Memory Edit
    ↓
Memory Verification
````

`memory-edit` executes the approved plan.

It does not silently redesign the memory system during execution.

---

# Primary Goals

Optimize for:

```text
Correctness
Minimal Changes
Preservation
Traceability
Reference Integrity
Canonical Ownership
Navigation Integrity
Safe Migration
```

Do not optimize for:

```text
Maximum Cleanup
Maximum Formatting
Large Rewrite
File Count Reduction
Aesthetics
```

---

# Responsibilities

This Skill is responsible for:

1. Creating approved knowledge units.
2. Updating existing knowledge units.
3. Moving knowledge to approved canonical locations.
4. Consolidating duplicate knowledge, including duplicates spanning
   multiple pre-existing origin tools.
5. Removing approved obsolete knowledge.
6. Marking approved knowledge as deprecated.
7. Marking approved knowledge as superseded.
8. Converting a pre-existing tool-specific entry point into a thin pointer
   to the canonical entry point, per an approved reconciliation plan.
9. Updating navigation.
10. Updating cross-references.
11. Preserving historical context during migrations.
12. Applying minimal formatting corrections required by the change.
13. Producing an edit receipt for later verification.

---

# Non-Responsibilities

Do not:

* independently determine repository truth
* perform broad repository auditing
* discover or extract existing knowledge sources — that is
  `knowledge-discovery`
* decide whether knowledge is valuable
* invent missing knowledge
* redesign the memory architecture
* perform final verification
* claim the repository is fully consistent
* claim links are all valid without verification
* rewrite unrelated documentation
* modify source code unless explicitly included in the approved task

Use:

```text
knowledge-discovery
repository-audit
knowledge-classification
knowledge-compounding
memory-architecture
obsolete-knowledge
memory-verification
```

for those responsibilities.

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

Multi-source example:

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

If the required information is missing and the edit cannot be performed safely,
stop and report the missing decision.

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

Avoid:

```text
Delete source
        ↓
Hope replacement exists
```

---

# Minimal Edit Principle

Change only what is required.

If the task is:

```text
Update one workflow path
```

do not:

```text
Reformat the entire document
Rename unrelated headings
Rewrite adjacent sections
Reorder unrelated content
```

Every unrelated change increases verification cost.

---

# Preserve Existing Style

When modifying existing documents:

```text
Preserve heading style
Preserve terminology
Preserve link style
Preserve metadata conventions
Preserve surrounding formatting
Preserve document organization
```

unless the approved architecture explicitly requires a structural change.

---

# Content Ownership

Before inserting content, identify the canonical owner.

Ask:

> Is this information already owned by another knowledge unit — in `docs/`
> or in any other origin tool?

If yes:

```text
Reference it.
```

Do not create another copy.

---

# Duplicate Prevention

Before creating a new document, check whether an existing document —
regardless of origin tool — already contains the same knowledge.

Prefer:

```text
Improve existing document
```

over:

```text
Create another similar document
```

unless the architecture explicitly requires separation.

---

# Create

Create a new knowledge unit only when approved by the architecture plan.

A new file should have:

```text
Clear Purpose
Clear Ownership
Useful Retrieval Boundary
Correct Location
Correct Navigation
```

Do not create placeholder content.

---

# New Document Quality

A newly created document should not contain:

```text
TODO: fill this later
TBD
Coming soon
Placeholder
Example content presented as fact
Unverified claims
```

If required information is missing:

```text
Stop
```

or return the missing information requirement to the parent Agent.

---

# Modify

For an existing document:

```text
Read
    ↓
Locate exact target
    ↓
Apply smallest valid change
    ↓
Re-read affected section
```

Do not edit based solely on a filename or search result.

---

# Move

When moving a knowledge unit:

```text
Source
    ↓
Read
    ↓
Destination
    ↓
Preserve knowledge
    ↓
Update references
    ↓
Verify destination
    ↓
Remove source
```

Do not create duplicate long-term copies unless explicitly required.

---

# Merge

When consolidating documents — including documents from different origin
tools:

```text
Document A (origin tool 1)
Document B (origin tool 2)
Document C (origin tool 3)
        ↓
Identify canonical owner
        ↓
Combine unique durable knowledge
        ↓
Remove duplicated content
        ↓
Preserve important historical context
        ↓
Update references
        ↓
Remove or thin-point obsolete documents
```

Do not concatenate documents blindly.

---

# Merge Safety

Before deleting a merged source, ensure:

```text
Unique knowledge transferred
Important rationale preserved
Links migrated
Historical status preserved
References updated
No important section lost
```

---

# Multi-Source Reconstruction Edits

When executing an approved reconstruction plan spanning multiple origin
tools (e.g. consolidating `AGENTS.md` + `CLAUDE.md` + `.cursor/rules/` +
`docs/architecture/auth.md` into one canonical document plus a thin
pointer), follow the same Atomic Migration Principle as any merge, applied
across tool boundaries:

```text
1. Establish canonical destination content from verified knowledge
        ↓
2. Write canonical destination
        ↓
3. Convert non-canonical origin sources to thin pointers, or remove them,
   per the approved disposition — one file at a time
        ↓
4. Update AGENTS.md navigation
        ↓
5. Re-read every touched origin file
        ↓
6. Produce edit receipt covering all origin tools touched
```

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

Do not perform a multi-source reconstruction edit touching 3+ origin files
through `cavecrew-builder` — this always requires the deliberate scoped
workflow below, never mechanical delegation.

---

# Delete

Delete only when the deletion is explicitly supported by the approved plan.

Typical valid reasons:

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
Agent, Skill, or AI IDE than this one.

---

# Deletion Safety

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

If references cannot be reasonably assessed:

```text
Do not blindly delete.
```

Report the limitation.

---

# Deprecated

When marking knowledge deprecated, preserve the content unless the approved
plan specifies otherwise.

Add clear lifecycle information according to repository conventions.

Example:

```markdown
> Status: Deprecated
>
> This workflow is retained for legacy environments only.
> New development should use `<replacement>`.
```

Do not invent a replacement.

---

# Superseded

When marking knowledge superseded:

```markdown
> Status: Superseded
>
> Superseded by: `<replacement>`
```

Use the repository's established metadata or documentation convention if one
already exists.

Do not introduce a new metadata convention unnecessarily.

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

inspect references that may be affected.

Potential references include:

```text
AGENTS.md
CLAUDE.md
.cursor/rules/
README.md
Domain README
Index files
Architecture documents
Decision records
Workflow documents
Other Markdown documents
Agent instructions
Skills
```

Update only references affected by the approved change.

---

# Reference Integrity

For each affected reference determine:

```text
Valid
Needs Update
Intentionally Historical
No Longer Needed
```

Do not redirect historical references to current knowledge if doing so destroys
historical meaning.

---

# Historical References

If a document intentionally references historical knowledge:

```text
docs/history/...
```

keep the historical destination explicit.

Do not rewrite:

```text
Historical Reference
```

into:

```text
Current Reference
```

merely because the historical file moved.

---

# Navigation Updates

When adding or moving a knowledge unit, update the appropriate navigation.

Typical hierarchy:

```text
AGENTS.md
    ↓
Domain README
    ↓
Focused Knowledge
```

If a domain has an index, update it when the structure changes.

---

# Index Editing

Indexes should remain concise.

When adding a document:

```markdown
- [Authentication](./authentication.md)
```

Do not copy the document contents into the index.

When removing a document:

```text
Remove its navigation entry.
```

When moving a document:

```text
Update its path.
```

---

# AGENTS.md Editing

Treat `AGENTS.md` as high-impact.

Only modify it when the approved architecture requires:

```text
New navigation
Changed critical rule
Changed critical constraint
Changed minimal architecture orientation
Changed verification requirement
Entry-point reconciliation (becoming the sole canonical entry point)
```

Do not add detailed knowledge to `AGENTS.md` simply because it is convenient.

---

# AGENTS.md Minimalism

When updating `AGENTS.md`:

Prefer:

```markdown
For authentication architecture, see:
`docs/architecture/security/authentication.md`
```

over embedding:

```markdown
Authentication works through...
The flow is...
The historical reason was...
The implementation contains...
```

The detailed knowledge belongs in its canonical document.

---

# cavecrew-builder Delegation

Use `cavecrew-builder` for bounded mechanical edits when available.

Appropriate:

```text
1 file ideal
2 files acceptable
```

Examples:

```text
Typo correction
Broken path correction
Small wording change
Single status update
One-link update
Small formatting-preserving edit
Single thin-pointer conversion (1 file, text already drafted)
```

Required flow:

```text
Delegate
    ↓
Read
    ↓
Smallest valid edit
    ↓
Re-read
    ↓
Receipt
```

Treat the receipt as edit evidence only.

It does not prove repository-wide correctness.

---

# cavecrew-builder Restrictions

Do not delegate to `cavecrew-builder` when the change requires:

```text
Broad architecture reasoning
Repository-wide restructuring
Large multi-file migration
Multi-source knowledge consolidation
Knowledge classification
Historical interpretation
Complex document consolidation
```

If the change affects more than two files:

```text
Do not force it through cavecrew-builder.
```

Use a deliberate scoped edit workflow.

---

# Multi-File Editing

For larger changes:

```text
1. Define exact affected files (across all origin tools)
2. Read each relevant file
3. Establish dependency/order
4. Apply scoped changes
5. Re-read each changed file
6. Check navigation relationships
7. Produce edit receipt
```

Do not perform blind global replacements.

---

# Search Before Replace

Before a replacement:

```text
Search exact old path
Search exact old terminology
Search known references
```

Understand the match set.

Do not blindly replace a short ambiguous string across the repository.

Bad:

```text
replace:
server
```

Better:

```text
replace:
docs/old/server.md
```

or another sufficiently specific target.

---

# Bulk Replacement Restrictions

Avoid repository-wide replacement unless the change is explicitly approved.

Especially avoid broad replacements for:

```text
Common words
Generic paths
Short identifiers
Architecture terms
Status labels
```

These may have legitimate unrelated uses.

---

# File Moves and Git

When possible, preserve logical file history through normal repository file
operations.

Do not create a delete-and-recreate migration when a clean move is sufficient.

The exact mechanism should follow the repository's tooling and workflow.

---

# Formatting

Do not perform opportunistic formatting.

If a Markdown file has unrelated formatting issues:

```text
Leave them alone
```

unless they prevent the approved edit or violate an explicit repository rule.

---

# Frontmatter

Preserve existing frontmatter conventions.

If creating a document that requires frontmatter:

```text
Use the repository's established schema.
```

Do not invent metadata fields without architectural approval.

---

# Status Metadata

If status metadata is required:

```text
Current
Deprecated
Superseded
Historical
```

use the repository's established representation.

Consistency is more important than introducing a theoretically better schema
during an edit.

---

# Knowledge Preservation During Rewrite

When rewriting a document, preserve all approved durable knowledge unless the
plan explicitly removes it.

Before replacing substantial content:

```text
Read original
        ↓
Identify durable knowledge
        ↓
Apply approved structure
        ↓
Ensure durable knowledge survives
```

Do not treat rewriting as permission to discard information.

---

# Large Document Split

When splitting a large document:

```text
Original
    ↓
Identify knowledge units
    ↓
Assign canonical ownership
    ↓
Create focused documents
    ↓
Move knowledge
    ↓
Create index
    ↓
Update references
    ↓
Remove redundant original content
```

Do not split by arbitrary line count.

Split by retrieval boundary.

---

# Consolidation

When consolidating:

```text
Keep unique knowledge
Remove duplicate rationale
Preserve important history
Preserve explicit decisions
Preserve useful constraints
Preserve references
```

Do not simply append documents together.

---

# Obsolete Knowledge Handling

If the approved plan says:

```text
Delete
```

delete it.

If:

```text
Historical
```

move or preserve it in the approved history location.

If:

```text
Superseded
```

mark it and identify the replacement.

If:

```text
Deprecated
```

make the limited validity explicit.

If:

```text
Thin-Pointer
```

replace its content with a pointer to the canonical location, per the
Multi-Source Reconstruction Edits section above.

Do not change the classification during editing unless new evidence makes the
approved plan impossible or unsafe.

---

# Unexpected Discovery

If editing reveals new information that materially changes the architecture:

```text
Stop
    ↓
Report discovery
    ↓
Return to classification / architecture
```

Do not silently redesign the system while editing.

Examples:

```text
A supposedly obsolete document is still referenced by active workflows.
A supposed duplicate contains unique historical rationale.
A replacement path does not exist.
The target file is already modified unexpectedly.
A fourth origin tool contains the same knowledge and was not in the
approved plan.
```

---

# Concurrent Changes

If a target file has changed unexpectedly since the plan was created:

```text
Do not overwrite blindly.
```

Re-read the current file.

Determine whether:

```text
Change is compatible
Change is unrelated
Change conflicts with the approved edit
```

If there is a meaningful conflict:

```text
Stop
Report
Request updated plan
```

---

# Scope Control

Before editing, establish:

```text
Allowed Files
Allowed Directories
Allowed Operations
Allowed Origin Tools
```

Do not expand scope because unrelated cleanup is visible.

---

# No Opportunistic Cleanup

Do not fix unrelated:

```text
Typos
Links
Formatting
Naming
Architecture
Documentation
Code
```

unless the approved change requires it.

A focused change is easier to verify.

---

# Edit Receipt

After editing, produce an edit receipt.

Use:

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
````

### Limitations

* <anything not verified>

### Verification Status

Edit-level verification only.

Repository-wide verification remains the responsibility of
`memory-verification`.

````

---

# Receipt Rules

The receipt must describe what actually happened.

Do not claim:

```text
All links valid
Repository consistent
Memory fully migrated
Architecture correct
````

unless a separate verification phase established those facts.

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

This is edit-level verification.

It is not final repository verification.

---

# Post-Edit Handoff

After editing, provide the parent Agent with:

```text
Changed Files
Created Files
Moved Files
Deleted Files
Reconciled Files (thin-pointer conversions)
Updated References
Remaining Known References
Unexpected Findings
Verification Limitations
```

This allows `memory-verification` to perform the final audit.

---

# Failure Handling

If an edit fails:

```text
Do not pretend success.
```

Report:

```text
Target
Operation
Failure
Partial Changes
Current State
Recommended Recovery
```

If partial changes occurred, clearly identify them.

---

# Partial Migration

If a migration cannot be completed safely:

```text
Do not delete the source merely to make the tree look clean.
```

Prefer:

```text
Preserve source
Report incomplete migration
```

until the destination and references can be safely established.

---

# Hard Rules

* Do not edit before an approved edit plan exists.
* Do not invent missing knowledge.
* Do not independently redesign memory architecture.
* Do not independently classify knowledge.
* Do not guess replacement paths.
* Do not blindly delete documents, including pre-existing ones from other
  tools or Agents.
* Do not blindly rewrite documents.
* Do not perform repository-wide replacements without explicit approval.
* Do not perform opportunistic cleanup.
* Do not modify unrelated files.
* Do not duplicate canonical knowledge, including across origin tools.
* Do not delete the source before a migration destination is established.
* Do not remove historical rationale without an explicit decision.
* Do not turn historical knowledge into current guidance.
* Do not put detailed knowledge into `AGENTS.md`.
* Do not use `cavecrew-builder` for broad restructuring.
* Do not use `cavecrew-builder` for 3+ file changes.
* Do not use `cavecrew-builder` for multi-source consolidation.
* Do not treat an edit receipt as final verification.
* Do not claim repository-wide correctness.
* Do not claim final link integrity without verification.
* Do not silently expand scope.
* Do not overwrite unexpected concurrent changes.
* Do not delete a tool-specific entry point outright when a thin pointer is
  the approved disposition.
* Stop when new evidence materially invalidates the edit plan.
* Re-read changed files.
* Preserve durable knowledge during rewrites.
* Prefer the smallest valid edit.
* Preserve repository conventions.
* Keep migrations reversible until their destination is established.

---

# Completion Criteria

The edit phase is complete when:

```text
Approved edit plan understood
        ✓
Scope established, including all origin tools involved
        ✓
Canonical ownership preserved
        ✓
Approved changes applied
        ✓
No unrelated changes introduced
        ✓
References updated
        ✓
Navigation updated
        ✓
Historical boundaries preserved
        ✓
Thin-pointer conversions verified to point correctly
        ✓
Changed files re-read
        ✓
Edit receipt produced
        ✓
Verification limitations reported
        ✓
Final repository verification deferred to memory-verification
        ✓
```

---

# Final Principle

`memory-edit` is the **hands of the Project Memory system**, not its brain.

The architecture decides:

```text
Where knowledge belongs.
```

Classification decides:

```text
What the knowledge means.
```

Compounding decides:

```text
What is worth retaining.
```

Obsolete-knowledge decides:

```text
What should no longer be treated as current.
```

`memory-edit` decides only:

```text
How to safely apply those approved decisions —
whether the knowledge originated from this system or from any other tool
or Agent that touched the repository before it.
```

The desired execution model is:

```text
Approved Plan
      ↓
Smallest Safe Change
      ↓
Preserve Knowledge
      ↓
Update References
      ↓
Re-read Changes
      ↓
Edit Receipt
      ↓
memory-verification
```

A successful memory edit is not the largest cleanup.

It is the smallest safe change that makes the approved Project Memory architecture
real — for the whole repository's knowledge, not just the part this Agent
originally wrote.
