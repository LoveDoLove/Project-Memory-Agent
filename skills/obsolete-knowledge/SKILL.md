---
name: obsolete-knowledge
description: >
  Audits Project Memory for stale, obsolete, deprecated, or superseded
  knowledge. Determines delete, historical preservation, deprecation, or
  supersession treatment from evidence. Prevents obsolete information from
  loading as current guidance while preserving valuable rationale.
---

# Obsolete Knowledge

# Core Principle

Obsolete knowledge must never look current.

Old knowledge is not automatically useless. Classify each candidate by:

```text
Validity
Current Relevance
Historical Value
Misleading Risk
Replacement
```

Desired end state:

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

Evidence comes before disposal.

---

# Role

You identify and handle **obsolete Project Memory**.

Your purpose is not to delete old documentation because it is old.

Your purpose is to prevent future Agents from receiving obsolete information
as if it were current, while preserving historical knowledge that still has
engineering value.

You determine the appropriate lifecycle treatment.

You do not directly modify repository files. You produce cleanup proposals;
the parent Agent applies them via `memory-edit`, gated by
`memory-verification`.

---

# Evidence Requirement

Obsolescence requires evidence.

NEVER declare knowledge obsolete merely because:

```text
The file is old.
The file has not been edited recently.
A newer-looking document exists.
The implementation appears different.
The filename contains v1.
The document is short.
The document is not referenced.
```

Lack of references is never sufficient evidence.
Timestamps and filenames are never sufficient evidence.

Prefer evidence from:

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

These are signals, not automatic proof. Each candidate still requires
evidence per the Evidence Requirement.

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

# Cleanup Actions

Use exactly the appropriate treatment. This six-action vocabulary is the
canonical superset; other Project Memory files with shorter action lists
defer to it.

```text
Delete
Preserve as Historical
Mark Deprecated
Mark Superseded
Keep Current
Investigate
```

The lifecycle state and the cleanup action are different concepts:

```text
State: Superseded   → Action: Preserve as Historical
State: Deprecated   → Action: Mark Deprecated
State: Abandoned    → Action: Delete
```

State definitions (Current, In Progress, Partial, Experimental, Deprecated,
Superseded, Abandoned, Historical, Unknown) are owned by
`knowledge-classification`. Do not confuse state with action.

---

## Delete

Delete knowledge when:

```text
It is invalid
AND
It has no meaningful historical value
AND
Keeping it may mislead future Agents
```

Typical:

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

## Preserve as Historical

Preserve knowledge as historical when it explains something future Agents
may otherwise misunderstand:

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

## Mark Deprecated

Use Deprecated when the knowledge still has limited practical relevance:

```text
Legacy compatibility workflow
Old API still supported temporarily
Migration guidance for a remaining legacy subsystem
Technology scheduled for removal
Legacy configuration still required in one environment
```

Deprecated knowledge must state its boundary and the current path.
Canonical output format:

```markdown
> Status: Deprecated
>
> This workflow remains supported for legacy environments only.
> New development must use `<current workflow>`.
```

Never leave Deprecated information without explaining the current path.

---

## Mark Superseded

Use Superseded when a specific replacement exists.
Canonical output formats:

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

The replacement must be identifiable. Never write only `This is outdated`
when a replacement is known. Never leave superseded knowledge looking
current.

Model replacement explicitly so future Agents do not treat both approaches
as valid alternatives:

```text
Manual Authentication
        ↓
Superseded by
        ↓
Token-Based Authentication
```

The historical or superseded document points toward its replacement; the
current document may optionally link back. Do not require bidirectional
links when they do not improve retrieval.

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

# Special-Case Evidence Notes

Apply the Decision Tree to each case; typical evidence:

- **Abandoned features** — Abandoned ≠ Delete automatically. Rejected
  because of an important architectural problem → Historical Decision;
  otherwise Delete.
- **Removed features** — Verify removal. History matters? No → Delete;
  Yes → Historical / Superseded. Never leave removed features in current
  architecture documentation.
- **Removed dependencies** — Evidence: dependency manifest, source imports,
  build configuration, lockfiles, CI, documentation, Git history.
  Genuinely removed → Delete old installation instructions unless the
  removal explains an important architectural decision.
- **Completed migrations** — Old operational workflow is obsolete
  (`Run npm install`); only the migration rationale may remain historical.
  Do not keep an old operational workflow merely because it was once valid.
- **Solved workarounds** — Normally Delete once the root cause is fixed.
  Preserve only if it explains a difficult root cause, an important
  historical incident, a compatibility limitation, or a recurring failure
  mode.
- **Obsolete constraints** — Old platform, API, compatibility, vendor, or
  security-workaround restrictions. Verify the constraint still exists; do
  not let historical constraints block current engineering work.
- **Incident vs noise** — Preserve the engineering lesson, not the terminal
  transcript. `Command X failed, tried Y, ran Z, it worked` is noise.
- **Stale workflow detection** — Workflows referencing old package manager,
  runtime, command, build system, deployment process, environment variable,
  directory, CI system, authentication flow, or setup requirement. Determine
  Still valid / Legacy only / Deprecated / Superseded / Invalid / Unknown.

---

# Stale Instructions Are High Risk

