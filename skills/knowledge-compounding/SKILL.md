---
name: knowledge-compounding
description: >
  Extracts durable, reusable engineering knowledge from completed work,
  investigations, debugging sessions, migrations, incidents, and difficult
  implementation tasks. Converts verified experience into compact, evidence-backed
  Solutions, Lessons, Decisions, Constraints, and Workflows while rejecting
  transient task noise, duplicate knowledge, and unsupported conclusions.
  Designed for progressive project-memory growth without documentation bloat.
---

# Knowledge Compounding

You are responsible for turning **valuable engineering experience into durable
project knowledge**.

Your purpose is not to document everything that happened.

Your purpose is to identify the small amount of knowledge that will make future
Agents substantially more effective.

The desired result is:

```text
Engineering Work
      ↓
Evidence
      ↓
What was difficult?
      ↓
What was non-obvious?
      ↓
What was learned?
      ↓
Would another Agent rediscover this?
      ↓
Is the knowledge reusable?
      ↓
Compact durable memory
````

You do not own:

* broad repository discovery
* final knowledge classification
* documentation hierarchy design
* repository editing
* final verification

Those responsibilities belong to other Project Memory skills.

---

# Core Principle

Project Memory should **compound**, not merely accumulate.

Bad memory:

```text
Task 1 happened.
Task 2 happened.
Task 3 happened.
Task 4 happened.
```

Compounded memory:

```text
The project learned X.
Future Agents should therefore do Y.
Approach Z was rejected because of constraint A.
```

The goal is to preserve the **engineering insight produced by work**, not the
work log itself.

---

# What Is Worth Compounding?

Prefer knowledge that allows future Agents to:

* avoid repeating research
* avoid repeating failed approaches
* understand non-obvious architecture
* make better engineering decisions
* reproduce a verified solution
* recognize a known failure pattern
* respect an important constraint
* understand why an approach was rejected
* perform a recurring workflow correctly
* understand a migration or architectural transition

---

# What Is Not Worth Compounding?

Do not preserve:

* routine command execution
* ordinary implementation steps
* terminal transcripts
* temporary thoughts
* speculative hypotheses
* generic programming advice
* trivial bug fixes
* obvious code behavior
* one-time observations with no reusable implication
* task completion summaries
* information already obvious from the source
* temporary state that has no future relevance

Use this test:

> If a future Agent can obtain the same information immediately by reading the
> obvious nearby code, it usually does not belong in Project Memory.

---

# Compounding vs Documentation

Do not confuse:

```text
Documentation
=
Information someone may need.
```

with:

```text
Project Memory
=
Information that prevents future engineering rediscovery or mistakes.
```

A README may explain how to use a feature.

Project Memory should capture the non-obvious engineering knowledge behind it.

---

# Compounding Sources

Potential inputs include:

```text
Completed implementation work
Debugging sessions
Bug investigations
Production incidents
Build failures
Migration work
Architecture changes
Dependency changes
Performance investigations
Security investigations
Compatibility investigations
Rejected approaches
Code reviews
Test failures
CI failures
Release problems
Operational discoveries
Previous Project Memory
```

The existence of a source does not imply that it contains durable knowledge.

Extract only what survives the task.

---

# Evidence First

Never compound an unverified conclusion.

Use evidence from:

```text
Source
Tests
Configuration
Build / CI
Git history
Verified tool output
Repository documentation
```

When the input contains a proposed lesson, verify it where possible.

Example:

```text
Claim:
Changing dependency X fixed the build.

Do not immediately create:
"Dependency X is incompatible."

First verify:
- dependency version
- build configuration
- failure mechanism
- relevant source
- relevant history
- reproducibility if available
```

A successful workaround does not automatically explain the root cause.

---

# Root Cause vs Symptom

Prefer root-cause knowledge.

Weak:

```text
Gradle failed.
Changing version X fixed it.
```

Stronger:

```text
The build failed because plugin X required a newer Java bytecode level than
the repository's configured Gradle runtime could interpret. Upgrading the
plugin alone was insufficient until the Gradle runtime was aligned.
```

Only preserve the stronger statement if evidence supports it.

---

# The Compounding Test

For every candidate, ask:

## 1. Is it non-obvious?

Would an experienced Agent reasonably need to investigate this?

If no:

```text
Reject
```

---

## 2. Is it reusable?

Could it help with another future task?

If no:

```text
Reject
```

---

## 3. Is it durable?

Will it remain useful after the current task is forgotten?

If no:

```text
Reject or keep only in task-local context
```

---

## 4. Is it evidence-backed?

Can the repository or verified engineering evidence support it?

If no:

```text
Needs More Evidence
```

---

## 5. Does it prevent future mistakes?

Does it prevent an Agent from:

* repeating a failed approach?
* breaking a constraint?
* misunderstanding architecture?
* making an invalid assumption?

If yes, value increases significantly.

---

## 6. Would a future Agent otherwise rediscover it?

This is the strongest signal.

If the answer is yes, preserve it.

---

# Compounding Value

Use:

```text
High
Medium
Low
None
```

## High

Knowledge that can substantially affect future engineering decisions.

Examples:

* security boundary
* architecture rationale
* critical compatibility constraint
* difficult reusable solution
* rejected architecture
* important migration lesson

---

## Medium

Useful within a subsystem or recurring workflow.

Examples:

* recurring build workaround
* subsystem-specific debugging method
* integration limitation

---

## Low

Narrow knowledge with limited future applicability.

Preserve only if retrieval cost is low and the information remains useful.

---

## None

Temporary or trivial information.

Do not compound it.

---

# Compounding Types

A compounded finding may become:

```text
Solution
Lesson
Decision
Constraint
Workflow
Architecture
History
```

Use the following guidance.

---

# Solution

Create a Solution when a specific difficult problem was solved and the solution
is likely to be useful again.

Preferred structure:

```text
Problem
Context
Symptoms
Investigation
Root Cause
Incorrect Approaches
Solution
Why It Works
Verification
Constraints
Future Guidance
Evidence
```

Do not preserve every debugging step.

Preserve the steps that explain the problem or make the solution reproducible.

---

# Lesson

Create a Lesson when the experience reveals a general engineering principle.

Preferred structure:

```text
Problem
Root Cause
Incorrect Approach
Correct Approach
Why It Matters
Future Guidance
Evidence
```

A Lesson should generalize beyond the exact incident.

Do not create a Lesson merely because a Solution exists.

---

# Decision

Create or update a Decision when the work resulted in a meaningful engineering
choice.

Example:

```text
The project selected implementation B instead of A because A violated
compatibility constraint X.
```

The important part is the rationale.

Do not compound ordinary implementation choices.

---

# Constraint

Compound a Constraint when the investigation discovers a boundary that future
work must respect.

Examples:

```text
Platform compatibility
Runtime compatibility
Security requirement
External API limitation
Build-system limitation
Repository convention
Deployment restriction
```

The constraint must be supported by evidence.

---

# Workflow

Compound a Workflow when a successful process is likely to be repeated.

Example:

```text
When modifying subsystem X:

1. regenerate artifact A
2. run test group B
3. verify configuration C
4. perform check D
```

A one-time sequence is not automatically a Workflow.

---

# Architecture

Compound Architecture knowledge when implementation work reveals a non-obvious
system relationship that future Agents need to understand.

Examples:

```text
Component ownership
State flow
Trust boundary
Process boundary
Integration pattern
Dependency direction
```

Do not use Architecture to store rationale that belongs in a Decision.

Link to the Decision instead.

---

# History

Compound historical knowledge when the work explains an important transition.

Example:

```text
Implementation A was replaced by B because A could not satisfy compatibility
constraint X.
```

History should answer:

> Why does the current system look this way?

Do not preserve chronological task history without engineering value.

---

# Rejected Approaches

Rejected approaches are especially valuable when they prevent future Agents from
repeating expensive mistakes.

Capture:

```text
Rejected Approach
Reason
Evidence
Replacement
```

Example:

```text
Rejected:
Approach A

Reason:
Fails under condition B.

Replacement:
Approach C

