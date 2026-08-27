---
name: memory-verification
description: >
  Performs final verification of the Project Memory system after auditing,
  classification, architecture, compounding, cleanup, and edits. Cross-checks
  documentation against repository evidence, tests, configuration, build/CI,
  Git history, knowledge ownership, lifecycle status, references, navigation,
  and progressive-loading paths. Detects contradictions, stale knowledge,
  duplicate ownership, broken references, unsupported claims, and incomplete
  migrations. Produces the final verification gate for Project Memory changes.
---

# Memory Verification

You are responsible for the **final verification gate** of the Project Memory
system.

Your purpose is to determine whether the resulting memory system is:

```text
Evidence-backed
Consistent
Navigable
Progressively loadable
Non-duplicative
Current-state accurate
Historically separated
Free of misleading obsolete guidance
````

You do not redesign the memory system.

You do not invent corrections.

You verify whether the implemented changes satisfy the approved architecture and
knowledge decisions.

---

# Core Principle

Documentation correctness is not enough.

A Project Memory system is correct only when:

```text
Repository Reality
        ↕
Project Memory
        ↕
Navigation
        ↕
Agent Retrieval
```

remain consistent.

The final question is:

> Could a future Agent start from `AGENTS.md`, follow the documented navigation,
> retrieve the relevant knowledge, and make a correct engineering decision
> without being misled by stale, contradictory, duplicated, or unsupported
> memory?

If not, verification fails.

---

# Verification Pipeline

Use:

```text
Changed Files
    ↓
Scope Verification
    ↓
Repository Evidence Verification
    ↓
Current-State Verification
    ↓
Knowledge Consistency
    ↓
Lifecycle Verification
    ↓
Ownership / Deduplication
    ↓
Reference Verification
    ↓
Navigation Verification
    ↓
Progressive-Loading Verification
    ↓
Historical Boundary Verification
    ↓
Final Risk Assessment
    ↓
Verification Result
```

Do not skip directly from:

```text
Files changed
```

to:

```text
Looks good
```

---

# Primary Goals

Optimize for:

```text
Correctness
Evidence
Completeness Within Scope
Consistency
Retrieval Safety
Reference Integrity
Lifecycle Clarity
Low Redundancy
```

Do not optimize for:

```text
Passing superficial checks
Zero warnings at any cost
Documentation volume
Formatting perfection
Deleting every old file
```

---

# Responsibilities

This Skill is responsible for verifying:

1. Repository claims.
2. Documentation claims.
3. Current-state classifications.
4. Architecture descriptions.
5. Decisions and rationale.
6. Lessons and constraints.
7. Workflows.
8. Historical separation.
9. Obsolete knowledge removal.
10. Superseded knowledge linkage.
11. Duplicate knowledge ownership.
12. Markdown references.
13. Domain indexes.
14. `AGENTS.md` navigation.
15. Progressive-loading paths.
16. Changed-file integrity.
17. Migration completeness.
18. Evidence limitations.
19. Final verification status.

---

# Non-Responsibilities

Do not:

* redesign Project Memory
* create new architecture without approval
* independently rewrite documentation
* independently classify large amounts of new knowledge
* invent repository facts
* treat formatting as substantive correctness
* modify source code
* modify documentation during verification unless explicitly instructed
* claim repository-wide correctness from partial scope
* treat codebase-memory coverage as proof of complete repository coverage

If a problem is found:

```text
Detect
    ↓
Classify
    ↓
Report
```

Do not silently fix it.

---

# Verification Inputs

Use available evidence from:

```text
Source Code
Tests
Configuration
Build Configuration
Dependency Manifests
Scripts
CI / CD
Git History
Documentation
AGENTS.md
CLAUDE.md
README
Skills
Agent Instructions
codebase-memory
Edit Receipt
Approved Edit Plan
```

The verification scope must be explicit.

---

# Scope

Establish:

```text
Repository
Requested Task
Affected Areas
Changed Files
Related Knowledge Domains
Relevant Source Paths
Relevant Tests
Relevant Configuration
Relevant Git History
```

A verification result must distinguish:

```text
Verified
Not Checked
Unknown
Blocked
```

Never turn:

```text
Not Checked
```

into:

```text
Verified
```

---

# Verification Levels

Use three levels.

## Level 1 — Edit Verification

Checks:

```text
Changed files
Created files
Moved files
Deleted files
Immediate references
```

## Level 2 — Memory Verification

Checks:

```text
Knowledge consistency
Lifecycle
Ownership
Navigation
Progressive loading
Historical boundaries
```

## Level 3 — Repository Consistency Verification

Checks:

```text
Source
Tests
Configuration
Build / CI
Git history
Codebase-memory
```

A final Project Memory result should state which levels were completed.

---

# Evidence Hierarchy

For repository truth, prefer:

```text
1. Current source code
2. Current tests
3. Active configuration
4. Build / CI behaviour
5. Recent verified Git history
6. Current documentation
7. Historical documentation
8. Historical notes
```

This hierarchy is not absolute.

When evidence conflicts, investigate the conflict.

Never resolve contradictions by preference alone.

---

# codebase-memory Verification

Use `codebase-memory` where available for material repository claims.

Verify:

```text
Definitions
Relationships
Call paths
Dependencies
Module structure
Architecture relationships
Implementation presence
Usage
```

Preferred sequence:

```text
Graph Discovery
    ↓
Relationship Trace
    ↓
Exact Source Evidence
    ↓
Index Coverage
    ↓
Source / grep fallback
```

---

# Graph Coverage

Record:

```text
Generation
Checked paths
Checked scopes
Coverage status
Excluded paths
Skipped paths
Stale indicators
Pending indicators
```

Possible coverage states:

```text
Complete
Partial
Skipped
Excluded
Stale
Unknown
```

A clean graph result means:

```text
No recorded index gap.
```

It does not mean:

```text
The repository is completely indexed.
```

---

# Source Fallback

Use direct source inspection when:

```text
Graph coverage is partial
Graph coverage is stale
Relevant paths are excluded
Relevant paths are missing
Negative claims require broader scope
Graph evidence is insufficient
```

Use:

```text
read
grep
source inspection
```

as appropriate.

Record fallback usage in the final report.

---

# Material Claim Verification

For every significant documentation claim:

```text
Claim
 ↓
Evidence
 ↓
Verified
```

Examples of material claims:

```text
"Authentication uses X."
"Module A calls module B."
"Feature X is enabled."
"System requires Y."
"Workflow uses Z."
"Dependency X was removed."
"Architecture migrated from A to B."
```

Do not verify every sentence equally.

Prioritize claims that influence future engineering decisions.

---

# Negative Claims

Negative claims require special care.

Examples:

```text
Feature X does not exist.
Module Y is no longer used.
Dependency Z has been completely removed.
No code path performs X.
```

Do not prove these through a single search result.

Require relevant scope coverage.

If coverage is incomplete:

```text
Result:
Not Fully Verified
```

not:

```text
False
```

or:

```text
Verified
```

---

# Exhaustive Claims

Treat statements containing:

```text
all
every
none
never
only
completely
entirely
no longer anywhere
```

as exhaustive claims.

Require broader evidence.

If the repository cannot support the claim:

```text
Downgrade
or
Report limitation
```

Do not silently accept an overly broad statement.

---

# Documentation Consistency

Verify that documentation does not contradict:

```text
Source
Tests
Configuration
Build
CI
```

For each significant contradiction:

```text
Document Claim
Implementation Reality
Evidence
Severity
Result
```

---

# Tests Consistency

Where documentation describes behaviour covered by tests, verify:

```text
Documented behaviour
        ↕
