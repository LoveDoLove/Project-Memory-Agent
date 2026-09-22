# EMA Capability Matrix

> **Status:** Research deliverable
> **Type:** Capability comparison
> **Phase:** EMA Pre-Architecture Research
> **Date:** 2026-09
> **Evidence:** Primary sources where marked; interpretation/research observation elsewhere

---

## Legend

- ✅ Full capability present
- 🟡 Partial / limited capability
- ❌ Not present
- 🔵 Planned or claimed (unverified)
- N/A Not applicable to stated scope

---

## 1. Memory Formation

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Fact extraction from content | ✅ AI-powered (IngestContentWorkflow) | ❌ Manual agent-driven | Adapt — with validation gate |
| Summarization | ✅ AI-powered | 🟡 Agent-driven on demand | Adopt |
| Deduplication | ✅ LLM-detected at ingestion | ❌ Manual | Adapt — evidence-aware |
| Merging / consolidation | 🟡 Version chain (updates relation) | 🟡 consolidated_from frontmatter | Adapt |
| Update propagation | ✅ Versioning chain | 🟡 superseded_by field | Adopt + extend |
| Promotion pipeline | ❌ Not present | ❌ Not present | **Design required** |
| Candidate state | ❌ Not present | ❌ Not present | **Design required** |
| Validation gate | ❌ Not present | ✅ memory-verification skill | Adopt from PMA |
| Forgetting (retrieval) | ✅ isForgotten + forgetAfter | ✅ Deprecated / Superseded lifecycle | Adopt both approaches |
| Historical preservation | ❌ No distinction (forgotten = gone) | ✅ Historical state preserved | Adopt from PMA |
| Lifecycle states | 🟡 active/forgotten (binary) | ✅ 9-state lifecycle | Adopt from PMA |
| Audit log | ❌ Not present | ✅ CHANGELOG-MEMORY.md | Adopt from PMA |

---

## 2. Memory Ontology

| Concept | Supermemory | PMA (Current) | EMA (Required) |
|---------|-------------|---------------|----------------|
| Memory (extracted fact) | ✅ MemoryEntry | 🟡 Knowledge unit (doc-level) | Redesign — fact-level granularity |
| Document / Source | ✅ DocumentWithMemories | ✅ Evidence reference in frontmatter | Adopt both patterns |
| Event | ❌ No temporal events | ❌ Not typed | Defer |
| Entity | ❌ No entity extraction | ❌ Not typed | Defer |
| Relationship | 🟡 3 types: updates/extends/derives | ✅ 8 types with verification | Adopt PMA + extend |
| Decision | ❌ Not in model | ✅ Decision knowledge type | Adopt from PMA |
| Preference | ✅ (isStatic, user profile) | ❌ Implicit via Lessons | Adapt — distinguish Observed vs Canonical |
| Derived knowledge | ✅ Profiles are derived | ✅ derived_from relationship | Adopt PMA + extend |
| Temporal information | ✅ forgetAfter, version, createdAt | ✅ lifecycle states, last_verified | Adopt both |
| Provenance | 🟡 Source document link | ✅ Evidence chain (files/tests/git) | Adopt PMA model |
| Engineering-specific types | ❌ Generic memory only | ✅ Architecture, Constraint, Solution, Lesson, Workflow | Adopt from PMA |
| Canonical vs candidate | ❌ No distinction | ❌ Not formalized | **Design required** |

---

## 3. Memory Representation

| Aspect | Supermemory | PMA (Current) | EMA (Required) |
|--------|-------------|---------------|----------------|
| Primary format | Relational DB (Drizzle/PostgreSQL) | Markdown + YAML frontmatter | Decide: keep Git-native Markdown as canonical |
| Vector storage | ✅ Cloudflare AI / local Xenova | ❌ None | Adopt for retrieval index (derived, not canonical) |
| Graph structure | ✅ Visual graph (memory-graph package) | 🟡 Typed relationships in frontmatter | Maintain typed relationships; graph = derived |
| Git-native storage | ❌ Not designed for Git | ✅ Core design principle | Preserve from PMA |
| Structured frontmatter | ❌ Not Markdown-based | ✅ YAML schema | Adopt from PMA |
| Canonical vs derived | 🟡 Documents = canonical, profiles = derived | ✅ Explicit in architecture | Adopt + strengthen |
| Indexed | ✅ Vector index | 🟡 Optional domain indexes | Adopt vectors as derived index |
| Cached | 🟡 Vector embeddings cached | ❌ No caching layer | Defer |
| Ephemeral | ✅ Session/space state in KV | 🟡 Trace mode output | Adopt — explicit ephemeral layer |

