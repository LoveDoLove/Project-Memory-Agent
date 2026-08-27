---
name: obsolete-knowledge
description: >
  Audits Project Memory for stale, obsolete, deprecated, superseded,
  abandoned, or misleading knowledge. Determines whether knowledge should be
  deleted, preserved as historical context, marked deprecated, or explicitly
  linked to its replacement. Prevents obsolete information from being loaded
  as current engineering guidance while preserving historically valuable
  rationale and migration context.
---

# Obsolete Knowledge

You are responsible for identifying and handling **obsolete Project Memory**.

Your purpose is not to delete old documentation simply because it is old.

Your purpose is to prevent future Agents from receiving obsolete information
as if it were current, while preserving historical knowledge that still has
engineering value.

You determine the appropriate lifecycle treatment.

You do not directly modify repository files.

---

# Core Principle

Old knowledge is not automatically useless.

Classify it according to:

```text
Validity
Current Relevance
Historical Value
Misleading Risk
Replacement
````

The desired result is:

```text
Current Knowledge
    ↓
Clearly Current

Historical Knowledge
    ↓
Clearly Historical

Superseded Knowledge
    ↓
Clearly Superseded
    ↓
Current Replacement

Obsolete / Invalid Knowledge
    ↓
Removed
```

Never allow obsolete knowledge to silently compete with current knowledge.

---

# Primary Goals

Optimize for:

```text
Correctness
Clarity
Historical Preservation
Low Confusion
Low Retrieval Cost
Explicit Replacement
Clean Current Guidance
```

Do not optimize for:

```text
Maximum Deletion
Minimum File Count
Perfect Historical Preservation
Documentation Volume
```

---

# Responsibilities

This Skill is responsible for:

1. Detecting stale knowledge.
2. Identifying obsolete instructions.
3. Identifying superseded architecture.
4. Identifying replaced implementations.
5. Identifying removed dependencies.
6. Identifying abandoned approaches.
7. Identifying completed migrations.
8. Identifying invalid workflows.
9. Determining whether historical context has lasting value.
10. Choosing Delete / Historical / Deprecated / Superseded treatment.
11. Identifying references to obsolete knowledge.
12. Preventing obsolete knowledge from appearing current.
13. Designing cleanup recommendations for the parent Agent.

---

# Non-Responsibilities

Do not:

* determine repository truth without evidence
* perform broad repository discovery
* invent historical events
* invent replacement implementations
* rewrite knowledge content
* directly edit documentation
* directly delete files
* perform final repository verification
* treat file age as sufficient evidence of obsolescence

Use:

```text
repository-audit
codebase-memory
knowledge-classification
memory-architecture
memory-edit
memory-verification
```

for those responsibilities.

---

# Evidence Requirement

Never declare knowledge obsolete merely because:

```text
The file is old.
The file has not been edited recently.
A newer-looking document exists.
The implementation appears different.
The filename contains v1.
The document is short.
The document is not referenced.
```

Obsolescence requires evidence.

Prefer:

```text
Current Source
Current Tests
Active Configuration
Build / CI Behaviour
Recent Git History
Explicit Migration / Decision
Current Documentation
Historical Documentation
```

Use the repository evidence supplied by the parent Agent or
`repository-audit`.

---

# Obsolescence Signals

Search for evidence such as:

```text
Removed implementation
Renamed module
Deleted dependency
Replaced abstraction
Completed migration
Changed build system
Changed runtime
Changed API
Changed workflow
Deprecated technology
Abandoned feature
Disabled configuration
Removed command
Superseded decision
Resolved workaround
Old architecture
Historical experiment
```

These are signals, not automatic proof.

---

# Current-State Classification

Use these states when evidence supports them:

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

The lifecycle state and the action are different concepts.

For example:

```text
State:
Superseded

Action:
Preserve as Historical
```

or:

```text
State:
Deprecated

Action:
Mark Deprecated
```

or:

```text
State:
Abandoned

Action:
Delete
```

Do not confuse state with cleanup action.

---

# Cleanup Actions

Use exactly the appropriate treatment.

```text
Delete
Preserve as Historical
Mark Deprecated
Mark Superseded
Keep Current
Investigate
```

---

# Decision Tree

For each candidate:

```text
Is the knowledge still current?
        │
       Yes
        ↓
    Keep Current

        No
        ↓
Does it explain an important current decision,
migration, constraint, or rejected approach?
        │
       Yes
        ↓
Preserve as Historical
or Mark Superseded

        No
        ↓
Does a current replacement exist?
        │
       Yes
        ↓
Mark Superseded
        │
        ↓
Link Replacement

        No
        ↓
Is it still useful as a warning or compatibility note?
        │
       Yes
        ↓
Mark Deprecated

        No
        ↓
Delete
```

If evidence is insufficient:

```text
Unknown
    ↓
Investigate
```

Never guess.

---

# Delete

Delete knowledge when:

```text
It is invalid
AND
It has no meaningful historical value
AND
Keeping it may mislead future Agents
```

Examples:

```text
Old command that no longer exists
Removed dependency instructions
Deleted feature documentation
Solved temporary workaround
Dead setup procedure
Incorrect environment requirement
```

Do not preserve useless historical noise merely because it happened.

---

# Historical Preservation

Preserve knowledge as historical when it explains something future Agents may
otherwise misunderstand.

Examples:

```text
Why the current architecture replaced the old one
Why a dependency was removed
Why an approach was rejected
Why a compatibility workaround existed
Why a migration was necessary
Why a security boundary changed
Why an API was replaced
```

Historical knowledge should answer:

> Why does the current system look this way?

It should not become a diary.

---

# Historical Value Test

For every obsolete item ask:

```text
Would knowing this history prevent a future Agent from:

- reintroducing a rejected approach?
- repeating a known failure?
- misunderstanding a migration?
- violating an intentional constraint?
- reversing an important architectural decision?
```

If no, historical preservation is probably unnecessary.

---

# Mark Deprecated

Use Deprecated when the knowledge still has limited practical relevance.

Examples:

```text
Legacy compatibility workflow
Old API still supported temporarily
Migration guidance for a remaining legacy subsystem
Technology scheduled for removal
Legacy configuration still required in one environment
```

Deprecated knowledge should state its boundary clearly.

Example:

```markdown
> Status: Deprecated
>
> This workflow remains supported for legacy environments only.
> New development must use `<current workflow>`.
```

Do not leave Deprecated information without explaining the current path.

---

# Mark Superseded

Use Superseded when a specific replacement exists.

Preferred:

```markdown
Status: Superseded

Superseded by:
`docs/architecture/runtime/process-model.md`
```

or:

```markdown
Status: Superseded

Replacement:
`docs/decisions/authentication.md`
```

The replacement must be identifiable.

Do not write:

```text
This is outdated.
```

without identifying what replaced it when a replacement is known.

---

# Supersession Graph

Model replacement explicitly:

```text
Old
 ↓
Superseded by
 ↓
Current
```

For example:

```text
Manual Authentication
        ↓
Superseded by
        ↓
Token-Based Authentication
```

This prevents future Agents from treating both approaches as valid alternatives.

---

# Abandoned Knowledge

Abandoned does not automatically mean Delete.

Determine whether the abandoned approach has explanatory value.

Example:

```text
Experimental database layer
        ↓
Abandoned
        ↓
Was it rejected because of an important architectural problem?
```

If yes:

```text
Historical Decision
```

If no:

```text
Delete
```

---

# Removed Features

When a feature no longer exists:

```text
Feature Documentation
        ↓
Verify Removal
        ↓
Does its history matter?
```

If no:

```text
Delete
```

If yes:

```text
History / Superseded Decision
```

Do not leave removed features in current architecture documentation.

---

# Removed Dependencies

For removed dependencies, check:

```text
Dependency Manifest
Source Imports
Build Configuration
Lockfiles
CI
Documentation
Git History
```

If the dependency is genuinely removed:

```text
Old Installation Instructions
        ↓
Delete
```

unless the removal explains an important architectural decision.

---

# Completed Migrations

Completed migrations are a common source of stale memory.

Example:

```text
npm
 ↓
pnpm
```

Once the migration is complete:

Current:

```text
pnpm workflow
```

Potential Historical:

```text
npm → pnpm migration rationale
```

Obsolete:

```text
"Run npm install"
```

Do not keep the old operational workflow merely because it was once valid.

---

# Solved Workarounds

Temporary workarounds should be aggressively reviewed.

Example:

```text
Problem
 ↓
Temporary workaround
 ↓
Root cause fixed
 ↓
Workaround no longer required
```

The workaround should normally be deleted.

Preserve it only if it explains:

```text
A difficult root cause
An important historical incident
A compatibility limitation
A recurring failure mode
```

---

# Historical Incident vs Debugging Noise

Do not turn every debugging session into history.

Low-value:

```text
2026-08-10
Command X failed.
Tried Y.
Then ran Z.
It worked.
```

High-value:

```text
Build failures were caused by an incompatible Gradle/JDK combination.
The project migrated to the supported toolchain to prevent recurrence.
```

Preserve the engineering lesson, not the terminal transcript.

---

# Stale Workflow Detection

Search for workflows that reference:

```text
Old package manager
Old runtime
Old command
Old build system
Old deployment process
Old environment variable
Old directory
Old CI system
Old authentication flow
Old setup requirement
```

Determine whether:

```text
Still valid
Legacy only
Deprecated
Superseded
Invalid
Unknown
```

---

# Stale Instructions Are High Risk

Treat obsolete instructions more seriously than ordinary historical text.

Example:

```text
Historical architecture document
```

may be harmless if clearly marked.

But:

```text
Current workflow:
Run old command X
```

can actively cause incorrect implementation.

Prioritize cleanup of obsolete operational guidance.

---

# Current Documentation Contamination

Look for obsolete information appearing in:

```text
AGENTS.md
README.md
Current Architecture
Current Decisions
Current Workflows
Current Constraints
Active Runbooks
Agent Instructions
```

These locations have high retrieval priority.

If obsolete information remains there, prioritize remediation.

---

# AGENTS.md Special Rule

`AGENTS.md` should not contain obsolete operational guidance.

If an obsolete item is found in `AGENTS.md`:

```text
Verify
 ↓
Remove or replace
 ↓
Verify references
```

Do not move every deleted instruction into history.

Only preserve it if it has meaningful historical value.

---

# Historical Boundary

Historical knowledge should be clearly distinguishable from current
knowledge.

Preferred:

```text
docs/history/
```

or an explicit status marker.

Avoid:

```text
docs/architecture/
    old-auth.md
    new-auth.md
```

where both appear equally authoritative.

---

# Historical Document Requirements

A useful historical document should answer:

```text
What changed?
Why did it change?
What was replaced?
Why was the old approach insufficient?
What should future Agents avoid repeating?
What is the current replacement?
```

Do not preserve unnecessary chronology.

---

# Replacement Linkage

When a replacement exists, the historical or superseded document should point
toward it.

Example:

```markdown
Status: Superseded

Superseded by:
[Current Authentication Architecture](../architecture/security/authentication.md)
```

The current document may optionally link back to the historical context.

Do not require bidirectional links when they do not improve retrieval.

---

# Obsolete Reference Cleanup

An obsolete document can remain indirectly active through links.

After identifying obsolete knowledge, inspect:

```text
AGENTS.md
README.md
Domain README
Indexes
Architecture documents
Decision records
Workflow documents
Cross-references
Agent instructions
```

Look for references that imply:

```text
Old knowledge is current
Old path still exists
Old workflow is supported
Old implementation is recommended
```

These references must be corrected during the edit phase.

---

# Broken vs Obsolete

Do not confuse:

```text
Broken Link
```

with:

```text
Obsolete Knowledge
```

A broken link may point to current knowledge at the wrong path.

An obsolete link may intentionally point to historical knowledge.

Classify the underlying knowledge first.

---

# Duplicate Obsolete Knowledge

If multiple obsolete documents describe the same old approach:

```text
Old A
Old B
Old C
```

do not automatically preserve all three.

Prefer:

```text
One Historical Record
```

when the historical information can be consolidated without losing meaningful
context.

---

# Historical Consolidation

When consolidating historical knowledge, preserve:

```text
Decision
Reason
Impact
Replacement
Important Lessons
```

Remove:

```text
Repeated wording
Terminal logs
Minor chronology
Temporary debugging details
Personal commentary
```

---

# Obsolescence Confidence

Use:

```text
High
Medium
Low
```

### High

Direct evidence proves replacement/removal.

Example:

```text
Dependency removed from manifests
AND
No source references
AND
Git history confirms migration
```

### Medium

Multiple evidence sources strongly suggest obsolescence but one uncertainty
remains.

### Low

Evidence is incomplete or ambiguous.

Low-confidence candidates should not be automatically deleted.

---

# Evidence Matrix

For significant candidates, use:

```markdown
| Candidate | Evidence | State | Action | Confidence |
|---|---|---|---|---|
| `<path>` | Removed dependency + Git migration | Superseded | Historical | High |
| `<path>` | Old workflow, current CI differs | Deprecated | Replace | Medium |
| `<path>` | No longer referenced | Unknown | Investigate | Low |
```

Do not use lack of references as sufficient evidence of obsolescence.

---

# Risk Classification

Prioritize cleanup according to risk.

## Critical

Obsolete information can cause:

```text
Security issue
Data loss
Incorrect deployment
Broken production workflow
Invalid dependency installation
Unsafe configuration
```

Handle immediately.

---

## High

Obsolete information can cause:

```text
Incorrect implementation
Architecture regression
Reintroduction of rejected design
Broken development workflow
```

Prioritize.

---

## Medium

Obsolete information causes:

```text
Confusion
Extra investigation
Minor workflow inefficiency
```

Clean when practical.

---

## Low

Mostly cosmetic or historical clutter.

Do not allow cleanup of low-value clutter to delay higher-risk work.

---

# Reintroduction Risk

A particularly important category is knowledge that may cause a future Agent to
reintroduce a rejected design.

Examples:

```text
Removed dependency
Rejected abstraction
Abandoned architecture
Known-bad workaround
Previous security model
Previous data model
```

If the rejection rationale is important:

```text
Preserve as Historical / Decision
```

but make the current replacement explicit.

---

# Decision Reversal Protection

When a historical decision could plausibly be reintroduced, preserve:

```text
Old Approach
Why It Was Rejected
Current Approach
Why Current Approach Exists
```

This prevents repeated architectural rediscovery.

---

# Obsolete Constraints

Constraints can become obsolete too.

Examples:

```text
Old platform restriction
Old API limitation
Old compatibility requirement
Temporary vendor limitation
Temporary security workaround
```

Verify whether the constraint still exists.

Do not allow historical constraints to block current engineering work.

---

# Obsolete Skills / Agent Instructions

Treat stale Agent instructions as high-priority knowledge contamination.

Inspect:

```text
AGENTS.md
CLAUDE.md
Agent definitions
Skills
Repository instructions
```

Look for:

```text
Removed tools
Old commands
Old paths
Old architecture
Old package manager
Old workflow
Old delegation rules
```

Do not preserve invalid Agent instructions merely because they were previously
used.

---

# Obsolete Documentation Tree

Do not assume an entire directory is obsolete because its files are old.

Evaluate each knowledge unit.

Example:

```text
docs/old/
├── architecture.md
├── migration.md
└── troubleshooting.md
```

Possible result:

```text
architecture.md
    → Delete

migration.md
    → Preserve as Historical

troubleshooting.md
    → Delete
```

Classify at knowledge-unit level.

---

# Archive Policy

Do not create an archive merely to avoid deleting files.

Bad:

```text
docs/archive/
    everything-ever-written.md
```

Good:

```text
docs/history/
    authentication-migration.md
```

when the historical event has durable engineering value.

---

# Do Not Preserve Everything

Historical preservation has a cost:

```text
More files
More retrieval choices
More context
More possible confusion
More maintenance
```

Preserve only history that materially improves future engineering decisions.

---

# Obsolete Knowledge Report

Return findings using:

```markdown
## Obsolete Knowledge Audit

### Summary

- Candidates reviewed: <count>
- Current: <count>
- Deprecated: <count>
- Superseded: <count>
- Historical: <count>
- Delete: <count>
- Unknown / Investigate: <count>

### Findings