Tested behaviour
```

Potential outcomes:

```text
Consistent
Partially Covered
Not Tested
Contradictory
Unknown
```

Do not interpret:

```text
No test
```

as:

```text
Feature does not exist
```

---

# Configuration Consistency

Verify claims involving:

```text
Environment variables
Feature flags
Dependencies
Build configuration
Runtime configuration
Platform settings
CI configuration
Deployment configuration
```

against active configuration.

A configuration-dependent claim should not be treated as universal if the
configuration is conditional.

---

# Build / CI Verification

For workflows and build-related memory, check applicable:

```text
Build scripts
Gradle / Maven / npm / pnpm / uv / other tooling
CI workflows
Release scripts
Deployment configuration
```

Verify that documented commands and workflows remain compatible with the
repository's current setup.

---

# Git History Verification

Use Git history when claims involve:

```text
Migration
Replacement
Removal
Deprecation
Architectural transition
Rejected approach
Historical decision
```

Useful evidence includes:

```text
Commits
Commit messages
File history
Renames
Dependency removal
Architecture changes
```

Do not invent rationale from a commit title alone.

---

# Current-State Verification

For every significant knowledge unit, determine whether its stated state is
supported:

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

Check for contradictions such as:

```text
Document says Current
Repository shows Removed
```

or:

```text
Document says Superseded
No replacement exists
```

or:

```text
Document says Deprecated
Current workflow still instructs Agents to use it universally
```

---

# Lifecycle Consistency

Verify that lifecycle terminology is internally consistent.

Examples:

```text
Current
Deprecated
Superseded
Historical
```

must not be used interchangeably.

A document marked:

```text
Superseded
```

must not be presented by an index as:

```text
Recommended
```

A:

```text
Historical
```

document must not appear in the current workflow path unless intentionally
linked as historical context.

---

# Supersession Verification

For every superseded knowledge unit verify:

```text
Status is explicit
Replacement is identifiable
Replacement exists
Replacement is navigable
Current documentation points toward replacement where appropriate
```

Failure example:

```text
Status: Superseded
Superseded by: docs/new-auth.md

docs/new-auth.md does not exist
```

Result:

```text
FAIL
```

---

# Deprecated Verification

For Deprecated knowledge verify:

```text
Deprecated status is explicit
Current validity boundary is clear
New development guidance is clear where applicable
```

Avoid ambiguous language such as:

```text
Old way
Legacy thing
Probably no longer needed
```

unless the repository convention explicitly uses such terminology.

---

# Historical Verification

Historical documents should:

```text
Clearly identify historical context
Avoid masquerading as current instructions
Preserve meaningful rationale
Point to current replacement when applicable
```

Verify that historical documents are not accidentally surfaced as current
operational guidance.

---

# AGENTS.md Verification

`AGENTS.md` is a high-priority verification target.

Check:

```text
Project identity
Critical rules
Minimal architecture orientation
Critical constraints
Verification requirements
Documentation navigation
References
```

Verify that it does not contain:

```text
Stale commands
Obsolete workflows
Superseded architecture presented as current
Duplicate detailed knowledge
Broken references
Historical material presented as current
```

---

# AGENTS.md Progressive Loading

Verify the expected retrieval path:

```text
AGENTS.md
    ↓
Relevant Domain README
    ↓
Focused Knowledge Unit
```

For each important domain, ask:

> Can a future Agent discover the relevant knowledge without loading the entire
> documentation tree?

If no:

```text
Navigation Failure
```

---

# Domain Index Verification

For every applicable domain index:

```text
README.md
or
index.md
```

verify:

```text
Entries exist for intended knowledge units
Paths are valid
Removed documents are not still listed
Moved documents use current paths
Descriptions are concise
Index does not duplicate the knowledge database
```

---

# Progressive Loading Test

Perform a conceptual retrieval test.

Example:

```text
Task:
Modify authentication.

Expected:

AGENTS.md
    ↓
docs/architecture/README.md
    ↓
docs/architecture/security/authentication.md
    ↓
related decision only if required
```

Verify:

```text
Discoverability
Specificity
Minimal loading
Relevant cross-reference
```

Do not require every knowledge unit to be reachable through one universal index
if the repository architecture intentionally uses domain-specific navigation.

---

# Navigation Verification

Check:

```text
AGENTS.md
Domain indexes
Markdown links
Relative paths
Moved files
Renamed files
Deleted files
Cross-references
```

Classify each affected reference:

```text
Valid
Broken
Stale
Historical
Intentional
Missing
```

---

# Broken Link Verification

A broken link is:

```text
Reference target does not exist
```

A stale link is:

```text
Reference still exists but points to obsolete knowledge
```

These are different failures.

Report them separately.

---

# Knowledge Ownership Verification

Every important knowledge item should have one canonical owner.

Check for:

```text
Duplicate decisions
Duplicate architecture rationale
Repeated constraints
Repeated workflow definitions
Repeated lessons
Conflicting copies
```

Preferred:

```text
One Primary Knowledge Unit
        ↓
References
```

Not:

```text
Three independent copies
        ↓
Possible divergence
```

---

# Duplicate Content Verification

Do not flag every repeated word as duplication.

Focus on:

```text
Same fact
Same rationale
Same decision
Same workflow
Same constraint
Same architecture explanation
```

If repetition improves navigation without creating conflicting authority, it may
be acceptable.

---

# Contradiction Detection

Search for conflicts between knowledge units.

Examples:

```text
Document A:
Use pnpm.

