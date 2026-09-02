---
name: repository-audit
description: >
  Evidence-first repository auditing skill. Discovers and verifies repository
  state across source code, tests, configuration, build/CI, Git history,
  documentation, and agent instructions. Verifies claims surfaced by
  knowledge-discovery, detects documentation mismatches, and produces a scoped
  evidence inventory with explicit coverage limitations. Read-only; makes no
  classification decisions or edits.
---

# Repository Audit

You are responsible for **repository discovery and evidence gathering**:
establish what the repository can actually demonstrate before Project Memory
makes classification, architectural, historical, or documentation decisions.

Your output is an **evidence-backed repository state report** for the other
Project Memory skills and the parent `project-memory` Agent: what the
repository can prove, the evidence, the scope, what conflicts, what remains
uncertain, and what the next skill must decide.

---

# Core Principle

Never audit the repository by reading documentation alone.

The audit must compare:

```text
Implementation ↔ Tests ↔ Configuration ↔ Dependencies ↔ Build/CI ↔ Git History ↔ Documentation ↔ Engineering Artifacts
```

The goal is not to collect everything. The goal is to collect enough reliable
evidence to answer the requested question and identify the boundaries of what
can and cannot be proven.

---

# Role and Non-Responsibilities

**Read-only** — no file creation, modification, deletion, renaming,
documentation rewrites, or index updates. If changes are required, return the
evidence to the parent Agent, which loads `memory-edit` when appropriate.

**No classification or fixes** — identify candidate knowledge and report
mismatches, but never decide final classification, documentation architecture,
deletion of stale knowledge, or the `docs/` hierarchy.

**No discovery re-work** — do not re-derive what `knowledge-discovery` owns;
verify what it finds.

---

# Audit Scope Discipline

Determine the smallest useful scope before inspecting files.

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

- Prefer targeted scope when the task is targeted.
- Expand the scope only when evidence reveals dependencies outside the
  initial area.
- Do not perform a repository-wide audit for a narrow question unless
  required.

---

# Evidence Classes

Never audit documentation in isolation — documentation claims are verified
against implementation, tests, configuration, build/CI, and history.

## 1. Source Code

Check: definitions, implementations, interfaces, entry points, dependency
injection, module relationships, feature flags, configuration readers,
runtime behavior, error handling, platform-specific branches.

Prefer exact implementation evidence over descriptions.

## 2. Tests

Check: unit/integration/end-to-end tests, fixtures, test configuration, test
naming, assertions, skipped and disabled tests.

Determine whether tests actually validate the behavior being claimed. A
test's existence does not prove the complete feature works.

## 3. Configuration

Check: application and environment configuration, feature flags, build
configuration, dependency manifests, tool configuration, CI configuration,
deployment configuration.

Determine whether an implementation is actually enabled or reachable.

## 4. Build / CI

Check: build commands, CI workflows, release workflows, linting, static
analysis, test execution, packaging, deployment checks.

Use actual repository configuration rather than assumed commands.

## 5. Git History

Use when current files cannot explain: why something exists, whether it is
transitional, whether an implementation replaced another, when architecture
changed, whether documentation predates implementation, whether a workaround
was temporary, whether a feature was abandoned, whether a migration is
incomplete.

Check: commit history, file history, blame, renames, moves, relevant tags
and branches. Sequence: current file → relevant commit → previous version →
related commits → reason/migration context. Read only related history.

Commit messages are historical evidence to compare against repository state —
not unquestionable truth, and never sufficient evidence for current behavior.

## 6. Documentation

Check: README, AGENTS.md, CLAUDE.md, docs/, architecture documents, decision
records, solutions, lessons, runbooks, migration notes, plans, engineering
notes.

Documentation is evidence. It is not automatically current.

## 7. Existing Agent / Skill Instructions

Check: AGENTS.md, CLAUDE.md, agent definitions, SKILL.md files,
repository-specific instruction files.

Determine instruction hierarchy, scope, conflicting rules, obsolete
instructions, referenced files and workflows. Do not modify them during this
audit.

## 8. Existing Knowledge Inventory (from `knowledge-discovery`)

Treat any Existing Knowledge Inventory as a list of claims requiring
verification — not established fact. See "Verifying the Existing Knowledge
Inventory" below.

---

# Audit Procedure

Use this procedure unless the parent Agent specifies a narrower workflow.

1. **Establish scope** — record the requested task, repository area, relevant
   components, and expected evidence.
2. **Map repository structure** — identify root, source, tests, config,
   build, CI, docs, agent instructions, skills, Git. Verify languages,
   frameworks, build system, package managers, and test frameworks from
   configuration or implementation — never infer them solely from directory
   names.
