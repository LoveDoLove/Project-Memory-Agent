# Memory Change Audit Log

Append-only log of all Project Memory knowledge changes. Each entry records
what changed, why, and with what confidence.

---

### 2026-09-08 — Architecture Evolution (Phase 1)

- **Path:** `AGENTS.md`, `dsh-plugin/dsh/slash-project-memory.mjs`, `skills/memory-edit/SKILL.md`, `docs/architecture.md`
- **Operation:** Update
- **Reason:** Add L0 domain summaries, retrieval trace mode (`--trace`), and knowledge change audit log per OpenViking evolution research
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — Frontmatter Schema Standardization (Phase 2)

- **Path:** `templates/schema.yaml`, `templates/TEMPLATE.md`, `templates/SOLUTIONS.md`
- **Operation:** Update
- **Reason:** Standardize frontmatter across all knowledge types; add `confidence` field; extend `related:` to support typed links; add `domain_readme` schema with freshness fields
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md (typed links proposal)
- **Verified By:** knowledge-classification

### 2026-09-08 — DSH Plugin Enhancements (Phase 3)

- **Path:** `dsh-plugin/dsh/plugin.mjs`
- **Operation:** Update
- **Reason:** Add post-task compounding prompt (agent/post-step listener), freshness warning on session start (checks pending_updates in domain READMEs), COMPOUNDING_ENABLED env var support
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — Agent Documentation Update

- **Path:** `agents/project-memory.md`
- **Operation:** Update
- **Reason:** Document new features: L0 summaries, retrieval trace, audit log, typed links, freshness indicators, post-task compounding
- **Confidence:** High
- **Evidence Source:** docs/research/openviking-evolution-research.md
- **Verified By:** memory-verification

### 2026-09-08 — DSH Plugin Version Bump (0.4.28)

- **Path:** `dsh-plugin/package.json`
- **Operation:** Update
- **Reason:** Bump version 0.4.27 → 0.4.28; update nodeVersions compatibility (<25.0.0) for GitHub Actions Node 24 fallback; add dsh 0.1.5-alpha.1 to compatible releases
- **Confidence:** High
- **Evidence Source:** npm publish workflow failure (exit code 1); Node 20 deprecation warning
- **Verified By:** repository-audit
### 2026-09-09 — DSH Plugin Syntax Fix (v0.4.29)

- **Path:** `dsh-plugin/dsh/slash-project-memory.mjs`
- **Operation:** Fix
- **Reason:** Unescaped backtick in template literal string caused SyntaxError on dsh boot ("Unexpected identifier 'knowledge'"). The `knowledge-compounding` routing line used bare ` backticks instead of escaped `. Fixed by escaping all backticks in the compounding branch.
- **Confidence:** High
- **Evidence Source:** dsh web startup failure, node --check
- **Verified By:** syntax check