---

## 4. Temporal Knowledge

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Event time tracking | ✅ createdAt, updatedAt | ✅ created, last_verified dates | Adopt both |
| Ingestion time | ✅ createdAt | ✅ created date | Adopt |
| Validity intervals | 🟡 forgetAfter (end-only) | ❌ Not formalized | **Design required** — valid_from + valid_until |
| Historical state preservation | ❌ Forgotten = soft-deleted from retrieval | ✅ Historical knowledge type | Adopt from PMA |
| Supersession chain | ✅ Version chain (updates relation) | ✅ superseded_by field | Adopt from PMA; supplement with chain |
| Stale knowledge detection | ❌ Not present | 🟡 last_indexed / pending_updates | Adapt + strengthen |
| Lifecycle transitions | 🟡 Binary (active/forgotten) | ✅ 9-state lifecycle | Adopt from PMA |
| Temporal retrieval | 🟡 Implicit (forgotten excluded) | ❌ Not supported | **Design required** |

---

## 5. Contradiction Handling

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Contradiction detection | ✅ LLM-based at ingestion | ❌ Manual review only | Adapt — surface for human/agent review |
| Contradiction resolution | ✅ Auto-resolved (newest wins) | 🟡 contradicts relationship + review | Redesign — evidence-backed resolution |
| Contradiction audit trail | ❌ Not present | 🟡 CHANGELOG-MEMORY.md | Adopt from PMA |
| Unresolved conflict state | ❌ No explicit state | 🟡 "Needs Review" relationship state | Adopt from PMA + formalize |
| Authority mechanism | ❌ Recency only | 🟡 Verification states (Verified/Invalid) | Adopt + extend evidence authority |
| Assumption: newest = correct | ✅ (implicit, built-in) | ❌ Explicitly rejected | Maintain EMA invariant: Newest ≠ Correct |

---

## 6. Search and Retrieval

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Semantic search (vector) | ✅ Hybrid mode default | ❌ Not present | Adopt as derived index |
| Lexical search | 🟡 Part of hybrid | ❌ Not formalized | Adopt |
| Hybrid retrieval | ✅ searchMode: hybrid | ❌ Not present | Adopt |
| Graph traversal | 🟡 Visual only (not query language) | 🟡 Related links followed manually | Design required |
| Metadata filtering | ✅ Container tag filter | 🟡 Type/status frontmatter filter | Adopt + extend |
| Scope-aware retrieval | 🟡 Container tags (flat) | ✅ Domain progressive loading | Adopt + extend with scope hierarchy |
| Lifecycle-aware retrieval | 🟡 Excludes forgotten (inferred) | 🟡 Obsolete knowledge audited | Adopt — explicit lifecycle gate |
| Authority-aware ranking | ❌ Not present | 🟡 Confidence + evidence fields | Design required |
| Provenance in results | 🟡 Source document reference | ✅ Evidence chain | Adopt from PMA |
| Freshness ranking | 🟡 Implicit via isLatest | 🟡 last_verified dates | Adopt + make explicit |
| Context compression | ✅ 99.4% reduction on LongMemEval | 🟡 Progressive loading (token-efficient) | Adopt principles; adapt to engineering |

---

## 7. Context Construction

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| User profile injection | ✅ /context command, ~50ms | ❌ Not present | Adapt — Engineering context, not personal profile |
| Static/dynamic profile split | ✅ profile.static + profile.dynamic | ❌ Not present | Adapt — engineering knowledge vs recent task context |
| Context deduplication | ✅ (implicit by profile system) | 🟡 Low-redundancy design | Adopt |
| Provenance in context | ❌ Profile lacks provenance | ✅ Evidence references in docs | Adopt from PMA |
| Conflict presentation | ❌ Conflicts resolved before context | ❌ Not present | **Design required** |
| Temporal context | 🟡 dynamic = recent | 🟡 lifecycle state in docs | Adopt + extend |
| Project context | 🟡 Container tag scoping | ✅ Project-scoped repository memory | Adopt from PMA |
| Cross-project context | ❌ Manual tag management | ❌ Not present | **Design required** |
| Token efficiency | ✅ 99.4% reduction demonstrated | ✅ Progressive loading (L0/L1/L2/L3) | Adopt both strategies |

---