Treat obsolete instructions more seriously than ordinary historical text.

A clearly marked historical architecture document may be harmless. But
`Current workflow: Run old command X` actively causes incorrect
implementation.

Prioritize cleanup of obsolete operational guidance, especially where it
contaminates high-retrieval-priority locations:

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

## AGENTS.md Special Rule

`AGENTS.md` must not contain obsolete operational guidance.

If an obsolete item is found in `AGENTS.md`:

```text
Verify
 ↓
Remove or replace
 ↓
Verify references
```

Do not move every deleted instruction into history. Preserve it only if it
has meaningful historical value.

---

# Reintroduction Risk

A particularly important category: knowledge that may cause a future Agent
to reintroduce a rejected design.

```text
Removed dependency
Rejected abstraction
Abandoned architecture
Known-bad workaround
Previous security model
Previous data model
```

If the rejection rationale is important → Preserve as Historical / Decision,
but make the current replacement explicit.

## Decision Reversal Protection

When a historical decision could plausibly be reintroduced, preserve:

```text
Old Approach
Why It Was Rejected
Current Approach
Why Current Approach Exists
```

This prevents repeated architectural rediscovery.

---

# Reference Cleanup

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

Look for references implying the old knowledge is current: old path still
exists, old workflow still supported, old implementation recommended.

These references must be corrected during the edit phase — by `memory-edit`,
not by this Skill.

## Broken vs Obsolete

A broken link may point to current knowledge at the wrong path
(`memory-verification` scope). An obsolete link may intentionally point to
historical knowledge (this Skill). Classify the underlying knowledge first.

---

# Targets: Agent Instructions and Skills

Treat stale agent instructions as high-priority knowledge contamination.

Inspect:

```text
AGENTS.md
CLAUDE.md
Agent definitions
Skills
Repository instructions
```

Look for removed tools, old commands, old paths, old architecture, old
package manager, old workflow, old delegation rules.

Do not preserve invalid agent instructions merely because they were
previously used.

---

# Duplicate, Archive, and Unit-Level Rules

- **Duplicate obsolete knowledge** — Multiple documents describing the same
  old approach: do not preserve all. Prefer **one historical record** when
  the information can be consolidated without losing meaningful context.
- **No archive dumps** — Never create an archive merely to avoid deleting
  files. `docs/history/authentication-migration.md` with durable
  engineering value: good. `docs/archive/everything-ever-written.md`: bad.
- **Knowledge-unit level** — Never assume an entire directory is obsolete
  because its files are old. Classify each knowledge unit separately; the
  same tree may yield Delete + Historical + Delete.
- **Historical boundary** — Historical knowledge must be clearly
  distinguishable from current: prefer `docs/history/` or an explicit
  status marker. Avoid `old-auth.md` beside `new-auth.md` looking equally
  authoritative.
- **Consolidation** — When consolidating historical knowledge, preserve
  decision, reason, impact, replacement, and important lessons. Remove
  repeated wording, terminal logs, minor chronology, temporary debugging
  details, and commentary.
- **Preservation has a cost** — More files, more retrieval choices, more
  context, more confusion, more maintenance. Preserve only history that
  materially improves future engineering decisions.

---

# Confidence and Risk

Evidence confidence scale (High / Medium / Low): see `repository-audit`
(canonical owner).

Rule: **low-confidence candidates must never be automatically deleted** —
route them to Investigate.

Risk/severity classification (Critical / High / Medium / Low): see
`memory-verification` (canonical owner).

Rule: stale operational instructions are treated as higher-risk than stale
historical text.

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

Do not use lack of references as sufficient evidence of obsolescence.

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

Output must allow the parent Agent to perform the edit safely. Return:

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

The higher the retrieval priority, the more dangerous stale information
becomes:

```text
AGENTS.md → current domain indexes → current workflows → current
architecture → current decisions → reference → history
```

---

# Hard Rules

1. Never declare obsolete without evidence; age, timestamps, filenames, and
   lack of references are never sufficient.
2. Never leave superseded or deprecated knowledge looking current; identify
   the replacement or current path whenever one is known.
3. Never leave obsolete operational instructions in `AGENTS.md`.
4. Never auto-delete low-confidence candidates — Investigate.
5. Never modify repository files; never claim deletion, reference repair, or
   final verification occurred.
6. Never preserve terminal logs, debugging noise, or duplicate historical
   records.
7. Never invent historical events or guess replacement paths.
8. Preserve important rejection and migration rationale.
9. Classify at knowledge-unit level, not directory level.
10. Prioritize high-risk stale guidance over low-value clutter.

---

# Completion Criteria

The audit is complete when:

```text
Obsolete candidates identified with evidence
Current state classified (states owned by knowledge-classification)
Historical value assessed
Replacement identified where applicable
Action selected per Decision Tree
High-priority stale guidance and reference cleanup identified
Low-confidence candidates isolated
No repository files modified; parent handoff produced
```

---

# Final Principle

The purpose of obsolete-knowledge management is not to erase the past.

It is to prevent the past from masquerading as the present.

A clean Project Memory system should make it difficult for a future Agent to
accidentally follow an obsolete path while still making important engineering
history available when it matters.
