---
name: knowledge-compounding
description: >
  Extracts durable, reusable engineering knowledge from completed work,
  debugging sessions, migrations, incidents, and difficult implementation
  tasks. Converts verified experience into compact, evidence-backed
  Solutions, Lessons, Decisions, Constraints, and Workflows while rejecting
  task noise, duplicates, and unsupported conclusions. Read-only: produces
  knowledge proposals; memory-edit applies them.
---

# Knowledge Compounding

Turn valuable engineering experience into durable project knowledge. Your
purpose is not to document everything that happened — it is to identify the
small amount of knowledge that will make future Agents substantially more
effective.

You do not own: repository discovery, final classification, documentation
hierarchy design, repository editing, final verification. Those belong to
other Project Memory skills.

---

# Core Principle

Project Memory should compound, not merely accumulate.

Bad memory:

```text
Task 1 happened.
Task 2 happened.
Task 3 happened.
```

Compounded memory:

```text
The project learned X.
Future Agents should therefore do Y.
Approach Z was rejected because of constraint A.
```

Preserve the engineering insight produced by work, not the work log:

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
```

---

# Role

You extract and propose. You never modify repository files — approved
proposals are applied by `memory-edit`. Final type and state are determined
by `knowledge-classification`; placement is designed by `memory-architecture`;
implemented memory is verified by `memory-verification`.

---

# Evidence First

Never compound an unverified conclusion. Verification precedes compounding.

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

When the input contains a proposed lesson, verify it where possible:

```text
Claim:
Changing dependency X fixed the build.

Verify before compounding:
- dependency version
- build configuration
- failure mechanism
- relevant source and history
- reproducibility if available
```

A successful workaround does not automatically explain the root cause.

Evidence confidence scale (High / Medium / Low / Unknown): see
`repository-audit`.

---

# Root Cause vs Symptom

Prefer root-cause knowledge. Weak: "Gradle failed; changing version X fixed
it." Stronger: the verified mechanism — why it failed and what the fix
actually addressed. Only preserve the stronger statement if evidence supports
it. Do not invent root causes.

---

# The Durable Bar (Canonical Gate)

Before promoting anything, apply the counterfactual test — it outranks all
other criteria:

> If this learning disappeared, would a future Agent reading the final
> implementation, tests, and existing docs still repeat the mistake or
> redo substantial investigation?

Completion, effort, and diff size never establish eligibility. A learning
earns its place only when it holds durable reasoning that is **not readily
recoverable** from the artifacts the work left behind, and losing it would
plausibly cause recurrence, material risk, or substantial rediscovery.

When the counterfactual fails, propose nothing and say why. When it
passes, the Promote/Reject criteria below refine — never overrule — it.

---

# Promote When / Reject When

Canonical value criteria. Apply this test to every candidate.

## Promote when

* it is non-obvious — an experienced Agent would need to investigate
* it is reusable — it helps with another future task
* it is durable — it remains useful after the current task is forgotten
* it is evidence-backed — repository or verified evidence supports it
* it prevents future mistakes:
  * repeating a failed approach
  * breaking a constraint
  * misunderstanding architecture
  * making an invalid assumption
* a future Agent would otherwise rediscover it — strongest signal
* it lets future Agents avoid repeating research, reproduce a verified
  solution, recognize a known failure pattern, respect a constraint,
  understand non-obvious architecture, understand why an approach was
  rejected, or perform a recurring workflow correctly

If evidence is missing: Needs More Evidence, not rejection or promotion.

## Reject when

* routine command execution, ordinary implementation steps
* terminal transcripts, temporary thoughts, speculative hypotheses
* generic programming advice, trivial bug fixes
* obvious code behavior
* one-time observations with no reusable implication
* task completion summaries
* information already obvious from the source
* temporary state with no future relevance

Test:

> If a future Agent can obtain the same information immediately by reading the
> obvious nearby code, it does not belong in Project Memory.

Compounding value: High / Medium / Low / None. High — substantially affects
future engineering decisions. Medium — useful within a subsystem or recurring
workflow. Low — narrow; preserve only if retrieval cost is low. None — do not
compound.

---

# Sources of Compoundable Knowledge

```text
Completed implementation work
Debugging sessions and bug investigations
Production incidents
Build, test, CI, and release failures
Migration, architecture, and dependency changes
Performance, security, and compatibility investigations
Rejected approaches
Code reviews
Operational discoveries
Previous Project Memory
```

A source existing does not imply it contains durable knowledge. Extract only
what survives the task.

---

# Extraction: Solution / Lesson

Reduce completed work to:

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

Create a Solution when a specific difficult problem was solved and the
solution is likely to be useful again.

Create a Lesson when the experience reveals a general engineering principle.
Test: if the exact code, library, or incident disappeared tomorrow, would the
lesson still be useful? If no, it is a Solution or ordinary task detail. Do
not create a Lesson merely because a Solution exists.

Do not confuse documentation (information someone may need) with Project
Memory (information that prevents future rediscovery or mistakes).

Type definitions and distinctions (Solution / Lesson / Decision / Constraint
/ Workflow / Architecture / History): see `knowledge-classification`.

## Solution Track Contract

A proposed Solution carries one of two tracks, decided by the problem it
solves:

```text
Bug track       — the problem is a diagnosed defect (build_error,
                  test_failure, runtime_error, performance_issue,
                  integration_issue, security_issue, ui_bug, logic_error)
