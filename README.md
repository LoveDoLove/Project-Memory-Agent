# Project Memory

> Durable, evidence-backed memory for coding agents.

**Project Memory** is an agent-driven knowledge system that gives coding agents
durable, structured, and progressively-loaded memory for software repositories.

It helps agents understand a project, preserve important engineering decisions,
compound lessons learned, remove obsolete knowledge, and avoid repeating
research that has already been done.

Critically, it does not assume it is starting from a blank repository. Most
real repositories already have fragments of project knowledge scattered
across `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/`, `skills/`,
ADRs, README files, and documentation written by other Agents, other AI
IDEs, or other engineers. Project Memory treats all of that as **existing
knowledge to discover, verify, and reconcile** — not as untouched
documentation to leave alone while adding its own files next to it.

> **Code tells agents what exists. Project Memory helps them remember why —
> and reconciles every place that already tried to write that down.**

[![GitHub Stars][stars-shield]][stars-url]
[![GitHub Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

---

## Table of Contents

- [About The Project](#about-the-project)
- [Why Project Memory](#why-project-memory)
- [The Core Idea](#the-core-idea)
- [Existing Knowledge Is Not Ground Truth](#existing-knowledge-is-not-ground-truth)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
- [Memory Structure](#memory-structure)
- [Skills](#skills)
- [Specialized Agents](#specialized-agents)
- [Design Principles](#design-principles)
- [Project Status](#project-status)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## About The Project

AI coding agents are becoming increasingly capable.

However, they still have a fundamental limitation:

**They repeatedly have to rediscover the same project knowledge — and,
increasingly, they repeatedly write their own competing copy of it.**

A real software repository contains far more knowledge than its source code:

- Architectural decisions
- Rejected approaches
- Compatibility constraints
- Implementation rationale
- Historical migrations
- Debugging lessons
- Development workflows
- Operational procedures
- Project-specific conventions
- Known limitations
- Constraints imposed by external systems

Some of this knowledge exists in documentation.

Some exists in Git history.

Some exists only in the implementation.

Some exists only because an engineer previously discovered that a particular
approach does not work.

And, increasingly, some of it exists three different times — once in
`AGENTS.md`, once in `CLAUDE.md`, once in `.cursor/rules/` — written by
different Agents or AI IDEs at different times, quietly disagreeing with
each other.

Without a durable memory system, future agents repeatedly reconstruct this
knowledge from scratch, or worse, add a fourth competing copy on top of the
three that already exist.

Project Memory is designed to solve both problems: the missing-knowledge
problem and the fragmented-knowledge problem.

It turns scattered, multi-source repository knowledge into one maintained,
evidence-backed memory system that future agents can progressively load
when they need it.

---

## Why Project Memory?

Traditional documentation tends to accumulate.

Project Memory is designed to **compound and reconcile**.

```text
Existing Project Knowledge (any origin: human, Agent, AI IDE)
       │
       ▼
Discover
       │
       ▼
Verify Against Repository Evidence
       │
       ▼
Classify, Deduplicate, Resolve Conflicts
       │
       ▼
Compound New Learning
       │
       ▼
Reconstruct Into One Architecture
       │
       ▼
Future Agent
       │
       ▼
Less Rediscovery, No Competing Copies
       │
       ▼
Better Engineering Work
```

The goal is not to document everything.

The goal is not to add a new file next to every existing one.

The goal is to preserve the knowledge that materially improves future
engineering decisions — in exactly one authoritative place, regardless of
how many tools or agents originally wrote a version of it down.

### The Problem

Without durable, reconciled project memory:

```text
Agent A (using Tool X)
  │
  ├── investigates architecture
  ├── discovers a rejected approach
  └── writes it down in Tool X's memory file
          │
          ▼
       Session ends
          │
          ▼
Agent B (using Tool Y)
  │
  ├── never sees Tool X's memory file
  ├── investigates the same architecture again
  ├── tries the rejected approach again
  └── writes its own, slightly different, conclusion into Tool Y's file
          │
          ▼
Repository now has two disagreeing "sources of truth"
```

With Project Memory:

```text
Agent A, Agent B, and every prior AI IDE's notes
  │
  ├── discovered
  ├── verified against repository evidence
  ├── reconciled into one canonical answer
  └── reconstructed into Project Memory
          │
          ▼
     Project Memory
          │
          ▼
Agent C
  │
  ├── loads relevant knowledge from one trustworthy place
  ├── understands the previous decision
  └── starts further ahead
```

---

## The Core Idea

Project Memory is built around one principle:

> **Engineering knowledge should become more useful over time — and there
> should only ever be one authoritative copy of it.**

This means memory should not simply grow.

It should become:

- More accurate
- More structured
- Less redundant
- Easier to retrieve
- Better separated by lifecycle
- More strongly supported by evidence
- **Consolidated**, even when it originally came from several different
  tools that never talked to each other

A larger `docs/` directory is not necessarily better memory.

Five files that each partially describe the same subsystem are not five
times better than one that fully describes it — they are a maintenance
liability and a source of future contradictions.

A better memory system contains the **right knowledge in the right place,
in exactly one place**.

---

## Existing Knowledge Is Not Ground Truth

This is the operating principle that distinguishes Project Memory from a
simple documentation generator.

A repository that has been touched by more than one Agent, AI IDE, or
engineer almost always already contains an informal, undocumented merge
conflict in its project knowledge — it just hasn't been run yet.

Project Memory assumes, by default, that any pre-existing knowledge source
is:

```text
AGENTS.md
CLAUDE.md
.cursor/rules/
.cursorrules
.windsurfrules
.github/copilot-instructions.md
.claude/
skills/
agents/
README.md
docs/
docs/adr/ or docs/decisions/
generated AI documentation
prior Project Memory output
other AI-IDE- or Agent-produced context
```

a **candidate knowledge source that requires verification** — not an
authoritative record simply because it exists, looks polished, or was
written by another capable Agent.

The default outcome of a Project Memory task is therefore **not**:

```text
Original files, left untouched
        +
New Project Memory files, added alongside
```

It is:

```text
Existing knowledge, discovered, verified, deduplicated,
conflict-resolved, and reconstructed into one architecture
```

If existing memory turns out to already be accurate and well organized, the
correct action may be to keep it largely as-is — but that is a conclusion
reached after verification, never an assumption made at the start.

---

## How It Works

Project Memory uses a primary orchestrator with specialized Skills.

```text
                         ┌─────────────────────┐
                         │   Project Memory    │
                         │       Agent         │
                         │    Orchestrator     │
                         └──────────┬──────────┘
                                    │
             ┌───────────────────┬─┴─┬───────────────────┐
             │                   │   │                   │
             ▼                   ▼   ▼                   ▼
    Knowledge Discovery   Repository Audit   Knowledge Model   Memory Architecture
   (existing sources,          │                   │                  │
    all origins)               │                   │                  │
             │                 └───────────────────┼──────────────────┘
             │                                     │
             └─────────────────────────────────────┤
                                                     ▼
                                          Knowledge Classification
                                                     │
                                                     ▼
                                          Knowledge Compounding
                                                     │
                                                     ▼
                                           Obsolete Knowledge
                                                     │
                                                     ▼
                                                Memory Edit
                                                     │
                                                     ▼
                                          Memory Verification
```

The orchestrator decides which Skills are required for the current task.

It does not need to load every Skill for every request — but whenever the
repository already contains pre-existing knowledge sources and the task is
a full audit, an initial build, or a reconstruction request, **Knowledge
Discovery runs first**, before anything else touches memory.

---

## The Memory Loop

A typical Project Memory operation follows:

```text
1. Understand & Discover Existing Knowledge
      ↓
2. Discover Repository Evidence
      ↓
3. Verify (including every claim pulled from existing sources)
      ↓
4. Compare
      ↓
5. Classify (deduplicate + resolve cross-source conflicts)
      ↓
6. Compound
      ↓
7. Architect (reconstruction, not just addition)
      ↓
8. Clean obsolete knowledge, regardless of origin tool
      ↓
9. Edit (including multi-source consolidation and thin-pointer conversion)
      ↓
10. Verify again
```

This makes memory maintenance a knowledge-migration and reconciliation
workflow, not merely a documentation-writing exercise.

---

## Architecture

### Progressive Loading

`AGENTS.md` is the primary entry point.

A future agent should not need to load the entire documentation tree — and
should never need to guess which of several competing entry points
(`AGENTS.md`? `CLAUDE.md`? `.cursor/rules/`?) is actually authoritative.

Instead:

```text
AGENTS.md
    │
    ▼
Relevant Domain Index
    │
    ▼
Focused Knowledge Unit
    │
    ▼
Related Detail
```

For example:

```text
AGENTS.md
    ↓
docs/architecture/README.md
    ↓
docs/architecture/security/authentication.md
    ↓
docs/decisions/security/authentication.md
```

Only the knowledge required for the current task needs to be loaded.

If the repository has tool-specific entry points like `CLAUDE.md` or
`.cursor/rules/`, Project Memory reconciles them into thin pointers back to
`AGENTS.md` rather than letting them silently diverge into a second
"primary" source of truth.

---

### Knowledge Architecture

A typical repository may look like:

```text
repository/
│
├── AGENTS.md
├── CLAUDE.md            (thin pointer to AGENTS.md, if present)
│
└── docs/
    │
    ├── architecture/
    │   ├── README.md
    │   └── focused-topic.md
    │
    ├── decisions/
    │   ├── README.md
    │   └── focused-decision.md
    │
    ├── lessons/
    │   ├── README.md
    │   └── focused-lesson.md
    │
    ├── workflows/
    │   ├── README.md
    │   └── focused-workflow.md
    │
    ├── constraints/
    │   ├── README.md
    │   └── focused-constraint.md
    │
    ├── reference/
    │   ├── README.md
    │   └── focused-reference.md
    │
    └── history/
        ├── README.md
        └── historical-unit.md
```

This is a pattern, not a mandatory directory structure.

Project Memory should create only domains containing useful knowledge, and
should consolidate — not merely add to — whatever domains already exist
under a different convention (for example `docs/adr/` instead of
`docs/decisions/`).

---

## Key Features

### Existing Knowledge Discovery

Before creating anything new, Project Memory inventories what the
repository already claims about itself.

It scans known conventions across the AI-agent and AI-IDE ecosystem:

```text
AGENTS.md
CLAUDE.md
.cursor/rules/  ·  .cursorrules  ·  .windsurfrules
.github/copilot-instructions.md
.claude/ (commands, skills, agents, settings)
skills/  ·  agents/
README.md  ·  CONTRIBUTING.md
docs/  ·  docs/adr/  ·  docs/decisions/
generated AI documentation
prior Project Memory output
```

For every claim it finds, it records **where the claim came from** — the
file, the tool/convention, the apparent authorship (human, AI Agent, AI
IDE, or unknown) — and groups claims describing the same subject into
clusters, flagging each cluster as consistent, redundant, conflicting, or
complementary.

This inventory is the input to verification and classification. It is
never treated as approved memory on its own.

---

### Evidence-Based Memory

Project Memory verifies important repository claims against available
evidence — including every claim pulled from a pre-existing knowledge
source.

Relevant evidence can include:

- Source code
- Tests
- Configuration
- Build configuration
- CI/CD
- Dependency manifests
- Git history
- Documentation
- Repository indexes

When available, `codebase-memory` can provide graph-based repository
evidence before direct source inspection is used as a fallback.

The important distinction is:

```text
Documentation
      ≠
Evidence

Existing Knowledge Source
      ≠
Verified Fact
```

A claim must be checked against repository reality when it matters —
regardless of which tool or Agent originally wrote it down.

---

### Knowledge Classification

Project Memory separates knowledge into meaningful categories:

```text
Current Facts
Architecture
Decisions
Lessons
Constraints
Workflows
Reference
Historical Context
Obsolete / Invalid
```

Not everything discovered during an audit deserves permanent memory —
including content produced by a previous Agent session.

---

### Current-State Awareness

Significant project knowledge can be classified as:

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

This prevents old information from silently appearing to be current
guidance — whether that old information lives in a Project-Memory-authored
file or in a `CLAUDE.md` nobody has revisited in months.

---

### Cross-Source Conflict Resolution

When two or more existing knowledge sources disagree — for example
`AGENTS.md` says "use pnpm" while `.cursor/rules/setup.md` says
"npm install" — Project Memory resolves the conflict with repository
evidence, not by preferring whichever file looks newest or most polished.

```text
Conflicting Claims
        ↓
Repository Evidence
        ↓
One claim confirmed, others corrected or removed
        or
Claims apply to different, non-conflicting scopes
        or
Neither claim matches current reality — a new fact is established
```

The resolution, and the reasoning behind it, is recorded — not just the
outcome.

---

### Knowledge Compounding

Project Memory captures knowledge that has long-term engineering value,
whether it comes from newly completed work or from rationale buried inside
an existing knowledge source that was never formally captured.

Useful knowledge should help future agents:

- Understand a non-obvious project fact
- Avoid repeating previous research
- Avoid a known mistake
- Understand an architectural decision
- Understand why an alternative was rejected
- Make a better implementation decision
- Continue a migration correctly

The objective is:

> **More leverage, not more documents — and not more competing documents.**

---

### Obsolete Knowledge Management

Project Memory actively looks for:

- Removed implementations
- Abandoned approaches
- Superseded architecture
- Removed dependencies
- Obsolete workflows
- Invalid commands
- Stale workarounds
- Completed migrations
- Outdated project structures
- Existing knowledge sources that duplicate or contradict verified current
  knowledge
- Existing knowledge sources that no longer match the repository at all

Obsolete information can be:

```text
Deleted
Preserved as Historical
Marked Deprecated
Marked Superseded
```

This applies identically regardless of which tool or Agent produced the
obsolete content — a stale section in `CLAUDE.md` gets the same scrutiny as
a stale document in `docs/`.

Historical knowledge is retained when it explains something important about
the current system.

---

### Canonical Knowledge Ownership

Important knowledge should have one primary home — even if it currently
exists in three different files produced by three different tools.

For example:

```text
Primary:
docs/decisions/security/authentication.md

Referenced by:
AGENTS.md
docs/architecture/security-model.md
CLAUDE.md (thin pointer)
```

Project Memory avoids maintaining multiple independent copies of the same
rationale, and actively consolidates copies it finds spread across
different origin tools.

---

### Dual Entry Point Reconciliation

When a repository has more than one file competing to be the "primary"
Agent-facing entry point — most commonly `AGENTS.md` and `CLAUDE.md`, or
either of these plus `.cursor/rules/` — Project Memory resolves the
ambiguity rather than leaving both in place to silently drift apart.

The default resolution is a single canonical entry point (`AGENTS.md`),
with other tool-specific files reduced to a thin pointer:

```markdown
<!-- CLAUDE.md -->
See [AGENTS.md](./AGENTS.md) for project rules, architecture orientation,
and documentation navigation. This file is intentionally kept minimal.
```

Genuinely synchronized parallel entry points are only kept when the
repository has an explicit, evidence-backed reason to need tool-specific
divergence — that is the exception, not the default.

---

### Final Verification

Memory changes are not considered complete simply because Markdown files
were created, moved, or merged.

The final verification stage checks:

```text
Repository consistency
Knowledge consistency
Lifecycle state
Duplicate ownership, across every origin tool
Historical boundaries
Supersession
References
Navigation
Progressive loading
Migration completeness
Entry-point reconciliation
Evidence limitations
```

The final verification result is:

```text
PASS
PASS WITH WARNINGS
FAIL
BLOCKED
```

---

## Installation

Project Memory is designed for coding-agent environments that support
agent/subagent and Skill-style workflows.

### OpenCode

Clone the repository:

```bash
git clone https://github.com/LoveDoLove/Project-Memory-Agent.git
```

Then make the Project Memory Agent and its Skills available to your OpenCode
environment according to your project's agent/skill configuration.

Once installed, invoke the orchestrator:

```text
@project-memory
```

The Project Memory Agent determines which specialized Skills should be loaded
for the task — including `knowledge-discovery`, if the target repository
already has pre-existing knowledge sources.

---

## Usage

### Audit an Entire Project

Start the Project Memory Agent:

```text
@project-memory
```

It should discover any existing knowledge sources, inspect the repository,
determine the existing state of its project memory, and report what should
be retained, changed, merged, moved, or removed — across every origin tool
it finds, not only its own prior output.

---

### Audit a Specific Domain

```text
@project-memory

Audit the authentication architecture and update the project memory.
```

The agent should:

```text
Discover (existing sources describing authentication, if any)
    ↓
Verify
    ↓
Compare
    ↓
Classify
    ↓
Update
    ↓
Verify
```

Only the relevant repository scope should be investigated when the task is
clearly bounded.

---

### Build Project Memory in a Repository That Already Has Documentation

```text
@project-memory

Build the initial project memory for this repository. It already has an
AGENTS.md, a CLAUDE.md, and some notes under docs/.
```

The agent should determine:

- What knowledge already exists, and where — across every origin tool
- What knowledge is missing
- What documentation is stale, redundant, or contradictory across sources
- Which decisions matter
- Which lessons are worth preserving
- Which knowledge belongs in history
- How the resulting, single, reconciled memory should be structured

The result is a reconstructed memory system — not the original files left
untouched with new files added beside them.

---

### Reconstruct Fragmented or Conflicting Memory

```text
@project-memory

Our AGENTS.md, CLAUDE.md, and .cursor/rules/ all describe the build process
differently. Reconcile them.
```

The agent loads `knowledge-discovery` to inventory all three sources,
`repository-audit`/`codebase-memory` to determine which claim (if any)
matches reality, `knowledge-classification` to resolve the conflict with
evidence, and `memory-architecture` + `memory-edit` to consolidate them into
one canonical description with the other files reduced to thin pointers or
removed.

---

### Update Memory After Engineering Work

```text
@project-memory

Review the changes from this feature and compound any durable project knowledge.
```

This is where Project Memory becomes useful as a long-term system rather than a
one-time documentation generator.

---

## Memory Structure

### `AGENTS.md`

The primary progressive-loading entry point.

It should contain only high-signal information:

- Project identity
- Critical always-read rules
- Minimal architecture orientation
- Critical constraints
- Verification requirements
- Documentation navigation
- References to detailed knowledge

It should **not** become the entire project knowledge base, and it should
be the **only** file playing this role — other tool-specific entry points
should point to it rather than maintaining a parallel, potentially
divergent copy.

---

### `docs/architecture/`

Architecture knowledge.

Examples:

```text
System architecture
Module boundaries
Data flow
State ownership
Trust boundaries
Integration architecture
```

---

### `docs/decisions/`

Important engineering and architectural decisions.

A meaningful decision may capture:

```text
Status
Context
Decision
Rationale
Alternatives
Rejected Alternatives
Consequences
Trade-offs
Stability
Evidence
```

---

### `docs/lessons/`

Reusable engineering lessons.

Preferred structure:

```text
Problem
Root Cause
Incorrect Approach
Correct Approach
Why It Matters
Future Guidance
```

Raw terminal logs and debugging noise do not belong here.

---

### `docs/workflows/`

Repeatable procedures for:

- Development
- Testing
- Verification
- Release
- Operations
- Agent workflows

---

### `docs/constraints/`

Important non-negotiable boundaries.

Examples:

- Security
- Compatibility
- Platform
- Runtime
- External services
- Repository-specific restrictions

---

### `docs/reference/`

Useful on-demand knowledge that does not normally belong in the initial
context.

---

### `docs/history/`

Historical information that still provides meaningful engineering context —
including the history of why a repository's knowledge was once fragmented
across multiple tools, when that history is worth keeping.

Historical knowledge should not masquerade as current operational guidance.

---

## Skills

Project Memory intentionally uses specialized Skills instead of placing every
responsibility inside one enormous Agent prompt.

| Skill                      | Responsibility                                                    |
| --------------------------- | -------------------------------------------------------------------- |
| `knowledge-discovery`       | Discover and inventory every pre-existing knowledge source, with provenance |
| `repository-audit`          | Repository discovery and evidence gathering                        |
| `knowledge-classification`  | Classify and filter discovered knowledge; resolve cross-source conflicts |
| `knowledge-compounding`     | Turn durable experience into reusable memory                       |
| `memory-architecture`       | Design knowledge hierarchy, navigation, and multi-source reconstruction mapping |
| `obsolete-knowledge`        | Detect and handle stale or superseded knowledge, regardless of origin |
| `memory-edit`               | Apply approved documentation changes, including multi-source consolidation |
| `memory-verification`       | Perform the final consistency and quality gate                     |

The Project Memory Agent orchestrates these Skills progressively.

`knowledge-discovery` is the mandatory first step whenever a full audit, an
initial build, or a reconstruction task encounters a repository that already
has knowledge sources — which, in practice, is most repositories.

You do not normally need to invoke each Skill manually.

---

## Specialized Agents

Project Memory can also delegate repository work to specialized agents when
available.

### `codebase-memory`

Used as a read-only repository evidence layer.

It helps answer questions such as:

- Where does functionality exist?
- How are modules related?
- Is an abstraction actually used?
- What are the relevant call paths?
- Does the implementation support a documentation claim?
- Does the implementation support a claim pulled from an existing
  `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules/` file?

Graph evidence is treated as evidence, not as permission to modify the
repository.

---

### `cavecrew-builder`

Used for bounded mechanical edits when available.

Typical use cases include:

- Small documentation corrections
- Broken link fixes
- Path updates
- Typo corrections
- A single thin-pointer conversion (one file, text already drafted)
- Small focused mechanical changes

Large architectural changes and multi-source consolidations should not be
delegated as mechanical edits.

---

## Design Principles

### Existing Knowledge Is Not Ground Truth

No pre-existing memory file — regardless of which human, Agent, or AI IDE
produced it — is treated as correct simply because it exists.

### Evidence Before Memory

Do not create long-term project knowledge before understanding what the
repository can actually prove.

### Current Before Historical

Current engineering guidance must remain clearly separated from historical
context.

### One Knowledge, One Owner — Across Every Tool

Important knowledge should have one canonical source, even when it started
out duplicated across several different tools' memory files.

Use references instead of maintaining duplicate copies.

### Progressive Loading

Agents should load only the knowledge relevant to the current task, from
one unambiguous entry point.

### Small Knowledge Units

A knowledge file should represent one independently retrievable concept.

### Compound, Don't Accumulate

Every retained knowledge unit should provide future engineering value.

More documentation does not automatically mean better memory, and more
competing copies of the same fact never do.

### Verification Is Mandatory

Documentation is not considered authoritative merely because it exists —
including documentation Project Memory itself wrote in a previous run.

### Unknown Is a Valid State

When evidence is insufficient:

```text
Unknown
```

is better than an invented answer, and better than silently trusting
whichever existing source happened to be found first.

### Preserve Useful History

Historical knowledge should be removed only when it has no remaining
explanatory value.

A rejected architectural approach can be important even after the
implementation has disappeared — and even if the only remaining record of
it lived in a `CLAUDE.md` nobody had opened in a year.

---

## Project Status

Project Memory currently includes the core agent orchestration and memory
lifecycle:

```text
[x] Project Memory orchestrator
[x] Existing-knowledge discovery (multi-source, multi-tool)
[x] Repository audit
[x] Knowledge classification
[x] Cross-source conflict resolution
[x] Knowledge compounding
[x] Memory architecture (including multi-source reconstruction)
[x] Dual entry-point reconciliation
[x] Obsolete knowledge management
[x] Memory editing workflow
[x] Memory verification
[x] Progressive-loading model
[x] Current / Historical separation
[x] Canonical knowledge ownership
```

The project is actively evolving toward broader coding-agent compatibility and
more automated memory quality checks.

---

## Roadmap

### Core

- [x] Project Memory orchestrator
- [x] Existing-knowledge discovery skill
- [x] Repository audit Skill
- [x] Knowledge classification
- [x] Cross-source conflict resolution
- [x] Knowledge compounding
- [x] Memory architecture
- [x] Multi-source reconstruction and dual entry-point reconciliation
- [x] Obsolete knowledge management
- [x] Memory editing workflow
- [x] Memory verification

### Automation

- [ ] Automated memory health checks
- [ ] Automated stale-reference detection
- [ ] Automated duplicate detection across origin tools
- [ ] Automated orphan detection
- [ ] Improved repository coverage reporting
- [ ] Knowledge quality metrics

### Agent Ecosystem

- [ ] Broader agent-platform compatibility
- [ ] Platform-specific installation helpers
- [ ] Improved agent interoperability
- [ ] More repository-aware integrations
- [ ] Additional known existing-knowledge conventions as new tools emerge

### Long-Term

- [ ] Incremental memory maintenance
- [ ] Memory drift detection
- [ ] Knowledge dependency tracking
- [ ] Cross-project memory patterns
- [ ] Improved evidence provenance

See the GitHub Issues for proposed features and ongoing work.

---

## Contributing

Contributions are welcome.

Before adding a new feature, consider whether it belongs as:

- Agent orchestration
- A specialized Skill
- A verification mechanism
- A repository integration
- A memory convention
- A new existing-knowledge source pattern that `knowledge-discovery` should
  recognize

Avoid adding complexity simply to increase the number of agents or Skills.

The goal is to improve the quality, durability, and retrieval efficiency of
project knowledge — and to reduce, not add to, the number of competing
copies of that knowledge in a repository.

### Development Principles

1. Prefer evidence over assumptions.
2. Keep responsibilities clearly separated.
3. Avoid duplicate knowledge, including across origin tools.
4. Preserve important historical rationale.
5. Keep progressive loading efficient.
6. Verify changes before considering them complete.
7. Prefer simple mechanisms over unnecessary orchestration.
8. Never treat a pre-existing file as correct merely because it exists.

### Pull Requests

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Verify the affected Agent or Skill.
5. Update documentation when behaviour changes.
6. Open a pull request with a clear description of the change.

---

## License

Distributed under the MIT License.

See [`LICENSE`](LICENSE) for more information.

---

## Acknowledgments

Project Memory is influenced by the broader ecosystem of AI coding agents,
agentic software engineering, and knowledge-compounding workflows.

Special inspiration comes from the idea behind
[Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin):
engineering work should make subsequent engineering work easier.

Project Memory applies that idea specifically to **repository knowledge**:

```text
Compound Engineering
        ↓
Engineering work compounds
```

```text
Project Memory
        ↓
Repository knowledge compounds — from every tool that ever touched it,
into one place.
```

The goal is not to replace coding agents.

The goal is to make the next coding agent start further ahead — from one
trustworthy memory system, not from several competing ones left behind by
whichever tools came before it.

---

## Project

**Project Memory**

Durable, evidence-backed memory for coding agents.

Repository:

[https://github.com/LoveDoLove/Project-Memory-Agent](https://github.com/LoveDoLove/Project-Memory-Agent)

---

<p align="center">
  <sub>Build once. Learn once. Reconcile everywhere. Let the next agent start further ahead.</sub>
</p>

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/Project-Memory-Agent.svg
[issues-url]: https://github.com/LoveDoLove/Project-Memory-Agent/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE
