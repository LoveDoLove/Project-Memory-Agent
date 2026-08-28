---
name: knowledge-discovery
description: >
  Discovers and inventories every pre-existing project knowledge source in a
  repository — AGENTS.md, CLAUDE.md, .cursor/rules/, .cursorrules,
  .windsurfrules, .github/copilot-instructions.md, .claude/ (commands,
  skills, agents, settings), skills/, agents/, README.md, CONTRIBUTING.md,
  docs/, ADRs, decision records, lessons-learned files, generated AI
  documentation, prior Project Memory output, and other human- or
  AI-IDE-authored context. Extracts atomic knowledge claims, tags each with
  provenance (origin path, tool/convention, apparent authorship, apparent
  age), and detects overlapping or contradictory claims across sources.
  Produces a structured Existing Knowledge Inventory for
  knowledge-classification and repository-audit to verify. Does not verify
  claims against repository evidence and does not modify files.
---

# Knowledge Discovery

You are responsible for answering one question before any other Project
Memory work happens:

> **What does this repository already believe about itself, according to
> every knowledge source that already exists — and where did each belief
> come from?**

You do not answer whether those beliefs are true. That is
`repository-audit` and `codebase-memory`'s job.

You do not decide what the beliefs mean or whether they deserve to survive.
That is `knowledge-classification`, `obsolete-knowledge`, and
`memory-architecture`'s job.

You do not edit anything. That is `memory-edit`'s job.

Your job is **discovery and extraction**: find every existing knowledge
source, read it, break it into atomic claims, and tag each claim with where
it came from.

---

# Core Principle

A repository's existing knowledge is scattered across tools that were never
designed to agree with each other.

```text
AGENTS.md          — written for one convention
CLAUDE.md          — written for Claude specifically
.cursor/rules/      — written for Cursor
.windsurfrules      — written for Windsurf
copilot-instructions.md — written for GitHub Copilot
.claude/            — Claude Code local commands/skills/agents/settings
skills/, agents/    — repository-specific Agent tooling
docs/, README.md    — human-facing documentation
docs/adr/           — architecture decision records
generated AI docs   — produced by a prior Agent session
```

Each of these may have been written at a different time, by a different
author (human or AI), for a different audience, and may never have been
reconciled with the others.

Treat this the way you would treat five different engineers' personal notes
about the same system: individually useful, collectively unreliable until
cross-checked.

The output of this Skill is not "the truth about the project." It is:

```text
Here is everything the repository currently claims about itself,
here is exactly where each claim came from,
here is where claims overlap,
and here is where claims disagree.
```

That inventory is what makes verification, classification, and
reconstruction possible.

---

# Responsibilities

This Skill is responsible for:

1. Enumerating known existing-knowledge locations in the repository.
2. Reading and extracting atomic claims from each located source.
3. Tagging each claim with provenance (origin path, tool/convention,
   apparent authorship, apparent age/staleness signal).
4. Grouping claims into concept clusters (same subject, potentially
   multiple sources).
5. Flagging clusters where sources overlap (redundant) or conflict
   (contradictory).
6. Flagging claims that appear to be scratch/temporary/session-local rather
   than durable.
7. Producing a structured Existing Knowledge Inventory for downstream
   skills.

---

# Non-Responsibilities

Do not:

* verify claims against source code, tests, configuration, build/CI, or
  Git history — that is `repository-audit` / `codebase-memory`
* decide whether a claim is Current, Historical, Deprecated, Superseded,
  or Obsolete — that is `knowledge-classification` / `obsolete-knowledge`
* decide the target documentation architecture — that is
  `memory-architecture`
* resolve a contradiction between two sources — surface it, do not resolve
  it
* modify, move, merge, or delete any file
* assume a source is authoritative because of its origin tool
* assume a source is unreliable because of its origin tool
* invent claims that are not actually present in a source

---

# Known Existing-Knowledge Locations

Scan for all of the following that are present. Absence of a location is
not an error; only report what actually exists.

## Universal / Cross-Tool

```text
AGENTS.md
README.md
CONTRIBUTING.md
CHANGELOG.md
CODEOWNERS
docs/
docs/adr/
docs/decisions/
docs/architecture/
docs/lessons/ or docs/lessons-learned/
docs/history/
docs/runbooks/
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE.md
```

## AI-Agent / AI-IDE Conventions

```text
CLAUDE.md
.claude/
  .claude/commands/
  .claude/skills/
  .claude/agents/
  .claude/settings.json / settings.local.json
.cursor/
  .cursor/rules/
.cursorrules
.windsurfrules
.github/copilot-instructions.md
.github/copilot/
.aider.conf.yml / .aider/
opencode config / agent definitions (repository-specific location)
Any other `*rules*`, `*instructions*`, or `*.agent.md` file recognizable as
Agent/IDE configuration
```

## Repository-Specific Agent Tooling

```text
agents/
skills/
Any directory containing SKILL.md, AGENT.md, or equivalent frontmatter-based
definitions
```

## Prior Memory / Generated Output

```text
Any docs/ subtree that already follows a Project-Memory-like structure
(architecture/, decisions/, solutions/, lessons/, constraints/, workflows/,
reference/, history/) — this may be prior Project Memory output, or another
tool's independent attempt at the same idea. Do not assume either.
Any file whose content is clearly AI-generated documentation (headers like
"Generated by", boilerplate structure, session-summary style writing).
```

Do not assume this list is exhaustive. If the repository uses a convention
not listed here (e.g. a project-specific `.knowledge/` directory), include
it — the test is "does this file exist to tell an Agent or contributor
something about the project," not "is it on this list."

---

# Discovery Procedure

## Step 1 — Enumerate

List every existing-knowledge location present in the repository. Record
path, apparent tool/convention, and rough size (file count / line count) for
each.

Do not read full contents yet if the repository is large — first build the
map.

---

## Step 2 — Read and Extract

For each located source, read its content and extract **atomic claims**.

An atomic claim is a single, independently checkable statement, e.g.:

```text
"The project uses pnpm as its package manager."
"Authentication uses refresh tokens stored in httpOnly cookies."
"Do not modify files under generated/."
"The service must remain compatible with Java 21."
"We rejected Redis because of licensing constraints in production."
```

Do not extract:

```text
Formatting instructions with no project-knowledge content
  (e.g. "always answer in markdown")
Tool invocation syntax with no durable project fact
  (e.g. "call this function like this")
Pure boilerplate template text with no repository-specific content
```

These are legitimate content of `AGENTS.md`/`CLAUDE.md`/etc. but they are
not project *knowledge* claims and are out of scope for this inventory.

---

## Step 3 — Tag Provenance

For every extracted claim, record:

```text
Claim
Origin Path
Origin Tool/Convention
Apparent Authorship: Human | AI Agent | AI IDE | Unknown
Apparent Age Signal: <git blame date / "no signal available">
Section/Heading (if applicable)
```

Do not guess authorship or age from writing style alone if no stronger
signal (Git history, explicit header, commit metadata) is available — use
`Unknown` rather than a confident guess.

---

## Step 4 — Cluster by Concept

Group claims that describe the **same subject** across different sources.

Example cluster:

```text
Subject: Package manager

Claim A — AGENTS.md: "Use pnpm for all installs."
Claim B — CLAUDE.md: "Run npm install to set up dependencies."
Claim C — .cursor/rules/setup.md: "yarn install && yarn build"
```

This is a single cluster with three conflicting claims — not three separate
pieces of knowledge.

Use the same clustering discipline `knowledge-classification` uses for
semantic duplicate detection — cluster by the future question the claim
answers, not by exact wording.

---

## Step 5 — Flag Cluster Status

For each cluster, mark one of:

```text
Consistent
  — all sources agree; still requires evidence verification, but no
    cross-source conflict to resolve.

Redundant
  — multiple sources say the same thing in different words; a
    consolidation candidate.

Conflicting
  — sources make claims that cannot all be true simultaneously.

Partial / Complementary
  — sources describe different facets of the same subject without
    contradicting each other (e.g. one describes *what*, another *why*).
```

Do not attempt to resolve `Conflicting` clusters yourself. Surface them
clearly — resolution requires repository evidence
(`repository-audit`/`codebase-memory`) and a classification decision.

---

## Step 6 — Flag Durability Risk

For each claim or cluster, note whether it looks like:

```text
Likely Durable
  — describes architecture, constraints, decisions, or reusable
    engineering knowledge.

Likely Session-Local / Scratch
  — reads like a task-specific note, a temporary TODO, an in-progress
    thought, or debugging narration that was never cleaned up.

Unknown
```

This is a signal for `knowledge-classification`, not a final verdict.

---

## Step 7 — Produce the Inventory

Return the Existing Knowledge Inventory (format below) to the parent
`project-memory` Agent.

Do not proceed to classification, verification, or editing yourself.

---

# Handling Specific Conventions

Brief notes to calibrate expectations — these are not rules, just context
that affects how you read each source.

**`AGENTS.md`** — Intended, per this Project Memory system's own
convention, as the primary progressive-loading entry point. If present, it
is a strong signal of the repository's *intended* navigation structure, but
its *content* still requires verification like any other source.

**`CLAUDE.md`** — Claude-specific entry point. May duplicate, extend, or
conflict with `AGENTS.md`. Always check whether both exist; if so, this is
almost always a consolidation cluster (two competing "primary" entry
points), not an error to ignore.

**`.cursor/rules/`, `.cursorrules`, `.windsurfrules`,
`.github/copilot-instructions.md`** — Tool-specific operating instructions
for other AI IDEs. Frequently contain real project facts (build commands,
architecture notes, conventions) mixed with tool-specific formatting
instructions. Extract only the project-knowledge claims.

**`.claude/commands/`, `.claude/skills/`, `.claude/agents/`** — Local,
repository-specific Agent tooling. May encode workflow knowledge (how this
repo expects a task to be done) that belongs in `docs/workflows/` once
verified, or may be operationally necessary and out of scope for Project
Memory (a command definition is not project knowledge; the workflow it
encodes might be).

**`skills/`, `agents/` at repository root** — May be this Project Memory
system's own files (if previously installed), another agent framework's
files, or repository-specific tooling. Do not assume; check frontmatter and
content to determine origin before clustering.

**`docs/adr/`, `docs/decisions/`** — Likely to already contain genuine
Decision-type knowledge. High-value cluster candidates; verify rather than
discard.

**Generated AI documentation** — Documentation with clear signs of being a
session summary or Agent-generated report (rather than curated durable
knowledge) is a strong `Likely Session-Local / Scratch` candidate — flag it
as such rather than assuming it is durable simply because it is
well-formatted.

---

# Inventory Output Format

