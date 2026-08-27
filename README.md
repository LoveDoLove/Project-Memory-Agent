# Project Memory

> Durable, evidence-backed memory for coding agents.

**Project Memory** is an agent-driven knowledge system that gives coding agents
durable, structured, and progressively-loaded memory for software repositories.

It helps agents understand a project, preserve important engineering decisions,
compound lessons learned, remove obsolete knowledge, and avoid repeating
research that has already been done.

> **Code tells agents what exists. Project Memory helps them remember why.**

[![GitHub Stars][stars-shield]][stars-url]
[![GitHub Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

---

## Table of Contents

- [About The Project](#about-the-project)
- [Why Project Memory](#why-project-memory)
- [The Core Idea](#the-core-idea)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
- [Memory Structure](#memory-structure)
- [Skills](#skills)
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

**They repeatedly have to rediscover the same project knowledge.**

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

Without a durable memory system, future agents repeatedly reconstruct this
knowledge from scratch.

Project Memory is designed to solve that problem.

It turns repository knowledge into a maintained, evidence-backed memory system
that future agents can progressively load when they need it.

---

## Why Project Memory?

Traditional documentation tends to accumulate.

Project Memory is designed to **compound**.

```text
Engineering Work
       │
       ▼
Repository Evidence
       │
       ▼
Knowledge Extraction
       │
       ▼
Durable Project Memory
       │
       ▼
Future Agent
       │
       ▼
Less Rediscovery
       │
       ▼
Better Engineering Work
```

The goal is not to document everything.

The goal is to preserve the knowledge that materially improves future engineering
decisions.

### The Problem

Without durable project memory:

```text
Agent A
  │
  ├── investigates architecture
  ├── discovers a rejected approach
  └── fixes a difficult problem
          │
          ▼
       Session ends
          │
          ▼
Agent B
  │
  ├── investigates the same architecture
  ├── tries the rejected approach again
  └── rediscovers the same problem
```

With Project Memory:

```text
Agent A
  │
  ├── investigates
  ├── solves
  └── compounds useful knowledge
          │
          ▼
     Project Memory
          │
          ▼
Agent B
  │
  ├── loads relevant knowledge
  ├── understands the previous decision
  └── starts further ahead
```

---

## The Core Idea

Project Memory is built around one principle:

> **Engineering knowledge should become more useful over time.**

This means memory should not simply grow.

It should become:

- More accurate
- More structured
- Less redundant
- Easier to retrieve
- Better separated by lifecycle
- More strongly supported by evidence

A larger `docs/` directory is not necessarily better memory.

A better memory system contains the **right knowledge in the right place**.

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
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        Repository Audit    Knowledge Model    Memory Architecture
                 │                  │                  │
                 └──────────────────┼──────────────────┘
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

It does not need to load every Skill for every request.

---

## The Memory Loop

A typical Project Memory operation follows:

```text
1. Understand
      ↓
2. Discover
      ↓
3. Verify
      ↓
4. Compare
      ↓
5. Classify
      ↓
6. Compound
      ↓
7. Architect
      ↓
8. Clean obsolete knowledge
      ↓
9. Edit
      ↓
10. Verify again
```

This makes memory maintenance an engineering workflow rather than a
documentation-writing exercise.

---

## Architecture

### Progressive Loading

`AGENTS.md` is the primary entry point.

A future agent should not need to load the entire documentation tree.

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

---

### Knowledge Architecture

A typical repository may look like:

```text
repository/
│
├── AGENTS.md
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

Project Memory should create only domains containing useful knowledge.

---

## Key Features

### Evidence-Based Memory

Project Memory verifies important repository claims against available evidence.

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

When available, `codebase-memory` can provide graph-based repository evidence
before direct source inspection is used as a fallback.

The important distinction is:

```text
Documentation
      ≠
Evidence
```

Documentation must be checked against repository reality when the claim matters.

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

Not everything discovered during an audit deserves permanent memory.

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

This prevents old information from silently appearing to be current guidance.

---

### Knowledge Compounding

Project Memory captures knowledge that has long-term engineering value.

Useful knowledge should help future agents:

- Understand a non-obvious project fact
- Avoid repeating previous research
- Avoid a known mistake
- Understand an architectural decision
- Understand why an alternative was rejected
- Make a better implementation decision
- Continue a migration correctly

The objective is:

> **More leverage, not more documents.**

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

Obsolete information can be:

```text
Deleted
Preserved as Historical
Marked Deprecated
Marked Superseded
```

Historical knowledge is retained when it explains something important about the
current system.

---

### Canonical Knowledge Ownership

Important knowledge should have one primary home.

For example:

```text
Primary:
docs/decisions/security/authentication.md

Referenced by:
AGENTS.md
docs/architecture/security-model.md
```

Project Memory avoids maintaining multiple independent copies of the same
rationale.

---

### Final Verification

Memory changes are not considered complete simply because Markdown files were
created.

The final verification stage checks:

```text
Repository consistency
Knowledge consistency
Lifecycle state
Duplicate ownership
Historical boundaries
Supersession
References
Navigation
Progressive loading
Migration completeness
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
for the task.

---

## Usage

### Audit an Entire Project

Start the Project Memory Agent:

```text
@project-memory
```

It should inspect the repository, determine the existing state of its project
memory, and report what should be retained, changed, moved, or removed.

---

### Audit a Specific Domain

```text
@project-memory

Audit the authentication architecture and update the project memory.
```

The agent should:

```text
Discover
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

### Build Project Memory

```text
@project-memory

Build the initial project memory for this repository.
```

The agent should determine:

- What knowledge already exists
- What knowledge is missing
- What documentation is stale
- Which decisions matter
- Which lessons are worth preserving
- Which knowledge belongs in history
- How the resulting memory should be structured

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

It should **not** become the entire project knowledge base.

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

Historical information that still provides meaningful engineering context.

Historical knowledge should not masquerade as current operational guidance.

---

## Skills

Project Memory intentionally uses specialized Skills instead of placing every
responsibility inside one enormous Agent prompt.

| Skill                      | Responsibility                                  |
| -------------------------- | ----------------------------------------------- |
| `repository-audit`         | Repository discovery and evidence gathering     |
| `knowledge-classification` | Classify and filter discovered knowledge        |
| `knowledge-compounding`    | Turn durable experience into reusable memory    |
| `memory-architecture`      | Design knowledge hierarchy and navigation       |
| `obsolete-knowledge`       | Detect and handle stale or superseded knowledge |
| `memory-edit`              | Apply approved documentation changes            |
| `memory-verification`      | Perform the final consistency and quality gate  |

The Project Memory Agent orchestrates these Skills progressively.

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
- Small focused mechanical changes

Large architectural changes should not be delegated as mechanical edits.

---

## Design Principles

### Evidence Before Memory

Do not create long-term project knowledge before understanding what the repository
can actually prove.

---

### Current Before Historical

Current engineering guidance must remain clearly separated from historical
context.

---

### One Knowledge, One Owner

Important knowledge should have one canonical source.

Use references instead of maintaining duplicate copies.

---

### Progressive Loading

Agents should load only the knowledge relevant to the current task.

---

### Small Knowledge Units

A knowledge file should represent one independently retrievable concept.

---

### Compound, Don't Accumulate

Every retained knowledge unit should provide future engineering value.

More documentation does not automatically mean better memory.

---

### Verification Is Mandatory

Documentation is not considered authoritative merely because it exists.

---

### Unknown Is a Valid State

When evidence is insufficient:

```text
Unknown
```

is better than an invented answer.

---

### Preserve Useful History

Historical knowledge should be removed only when it has no remaining explanatory
value.

A rejected architectural approach can be important even after the
implementation has disappeared.

---

## Project Status

Project Memory currently includes the core agent orchestration and memory
lifecycle:

```text
[x] Project Memory orchestrator
[x] Repository audit
[x] Knowledge classification
[x] Knowledge compounding
[x] Memory architecture
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
- [x] Repository audit Skill
- [x] Knowledge classification
- [x] Knowledge compounding
- [x] Memory architecture
- [x] Obsolete knowledge management
- [x] Memory editing workflow
- [x] Memory verification

### Automation

- [ ] Automated memory health checks
- [ ] Automated stale-reference detection
- [ ] Automated duplicate detection
- [ ] Automated orphan detection
- [ ] Improved repository coverage reporting
- [ ] Knowledge quality metrics

### Agent Ecosystem

- [ ] Broader agent-platform compatibility
- [ ] Platform-specific installation helpers
- [ ] Improved agent interoperability
- [ ] More repository-aware integrations

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

Avoid adding complexity simply to increase the number of agents or Skills.

The goal is to improve the quality, durability, and retrieval efficiency of
project knowledge.

### Development Principles

1. Prefer evidence over assumptions.
2. Keep responsibilities clearly separated.
3. Avoid duplicate knowledge.
4. Preserve important historical rationale.
5. Keep progressive loading efficient.
6. Verify changes before considering them complete.
7. Prefer simple mechanisms over unnecessary orchestration.

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
Repository knowledge compounds
```

The goal is not to replace coding agents.

The goal is to make the next coding agent start further ahead.

---

## Project

**Project Memory**

Durable, evidence-backed memory for coding agents.

Repository:

[https://github.com/LoveDoLove/Project-Memory-Agent](https://github.com/LoveDoLove/Project-Memory-Agent)

---

<p align="center">
  <sub>Build once. Learn once. Let the next agent start further ahead.</sub>
</p>

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/Project-Memory-Agent.svg
[issues-url]: https://github.com/LoveDoLove/Project-Memory-Agent/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE
