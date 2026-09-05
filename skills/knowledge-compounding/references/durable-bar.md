# Durable Bar Reference

Detailed criteria for the counterfactual test that determines whether
knowledge belongs in Project Memory.

---

# The Durable Bar Test

> If this learning disappeared, would a future Agent reading the final
> implementation, tests, and existing docs still repeat the mistake or
> redo substantial investigation?

The durable bar is the primary gate for all knowledge. It outranks all
other criteria.

---

# Test Criteria

## Pass Criteria

Knowledge passes the durable bar when:

```text
1. The knowledge is NOT readily recoverable from:
   - Final implementation code
   - Tests
   - Existing documentation
   - Configuration files
   - Git history

2. Losing the knowledge would plausibly cause:
   - Recurrence of a mistake
   - Material risk
   - Substantial rediscovery
   - Expensive investigation
```

## Fail Criteria

Knowledge fails the durable bar when:

```text
1. The knowledge IS readily recoverable from:
   - Reading the obvious nearby code
   - Existing tests
   - Current documentation
   - Configuration files

2. Losing the knowledge would NOT cause:
   - Recurrence of mistakes
   - Material risk
   - Substantial rediscovery
```

---

# What Never Establishes Eligibility

```text
- Completion of work
- Effort invested
- Diff size
- Number of commits
- Number of tests
- Time spent debugging
```

A learning earns its place only when it holds durable reasoning that is
**not readily recoverable** from the artifacts the work left behind.

---

# Examples

## Pass Example

```text
Learning: "Build strategy A fails because generated sources are
unavailable during initial configuration. The project requires
strategy B."

Test: Would a future Agent rediscover this by reading the build config?
Answer: No - the config shows the current strategy but not why the
other strategy was rejected.

Verdict: PASSES durable bar
```

## Fail Example

```text
Learning: "The project uses TypeScript for type safety."

Test: Would a future Agent rediscover this by reading the codebase?
Answer: Yes - package.json shows TypeScript, tsconfig.json exists,
code uses TypeScript syntax.

Verdict: FAILS durable bar
```

---

# Integration with Workflow

```text
Step 0 (Before Compounding) -> Durable Bar Test -> Step 1 (Collect Context)
```

The durable bar test runs BEFORE any other compounding work. If the test
fails, compounding stops immediately - no research, no analysis, no proposal.

---

# Quality Gates

## One Learning Per Run

```text
- Grounding assumes a single solved problem
- Overlap detection assumes a single knowledge unit
- Cross-referencing assumes a single proposal
```

When several findings qualify, rank them, then compound the single
strongest one this run.

## Evidence Required

```text
- Every claim must have evidence
- Every evidence must have a source
- Every source must be verifiable
```

---

# References

- `knowledge-compounding` - main compounding workflow
- `references/quality-constraints.md` - additional quality gates
- `knowledge-classification` - knowledge type definitions