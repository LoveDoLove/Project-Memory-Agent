#!/usr/bin/env node
/**
 * Engineering Memory Agent (EMA) — Standalone Stdio MCP Executable
 * Phase 8: Standalone MCP Server & CLI Tooling
 */

import { createMCPServer } from '../src/mcp/server.mjs';

const server = createMCPServer({
  projectRoot: process.cwd(),
});

server.start(process.stdin, process.stdout);

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