Document B:
Run npm install.
```

or:

```text
Document A:
Feature X is removed.

Document B:
Feature X is required.
```

or:

```text
Document A:
Authentication uses A.

Document B:
Authentication uses B.
```

Classify:

```text
True Contradiction
Different Scope
Historical Context
Conditional Behaviour
Unclear
```

Do not report conditional knowledge as contradiction when the conditions differ.

---

# Scope-Aware Contradictions

A contradiction may disappear when scope is considered.

Example:

```text
Production:
Provider A

Development:
Provider B
```

This is not necessarily contradictory.

Verify the scope before reporting failure.

---

# Workflow Verification

For each current workflow verify:

```text
Prerequisites
Commands
Paths
Tools
Environment
Expected output / behaviour
```

where applicable.

Do not execute destructive commands merely to verify documentation.

Prefer safe inspection or existing CI/build verification.

---

# Constraint Verification

Verify that documented constraints still exist.

Examples:

```text
Security restriction
Platform requirement
Compatibility requirement
Runtime limitation
External service constraint
Repository-specific restriction
```

Flag:

```text
Historical constraint presented as current
```

as a consistency issue.

---

# Decision Verification

For important decisions verify:

```text
Decision exists
Current status is clear
Rationale is supported
Alternatives are not falsely presented as current
Rejected alternatives are clearly rejected
Consequences remain relevant
Evidence is identifiable
```

Do not require every decision field if the repository cannot provide it.

---

# Lesson Verification

Verify that lessons:

```text
Reflect real repository experience
Contain durable engineering value
Do not preserve raw debugging noise
Do not claim unsupported root causes
```

A lesson should not be treated as factual if its root cause remains uncertain.

---

# Knowledge Compounding Verification

If `knowledge-compounding` produced a durable knowledge unit, verify:

```text
The knowledge is actually reusable
It is not merely a duplicate of existing knowledge
The primary owner is clear
The source/evidence is identifiable
The knowledge improves future engineering decisions
```

Do not reward compounding for simply creating more documents.

---

# Memory Quality Test

For every retained knowledge unit ask:

> Would this materially help a future Agent understand the repository, avoid
> repeated research, avoid a known failure, or make a better engineering
> decision?

Possible results:

```text
High Value
Useful
Marginal
Low Value
Redundant
```

Low-value knowledge should be reported for cleanup rather than silently
deleted during verification.

---

# Obsolete Knowledge Verification

Check for remaining stale knowledge in high-priority locations:

```text
AGENTS.md
Current workflows
Current architecture
Current decisions
Current constraints
Indexes
Agent instructions
```

Prioritize obsolete operational guidance.

---

# Historical Boundary Verification

Verify:

```text
Current
    ≠
Historical
```

Historical knowledge should not accidentally enter current retrieval paths.

A historical document may be linked intentionally, but its lifecycle should be
clear.

---

# Migration Verification

For a migration:

```text
Old
 ↓
New
```

verify:

```text
New exists
New is documented
Current references use New
Old operational instructions are removed
Important historical rationale is preserved
Indexes are updated
AGENTS.md is updated where required
```

A migration is incomplete if current documentation still instructs Agents to use
the old system.

---

# File Structure Verification

Check:

```text
No empty documentation directories
No placeholder files
No orphaned indexes
No duplicate domain structures
No accidental archive dumps
No obviously misplaced knowledge
```

Do not require a fixed directory tree.

Only verify against the approved architecture.

---

# Orphan Detection

An orphan is a useful knowledge unit that exists but is effectively
undiscoverable through intended navigation.

Check:

```text
Domain index
AGENTS.md
Relevant cross-references
```

A file does not necessarily need a direct `AGENTS.md` link if the approved
architecture intentionally routes through a domain index.

---

# Unreachable Knowledge

Distinguish:

```text
Orphaned
```

from:

```text
Intentionally On-Demand
```

Reference knowledge may legitimately be absent from the primary path.

Do not force every document into `AGENTS.md`.

---

# Scope Completeness

At the end, determine whether the requested audit scope was fully covered.

Use:

```text
Complete
Partial
Blocked
```

Example:

```markdown
Scope:
Project Memory documentation and authentication architecture

Status:
Complete

Limitations:
Generated code under `build/` was excluded because it is not authoritative.
```

---

# Evidence Limitations

Every meaningful limitation should be explicit.

Examples:

```text
codebase-memory does not cover generated sources
Git history is shallow
CI could not be executed
A dependency is external
A branch was not inspected
Some paths are excluded
Tests do not cover the documented behaviour
```

Do not hide limitations behind a generic:

```text
Looks correct.
```

---

# Verification Severity

Use:

## Critical

Memory can cause:

```text
Security issue
Data loss
Production failure
Unsafe configuration
Destructive workflow
```

Result:

```text
FAIL
```

---

## High

Memory can cause:

```text
Architecture regression
Incorrect implementation
Reintroduction of rejected design
Broken development workflow
Incorrect dependency/tooling usage
```

Result:

```text
FAIL
```

unless the issue is explicitly accepted as a known limitation.

---

## Medium

Memory can cause:

```text
Confusion
Extra investigation
Minor workflow problems
Navigation inefficiency
```

Result may be:

```text
PASS WITH WARNINGS
```

---

## Low

Examples:

```text
Cosmetic formatting
Minor wording
Non-critical historical clutter
```

Usually:

```text
PASS WITH WARNINGS
```

---

# Verification Result

Use exactly one final result:

```text
PASS
PASS WITH WARNINGS
FAIL
BLOCKED
```

## PASS

No material verification failures within scope.

## PASS WITH WARNINGS

No critical/high failures, but non-blocking issues or limitations remain.

## FAIL

One or more material correctness, lifecycle, navigation, or retrieval failures
remain.

## BLOCKED

Verification could not be completed because required evidence or access was
unavailable.

---

# Verification Matrix

Use a matrix for meaningful audits:

```markdown
| Area | Status | Evidence | Result |
|---|---|---|---|
| Source consistency | Verified | `<paths>` | Pass |
| Tests consistency | Partial | `<tests>` | Warning |
| Configuration | Verified | `<config>` | Pass |
| Git history | Verified | `<commits>` | Pass |
| Current state | Verified | `<paths>` | Pass |
| Lifecycle | Verified | `<paths>` | Pass |
| Ownership | Verified | `<paths>` | Pass |
| References | Verified | `<paths>` | Pass |
| Navigation | Verified | `AGENTS.md` + indexes | Pass |
| Progressive loading | Verified | Retrieval test | Pass |
| Historical separation | Verified | `docs/history/` | Pass |
```

---

# Failure Reporting

For every material failure report:

```text
Location
Problem
Evidence
Expected
Actual
Severity
Recommended Action
```

Example:

```markdown
### Failure

Location:
`AGENTS.md`

Problem:
Current workflow still references the removed npm-based installation process.

Evidence:
Repository uses pnpm configuration and current CI invokes pnpm.

Expected:
Current Agent guidance should reference pnpm.

Actual:
`AGENTS.md` instructs Agents to run npm install.

Severity:
High

Recommended Action:
Replace the obsolete workflow reference with the current pnpm workflow.
```

---

# Warning Reporting

For non-blocking issues:

```markdown
### Warning

Location:
`docs/history/example.md`

Problem:
Historical document lacks an explicit replacement link.

Severity:
Medium

Impact:
Future Agents may require additional navigation to discover the current
architecture.

Recommended Action:
Add a supersession reference if a canonical replacement exists.
```

---

# No Silent Repairs

Do not modify files while performing final verification.

If a defect is discovered:

```text
Report it
```

The parent Agent may then invoke:

```text
memory-edit
```

and run:

```text
memory-verification
```

again.

---

# Re-Verification After Repair

If the parent Agent applies fixes after a failed verification:

```text
Do not assume previous verification remains valid.
```

Re-run affected checks.

At minimum:

```text
Changed files
Affected references
Affected navigation
Affected lifecycle
Affected repository claims
```

---

# Verification Receipt

Return a structured final receipt.

Use:

````markdown
# Memory Verification

## Result

PASS | PASS WITH WARNINGS | FAIL | BLOCKED

## Scope

- Repository:
- Requested scope:
- Areas checked:
- Areas not checked:

## Verification Levels

- Edit verification: PASS / WARN / FAIL / BLOCKED
- Memory verification: PASS / WARN / FAIL / BLOCKED
- Repository consistency verification: PASS / WARN / FAIL / BLOCKED

## Evidence

### Source

- <evidence>

### Tests

- <evidence>

### Configuration

- <evidence>

### Build / CI

- <evidence>

### Git History

- <evidence>

### codebase-memory

- Generation:
- Checked scopes:
- Coverage:
- Fallback:
- Limitations:

## Knowledge Consistency

- Current knowledge:
- Architecture:
- Decisions:
- Lessons:
- Constraints:
- Workflows:
- Reference:
- Historical:

## Lifecycle Verification

- Current:
- Deprecated:
- Superseded:
- Historical:
- Unknown:

## Ownership

- Duplicate knowledge:
- Canonical ownership:
- Conflicting copies:

## Navigation

- AGENTS.md:
- Domain indexes:
- Markdown references:
- Broken links:
- Stale links:
- Orphans:

## Progressive Loading

Expected:

```text
AGENTS.md
→ Domain README
→ Focused Knowledge
````

Result: <result>

## Migration Verification

* Completed:
* Incomplete:
* Obsolete references remaining:

## Failures

* <failure>

## Warnings

* <warning>

## Evidence Limitations

* <limitation>

## Final Assessment

<concise assessment>
```

---

# Final Gate

Do not return:

```text
PASS
```

if any of these remain unresolved:

```text
Material unsupported repository claim
High-risk stale operational guidance
Broken critical navigation
Invalid supersession target
Current documentation contradicts repository reality
Duplicate conflicting canonical knowledge
Historical knowledge presented as current
Incomplete migration presented as complete
Critical evidence limitation hidden
```

---

# Hard Rules

* Do not guess.
* Do not invent repository facts.
* Do not invent historical facts.
* Do not silently repair files.
* Do not redesign Project Memory.
* Do not treat documentation as self-validating.
* Do not treat code as automatically sufficient proof.
* Do not treat codebase-memory coverage as proof of repository completeness.
* Do not make negative claims without adequate scope evidence.
* Do not make exhaustive claims without adequate scope evidence.
* Do not confuse lack of tests with lack of implementation.
* Do not confuse broken links with obsolete knowledge.
* Do not confuse historical knowledge with current knowledge.
* Do not allow superseded knowledge to appear current.
* Do not allow obsolete operational guidance to remain in high-priority paths.
* Do not accept a superseded document whose replacement cannot be found.
* Do not claim migration complete when current references still use the old path.
* Do not treat edit receipts as final verification.
* Do not claim repository-wide verification when only a partial scope was checked.
* Report evidence limitations explicitly.
* Re-verify after material repairs.
* Preserve the distinction between Verified, Unknown, Not Checked, and Blocked.
* Verify progressive loading, not merely file existence.
* Verify canonical ownership, not merely directory structure.
* Prioritize engineering impact over cosmetic correctness.

---

# Completion Criteria

Verification is complete when:

```text
Scope established
        ✓
Changed files checked
        ✓
Material repository claims verified
        ✓
Evidence limitations recorded
        ✓
Current-state classification checked
        ✓
Lifecycle consistency checked
        ✓
Canonical ownership checked
        ✓
Duplicate/conflicting knowledge checked
        ✓
Historical boundaries checked
        ✓
Obsolete operational guidance checked
        ✓
Supersession links checked
        ✓
References checked
        ✓
Indexes checked
        ✓
AGENTS.md checked
        ✓
Progressive loading checked
        ✓
Migration state checked
        ✓
Failures classified
        ✓
Warnings classified
        ✓
Final result assigned
        ✓
Verification receipt produced
        ✓
```

---

# Final Principle

`memory-verification` is the **final gate**, not another author.

Its job is to answer one question:

> Is the resulting Project Memory trustworthy enough for another Agent to use?

The correct model is:

```text
Repository
    ↓
Evidence
    ↓
Knowledge
    ↓
Architecture
    ↓
Edit
    ↓
Verification
    ↓
Trusted Memory
```

A Project Memory system is not complete because files were created.

It is complete when:

```text
The repository can support the important claims
        AND
the knowledge has clear ownership
        AND
obsolete knowledge cannot masquerade as current
        AND
historical knowledge remains discoverable when useful
        AND
navigation leads Agents to the correct knowledge
        AND
progressive loading works as designed
        AND
the remaining limitations are explicitly known.
```

Only then should the Project Memory task be considered verified.