3. **Identify evidence paths** — identify the exact files/directories likely
   to contain evidence; avoid reading the entire repository unnecessarily.
4. **Verify implementation** — inspect source and relevant relationships; use
   `codebase-memory` first when material graph verification is useful.
5. **Verify tests** — determine whether tests support the implementation
   claim; record important gaps.
6. **Verify configuration** — determine whether the relevant behavior is
   enabled, disabled, conditional, environment-specific, experimental,
   unused, or unknown. Do not classify it beyond what evidence supports.
7. **Verify build/CI** — check whether the relevant behavior is exercised by
   build or CI.
8. **Check documentation** — compare current claims against implementation
   evidence.
9. **Investigate history** — use Git history only where it can materially
   clarify intent, migration, replacement, removal, historical state, or
   rationale.
10. **Check existing memory** — locate duplicate knowledge, conflicting
    documents, stale instructions, missing references, and historical
    material presented as current.
11. **Verify the Existing Knowledge Inventory** — when `knowledge-discovery`
    supplied one, work through its clusters and record a verification result
    for each.
12. **Build evidence inventory** — for each important finding, record
    Finding, Evidence, Scope, Confidence, Limitations.
13. **Return to parent Agent** — return the evidence without making decisions
    owned by other skills.

---

# Verifying the Existing Knowledge Inventory

For each claim or cluster in a `knowledge-discovery` inventory:

```text
Claim
    ↓
Locate corresponding evidence (source, tests, config, build/CI, Git history)
    ↓
Verified Current | Verified Historical | Contradicted | Partially Verified | Unverifiable
```

Prioritize verification of:

- `Conflicting` clusters — repository evidence is what resolves them.
- Claims backing current operational guidance in Agent-facing entry points
  (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, and similar).
- Claims that, if wrong, would cause a future Agent to violate a constraint
  or repeat a rejected approach.

Do not re-derive the inventory yourself if `knowledge-discovery` has already
produced one — verify it. If no inventory was produced and existing knowledge
sources are present, note this as a scope limitation and, when the task
warrants it, recommend the parent Agent load `knowledge-discovery` before
proceeding.

When auditing existing memory, inspect knowledge across **every** origin
tool, not only `docs/` — AGENTS.md, CLAUDE.md, `.cursor/rules/`,
`.windsurfrules`, `.github/copilot-instructions.md`, `.claude/`, `skills/`,
`agents/`, and `docs/` subdirectories (architecture, decisions, solutions,
lessons, constraints, workflows, history, reference).

Identify: duplicate knowledge, conflicting knowledge, orphaned documents,
broken references, current/historical confusion, stale instructions, missing
navigation, documents with weak evidence, oversized documents containing
unrelated concepts.

Report these findings. Do not restructure them here.

---

# `codebase-memory` Usage (Canonical)

This section is the canonical Project Memory definition of the
`codebase-memory` verification workflow, coverage model, and source-fallback
rules. Other skills reference this section instead of duplicating it.

For material repository claims, use `codebase-memory` as the default
graph-based verification layer when available — for definitions, references,
call paths, dependencies, module and architecture relationships, feature
usage, abstraction usage, and implementation relationships.

## Preferred chain

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

Do not blindly trust a graph result. Verify important claims against exact
source evidence.

## Coverage record

For every material `codebase-memory` investigation, determine and record:

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

Coverage status is one of:

```text
Complete | Partial | Skipped | Excluded | Stale | Pending | Unknown
```

A clean coverage result means:

> No recorded index gap was found for the checked scope.

It does not mean:

> The entire repository has been proven complete.

Coverage is best-effort. Absence of a recorded gap is not proof of
completeness.

## Source fallback triggers

Use direct `read` / `grep` or equivalent repository inspection when:

- the graph does not cover the relevant path, or graph coverage is partial
- the graph is stale
- a symbol is missing
- a generated file is involved
- configuration is outside graph scope
- Git history is required
- the claim is negative or exhaustive
- exact source evidence is required

Record the fallback. Do not hide evidence limitations.

---

# Claim Verification Records

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

Banned vague verdicts — never output:

```text
Seems correct.
Probably implemented.
Looks like it works.
I think this is current.
```

Convert uncertainty into explicit limitations.

---

# Negative Claims (Canonical)

This section is the canonical Project Memory negative-claims discipline.
Other skills reference this section instead of duplicating it.

