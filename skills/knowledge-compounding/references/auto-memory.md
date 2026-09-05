# Auto-Memory Reference

Detailed rules for scanning existing Project Memory before compounding
to prevent duplicates and enable strengthening.

---

# Scan Process

## Step 1: Read MEMORY.md

```text
1. Read MEMORY.md (if it exists)
2. Read domain indexes (docs/*/README.md)
3. Read solution indexes (docs/solutions/README.md)
4. Build a map of existing knowledge
```

## Step 2: Keyword Search

```text
1. Extract keywords from current work:
   - Problem description
   - Affected modules
   - Technologies used
   - Error messages
   - Function names

2. Search existing knowledge for each keyword:
   - Exact matches
   - Partial matches
   - Related terms

3. Rank results by relevance:
   - High: exact keyword match in title or problem
   - Medium: keyword match in content
   - Low: related term match
```

## Step 3: Contextual Review

```text
1. Read potentially related knowledge
2. Extract relevant learnings
3. Check if learnings are still current:
   - Verify against codebase
   - Check last_verified date
   - Assess if code has changed
```

## Step 4: Determine Action

```text
If related knowledge exists:
  - Strengthen: add new evidence to existing knowledge
  - Update: correct outdated information
  - Consolidate: merge scattered duplicates
  - Link: connect related knowledge
  - Ignore: knowledge is already adequate

If no related knowledge exists:
  - Create: compound new knowledge
```

---

# Provenance Tagging

When auto-memory scan finds related knowledge, tag the provenance:

```text
Source: MEMORY.md -> domain/index.md -> unit.md
Status: active | superseded | deprecated | historical
Relevance: high | medium | low
```

## Usage

```text
- Source: helps locate the original knowledge
- Status: determines if knowledge is current
- Relevance: guides strengthening decisions
```

---

# Strengthening Rules

When current work provides new evidence for existing knowledge:

```text
1. Verify the existing knowledge is still accurate
2. Add the new evidence
3. Update the last_verified date
4. Strengthen the knowledge (do not create duplicate)
```

## Strengthening Format

```text
Existing:     "Use approach B."
New evidence: "Approach A fails on Android 11 because of X."
Better:       "Use B; A was rejected because X fails on Android 11."
```

---

# Integration with Workflow

```text
Step 0 (Before Compounding) -> Auto-Memory Scan -> Durable Bar Test
```

Auto-memory scan runs BEFORE the durable bar test. If related knowledge
exists, the durable bar test applies to the strengthening action.

---

# Quality Rules

```text
- Do not create duplicates; prefer strengthening existing knowledge
- Do not create a Lesson merely because a Solution exists
- Preserve rejected approaches only when future Agents may repeat them
- Prefer compact knowledge over chronological narrative
```

---

# References

- `knowledge-compounding` - main compounding workflow
- `memory-edit` - how to apply changes
- `knowledge-classification` - knowledge type definitions