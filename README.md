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

- [Quick Start](#quick-start)
- [Why Project Memory](#why-project-memory)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Skills](#skills)
- [Memory Structure](#memory-structure)
- [Design Principles](#design-principles)
- [Project Status & Roadmap](#project-status--roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

### Install (Windows PowerShell)

```powershell
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

The installer downloads the Project Memory Agent and its 8 Skills from this
repository and copies them into your chosen agent's **global** config
directory. Pick a target from the menu:

```text
1 OpenCode  2 Codex  3 Claude  4 All  Q Quit
```

| Target | Skills | Agent |
|--------|--------|-------|
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/agents/project-memory.md` |
| Codex | `~/.agents/skills/` | `~/.codex/agents/project-memory.toml` |
| Claude | `~/.claude/skills/` | `~/.claude/agents/project-memory.md` |

Run via `irm | iex` (stdin redirected), the installer defaults to `all`
non-interactively. `all` writes skills to `~/.claude/skills` (covers both
Claude and OpenCode) and `~/.agents/skills` (Codex), plus the agent in each
tool's native format — without double-loading OpenCode.

From a local checkout, additional options are available:

```powershell
powershell -ExecutionPolicy Bypass -File ./install.ps1 -Target all   # skip the menu
powershell -ExecutionPolicy Bypass -File ./install.ps1 -Verify       # dry-run, no writes
powershell -ExecutionPolicy Bypass -File ./install.ps1 -Branch dev   # install from a branch
```

Codex note: spawning subagents requires `[features] multi_agent = true` in
`~/.codex/config.toml`. The installer prints this hint but never edits your
config.

### Use

Once installed, invoke the orchestrator in your agent:

```text
@project-memory
```

It discovers any existing knowledge sources, inspects the repository,
determines the current state of project memory, and reports what should be
retained, changed, merged, moved, or removed — across every origin tool it
finds, not only its own prior output.

### Manual Install (any platform)

Clone the repository and copy `agents/` and `skills/` into your agent's
configuration directory, following the table above.

```bash
git clone https://github.com/LoveDoLove/Project-Memory-Agent.git
```

---

## Why Project Memory

AI coding agents repeatedly rediscover the same project knowledge — and,
increasingly, they repeatedly write their own competing copy of it.

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

The core principle:

> **Engineering knowledge should become more useful over time — and there
> should only ever be one authoritative copy of it.**

Every pre-existing knowledge source (`AGENTS.md`, `CLAUDE.md`,
`.cursor/rules/`, prior AI-IDE output, human notes) is treated as a
**candidate that requires verification** — never as ground truth simply
because it exists, looks polished, or was written by another capable Agent.
The default outcome is reconstruction into one architecture, not new files
added alongside unexamined old ones.

---

## How It Works

Project Memory uses a primary orchestrator with specialized Skills:

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

A typical operation follows the memory loop:

```text
 1. Understand & discover existing knowledge
 2. Discover repository evidence
 3. Verify (including every claim pulled from existing sources)
 4. Classify (deduplicate + resolve cross-source conflicts)
 5. Compound
 6. Architect (reconstruction, not just addition)
 7. Clean obsolete knowledge, regardless of origin tool
 8. Edit (including multi-source consolidation)
 9. Verify again
```

Whenever the repository already contains pre-existing knowledge sources and
the task is a full audit, an initial build, or a reconstruction request,
**knowledge-discovery runs first** — discovery tells the agent *what claims
exist to verify*; audit tells it *whether they are true*.

### Key Features

- **Existing-knowledge discovery** — inventories every pre-existing source
  (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/`, ADRs, generated
  AI docs, …) with provenance: origin path, tool, authorship, and overlap /
  conflict clusters.
- **Evidence-based memory** — important claims are verified against source
  code, tests, config, build/CI, and Git history. Documentation ≠ evidence.
- **Knowledge classification** — current facts, architecture, decisions,
  solutions, lessons, constraints, workflows, reference, history, obsolete.
- **Current-state awareness** — Current / In-Progress / Deprecated /
  Superseded / Historical / Unknown statuses keep old guidance from looking
  current.
- **Cross-source conflict resolution** — `AGENTS.md` says pnpm,
  `.cursor/rules/` says npm? Resolved by repository evidence, not by
  whichever file looks newest.
- **Knowledge compounding** — completed work and buried rationale become
  reusable Solutions and Lessons, not more documents.
- **Obsolete-knowledge management** — stale content is deleted, marked
  deprecated/superseded, or preserved as history, regardless of which tool
  produced it.
- **Canonical ownership** — one primary home per concept; everything else
  references it.
- **Dual entry-point reconciliation** — competing `AGENTS.md` / `CLAUDE.md`
  / `.cursor/rules/` entry points collapse into one canonical entry point
  plus thin pointers.
- **Final verification gate** — repository consistency, duplicate ownership,
  references, navigation, migration completeness → PASS / PASS WITH
  WARNINGS / FAIL / BLOCKED.
- **Self-managing context** — the orchestrator enforces its own token discipline:
  skills load one at a time on demand, evidence is capped to sourced pointers,
  and mechanical edits delegate to bounded subagents under context pressure.
- **Self-auditing** — a Memory Health quality bar plus a Self-Audit directive make
  the agent run its own pipeline on its own repository to catch memory drift
  before it claims others' memory is accurate.

---

## Usage

### Audit an Entire Project

```text
@project-memory
```

The agent discovers existing knowledge sources, inspects the repository,
determines the existing state of its project memory, and reports what should
be retained, changed, merged, moved, or removed — across every origin tool
it finds, not only its own prior output.

### Audit a Specific Domain

```text
@project-memory

Audit the authentication architecture and update the project memory.
```

Only the relevant repository scope is investigated when the task is clearly
bounded.

### Build Memory in a Repository That Already Has Documentation

```text
@project-memory

Build the initial project memory for this repository. It already has an
AGENTS.md, a CLAUDE.md, and some notes under docs/.
```

The result is a reconstructed memory system — not the original files left
untouched with new files added beside them.

### Reconcile Fragmented or Conflicting Memory

```text
@project-memory

Our AGENTS.md, CLAUDE.md, and .cursor/rules/ all describe the build process
differently. Reconcile them.
```

The agent inventories all three sources, verifies which claim (if any)
matches reality, resolves the conflict with evidence, and consolidates them
into one canonical description with the other files reduced to thin pointers
or removed.

### Update Memory After Engineering Work

```text
@project-memory

Review the changes from this feature and compound any durable project knowledge.
```

This is where Project Memory becomes useful as a long-term system rather
than a one-time documentation generator.

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

The Project Memory Agent orchestrates these Skills progressively — you do
not normally need to invoke each Skill manually.

When available, the agent can also delegate to specialized agents:

- **`codebase-memory`** — read-only graph-based repository evidence layer
  (where functionality exists, module relationships, call paths, whether
  implementation supports a documented claim).
- **`cavecrew-builder`** — bounded mechanical edits (typo fixes, broken
  links, path updates, single-file thin-pointer conversions). Never for
  multi-source consolidation.

---

## Memory Structure

`AGENTS.md` is the primary progressive-loading entry point. It contains only
high-signal information — project identity, critical rules, minimal
architecture orientation, verification requirements, and documentation
navigation — and is the **only** file playing this role. Other tool-specific
entry points point to it rather than maintaining parallel, divergent copies.

```text
AGENTS.md
    ↓
docs/<domain>/README.md        (domain index)
    ↓
docs/<domain>/<topic>.md       (focused knowledge unit)
    ↓
related knowledge, only when required
```

A typical repository may look like:

```text
repository/
│
├── AGENTS.md
├── CLAUDE.md            (thin pointer to AGENTS.md, if present)
│
└── docs/
    ├── architecture/    # how the current system works
    ├── decisions/       # why the project chose each direction
    ├── lessons/         # reusable engineering lessons
    ├── workflows/       # repeatable procedures (dev, test, release, ops)
    ├── constraints/     # non-negotiable boundaries (security, compatibility)
    ├── reference/       # useful on-demand knowledge
    └── history/         # old context that still explains the present
```

This is a pattern, not a mandatory scaffold. Only domains containing useful
verified knowledge are created; existing conventions (e.g. `docs/adr/`
instead of `docs/decisions/`) are adapted to, not force-renamed.

Each knowledge unit carries frontmatter metadata (title, type, status,
stability, scope, evidence, related) and one independently retrievable
concept in its Markdown body.

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
out duplicated across several different tools' memory files. Use references
instead of maintaining duplicate copies.

### Progressive Loading

Agents should load only the knowledge relevant to the current task, from one
unambiguous entry point.

### Small Knowledge Units

A knowledge file should represent one independently retrievable concept.

### Compound, Don't Accumulate

Every retained knowledge unit should provide future engineering value. More
documentation does not automatically mean better memory, and more competing
copies of the same fact never do.

### Verification Is Mandatory

Documentation is not considered authoritative merely because it exists —
including documentation Project Memory itself wrote in a previous run.

### Unknown Is a Valid State

When evidence is insufficient, `Unknown` is better than an invented answer,
and better than silently trusting whichever existing source happened to be
found first.

### Preserve Useful History

Historical knowledge should be removed only when it has no remaining
explanatory value. A rejected architectural approach can be important even
after the implementation has disappeared.

---

## Project Status & Roadmap

Project Memory currently includes the core agent orchestration and memory
lifecycle:

```text
[x] Project Memory orchestrator
[x] Existing-knowledge discovery (multi-source, multi-tool)
[x] Repository audit
[x] Knowledge classification + cross-source conflict resolution
[x] Knowledge compounding
[x] Memory architecture (including multi-source reconstruction)
[x] Dual entry-point reconciliation
[x] Obsolete knowledge management
[x] Memory editing workflow
[x] Memory verification
[x] Progressive-loading model + current/historical separation
[x] Canonical knowledge ownership
[x] Platform-specific installation helpers (install.ps1: OpenCode, Codex, Claude)
```

Delivered (recently):

- [x] Memory health checks — a Memory Health quality bar in the orchestrator plus a guardrail Pester test that keeps skills, manifest, and agent files in sync.
- [x] Knowledge quality metrics — the Memory Health rubric (evidence pointer per claim, zero unresolved conflicts, obsolete labelled, no duplicate homes).
- [x] Incremental maintenance + drift detection — a Self-Audit directive runs the pipeline on this repo itself.

Planned:

- [ ] Automated stale-reference detection
- [ ] Automated duplicate detection across origin tools
- [ ] Automated orphan detection
- [ ] Improved repository coverage reporting
- [ ] Broader agent-platform compatibility
- [ ] More repository-aware integrations
- [ ] Knowledge dependency tracking
- [ ] Cross-project memory patterns

See the GitHub Issues for proposed features and ongoing work.

---

## Contributing

Contributions are welcome.

Before adding a new feature, consider whether it belongs as agent
orchestration, a specialized Skill, a verification mechanism, a repository
integration, or a new existing-knowledge source pattern that
`knowledge-discovery` should recognize. Avoid adding complexity simply to
increase the number of agents or Skills.

### Development Principles

1. Prefer evidence over assumptions.
2. Keep responsibilities clearly separated.
3. Avoid duplicate knowledge, including across origin tools.
4. Preserve important historical rationale.
5. Keep progressive loading efficient.
6. Verify changes before considering them complete.
7. Prefer simple mechanisms over unnecessary orchestration.
8. Never treat a pre-existing file as correct merely because it exists.

### Testing

The installer ships Pester 3.4.0 tests (Windows PowerShell 5.1). Run them from a checkout:

```powershell
Invoke-Pester ./install.tests.ps1
```

7 tests cover installer targets, the `all` no-double-load rule, and a guardrail
that keeps the 8 skills, their manifest (`$Skills` in `install.ps1`), and both
agent files (`project-memory.md` / `project-memory.toml`) in sync.

### Pull Requests

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Verify the affected Agent or Skill.
5. Update documentation when behaviour changes.
6. Open a pull request with a clear description of the change.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more
information.

---

## Acknowledgments

Inspired by the idea behind
[Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin):
engineering work should make subsequent engineering work easier. Project
Memory applies that idea specifically to **repository knowledge**.

The goal is not to replace coding agents. The goal is to make the next
coding agent start further ahead — from one trustworthy memory system, not
from several competing ones left behind by whichever tools came before it.

---

## Project

**Project Memory** — durable, evidence-backed memory for coding agents.

Repository: [https://github.com/LoveDoLove/Project-Memory-Agent](https://github.com/LoveDoLove/Project-Memory-Agent)

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