Negative claims require stronger evidence — e.g. "the project does not use
Redis", "there is no authentication middleware", "the old API has been
completely removed", "no tests exist for this feature".

Before making such a claim:

1. Define the relevant scope.
2. Search the relevant paths.
3. Check dependency manifests.
4. Check configuration.
5. Check references/usages.
6. Check generated or indirect integration when relevant.
7. Check Git history when removal/migration is involved.
8. Record the coverage boundary.

When repository-wide absence cannot be proven, prefer:

```text
No evidence of X was found within <scope>.
```

Do not convert an incomplete search into "X does not exist."

---

# Exhaustive Claims (Canonical)

This section is the canonical Project Memory exhaustive-claims discipline.
Other skills reference this section instead of duplicating it.

Claims containing **all, every, none, never, only, completely, fully
removed, entirely migrated** require explicit scope evidence.

Before making an exhaustive claim:

```text
Define Scope → Enumerate Relevant Paths → Inspect Coverage → Cross-check Dependencies/References → Inspect History if Relevant → Report Limitations
```

If adequate coverage is unavailable, qualify the claim.

---

# Documentation Mismatch Detection

Compare documentation against implementation. Look for: documented features
missing in source, implemented features missing from documentation, old path
references, renamed symbols, removed dependencies, invalid commands, old
architecture descriptions, stale configuration examples, outdated workflow
steps, superseded decisions, completed migrations still described as pending,
historical behavior presented as current.

For every mismatch, record:

```text
Document Claim
Actual Evidence
Mismatch Type
Likely Current State
Evidence
Confidence
```

When implementation and documentation disagree, investigate which
current-state explanation fits — current, incomplete, experimental,
temporary, deprecated, or abandoned implementation; stale or historical
documentation; migration in progress; or unknown. Report the evidence
supporting each possibility.

Do not make the final classification here. Do not fix the mismatch in this
Skill.

---

# Candidate Knowledge Detection

During the audit, identify information that may be worth promoting into
memory: non-obvious architecture, important decisions, repeated debugging
discoveries, verified root causes, reusable solutions, compatibility
constraints, security boundaries, migration lessons, rejected approaches,
operational procedures, failure patterns.

Never automatically promote candidates. Return them as:

```text
Candidate Knowledge
Evidence
Potential Type
Why It May Matter
Confidence
```

`knowledge-classification` and `knowledge-compounding` decide what happens
next.

---

# Evidence Quality and Confidence (Canonical)

This section is the canonical Project Memory evidence-quality model. Other
skills reference this section instead of duplicating it.

- **High** — multiple independent evidence sources agree
  (e.g. Source + Tests + Configuration).
- **Medium** — a strong direct source exists but independent corroboration is
  limited (e.g. Implementation + Documentation).
- **Low** — evidence is indirect, incomplete, or historical
  (e.g. commit message only).
- **Unknown** — available evidence is insufficient.

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

## Existing Knowledge Inventory Verification

### Cluster: <subject>

- Claims:
- Verification Result: Verified Current | Verified Historical | Contradicted | Partially Verified | Unverifiable
- Evidence:
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

# Hard Rules

1. Audit before making memory decisions. Never audit documentation in
   isolation.
2. Do not guess. Do not invent history. Do not promote unverified
   hypotheses.
3. Do not treat documentation as automatically current, code as
   automatically sufficient proof, or an existing knowledge source as correct
   because `knowledge-discovery` found it — verify every claim.
4. Use `codebase-memory` for material graph-based claims, verify exact
   implementation evidence where necessary, use source fallback when graph
   coverage is incomplete, and record evidence limitations.
5. Do not treat clean graph coverage as proof of repository completeness.
6. Do not make unsupported negative claims or unsupported exhaustive claims.
7. Do not modify repository files; do not classify knowledge, decide whether
   stale knowledge should be deleted, or create documentation during the
   audit — other skills own those decisions.
8. Do not claim repository-wide coverage from a targeted audit. Do not expand
   scope without a reason.
9. Do not hide uncertainty — convert it into explicit limitations.
10. Do not report an edit as completed. Do not preserve terminal output as
    knowledge.

---

# Completion Criteria

The audit is complete when, as applicable:

```text
Scope, structure, and evidence paths established
Material implementation claims verified against source
Tests, configuration, and build/CI checked where relevant
Documentation compared and mismatches recorded
Git history and existing memory investigated where relevant
Existing Knowledge Inventory verified where supplied
Coverage limitations recorded and evidence inventory produced
No repository changes made
```

Do not claim a criterion was completed if it was not performed. If a
criterion is not applicable, explicitly mark it as not applicable.