Knowledge track — the problem is a gap in practice (best_practice,
                  convention, tooling_decision, workflow_issue,
                  developer_experience, architecture_pattern,
                  documentation_gap)
```

Required fields by track, beyond the shared Problem / Solution /
Verification / Evidence:

```text
Bug track       — symptoms (observable failures), root_cause (verified
                  mechanism), resolution_type (code_fix | migration |
                  config_change | test_fix | dependency_update | ...)
Knowledge track — applies_when (conditions where the guidance applies);
                  symptoms / root_cause optional, never required
```

Do not force bug-track fields onto knowledge-track learnings or vice
versa. Open-vocabulary values (`component`, `root_cause`, `problem_type`)
follow the corpus-first rule in `knowledge-classification` — sample the
corpus before choosing, never coin a near-synonym.

---

# Rejected Approaches

Rejected approaches are especially valuable when they prevent future Agents
from repeating expensive mistakes.

Capture format:

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

Do not preserve every abandoned idea. Preserve a rejected approach only when
future Agents are likely to independently consider it again.

## Failed Approach Detection

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

Transient failures (e.g. a missing local environment variable) are not
durable. A failure is durable only if verified:

```text
Build strategy A fails because generated sources are unavailable during
initial configuration. The project therefore requires strategy B.
```

---

# Existing Memory Actions

Before creating new knowledge, search existing Project Memory for the same:

```text
Problem
Root cause
Architecture
Decision
Constraint
Workflow
Rejected approach
Subsystem
```

Then choose one action:

```text
Create        genuinely new knowledge; no adequate existing home
Update        existing knowledge needs correction or new facts
Strengthen    new evidence reinforces existing knowledge
Consolidate   merge scattered duplicates into one canonical unit
Link          connect related knowledge; no content change
Ignore        not worth compounding, or duplicate
```

Do not create duplicates.

---

# Knowledge Strengthening

Strengthen existing memory when new evidence:

* confirms an existing claim
* adds a missing root cause
* adds verification
* adds important constraints
* clarifies rejected alternatives
* updates current-state information

```text
Existing:     "Use approach B."
New evidence: "Approach A fails on Android 11 because of X."
Better:       "Use B; A was rejected because X fails on Android 11."
```

Prefer strengthening one canonical document over creating another.

---

# Knowledge Decay

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
Update / Supersede / Historical / Flag for Removal
```

Do not silently append contradictory information. Do not automatically
rewrite historical knowledge into current knowledge — preserve as History if
it explains the current system; recommend removal or supersession if it is
actively misleading.

You do not decide lifecycle actions. Return "potentially superseded knowledge
detected" and let the parent Agent load `obsolete-knowledge`, which determines
delete / preserve as history / mark deprecated / mark superseded. Lifecycle
states and transitions: see `knowledge-classification`.

---

# Compression and Knowledge Density