## 8. Scope and Isolation

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Global scope | 🟡 Default project (no tag) | ❌ Not present | **Design required** |
| Organization scope | ✅ Better Auth org | ❌ Not present | Defer (single-user focus) |
| Workspace scope | ❌ No concept | ❌ Not present | **Design required** |
| Project scope | 🟡 Container tag | ✅ Repository-native | Adopt from PMA + strengthen |
| Repository scope | ❌ GitHub is just a connector | ✅ Core design | Adopt from PMA |
| Branch scope | ❌ Not present | ❌ Not present | Defer |
| Task scope | ❌ Not present | ❌ Not present | **Design required** |
| Session scope | 🟡 MCP session state only | 🟡 Trace mode (ephemeral) | Adopt — explicit session layer |
| Hard isolation | ❌ Metadata filtering only | ❌ Not present | **Design required for sensitive boundaries** |
| Soft filtering | ✅ Container tag filter | ✅ Domain/type filtering | Adopt both |
| Scope inheritance | ❌ Not present | ❌ Not present | **Design required** |
| Promotion between scopes | ❌ Not present | ❌ Not present | **Design required** |

---

## 9. Agent Integration

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| MCP server | ✅ Hosted + self-hosted | ❌ Not present | Adopt — MCP as primary agent interface |
| DeepSeek Harness plugin | ❌ No DSH plugin | ✅ DSH plugin (dsh-project-memory) | Adopt from PMA; extend for EMA |
| Claude Code | ✅ claude-supermemory | ❌ via install.ps1 | Adopt (already supported) |
| Cursor | ✅ cursor-supermemory | ❌ Not targeted | Defer |
| OpenCode | ✅ opencode-supermemory | ❌ via install.ps1 | Adopt |
| CLI | 🟡 supermemory-server CLI | ❌ Not present | **Design required** |
| Agent skills | ✅ memorybench skill | ✅ 8 specialized skills | Adopt both — agent skills as primary DSH interface |
| Filesystem interface | 🟡 SMFS (internal, not public) | ❌ Not present | Research pending (SMFS unverifiable) |
| API/SDK | ✅ TypeScript + Python SDK | ❌ Not present | Defer (secondary to skills/MCP) |
| Framework wrappers | ✅ Vercel AI, LangChain, Mastra, n8n | ❌ Not targeted | Defer |

---

## 10. Evaluation

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Retrieval quality (Recall@k) | ✅ Documented (95% @15) | ❌ Not measured | Defer until MVP |
| Temporal correctness | ✅ LongMemEval category | ❌ Not measured | **Design required** |
| Scope safety | ❌ Not benchmarked | ❌ Not measured | **Design required** |
| Provenance accuracy | ❌ Not benchmarked | ✅ Evidence discipline | Design required |
| Context efficiency | ✅ Token reduction measured | ✅ Progressive loading | Adopt both |
| Contradiction handling | 🟡 Multi-hop reasoning tested | ❌ Not measured | **Design required** |
| Lifecycle correctness | ❌ Not benchmarked | ❌ Not measured | **Design required** |
| Memory accuracy | ✅ Factual recall tested | ❌ Not measured | Adopt |
| Latency | ✅ ~50ms profile | ❌ Not measured | Adopt |

---

## 11. Local / Self-Hosted

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Fully local deployment | ✅ supermemory-server binary | ✅ Git-native, no external services | Adopt both |
| Local embeddings | ✅ Xenova/bge-base-en-v1.5 | N/A | Adopt (optional derived index) |
| Offline operation | ✅ Ollama integration | ✅ No network dependency | Maintain |
| Privacy (no external calls) | ✅ Fully offline possible | ✅ Git-native, no telemetry | Maintain |
| Data ownership | ✅ ./.supermemory directory | ✅ Git repository | Adopt both |
| Portability | 🟡 Single directory backup | ✅ Git push/pull | Adopt from PMA |

---

## 12. Security / Privacy

| Capability | Supermemory | PMA (Current) | EMA (Required) |
|------------|-------------|---------------|----------------|
| Project isolation | 🟡 Container tag (soft) | ✅ Repository-scoped | Adopt PMA; add hard isolation option |
| Cross-project leakage prevention | 🟡 Metadata only | ✅ Repository boundaries | **Design required** |
| Authorization | ✅ OAuth + API key | ❌ No auth model (local use) | Adopt MCP auth for cross-project |
| Credential handling | ✅ Two-phase upload, short TTL | N/A | Adopt pattern |
| Deletion (right to forget) | ✅ isForgotten | ✅ Obsolete knowledge deletion | Adopt both |
| Retention policies | ❌ Not configurable | ❌ Not present | Defer |
| Auditing | ❌ Not present | ✅ CHANGELOG-MEMORY.md | Adopt from PMA |
