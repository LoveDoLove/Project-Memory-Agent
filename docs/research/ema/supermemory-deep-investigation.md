# Supermemory Deep Technical Investigation

> **Status:** Research / Evidence Record
> **Phase:** EMA Pre-Architecture
> **Evidence Priority:** Primary Source Code (GitHub: supermemoryai/supermemory)
> **Date:** 2026-09

---

## 1. Repository Overview

**Verified Fact** — Repository: `supermemoryai/supermemory`
License: MIT (2025)
Stack: TypeScript, Bun, Turbo monorepo, Next.js, Hono, Drizzle ORM, Cloudflare Workers
Deployment: Cloudflare Workers (API, MCP), Next.js (web)

### Structure (Verified from source)

```
apps/
  web/               — Next.js web application
  mcp/               — MCP server (Cloudflare Worker, Hono)
  docs/              — Documentation site
  memory-graph-playground/ — Graph visualization playground
  sdk-playground/    — SDK demo
  raycast-extension/ — Raycast plugin
packages/
  memory-graph/      — React canvas memory graph component (@supermemory/memory-graph)
  lib/               — Shared utilities, auth, API client, similarity
  validation/        — Schema validation
  tools/             — Framework adapters (ai-sdk, Mastra, LangChain, etc.)
  ai-sdk/            — Vercel AI SDK wrapper
  hooks/             — React hooks
  ui/                — UI components
skills/              — Agent skills (memorybench)
```

---

## 2. Memory Model (Verified from source)

### 2.1 Core Memory Types

From `packages/memory-graph/src/api-types.ts` (primary source):

```typescript
// The only three memory relation types in the current codebase:
export type MemoryRelation = "updates" | "extends" | "derives"

export interface MemoryEntry {
  id: string
  memory: string          // extracted fact text
  content?: string | null // original content
  createdAt: string
  updatedAt: string
  spaceId?: string | null
  embedding?: number[]
  isStatic?: boolean      // static (long-term) vs dynamic
  isForgotten?: boolean
  forgetAfter?: string | null  // temporal expiry date
  forgetReason?: string | null
  version?: number             // versioning for updates
  parentMemoryId?: string | null
  rootMemoryId?: string | null
  isLatest?: boolean
  relation?: MemoryRelation | null
  updatesMemoryId?: string | null
  nextVersionId?: string | null
  memoryRelations?: Record<string, MemoryRelation> | null
}
```

**Research Observation:** Supermemory's memory model has exactly 3 typed relations (`updates`, `extends`, `derives`) and uses a versioning chain (`parentMemoryId`, `rootMemoryId`, `isLatest`, `version`). There is no `contradicts`, `supersedes`, `caused_by`, or evidence-typing in the schema.

### 2.2 Document Structure

```typescript
export interface DocumentWithMemories {
  id: string
  title: string | null
  url: string | null
  documentType: string
  createdAt: string
  updatedAt: string
  summary?: string | null
  memories: MemoryEntry[]   // extracted memories from the document
}
```

**Research Observation:** Supermemory stores two separate layers: raw **Documents** (source content) and extracted **Memories** (facts). Documents are the source; memories are derived. This is analogous to PMA's evidence vs knowledge separation but operates at a different granularity.

### 2.3 Memory Graph Node Types (Verified)

From `packages/memory-graph/src/types.ts`:
- `GraphNode.type: "document" | "memory"` — two node types
- Documents represented as rectangles; memories as hexagons
- Graph edges typed as: `updates`, `extends`, `derives`
- Nodes have: `isHovered`, `isDragging`, D3-force simulation data, `clusterKey`/`clusterColor`
- Forgotten memories remain in graph but marked `isForgotten: true`

**Research Observation:** The memory graph is primarily a **visualization layer**, not a storage backend or retrieval layer. The actual graph traversal and storage happens in the API server. The `memory-graph` package is a React/Canvas UI component.

---

## 3. Storage Architecture (Verified from source)

From `CLAUDE.md` (official architecture notes):

- **Relational database**: Drizzle ORM (PostgreSQL via Cloudflare Hyperdrive)
- **Vector storage**: Cloudflare AI embeddings (cloud); local: `Xenova/bge-base-en-v1.5`
- **KV storage**: Cloudflare KV (session state, space state, upload sessions)
- **Workflows**: Cloudflare Workflows for background processing
- **Object storage**: Cloudflare (file uploads)
- **Crons**: Every 4 hours for connector imports