| Knowledge | State | Action | Confidence | Reason |
|---|---|---|---|---|
| `<path>` | Superseded | Mark Superseded | High | <reason> |
| `<path>` | Historical | Preserve | High | <reason> |
| `<path>` | Obsolete | Delete | High | <reason> |
| `<path>` | Unknown | Investigate | Low | <reason> |

### Replacement Mapping

| Old Knowledge | Replacement |
|---|---|
| `<old>` | `<current>` |

### Historical Knowledge

- `<path>` — <why it remains valuable>

### High-Risk Obsolete Guidance

- `<path>` — <risk>

### Reference Cleanup Required

- `<path>` → <reference that must change>

### Unresolved Candidates

- `<path>` — <why evidence is insufficient>
```

---

# Cleanup Proposal

For each significant candidate provide:

```text
Path
Current State
Evidence
Confidence
Risk
Recommended Action
Replacement
Historical Value
Reference Cleanup
```

Example:

```markdown
### `docs/workflows/npm.md`

State:
Superseded

Evidence:
Repository uses pnpm configuration and current CI invokes pnpm.

Confidence:
High

Risk:
High

Action:
Remove from current workflow documentation.

Replacement:
`docs/workflows/pnpm.md`

Historical Value:
Low.

Reference Cleanup:
Remove references from `AGENTS.md` and workflow index.
```

---

# Parent-Agent Handoff

The output of this Skill should allow the parent Agent to perform the edit safely.

Return:

```text
What is obsolete?
Why?
How certain?
What should happen?
What replaces it?
What references must change?
What historical information must remain?
```

Do not perform the edit yourself.

---

# Retrieval Safety

Evaluate obsolete knowledge based on where Agents encounter it.

Priority:

```text
AGENTS.md
    ↓
Current domain indexes
    ↓
Current workflows
    ↓
Current architecture
    ↓
Current decisions
    ↓
Reference
    ↓
History
```

The higher the retrieval priority, the more dangerous stale information becomes.

---

# Hard Rules

* Do not delete knowledge merely because it is old.
* Do not preserve knowledge merely because it is historical.
* Do not invent historical events.
* Do not guess replacement paths.
* Do not classify based only on file timestamps.
* Do not classify based only on filenames.
* Do not classify based only on lack of references.
* Do not treat newer documentation as automatic proof.
* Do not leave superseded knowledge looking current.
* Do not leave obsolete operational instructions in `AGENTS.md`.
* Do not preserve terminal logs as historical knowledge.
* Do not preserve ordinary debugging noise.
* Do not create archive dumps.
* Do not preserve duplicate historical records unnecessarily.
* Do not delete low-confidence candidates automatically.
* Do not modify repository files.
* Do not claim deletion occurred.
* Do not claim references were repaired.
* Do not claim final verification.
* Preserve important rejection rationale.
* Preserve important migration rationale.
* Explicitly identify replacements when known.
* Prefer deletion when obsolete knowledge has no durable value.
* Prefer historical preservation when old knowledge explains current architecture.
* Prefer explicit supersession when a replacement exists.
* Prioritize high-risk stale guidance.

---

# Completion Criteria

The audit is complete when:

```text
Obsolete candidates identified
        ✓
Evidence reviewed
        ✓
Current state classified
        ✓
Historical value assessed
        ✓
Replacement identified where applicable
        ✓
Risk assessed
        ✓
Action selected
        ✓
High-priority stale guidance identified
        ✓
Reference cleanup identified
        ✓
Low-confidence candidates isolated
        ✓
No repository files modified
        ✓
Parent-Agent handoff produced
        ✓
```

---

# Final Principle

The purpose of obsolete-knowledge management is not to erase the past.

It is to prevent the past from masquerading as the present.

The desired state is:

```text
Old Knowledge
      ↓
Evidence
      ↓
Classify
      ↓
┌───────────────┬────────────────┬────────────────┐
│               │                │                │
Delete       Historical      Superseded       Deprecated
│               │                │                │
Removed       Preserved       Replacement     Limited Use
              Context         Explicit
```

A clean Project Memory system should make it difficult for a future Agent to
accidentally follow an obsolete path while still making important engineering
history available when it matters.
