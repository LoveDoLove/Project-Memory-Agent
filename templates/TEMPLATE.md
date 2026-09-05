# Solution Document Template

Use this template when creating new Solution documents in `docs/solutions/`.

---

# YAML Frontmatter

Every Solution document requires YAML frontmatter. The schema supports two
tracks: **Bug track** for diagnosed defects and **Knowledge track** for
practice gaps.

## Bug Track

Use when the problem is a diagnosed defect.

```yaml
---
title: "Short descriptive title"
problem_type: bug
category: "bug | test_failure | runtime_error | performance_issue | integration_issue | security_issue | ui_bug | logic_error | build_error"
module: "affected module or subsystem"
status: "active | superseded | deprecated | historical"
created: "YYYY-MM-DD"
last_verified: "YYYY-MM-DD"
applies_when: "conditions where this applies (optional for bug track)"
symptoms:
  - "observable failure or symptom 1"
  - "observable failure or symptom 2"
root_cause: "verified mechanism that caused the defect"
resolution_type: "code_fix | migration | config_change | test_fix | dependency_update | refactor"
tags:
  - "tag1"
  - "tag2"
related:
  - "path/to/related/document.md"
severity: "critical | high | medium | low"
---
```

## Knowledge Track

Use when the problem is a gap in practice.

```yaml
---
title: "Short descriptive title"
problem_type: knowledge
category: "best_practice | convention | tooling_decision | workflow_issue | developer_experience | architecture_pattern | documentation_gap"
module: "affected module or subsystem (optional)"
status: "active | superseded | deprecated | historical"
created: "YYYY-MM-DD"
last_verified: "YYYY-MM-DD"
applies_when: "conditions where this guidance applies"
symptoms:
  - "observable failure or symptom 1 (optional)"
root_cause: "verified mechanism (optional)"
resolution_type: "guidance"
tags:
  - "tag1"
  - "tag2"
related:
  - "path/to/related/document.md"
severity: "critical | high | medium | low"
---
```

---

# Content Sections

## 1. Problem

Describe the problem clearly and concisely. What was the issue? What was the
impact?

## 2. Root Cause

Explain the verified root cause. What mechanism caused the problem? How was
it verified?

## 3. Solution

Describe the solution that was applied. What approach was taken? Why was it
chosen over alternatives?

## 4. Failed / Rejected Approaches

Document approaches that were tried and failed, or considered and rejected.
This prevents future Agents from repeating expensive mistakes.

```markdown
### Approach A — Rejected

**Why tried:** <reason>
**Why failed:** <reason>
**Evidence:** <tests, logs, or other evidence>
**Replacement:** <what was used instead>
```

## 5. Verification

How was the solution verified? What evidence confirms it works?

```markdown
- [ ] Tests pass: <test names>
- [ ] Build succeeds: <build command>
- [ ] Manual verification: <steps>
- [ ] Evidence: <links to logs, screenshots, etc.>
```

## 6. Evidence

List the evidence that supports this document's claims.

```markdown
- Source: <file path and line numbers>
- Test: <test file and function>
- Config: <config file and setting>
- Build: <build log or CI output>
- Git: <commit hash or branch>
```

## 7. Why It Matters

Explain the future engineering value. Why would a future Agent need this
knowledge? What would they rediscover or repeat without it?

## 8. Future Guidance

Provide actionable guidance for future Agents. What should they do or avoid
doing?

## 9. Constraints

Document any constraints, limitations, or conditions that apply.

## 10. References

Link to related knowledge, documentation, or code.

---

# Quality Checklist

Before publishing a Solution document:

- [ ] YAML frontmatter is complete and accurate
- [ ] Problem is clearly described
- [ ] Root cause is verified (not guessed)
- [ ] Solution is evidence-backed
- [ ] Failed approaches are documented
- [ ] Verification steps are provided
- [ ] Evidence is listed with specific references
- [ ] Future guidance is actionable
- [ ] Document passes the durable bar test:
  > If this document disappeared, would a future Agent reading the final
  > implementation, tests, and existing docs still repeat the mistake or
  > redo substantial investigation?

---

# Examples

See `docs/solutions/` for real examples in this repository.

---

# References

- `references/schema.yaml` — canonical frontmatter contract
- `references/concepts-vocabulary.md` — vocabulary rules
- `knowledge-classification` — knowledge type definitions
- `knowledge-compounding` — extraction workflow