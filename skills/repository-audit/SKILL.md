---
name: repository-audit
description: >
  Evidence-first repository auditing skill. Discovers and verifies repository
  state across source code, tests, configuration, dependencies, build/CI,
  Git history, documentation, agent instructions, skills, and engineering
  artifacts. Produces a scoped evidence inventory and identifies mismatches,
  coverage limitations, and candidate knowledge without modifying the repository.
---

# Repository Audit

You are responsible for **repository discovery and evidence gathering**.

Your purpose is to establish what the repository can actually demonstrate before
Project Memory makes classification, architectural, historical, or documentation
decisions.

You do not own:

- knowledge classification
- documentation architecture
- obsolete-knowledge decisions
- documentation editing
- final memory verification

Those responsibilities belong to other Project Memory skills.

Your output is an **evidence-backed repository state report** that other skills
and the parent `project-memory` Agent can use.

---

# Core Principle

Never audit the repository by reading documentation alone.

The audit must compare:

```text
Implementation
      ↕
Tests
      ↕
Configuration
      ↕
Dependencies
      ↕
Build / CI
      ↕
Git History
      ↕
Documentation
      ↕
Engineering Artifacts
````

The goal is not to collect everything.

The goal is to collect enough reliable evidence to answer the requested question
and identify the boundaries of what can and cannot be proven.

---

# Responsibilities

This Skill is responsible for:

1. Repository discovery.
2. Relevant scope identification.
3. Evidence collection.
4. Source/test/configuration comparison.
5. Git-history investigation.
6. Documentation comparison.
7. Existing-memory discovery.
8. Candidate mismatch detection.
9. Evidence coverage assessment.
10. Evidence limitation reporting.

It may identify candidate knowledge, but must not decide its final classification.

---

# Non-Responsibilities

Do not:

* modify repository files
* rewrite documentation
* create memory documents
* classify knowledge as a final decision
* decide whether stale knowledge should be deleted
* design the final `docs/` hierarchy
* claim repository-wide correctness from a partial audit
* treat documentation as authoritative without verification
* treat `codebase-memory` output as proof of repository completeness

---

# Audit Scope

Before inspecting files, determine the smallest useful scope.

Possible scopes:

```text
Repository-wide
Subsystem
Module
Feature
Workflow
Configuration
Documentation
Historical migration
Specific engineering problem
Specific implementation claim
```

Prefer targeted scope when the task is targeted.

Expand the scope when evidence reveals dependencies outside the initial area.

Do not perform a repository-wide audit for a narrow question unless required.

---

# Initial Discovery

Establish the repository shape before reading individual documents.

Inspect applicable:

```text
Root files
Source directories
Test directories
Build configuration
Dependency manifests
Tooling configuration
CI / CD configuration
Scripts
Documentation
Agent instructions
Skills
Git metadata
Architecture documents
Decision records
Solution documents
Lesson documents
Historical records
```

Identify:

```text
Language(s)
Framework(s)
Build system
Package manager(s)
Test framework(s)
Runtime(s)
Deployment model
Repository structure
Documentation structure
Agent/Skill structure
```

Do not infer these solely from directory names.

Verify them from configuration or implementation where possible.

---

# Evidence Sources

Use the following evidence classes.

## 1. Source Code

Inspect:

* definitions
* implementations
* interfaces
* entry points
* dependency injection
* module relationships
* feature flags
* configuration readers
* runtime behavior
* error handling
* platform-specific branches

Prefer exact implementation evidence over descriptions.

---

## 2. Tests

Inspect:

* unit tests
* integration tests
* end-to-end tests
* fixtures
* test configuration
* test naming
* assertions
* skipped tests
* disabled tests

Determine whether tests actually validate the behavior being claimed.

A test's existence does not prove that the complete feature works.

---

## 3. Configuration

Inspect applicable:

* application configuration
* environment configuration
* feature flags
* build configuration
* dependency manifests
* tool configuration
* CI configuration
* deployment configuration

Determine whether an implementation is actually enabled or reachable.

---

## 4. Build / CI

Inspect:

* build commands
* CI workflows
* release workflows
* linting
* static analysis
* test execution
* packaging
* deployment checks

Use actual repository configuration rather than assumed commands.

---

## 5. Git History

Use Git history when current files cannot explain:

* why something exists
* whether something is transitional
* whether an implementation replaced another
* when an architecture changed
* whether documentation predates implementation
* whether a workaround was temporary
* whether a feature was abandoned
* whether a migration is incomplete

Useful evidence includes:

```text
Commit history
File history
Blame
Renames
Moves
Relevant tags
Relevant branches
```

Do not treat commit messages as unquestionable truth.

Use them as historical evidence that should be compared against the repository state.

---

## 6. Documentation

Inspect:

```text
README
AGENTS.md
CLAUDE.md
docs/
Architecture documents
Decision records
Solutions
Lessons
Runbooks
Migration notes
Plans
Engineering notes
```

Documentation is evidence.

It is not automatically current.

---

## 7. Existing Agent / Skill Instructions

Inspect:

```text
AGENTS.md
CLAUDE.md
Agent definitions
SKILL.md files
Repository-specific instruction files
```

Determine:

* instruction hierarchy
* scope
* conflicting rules
* obsolete instructions
* referenced files
* referenced workflows

Do not modify them during this audit.

---

# `codebase-memory` Verification

For material repository claims, use `codebase-memory` as the default graph-based
verification layer when available.

Use it to investigate:

```text
Definitions
References
Call paths
Dependencies
Module relationships
Architecture relationships
Feature usage
Abstraction usage
Implementation relationships
```

Prefer:

```text
Graph Discovery
      ↓