Use the minimum sufficient knowledge principle. Prefer:

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
Repeated rationale across multiple documents
```

Prefer:

```text
One Lesson that generalizes several incidents
```

over:

```text
One Lesson per minor incident
```

When several findings express the same durable idea, compress them into one
knowledge unit. Do not lose important distinctions during compression —
preserve conditions, exceptions, constraints, and evidence.

Maximize knowledge density — the ratio of useful engineering information to
document volume. Avoid long narrative, chronological logs, repeated
background, generic explanations, and implementation trivia. Never sacrifice
important constraints merely to make knowledge shorter.

---

# One Learning Per Run

Grounding, overlap detection, and cross-referencing each assume a single
solved problem. When several findings qualify, rank them, then compound
the single strongest one this run — the parent Agent runs the compounding
phase again for the next candidate. Never batch several unrelated
learnings into one proposal document, and never merge their rationale so
they can share a write. A proposal may list lower-ranked candidates as
"deferred" with one line each.

---

# Vocabulary Capture (CONCEPTS.md)

While compounding, flag domain terms the work used with project-specific
meaning — names the codebase, docs, and future work must mean the same
thing by. Propose each as a short glossary entry (term + one-line
definition), tagged for the parent Agent to apply via `memory-edit`
alongside the learning.

Rules:

- Capture terms, not claims. A glossary entry answers "what does this
  word mean here?", never "what is true / why".
- Only terms future work will trip on. A term every reader already
  shares is noise.
- Never a catch-all. Definitional findings are Reference units or stay in
  the learning's own body; the glossary is not a knowledge dump.
- Glossary rules are owned by `knowledge-classification` — do not
  redefine them here.

---

# Grounding Validation

Before finalizing a knowledge proposal, mechanically verify every factual
claim against the actual codebase. Grounding prevents compounding outdated
or incorrect information.

## Mechanical Validation

For each claim in the proposal:

```text
1. Identify the claim type (file path, function name, API, behavior, etc.)
2. Verify the claim against the current codebase
3. Record evidence (file, line, commit)
4. Mark confidence (High / Medium / Low / Unknown)
5. Flag any discrepancies
```

## Semantic Validation

After mechanical validation, check for semantic accuracy:

```text
- Does the explanation match the actual behavior?
- Are the root causes verified, not assumed?
- Are the solutions evidence-backed, not anecdotal?
```

## Claim Verification Rules

```text
File paths     → verify with glob/grep
Function names → verify with codebase-memory
API endpoints  → verify with route discovery
Behaviors      → verify with tests or manual verification
Config values  → verify with config files
Dependencies   → verify with package manifests
```

## Discrepancy Handling

When grounding reveals a discrepancy:

```text
1. Stop the compounding process
2. Report the discrepancy with evidence
3. Return to the parent Agent for resolution
4. Do not compound the unverified claim
```

---

# Auto-Memory Scan

Before compounding, scan existing Project Memory (MEMORY.md) for related
knowledge. This prevents duplicates and enables strengthening.

## Scan Process

```text
1. Read MEMORY.md and related indexes
2. Search for keywords from the current work
3. Identify potentially related knowledge
4. Check if the related knowledge is current and accurate
5. Determine if strengthening is needed
```

## Provenance Tagging

When auto-memory scan finds related knowledge, tag the provenance:

```text
Source: MEMORY.md → domain/index.md → unit.md
Status: active | superseded | deprecated | historical
Relevance: high | medium | low
```

## Strengthening

If the current work provides new evidence for existing knowledge:

```text
1. Verify the existing knowledge is still accurate
2. Add the new evidence
3. Update the last_verified date
4. Strengthen the knowledge (do not create duplicate)
```

---

# Session History Integration

Capture learnings across sessions to prevent rediscovery and enable
continuous improvement.

## Two-Stage Probe

Before compounding, probe session history for related work:

```text
Stage 1: Keyword Search
- Search session logs for keywords related to current work
- Identify potentially related sessions