**Canonical vs Derived:**
- **Canonical**: Documents (raw source), Memory entries in relational DB
- **Derived**: Vector embeddings (re-generatable), graph visualization data, user profiles
- **Ephemeral**: Space/session state (KV), upload tokens

**Storage classification (Interpretation):**
- Facts are canonical (stored in DB with provenance to source document)
- Embeddings are derived (can be regenerated from canonical content)
- Profiles are derived (built from canonical memory entries)

---

## 4. Ingestion Pipeline (Verified + Interpretation)

From `CLAUDE.md`:

```
Input (text/URL/file/conversation)
  ↓
IngestContentWorkflow (Cloudflare Workflow)
  ├── Content type detection and extraction
  ├── AI-powered summarization and automatic tagging
  ├── Vector embedding generation (Cloudflare AI)
  ├── Chunking for semantic search optimization
  └── Space relationship management
  ↓
DocumentWithMemories (stored in relational DB)
  ↓
Indexed in vector store
```

**Research Observation:** Ingestion is asynchronous via Cloudflare Workflows. Content goes through AI summarization and fact extraction before storage. There is no explicit human validation step — extracted facts are directly canonical once processed.

**EMA Gap identified:** Supermemory has no concept of `Candidate` knowledge state. Extracted facts immediately become canonical. There is no `Observed → Extracted → Candidate → Validated → Canonical` pipeline.

---

## 5. Retrieval Architecture (Verified from MCP tool source)

From `apps/mcp/src/server/tools/search-memory.ts`, `apps/mcp/src/server/tools/add-memory.ts`:

```
Query
  ↓
Hybrid search (searchMode: "hybrid" | "memories" | default)
  ├── Semantic similarity (vector embedding search)
  └── RAG (document chunk retrieval)
  ↓
Container-tag filtering (space scoping)
  ↓
Results merged and returned
```

**Verified tools on MCP server:**
- `add-memory` — Store new memory
- `save-memory` — Save explicit memory
- `guided-save` — Guided memory creation
- `search-memory` — Hybrid search
- `recall` — User recall (profile + search)
- `get-profile` — User profile retrieval (~50ms)
- `list-memories` — List memory entries
- `list-documents` — List source documents
- `get-document` — Get full document
- `list-container-tags` — List spaces/containers
- `select-space` / `set-active-tag` — Space selection
- `memory-graph` / `fetch-graph-data` — Graph visualization
- `upload-file` / `prepare-file-upload` — File ingestion
- `who-am-i` — Account identification
- `context` (MCP resource/prompt) — Inject user profile into conversation

**Research Observation:** Retrieval is primarily embedding-based with container-tag scoping. There is no lifecycle-aware retrieval (e.g., suppressing forgotten memories from results). `isForgotten` memories remain in the graph but their retrieval behavior from search is not visible in the MCP source.

---

## 6. Scope Model (Verified)

From MCP source and CLAUDE.md:

```
Organization (multi-user, Better Auth)
  └── User (authenticated entity)
       └── Container Tag / Space (logical namespace)
            └── Memory Entry + Document
```

**How scopin works:**
- `containerTag` is the primary scoping mechanism — a free-form string tag
- Container tags are called "spaces" in user-facing UI
- Memories can be stored with or without a container tag
- Search filters by container tag
- There is a "default project" fallback when no container tag specified

**Research Observation:** Supermemory's scope model is flat container tags — essentially metadata filtering, not hard isolation. Any caller with a valid API key and knowledge of a container tag can access its memories. This is **soft metadata filtering**, not **hard isolation**.

**EMA Gap identified:** There is no concept of:
- Repository-scoped knowledge
- Branch-scoped knowledge
- Task/session-scoped knowledge with automatic cleanup
- Scope inheritance (project inherits from workspace)
- Promotion from project scope to global scope

---

## 7. Temporal Knowledge (Verified)

From `api-types.ts`:
- `forgetAfter: string | null` — ISO date after which a memory should be forgotten
- `forgetReason: string | null` — Reason for forgetting
- `isForgotten: boolean` — Memory has been forgotten (soft delete from retrieval)
- `version: number` — Version chain support
- `isLatest: boolean` — Marks current version
- `parentMemoryId` / `rootMemoryId` / `nextVersionId` — Version chain links

**Relation `updates`:** When a memory is updated, the new version has `relation: "updates"` and references the old version. The old version gets `isLatest: false`.

**Research Observation (Interpretation):** Supermemory handles temporal supersession through versioning chains. When someone says "I moved to SF" — the system creates a new memory with `relation: "updates"` pointing to the old "I live in NYC" memory, marking the old as non-latest. The model assumes `newest = most correct` for the same fact.

**Critical EMA Gap:** Supermemory's approach of `newest = most correct` conflicts with the EMA invariant that `Newest ≠ Correct`. In engineering systems, a newer assertion does not necessarily supersede a well-evidenced older one. Engineering supersession must be explicit and evidence-backed.

---

## 8. Contradiction Resolution (Research Observation / Interpretation)

**Supermemory's approach (Interpretation from README + code):**
> "Contradictions are resolved automatically."

The actual mechanism is the versioning chain (`updates` relation) where new facts replace old ones via AI-driven comparison. The system uses an LLM during ingestion to detect when a new memory conflicts with an existing one and creates an `updates` relationship.

**What is NOT present (Verified absence):**
- No `contradicts` relation type (only: `updates`, `extends`, `derives`)
- No explicit contradiction registry
- No unresolved conflict state
- No authority mechanism beyond recency ordering
- No human review step for contradictions
- No evidence aggregation before resolution

**Research Observation:** Contradiction resolution in Supermemory is AI-automated and implicit. The system resolves contradictions at ingestion time based on what the LLM decides. There is no auditable contradiction history.

---

## 9. Profile System (Verified from source)

From `apps/mcp/src/server/resources/profile.ts` pattern and MCP server instructions:

```typescript
// Profile structure (from README)
profile.static  // Long-term stable facts: ["Senior engineer", "Prefers TypeScript"]
profile.dynamic // Recent activity: ["Working on auth migration", "Debugging rate limits"]
```

**How profiles work:**
- Auto-maintained by the engine from memory entries
- `isStatic: true` on memory entries → contributes to `profile.static`
- Recent entries (by timestamp) → `profile.dynamic`
- Single API call, ~50ms retrieval
- No explicit user-authored profile

**Research Observation:** The static/dynamic split is a temporal approximation — static = old + confirmed; dynamic = recent. This is an engineering shortcut, not evidence-based classification.

**EMA Consideration:** In engineering contexts, "observation becomes engineering preference" is exactly the risk the goal document warns against. An agent observing a developer use TypeScript three times should not turn this into a canonical global engineering preference without evidence-based promotion.

---

## 10. Connectors and Synchronization (Verified from source)

From CLAUDE.md:
- Connectors: Google Drive, Gmail, Notion, OneDrive, GitHub
- Sync mechanism: webhooks (real-time) + cron (every 4 hours)
- GitHub connector exists but its engineering-specific semantics (commits, PRs, issues) are not visible in the public source

From MCP tools:
- `upload-file` + `prepare-file-upload` — Two-phase file upload via signed URL
- File types: PDFs, images (OCR), videos (transcription), code (AST-aware chunking)
- Background processing: `IngestContentWorkflow` via Cloudflare Workflows

**Research Observation:** Supermemory treats all sources as content to extract facts from, not as authoritative sources with their own lifecycle semantics. A GitHub commit is just content to ingest, not an authoritative event in an engineering knowledge lineage.

---

## 11. SMFS — Supermemory Filesystem (Research Observation)

The README mentions:
> "We also built the Supermemory Filesystem (SMFS), which uses 3.0× fewer tokens on Claude (24M vs 72M) and 1.75× fewer on Codex across the 110-question xAFS benchmark."

**Finding:** SMFS is NOT a separate public repository. It is not present in the monorepo as a public package. It appears to be an internal research component or enterprise feature. The xAFS benchmark and SMFS source code are not publicly available in this repository.

**Classification:** Unverifiable from primary source. The benchmark claim (3.0× fewer tokens) is from supermemory.ai/research, which was inaccessible for direct verification.

**Interpretation:** SMFS likely represents a filesystem-like interface that presents memory as a hierarchy of "files" and "directories" — allowing agents to browse, read, and write memory using file-path semantics rather than search queries. This model reduces token usage because agents can navigate directly to relevant context rather than embedding search.

---

## 12. MemoryBench (Research Observation + Partial Verification)

From README:
> "We built MemoryBench — an open-source framework for standardized, reproducible benchmarks of memory providers."

Command visible in repo: `bun run src/index.ts run -p supermemory -b longmemeval -j gpt-4o -r my-run`

From `skills/` directory in the monorepo: Contains memorybench skill (`npx skills add supermemoryai/memorybench`).