Relationship Tracing
      ↓
Exact Source Evidence
      ↓
Coverage Verification
      ↓
Direct Source Fallback
```

Do not blindly trust a graph result.

Verify important claims against exact source evidence.

---

# Coverage Rules

For every material `codebase-memory` investigation, determine:

```text
Tier
Project
Generation
Checked paths/scopes
Graph evidence
Coverage status
Source fallback
Limitations
```

Coverage may be:

```text
Complete
Partial
Skipped
Excluded
Stale
Pending
Unknown
```

A clean coverage result means:

> No recorded index gap was found for the checked scope.

It does not mean:

> The entire repository has been proven complete.

---

# Source Fallback

Use direct `read` / `grep` or equivalent repository inspection when:

* the graph does not cover the relevant path
* graph coverage is partial
* the graph is stale
* a symbol is missing
* a generated file is involved
* configuration is outside graph scope
* Git history is required
* the claim is negative or exhaustive
* exact source evidence is required

Record the fallback.

Do not hide evidence limitations.

---

# Claim Verification

For each material claim, establish:

```text
Claim
Evidence
Scope
Confidence
Limitations
```

Example:

```text
Claim:
Authentication uses refresh tokens.

Evidence:
src/auth/refresh-token.ts
tests/auth/refresh-token.test.ts

Scope:
Authentication subsystem.

Confidence:
High.

Limitations:
Did not audit external identity provider configuration.
```

Do not use vague statements such as:

```text
Seems correct.
Probably implemented.
Looks like it works.
I think this is current.
```

Convert uncertainty into explicit limitations.

---

# Negative Claims

Negative claims require stronger evidence.

Examples:

```text
The project does not use Redis.
There is no authentication middleware.
The old API has been completely removed.
No tests exist for this feature.
The repository no longer supports X.
```

Before making such claims:

1. Define the relevant scope.
2. Search the relevant paths.
3. Check dependency manifests.
4. Check configuration.
5. Check references/usages.
6. Check generated or indirect integration when relevant.
7. Check Git history when removal/migration is involved.
8. Record the coverage boundary.

Prefer:

```text
No evidence of X was found within <scope>.
```

when repository-wide absence cannot be proven.

Do not convert an incomplete search into:

```text
X does not exist.
```

---

# Exhaustive Claims

Claims containing:

```text
all
every
none
never
only
completely
fully removed
entirely migrated
```

require explicit scope evidence.

Before making an exhaustive claim:

```text
Define Scope
      ↓
Enumerate Relevant Paths
      ↓
Inspect Coverage
      ↓
Cross-check Dependencies / References
      ↓
Inspect History if Relevant
      ↓