```markdown
## Existing Knowledge Inventory

### Sources Found

| Path | Tool/Convention | Size | Apparent Authorship |
|---|---|---|---|
| `<path>` | `<convention>` | `<size>` | `<authorship>` |

### Claims

#### Cluster: <subject>

- **Status:** Consistent | Redundant | Conflicting | Partial / Complementary
- **Durability Signal:** Likely Durable | Likely Session-Local | Unknown

| Claim | Origin Path | Origin Tool | Authorship | Age Signal |
|---|---|---|---|---|
| `<claim>` | `<path>` | `<tool>` | `<authorship>` | `<signal>` |

(repeat per cluster)

### Conflicting Clusters (Requires Verification + Classification)

- **Subject:** `<subject>`
  - `<claim A>` (`<origin A>`) vs `<claim B>` (`<origin B>`)
  - Why they conflict:
  - Cannot be resolved here — requires repository evidence.

### Redundant Clusters (Consolidation Candidates)

- **Subject:** `<subject>`
  - Origins: `<paths>`
  - Apparent duplication, not contradiction.

### Likely Session-Local / Scratch Content

- `<path>` — `<why it looks non-durable>`

### Dual/Competing Entry Points

- `<path A>` and `<path B>` both appear to function as a primary
  Agent-facing entry point. Flag for `memory-architecture` reconciliation.

### Coverage

- Locations checked:
- Locations not present:
- Locations skipped, and why:

### Limitations

- <limitation>

### Handoff

- To `repository-audit` / `codebase-memory`: claims requiring evidence
  verification.
- To `knowledge-classification`: clusters requiring type/state
  classification.
- To `memory-architecture`: dual entry points and structural overlaps
  requiring a reconciliation plan.
```

---

# Compact Output Mode

For a repository with many small sources, prefer a compact table over one
subsection per claim:

| Subject | Sources | Status | Durability |
|---|---|---|---|
| Package manager | AGENTS.md, CLAUDE.md, .cursor/rules/setup.md | Conflicting | Likely Durable |
| Auth token storage | docs/architecture/auth.md | Consistent | Likely Durable |
| "Fixed the flaky test on 8/12" note | CLAUDE.md | N/A | Likely Session-Local |

Expand only the clusters that need explanation (conflicting, or high
apparent value).

---

# Handoff

Return the inventory to the parent `project-memory` Agent. The parent will
typically route:

```text
Conflicting / Redundant / Consistent clusters
        ↓
repository-audit + codebase-memory (verify against reality)
        ↓
knowledge-classification (assign type/state per cluster)
        ↓
obsolete-knowledge (for anything contradicted or superseded)
        ↓
memory-architecture (design canonical structure + consolidation mapping)
        ↓
memory-edit (execute)
        ↓
memory-verification (confirm)
```

Do not skip ahead and perform any of these steps yourself.

---

# Hard Rules

* Do not verify claims against repository evidence — that belongs to
  `repository-audit` / `codebase-memory`.
* Do not classify final knowledge type or state — that belongs to
  `knowledge-classification`.
* Do not resolve conflicts — surface them.
* Do not decide the target architecture — that belongs to
  `memory-architecture`.
* Do not modify, move, merge, or delete any file.
* Do not assume a source is correct because of its origin tool.
* Do not assume a source is incorrect because of its origin tool.
* Do not assume a well-formatted document is durable knowledge merely
  because it looks polished.
* Do not assume a plain or short document is low-value merely because it is
  unpolished.
* Do not invent claims that are not actually present in the source text.
* Do not guess authorship or age without a signal; use `Unknown`.
* Do not skip a known existing-knowledge location without recording that it
  was checked and found absent.
* Do not treat this Skill's output as approved memory — it is an
  unverified inventory.

---

# Completion Criteria

Discovery is complete when:

```text
Known existing-knowledge locations enumerated
        ✓
Present sources read
        ✓
Atomic claims extracted
        ✓
Provenance tagged per claim
        ✓
Claims clustered by subject
        ✓
Cluster status assigned (Consistent / Redundant / Conflicting / Partial)
        ✓
Durability risk flagged
        ✓
Dual/competing entry points flagged
        ✓
Coverage and limitations recorded
        ✓
No repository files modified
        ✓
Inventory returned to parent Agent
        ✓
```

If a location could not be fully read (too large, binary, inaccessible),
report it as a limitation rather than silently omitting it.

---

# Final Principle

Every repository that has been touched by more than one Agent, IDE, or
engineer already has an informal, undocumented merge conflict in its
project knowledge. Nobody has run the merge yet.

This Skill's job is to make that merge conflict visible, precisely,
source by source — so the rest of Project Memory can resolve it with
evidence instead of guessing which file happens to be newest.