**Benchmarks verified from README (claimed, not independently verified):**
- LongMemEval: 95% Recall@15, 99.4% context reduction
- LoCoMo: #1
- ConvoMem: #1
- By category: Knowledge Updates 99%, Assistant recall 100%, User recall 97%, Multi-session 93%, Temporal Reasoning 91%, Preference 90%

**Research Observation:** MemoryBench covers: retrieval quality, temporal correctness, preference learning, multi-session recall. It does NOT cover: scope safety, provenance verification, authority, engineering-specific knowledge correctness, relationship integrity.

---

## 13. Agent Integration Architecture (Verified)

**MCP Server integration (Verified from source):**
```
Client (Claude, Cursor, OpenCode, etc.)
  ↓ HTTP Bearer token
MCP Server (Cloudflare Worker, Hono)
  ↓ OAuth or API key validation
SupermemoryServer (McpServer instance)
  ├── Tools: add/save/search/recall/list/upload/graph
  ├── Resources: profile, container-tags, widget
  └── Prompts: context injection
```

**Server instructions (Verified from server.ts):**
> "Use these tools whenever the user wants to recall something they may have saved, inspect stored sources or extracted memories, remember or upload new information, check their Supermemory account or access, change their active space, or explore their memory graph, even if they do not mention Supermemory by name."

**Research Observation (Important):** The MCP server's instructions tell the AI to automatically use memory tools even without explicit user request ("even if they do not mention Supermemory by name"). This is the "opaque AI remembers everything" pattern that EMA explicitly rejects.

Plugin integrations (verified public repos): Claude Code, Cursor, OpenCode, OpenClaw, Hermes. No DeepSeek Harness plugin exists.

---

## 14. Security Model (Verified)

From CLAUDE.md and MCP auth code:
- API key or OAuth Bearer token authentication
- Organization-scoped data isolation (Better Auth)
- Container tags provide logical separation but not cryptographic isolation
- No end-to-end encryption mentioned
- Self-hosted: all data stays local when running `supermemory-server`
- File upload: two-phase upload with signed tokens (short TTL: 2 minutes)

**Research Observation:** Security boundary is authentication (org membership) + authorization (API key). Cross-container-tag access is possible if an authenticated caller knows the tag name. There is no per-project access control list.

---

## 15. Licensing Summary

- **Repository license:** MIT (supermemoryai/supermemory, 2025)
- **SDK:** MIT (`supermemory` npm package, `supermemory` Python package)
- **MCP server:** MIT (open source)
- **Hosted platform:** Commercial SaaS, different ToS
- **Local runtime:** `supermemory-server` binary — license for the binary is not stated in this repo; it may differ from the repository MIT license
- **SMFS and MemoryBench:** License unclear for SMFS (internal); MemoryBench appears MIT based on the skills pattern

**Research Observation:** The open-source monorepo is MIT licensed. The hosted platform and the local binary may carry enterprise restrictions. Local embedding (`Xenova/bge-base-en-v1.5`) is MIT licensed.

---

## 16. Key Architectural Gaps for EMA (Summary)

| Gap | Supermemory Approach | EMA Requirement |
|-----|---------------------|-----------------|
| Authority chain | Newest = most correct (implicit) | Explicit evidence-backed authority |
| Extraction authority | Auto-canonical on ingestion | Observed → Candidate → Validated → Canonical |
| Contradiction | AI-resolved at ingestion, no audit | Explicit state; audit trail; unresolved allowed |
| Scope model | Flat container tags (metadata filter) | Typed scope hierarchy with inheritance |
| Scope isolation | Soft (metadata filter only) | Hard isolation for sensitive project boundaries |
| Relationship types | 3 types: updates, extends, derives | 8+ typed relationships with verification states |
| Provenance | Source document link | Evidence chain to source + git + tests |
| Engineering specifics | GitHub as generic connector | Code → commit → decision → issue → resolution |
| Lifecycle | forgotten/active (binary) | 9-state lifecycle with maintenance review |
| Verification gate | None | memory-verification skill + evidence discipline |
| Explainability | Not designed in | Required at every retrieval step |
| Forgetting | Temporal expiry + AI-triggered | Explicit lifecycle state (historical preserved) |
| DeepSeek Harness | No plugin exists | First-class integration target |
| Profile authority | Observations become static facts | Observations ≠ engineering preferences |
| Knowledge promotion | None | Project → Candidate → Validated → Global |