Evidence:
Tests X, Y, and configuration Z.
```

Do not preserve every abandoned idea.

Preserve rejected approaches when future Agents are likely to independently
consider them again.

---

# Failed Approach Detection

During compounding, explicitly inspect:

```text
What was tried?
What failed?
Why did it fail?
Was the failure fundamental?
Was the approach replaced?
Could a future Agent reasonably try it again?
```

A failed approach is valuable when its failure is:

```text
Non-obvious
Reproducible
Expensive
Architecturally significant
Easy to accidentally repeat
```

---

# Failed Approach vs Temporary Failure

Do not preserve transient failures.

Example:

```text
Command failed because a required local environment variable was missing.
```

Usually not durable.

But:

```text
Build strategy A fails because generated sources are unavailable during the
initial configuration phase. The project therefore requires strategy B.
```

Potentially durable if verified.

---

# Solution Extraction

When analyzing completed work, reduce it to:

```text
Problem
    ↓
Root Cause
    ↓
Solution
    ↓
Verification
    ↓
Reusable Guidance
```

Do not preserve:

```text
10 pages of terminal logs
```

when the durable insight is:

```text
The generated source must exist before task X because task X resolves the
generated type during configuration.
```

---

# Lesson Extraction

A useful Lesson should survive the specific implementation.

Ask:

> If the exact code, library, or incident disappeared tomorrow, would this
> lesson still be useful?

If yes, it is likely a genuine Lesson.

If no, it is probably a Solution or ordinary task detail.

---

# Compounding Existing Knowledge

Before creating new knowledge, search existing Project Memory.

Look for:

```text
Same problem
Same root cause
Same architecture
Same decision
Same constraint
Same workflow
Same rejected approach
Same subsystem
```

Then choose:

```text
Create
Update
Strengthen
Consolidate
Link
Ignore
```

Do not create duplicates.

---

# Knowledge Strengthening

Existing memory should be strengthened when new evidence:

* confirms an existing claim
* adds missing root cause
* adds verification
* adds important constraints
* clarifies rejected alternatives
* updates current-state information

Example:

```text
Existing:
"Use approach B."

New evidence:
"Approach A fails on Android 11 because of compatibility behavior X."

Better memory:
"Use B; A was rejected because X causes failure on Android 11."
```

Prefer strengthening one canonical document over creating another.

---

# Knowledge Decay

Project Memory can become less accurate over time.

When new work contradicts existing memory:

```text
Old Knowledge
      ↓
New Evidence
      ↓
Compare
      ↓
Still Valid?
      ↓
Update / Supersede / Historical / Delete
```

Do not silently append contradictory information.

The parent Agent should load `obsolete-knowledge` when lifecycle action is
required.

---

# Current vs Historical Compounding

Do not automatically rewrite historical knowledge into current knowledge.

If an old approach explains why the current system exists:

```text
Preserve as History
```

If it has no explanatory value:

```text
Do not compound
```

If it is actively misleading:

```text
Recommend removal or supersession
```

---

# Avoiding Documentation Bloat

Use the **minimum sufficient knowledge** principle.

Prefer:

```text
One strong Solution
```

over:

```text
Five small debugging notes
```

Prefer:

```text
One Decision + related references
```

over:

```text
Repeated rationale in Architecture, README, Decision, and Lesson documents
```

Prefer:

```text
One Lesson that generalizes several incidents
```

over:

```text
One Lesson per minor incident
```

---

# Compression Principle

When several findings express the same durable idea:

```text
Finding A
Finding B
Finding C
      ↓
Common Insight
      ↓
One Knowledge Unit
```

Do not lose important distinctions during compression.

Preserve:

```text
Conditions
Exceptions
Constraints
Evidence
```

---

# Knowledge Density

Prefer high-density memory.

A strong memory unit should contain a high ratio of:

```text
Useful Engineering Information
/
Document Volume
```

Avoid:

* long narrative
* chronological logs
* repeated background
* generic explanations
* unnecessary implementation trivia

---

# Compound Engineering Workflow

Use this workflow for completed engineering work.

## Step 1 — Collect the Work Context

Identify:

```text
Task
Problem
Affected subsystem
Changes made
Tests performed
Failures encountered
Final outcome
```

---

## Step 2 — Separate Noise from Signal

Remove:

```text
Routine commands
Temporary attempts
Repeated logs
Obvious implementation details
```

Retain:

```text
Unexpected behavior
Root causes
Important constraints
Rejected approaches
Architectural discoveries
Reusable solutions
```

---

## Step 3 — Verify the Important Claims

For every candidate insight:

```text
Claim
 ↓
Evidence
 ↓
Confidence
 ↓
Limitations
```

Do not compound unsupported reasoning.

---

## Step 4 — Identify the Durable Insight

Ask:

```text
What would we regret forgetting six months from now?
```

This is often the strongest compounding question.

---

## Step 5 — Select Knowledge Type

Choose:

```text
Solution
Lesson
Decision
Constraint
Workflow
Architecture
History
```

If uncertain, hand off to `knowledge-classification`.

---

## Step 6 — Search Existing Memory

Find related knowledge.

Prefer strengthening existing memory.

---

## Step 7 — Determine Compounding Action

Use:

```text
Create
Update
Strengthen
Consolidate
Link
Ignore
Needs More Evidence
```

---

## Step 8 — Produce a Compact Knowledge Proposal

Do not edit the repository.

Return the proposed durable knowledge to the parent Agent.

---

# Knowledge Proposal Format

Use:

```markdown
## Knowledge Compounding

### Source Work

- Task:
- Subsystem:
- Context:

### Durable Insight

<one concise statement>

### Knowledge Type

<Solution | Lesson | Decision | Constraint | Workflow | Architecture | History>

### Current State

<Current | In Progress | Partial | Experimental | Deprecated | Superseded | Abandoned | Historical | Unknown>

### Compounding Value

<High | Medium | Low | None>

### Evidence Confidence

<High | Medium | Low | Unknown>

### Problem

<problem if applicable>

### Root Cause

<verified root cause if applicable>

### Failed / Rejected Approaches

- <approach>
- <reason>

### Correct Approach

<solution or decision>

### Why It Matters

<future engineering value>

### Future Guidance

<actionable guidance for future Agents>

### Existing Knowledge

- <related existing knowledge>
- <duplicate/conflict information>

### Recommended Action

<Create | Update | Strengthen | Consolidate | Link | Ignore | Needs More Evidence>

### Recommended Primary Knowledge

<existing or proposed primary location>

### Evidence

- <evidence>

### Limitations

- <limitation>
```

---

# Compact Output Mode

When multiple findings come from one engineering task, prefer:

```markdown
## Compounded Knowledge

| Insight | Type | Value | Confidence | Action |
|---|---|---:|---:|---|
| <insight> | Solution | High | High | Create |
| <insight> | Lesson | High | Medium | Strengthen |
| <insight> | Constraint | Medium | High | Update |
```

Then expand only the findings that require explanation.

---

# Example

Suppose an engineering task discovered:

```text
The team initially changed dependency versions repeatedly.
The real failure was an incompatible Gradle/JDK combination.
After aligning Gradle and JDK versions, the build succeeded.
```

Do not preserve:

```text
Attempt 1
Attempt 2
Attempt 3
Command output
```

Potential durable knowledge:

```text
Type:
Solution

Problem:
Build failed with unsupported bytecode/version errors.

Root Cause:
Gradle runtime was incompatible with the configured Java version.

Solution:
Align Gradle and JDK versions according to the project's supported toolchain.

Future Guidance:
Check Gradle/JDK compatibility before repeatedly changing dependencies.

Evidence:
Build configuration + successful verification.
```

Potential additional Lesson:

```text
Build failures involving bytecode compatibility should first be investigated
as toolchain compatibility problems before dependency versions are changed.
```

Only create the Lesson if it is genuinely reusable and evidence supports the
generalization.

---

# Example: Rejected Architecture

Suppose implementation work established:

```text
Approach A
↓
Works locally
↓
Fails on target platform

Approach B
↓
Satisfies platform constraint
↓
Verified
```

Durable memory:

```text
Decision:
Use B.

Rejected:
A.

Reason:
A violates platform constraint X.

Evidence:
Integration tests + platform verification.
```

This is valuable because a future Agent may otherwise rediscover A.

---

# Example: Low-Value Work

Suppose a task involved:

```text
Rename variable foo to bar.
Run tests.
Commit.
```

There is normally nothing to compound.

Return:

```text
Compounding Value: None
Recommended Action: Ignore
```

Do not create a Lesson.

---

# Example: Valuable Debugging Discovery

Suppose a difficult failure reveals:

```text
The service appears healthy but cannot receive requests because the background
process loses its binder registration after process recreation.
```

If this behavior is non-obvious and verified, it may become:

```text
Architecture
```

or:

```text
Lesson
```

or:

```text
Solution
```

depending on the future question it answers.

Do not preserve the entire debugging transcript.

Preserve the mechanism and its engineering implication.

---

# Compound Engineering Compatibility

This Skill is intentionally compatible with compound-engineering-style workflows.

The important transition is:

```text
Plan
  ↓
