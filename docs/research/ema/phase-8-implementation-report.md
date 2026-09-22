# EMA Phase 8 — Standalone MCP Server & CLI Tooling Implementation Report

> **System:** Engineering Memory Agent (EMA)
> **Repository:** `LoveDoLove/Project-Memory-Agent`
> **Phase:** Phase 8 — Standalone MCP Server & CLI Tooling
> **Report Date:** 2026-09-22
> **Gate Status:** Complete & Verified

---

## 1. Objective

Build the standalone stdio MCP server and maintenance CLI tooling according to Development Plan §3 Phase 8 & §13.2:
- Expose the 5 standard MCP tools: `ema_recall`, `ema_add`, `ema_context`, `ema_validate`, `ema_promote`.
- Implement stdio JSON-RPC 2.0 transport in `dsh-plugin/src/mcp/server.mjs`.
- Provide standalone executable binaries `dsh-plugin/bin/ema-mcp.mjs` and `dsh-plugin/bin/ema-cli.mjs`.
- Implement CLI subcommands (`index`, `verify`, `status`, `recall`, `help`).
- Ensure candidates created via MCP `ema_add` always route to candidate queue (`.ema/candidates/`) with `authority_level: 'Candidate'`, never directly modifying canonical memory.

---

## 2. Implemented Scope

### Files Created
- `dsh-plugin/src/mcp/tools.mjs`: tool specifications and invocation dispatcher for all 5 MCP tools.
- `dsh-plugin/src/mcp/server.mjs`: JSON-RPC 2.0 protocol handler (`initialize`, `ping`, `tools/list`, `tools/call`) with line-delimited stdio transport.
- `dsh-plugin/bin/ema-mcp.mjs`: standalone MCP server executable.
- `dsh-plugin/bin/ema-cli.mjs`: maintenance CLI executable (`index`, `verify`, `status`, `recall`, `help`).
- `dsh-plugin/test/integration/mcp-server.test.mjs`: integration tests covering MCP handshake, all 5 tools, candidate lifecycle over MCP, and CLI commands.

### Files Updated
- `dsh-plugin/package.json`: added `bin` entry points for `ema` and `ema-mcp`.

---

## 3. Verification Results

```bash
cd dsh-plugin && node --test test/integration/mcp-server.test.mjs
```
- Total Phase 8 Tests: **8 passed, 0 failed**
- Duration: **172.55 ms**

Full Regression Suite:
- Total Tests: **168 passed, 0 failed, 0 skipped**
- Duration: **223.82 ms**

### Exit Criteria Verification
- "MCP inspector & JSON-RPC compatibility": **VERIFIED** (`initialize`, `tools/list`, `tools/call` conform to JSON-RPC 2.0).
- "Completes tool calls over stdio": **VERIFIED** (tested line-delimited requests/responses and direct handlers).
- "Candidate routing over MCP": **VERIFIED** (`ema_add` creates `Candidate` in `.ema/candidates/`, `ema_validate` verifies, `ema_promote` promotes to canonical).
- "CLI maintenance commands": **VERIFIED** (`ema status`, `ema help`, `ema index`, `ema verify`, `ema recall` functional).

Gate: **Phase 8 COMPLETE & VERIFIED**
