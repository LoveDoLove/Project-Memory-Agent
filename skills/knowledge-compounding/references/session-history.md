# Session History Reference

Detailed rules for integrating learnings across sessions to prevent
rediscovery and enable continuous improvement.

---

# Two-Stage Probe

## Stage 1: Keyword Search

```text
1. Extract keywords from current work:
   - Problem description
   - Affected modules
   - Technologies used
   - Error messages
   - Function names

2. Search session logs for each keyword:
   - Exact matches
   - Partial matches
   - Related terms

3. Rank results by relevance:
   - High: exact keyword match in problem or solution
   - Medium: keyword match in context
   - Low: related term match
```

## Stage 2: Contextual Review

```text
1. Read related session summaries
2. Extract relevant learnings
3. Check if learnings are still current:
   - Verify against codebase
   - Check session date
   - Assess if code has changed
```

---

# Filtering

## Branch Filtering

```text
- Filter by git branch names
- Focus on current branch
- Check related branches (feature, release, etc.)
```

## Keyword Filtering

```text
- Filter by terms from current work
- Include related terms
- Exclude irrelevant matches
```

## Timeframe Filtering

```text
- Recent sessions (last N days)
- Focus on recent work
- Check older sessions for patterns
```

## Subsystem Filtering

```text
- Filter by affected module or area
- Focus on current subsystem
- Check related subsystems
```

---

# Cross-Session Learning

## Pattern Detection

```text
When session history reveals patterns:
1. Identify recurring issues or approaches
2. Extract the pattern as a Lesson or Workflow
3. Verify against current codebase
4. Compound if durable
```

## Pattern Types

```text
Recurring Issues:
  - Same error in multiple sessions
  - Same approach tried and failed
  - Same constraint encountered

Recurring Approaches:
  - Same solution applied successfully
  - Same workflow followed
  - Same tool or library used
```

---

# Integration with Workflow

```text
Step 0 (Before Compounding) -> Session History Probe -> Auto-Memory Scan
```

Session history probe runs BEFORE auto-memory scan. It provides
additional context for identifying related knowledge.

---

# Quality Rules

```text
- Verify session learnings against current codebase
- Do not compound session observations without verification
- Focus on durable patterns, not one-time occurrences
- Preserve important historical context
```

---

# References

- `knowledge-compounding` - main compounding workflow
- `auto-memory.md` - auto-memory scan rules
- `knowledge-classification` - knowledge type definitions