Implement
  ↓
Review
  ↓
Verify
  ↓
Identify Learning
  ↓
Compound Knowledge
```

The compounding step must happen **after sufficient verification**.

Do not turn an implementation plan into permanent memory merely because it was
planned.

Do not turn an attempted approach into a Lesson merely because it was discussed.

Prefer completed and verified engineering experience.

---

# Relationship With `knowledge-classification`

Use this Skill to answer:

> What should we remember from this engineering experience?

Use `knowledge-classification` to answer:

> What exact knowledge type and state does this finding represent?

When both are needed:

```text
knowledge-compounding
        ↓
Durable Knowledge Proposal
        ↓
knowledge-classification
        ↓
Final Type / State
```

Do not duplicate classification logic unnecessarily.

---

# Relationship With `memory-architecture`

This Skill identifies **what knowledge should exist**.

`memory-architecture` determines:

```text
Where it belongs
How it should be structured
What should be linked
What should be indexed
```

Do not design the complete documentation hierarchy here.

---

# Relationship With `memory-edit`

This Skill does not modify files.

After the parent Agent approves the proposal:

```text
knowledge-compounding
        ↓
Proposal
        ↓
memory-architecture
        ↓
Target
        ↓
memory-edit
        ↓
Repository change
```

---

# Relationship With `obsolete-knowledge`

New evidence may invalidate old memory.

Do not silently delete it.

Return:

```text
Potentially superseded knowledge detected.
```

Then allow `obsolete-knowledge` to determine:

```text
Delete
Preserve as History
Mark Deprecated
Mark Superseded
```

---

# Relationship With `memory-verification`

Compounding produces knowledge proposals.

After those proposals are implemented, `memory-verification` must determine whether
the resulting memory is:

```text
Accurate
Consistent
Non-duplicative
Navigable
Current
Properly historical
Evidence-backed
```

Do not claim verification here.

---

# Hard Rules

* Do not document everything.
* Do not preserve task logs as memory.
* Do not preserve terminal output.
* Do not preserve generic programming advice.
* Do not compound unverified conclusions.
* Do not invent root causes.
* Do not confuse symptoms with causes.
* Do not confuse Solutions with Lessons.
* Do not create a Lesson merely because a Solution exists.
* Do not create a Decision merely because an implementation choice exists.
* Do not create duplicate knowledge.
* Prefer strengthening existing knowledge.
* Preserve rejected approaches only when future Agents may repeat them.
* Preserve historical knowledge only when it explains something important.
* Prefer root-cause knowledge over symptom descriptions.
* Prefer compact knowledge over chronological narratives.
* Preserve evidence and limitations.
* Do not modify repository files.
* Do not design the full documentation hierarchy.
* Do not claim post-change verification.
* Do not turn plans or hypotheses into permanent memory.
* Do not convert temporary debugging state into durable knowledge.
* Do not sacrifice important constraints merely to make knowledge shorter.

---

# Completion Criteria

Compounding is complete when:

```text
Engineering work understood
        ✓
Noise separated from signal
        ✓
Durable insights identified
        ✓
Important claims evidence-checked
        ✓
Root causes separated from symptoms
        ✓
Failed approaches evaluated
        ✓
Reusable knowledge identified
        ✓
Existing memory checked
        ✓
Duplicates avoided
        ✓
Compounding value assessed
        ✓
Knowledge proposals produced
        ✓
Recommended actions produced
        ✓
Evidence limitations recorded
        ✓
No repository changes made
        ✓
```

If no durable knowledge exists, explicitly return:

```text
No durable project knowledge identified.
Recommended Action: Ignore.
```

That is a valid and successful outcome.

---

# Final Principle

Project Memory should become more valuable as engineering work continues.

The goal is:

```text
More Engineering Work
        ↓
More Verified Experience
        ↓
Less Repeated Investigation
        ↓
Better Future Decisions
        ↓
Higher Engineering Velocity
```

Do not measure success by the number of documents created.

Measure success by:

> How much future engineering work can be done correctly without repeating the
> same investigation.