Stage 2: Contextual Review
- Read related session summaries
- Extract relevant learnings
- Check if learnings are still current
```

## Branch/Keyword Filtering

Filter session history by:

```text
Branch:     git branch names
Keywords:   terms from current work
Timeframe:  recent sessions (last N days)
Subsystem:  affected module or area
```

## Cross-Session Learning

When session history reveals patterns:

```text
1. Identify recurring issues or approaches
2. Extract the pattern as a Lesson or Workflow
3. Verify against current codebase
4. Compound if durable
```

---

# Reference Files

This skill references additional guidance in `references/`:

- `references/grounding-validation.md` — detailed validation rules
- `references/durable-bar.md` — durable bar test criteria
- `references/quality-constraints.md` — quality gates and constraints
- `references/auto-memory.md` — auto-memory scan rules
- `references/session-history.md` — session history integration

---

# Compound Engineering Workflow

## Step 1 — Collect work context

Task, problem, affected subsystem, changes made, tests performed, failures
encountered, final outcome.

## Step 2 — Separate noise from signal

Drop routine commands, temporary attempts, repeated logs, obvious details.
Keep unexpected behavior, root causes, constraints, rejected approaches,
architectural discoveries, reusable solutions.

## Step 3 — Verify the important claims

Claim → evidence → confidence → limitations. Do not compound unsupported
reasoning.

## Step 4 — Identify the durable insight

Ask: what would we regret forgetting six months from now?

## Step 5 — Select knowledge type

Solution / Lesson / Decision / Constraint / Workflow / Architecture / History.
If uncertain, hand off to `knowledge-classification`.

## Step 6 — Search existing memory

Find related knowledge. Prefer strengthening existing memory.

## Step 7 — Determine compounding action

Create / Update / Strengthen / Consolidate / Link / Ignore / Needs More
Evidence.

## Step 8 — Produce a compact knowledge proposal

Do not edit the repository. Return the proposal to the parent Agent.

---

# Compound After Verification

```text
Plan → Implement → Review → Verify → Identify Learning → Compound Knowledge
```

The compounding step must happen after sufficient verification. Do not turn
an implementation plan into permanent memory merely because it was planned.
Do not turn an attempted approach into a Lesson merely because it was
discussed. Prefer completed and verified engineering experience.

---

# Knowledge Proposal Format

Canonical output contract:

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

<lifecycle state — see knowledge-classification>

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

Evidence confidence scale: see `repository-audit`. Lifecycle states: see
`knowledge-classification`.

---

# Compact Output Mode

When multiple findings come from one engineering task, prefer a table, then
expand only the findings that require explanation:

```markdown
## Compounded Knowledge

| Insight | Type | Value | Confidence | Action |
|---|---|---:|---:|---|
| <insight> | Solution | High | High | Create |
| <insight> | Lesson | High | Medium | Strengthen |
| <insight> | Constraint | Medium | High | Update |
```

---

# Discoverability

A learning that cannot be found does not compound. After a Solution is
applied, verify the project's instructions would lead a future Agent to
the store before working in the area it covers — `AGENTS.md` → domain
index → unit. When they would not, the parent Agent adds the smallest
pointer, never a copy of the learning. `memory-edit` applies it;
`memory-verification` confirms it.

---

# Relationships

* `knowledge-classification` — answers "what exact knowledge type and state
  does this finding represent?"; this Skill answers "what should we remember
  from this experience?" Do not duplicate classification logic.
* `memory-architecture` — determines where knowledge belongs, how it is
  structured, linked, and indexed. Do not design the documentation hierarchy
  here.
* `memory-edit` — applies approved proposals to the repository. This Skill
  never modifies files.
* `obsolete-knowledge` — determines delete / preserve as history / mark
  deprecated / mark superseded when new evidence invalidates old memory.
* `memory-verification` — verifies implemented memory for accuracy,
  consistency, non-duplication, navigability. Do not claim verification here.

---

# Example: Rejected Architecture

```text
Decision:  Use B.
Rejected:  A — violates platform constraint X.
Evidence:  Integration tests + platform verification.
```

Valuable because a future Agent may otherwise rediscover A. Low-value work
(rename, test, commit) returns:

```text
Compounding Value: None
Recommended Action: Ignore
```

That is a valid outcome. Do not create a Lesson.

---

# Hard Rules

* Never compound unverified conclusions; never invent root causes.
* Do not preserve task logs, terminal output, generic advice, or obvious code
  behavior.
* Prefer root-cause knowledge over symptom descriptions.
* Do not create duplicates; prefer strengthening existing knowledge.
* Do not create a Lesson merely because a Solution exists.
* Preserve rejected approaches and history only when future Agents may repeat
  or need them.
* Prefer compact knowledge over chronological narrative — but never sacrifice
  constraints, evidence, or limitations for brevity.
* Compound only after verification — never plans, hypotheses, or temporary
  debugging state.
* Do not modify repository files; do not design the documentation hierarchy;
  do not claim post-change verification.

---

# Completion Criteria

Compounding is complete when:

```text
Engineering work understood
Noise separated from signal
Durable insights identified and evidence-checked
Root causes separated from symptoms
Failed approaches evaluated
Existing memory checked; duplicates avoided
Knowledge proposals with recommended actions produced
No repository changes made
```

If no durable knowledge exists, explicitly return:

```text
No durable project knowledge identified.
Recommended Action: Ignore.
```

That is a valid and successful outcome. Measure success by how much future
engineering work can be done correctly without repeating the same
investigation — not by the number of documents created.
