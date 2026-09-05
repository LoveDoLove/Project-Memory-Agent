# Quality Constraints Reference

Detailed quality gates and constraints for knowledge compounding.

---

# One Learning Per Run

## Constraint

```text
Grounding, overlap detection, and cross-referencing each assume a single
solved problem. When several findings qualify, rank them, then compound
the single strongest one this run.
```

## Why

```text
- Grounding validation assumes focused attention on one claim
- Overlap detection assumes one knowledge unit to compare
- Cross-referencing assumes one proposal to integrate
```

## Handling Multiple Findings

```text
1. Rank all findings by durable value
2. Compound the single strongest one
3. List lower-ranked candidates as "deferred"
4. Parent Agent runs compounding again for next candidate
```

## Rules

```text
- Never batch several unrelated learnings into one proposal
- Never merge rationale to share a write
- A proposal may list deferred candidates with one line each
```

---

# Evidence Confidence Scale

## Definitions

```text
High     - verified against multiple sources (code + tests + config)
Medium   - verified against one source (code or tests)
Low      - partially verified or inferred
Unknown  - cannot verify mechanically
```

## Usage

```text
- Every knowledge proposal must include evidence confidence
- Confidence affects compounding value assessment
- Low/Unknown confidence requires additional verification
```

---

# Compounding Value Scale

## Definitions

```text
High     - substantially affects future engineering decisions
Medium   - useful within a subsystem or recurring workflow
Low      - narrow; preserve only if retrieval cost is low
None     - do not compound
```

## Usage

```text
- Every knowledge proposal must include compounding value
- None value means Ignore action
- Low value means preserve only if retrieval is cheap
```

---

# Lifecycle States

## States

```text
active      - current and applicable
superseded  - replaced by newer knowledge
deprecated  - no longer recommended
historical  - preserved for reference
```

## Transitions

```text
active -> superseded (when newer knowledge replaces it)
active -> deprecated (when no longer recommended)
active -> historical (when no longer current but has value)
superseded -> historical (when superseding knowledge is itself superseded)
```

---

# Quality Checklist

Before publishing a knowledge proposal:

```text
- [ ] Durable bar test passed
- [ ] Evidence confidence assigned
- [ ] Compounding value assigned
- [ ] Lifecycle state determined
- [ ] One learning per run (not batched)
- [ ] All claims grounded
- [ ] Existing memory checked
- [ ] Duplicates avoided
```

---

# Integration with Workflow

```text
Step 7 (Determine Action) -> Quality Constraints -> Step 8 (Produce Proposal)
```

Quality constraints are applied after action determination but before
proposal production. They ensure the proposal meets all quality gates.

---

# References

- `knowledge-compounding` - main compounding workflow
- `references/durable-bar.md` - durable bar test criteria
- `knowledge-classification` - knowledge type definitions