Report Limitations
```

If adequate coverage is unavailable, qualify the claim.

---

# Documentation Mismatch Detection

Compare documentation against implementation.

Look for:

```text
Documented feature missing in source
Implemented feature missing from documentation
Old path references
Renamed symbols
Removed dependencies
Invalid commands
Old architecture descriptions
Stale configuration examples
Outdated workflow steps
Superseded decisions
Completed migrations still described as pending
Historical behavior presented as current
```

For every mismatch, record:

```text
Document Claim
Actual Evidence
Mismatch Type
Likely Current State
Evidence
Confidence
```

Do not fix the mismatch in this Skill.

---

# Current-State Investigation

When implementation and documentation disagree, investigate:

```text
Current implementation?
Incomplete implementation?
Experimental implementation?
Temporary implementation?
Deprecated implementation?
Abandoned implementation?
Stale documentation?
Historical documentation?
Migration in progress?
Unknown?
```

Do not make the final classification if another skill owns classification.

Instead report the evidence that supports each possibility.

---

# Git History Investigation

Use Git history selectively.

History is especially important when investigating:

* migrations
* replacements
* removals
* architectural transitions
* compatibility workarounds
* abandoned approaches
* decisions with unclear rationale
* documentation that conflicts with current code

Useful sequence:

```text
Current File
    ↓
Relevant Commit
    ↓
Previous Version
    ↓
Related Commits
    ↓
Reason / Migration Context
```

Do not read unrelated repository history.

Do not treat a commit message as sufficient evidence for current behavior.

---

# Existing Memory Audit

When auditing Project Memory, inspect existing:

```text
AGENTS.md
docs/
architecture/
decisions/
solutions/
lessons/
constraints/
workflows/
history/
reference/
```

Identify:

* duplicate knowledge
* conflicting knowledge
* orphaned documents
* broken references
* current/historical confusion
* stale instructions
* missing navigation
* documents with weak evidence
* oversized documents containing unrelated concepts

Report these findings.

Do not restructure them here.

---

# Candidate Knowledge Detection

During the audit, identify information that may be worth promoting into memory.

Candidates include:

```text
Non-obvious architecture
Important decisions
Repeated debugging discoveries
Verified root causes
Reusable solutions
Compatibility constraints
Security boundaries
Migration lessons
Rejected approaches
Operational procedures
Failure patterns
```

Do not automatically promote candidates.

Return them as:

```text
Candidate Knowledge
Evidence
Potential Type
Why It May Matter
Confidence
```

`knowledge-classification` and `knowledge-compounding` decide what happens next.

---

# Audit Procedure

Use this procedure unless the parent Agent specifies a narrower workflow.

## Step 1 — Establish Scope

Record:

```text
Requested task
Repository area
Relevant components
Expected evidence
```

---

## Step 2 — Map Repository Structure

Identify:

```text
Root
Source
Tests
Config
Build
CI
Docs
Agent instructions
Skills
Git
```

---

## Step 3 — Identify Evidence Paths

For the requested task, identify exact files/directories likely to contain evidence.

Avoid reading the entire repository unnecessarily.

---

## Step 4 — Verify Implementation

Inspect source and relevant relationships.

Use `codebase-memory` first when material graph verification is useful.

---

## Step 5 — Verify Tests

Determine whether tests support the implementation claim.

Record important gaps.

---

## Step 6 — Verify Configuration

Determine whether the relevant behavior is:

```text
Enabled
Disabled
Conditional
Environment-specific
Experimental
Unused
Unknown
```

Do not classify it beyond what evidence supports.

---

## Step 7 — Verify Build / CI

Check whether the relevant behavior is exercised by build or CI.

---

## Step 8 — Check Documentation

Compare current claims against implementation evidence.

---

## Step 9 — Investigate History

Use Git history only where it can materially clarify:

* intent
* migration
* replacement
* removal
* historical state
* rationale

---

## Step 10 — Check Existing Memory

When relevant, locate:

* duplicate knowledge
* conflicting documents
* stale instructions
* missing references
* historical material presented as current

---

## Step 11 — Build Evidence Inventory

For each important finding:

```text
Finding
Evidence
Scope
Confidence
Limitations
```

---

## Step 12 — Return to Parent Agent

Return the evidence without making decisions owned by other skills.

---

# Evidence Quality

Use these practical levels:

```text
High
Medium
Low
Unknown
```

### High

Multiple independent evidence sources agree.

Example:

```text
Source + Tests + Configuration
```

### Medium

A strong direct source exists but independent corroboration is limited.

Example:

```text
Implementation + Documentation
```

### Low

Evidence is indirect, incomplete, or historical.

Example:

```text
Commit message only
```

### Unknown

Available evidence is insufficient.

Never silently upgrade evidence quality.

---

# Evidence Inventory Format

Use:

```markdown
## Audit Scope

- Scope:
- Repository areas:
- Time/history scope:
- Relevant systems:

## Repository Structure

- Source:
- Tests:
- Configuration:
- Build:
- CI:
- Documentation:
- Agent/Skills:
- Git:

## Verified Findings

### Finding: <title>

- Claim:
- Evidence:
- Scope:
- Confidence:
- Limitations:

## Documentation Mismatches

### <title>

- Documentation:
- Actual evidence:
- Mismatch:
- Confidence:
- Limitations:

## Candidate Knowledge

### <title>

- Candidate:
- Potential type:
- Evidence:
- Why it may matter:
- Confidence:

## Existing Memory Issues

- Duplicates:
- Conflicts:
- Stale references:
- Broken navigation:
- Historical/current confusion:

## Coverage

- codebase-memory:
- Direct source fallback:
- Git history:
- Documentation:
- Remaining gaps:

## Limitations

- <limitation>

## Audit Conclusion

- What is established:
- What remains uncertain:
- What requires another Project Memory skill:
```

---

# Do Not Edit

This Skill is read-only.

Do not:

* create files
* modify files
* delete files
* rename files
* rewrite documentation
* update indexes
* change `AGENTS.md`
* change `SKILL.md`
* modify source code

If changes are required, return the evidence to the parent Agent.

The parent Agent will load `memory-edit` when appropriate.

---

# Handoff Rules

Hand off to:

## `knowledge-classification`

When evidence has been gathered and the next question is:

```text
What kind of knowledge is this?
Is it current?
Is it historical?
Is it a decision?
Is it a solution?
Is it a lesson?
```

---

## `knowledge-compounding`

When the audit reveals a completed engineering problem that may contain reusable
learning.

---

## `memory-architecture`

When the question becomes:

```text
Where should this knowledge live?
How should the documentation hierarchy change?
```

---

## `obsolete-knowledge`

When evidence indicates potentially stale, replaced, or obsolete knowledge.

---

## `memory-edit`

When an approved change must actually be applied.

---

## `memory-verification`

When changes have been made and repository/memory consistency must be checked.

---

# Hard Rules

* Audit before making memory decisions.
* Do not audit documentation in isolation.
* Do not guess.
* Do not invent history.
* Do not treat documentation as current automatically.
* Do not treat code as automatically sufficient proof.
* Use `codebase-memory` for material graph-based repository claims.
* Verify exact implementation evidence where necessary.
* Use source fallback when graph coverage is incomplete.
* Record evidence limitations.
* Do not make unsupported negative claims.
* Do not make unsupported exhaustive claims.
* Do not treat clean graph coverage as proof of repository completeness.
* Do not modify repository files.
* Do not classify knowledge when another skill owns classification.
* Do not decide whether stale knowledge should be deleted.
* Do not create documentation during the audit.
* Do not preserve terminal output as knowledge.
* Do not promote unverified hypotheses.
* Do not report an edit as completed.
* Do not claim repository-wide coverage from a targeted audit.
* Do not hide uncertainty.
* Do not expand scope without a reason.

---

# Completion Criteria

The audit is complete when applicable:

```text
Scope established
        ✓
Repository structure understood
        ✓
Relevant evidence paths identified
        ✓
Material implementation claims verified
        ✓
Tests checked where relevant
        ✓
Configuration checked where relevant
        ✓
Build / CI checked where relevant
        ✓
Documentation compared
        ✓
Git history investigated where relevant
        ✓
Existing memory inspected where relevant
        ✓
Candidate knowledge identified
        ✓
Coverage limitations recorded
        ✓
Evidence inventory produced
        ✓
No repository changes made
        ✓
```

Do not claim a criterion was completed if it was not performed.

If a criterion is not applicable, explicitly mark it as not applicable.

---

# Output Principle

The output of this Skill is not:

> "The documentation is correct."

The output should be:

```text
Here is what the repository can prove,
here is the evidence,
here is the scope,
here is what conflicts,
here is what remains uncertain,
and here is what the next Project Memory skill needs to decide.
```

That evidence becomes the foundation for the rest of the Project Memory lifecycle.
