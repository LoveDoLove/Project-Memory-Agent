/**
 * EMA Phase 8 — Standalone MCP Server & CLI Tooling Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import { createMCPServer } from '../../src/mcp/server.mjs';
import { initIndex, closeIndex } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';

function createTempWorkspace() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-mcp-test-'));
  const candidateDir = path.join(tmpDir, '.ema', 'candidates');
  const docsDir = path.join(tmpDir, 'docs');
  const changelogPath = path.join(tmpDir, 'CHANGELOG-MEMORY.md');
  const dbPath = path.join(tmpDir, '.ema', 'index.db');

  fs.mkdirSync(candidateDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(changelogPath, '# Memory Audit Log\n', 'utf8');

  const db = initIndex(dbPath);

  return { tmpDir, candidateDir, docsDir, changelogPath, dbPath, db };
}

function cleanupTempWorkspace(ws) {
  closeIndex(ws.db);
  fs.rmSync(ws.tmpDir, { recursive: true, force: true });
}

// ── MCP JSON-RPC Handshake & Tool Discovery ──────────────────────────────────

test('MCP: initialize handshake returns server info and tool capabilities', async () => {
  const ws = createTempWorkspace();
  try {
    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
    });

    const initReq = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {} },
    };

    const res = await server.handleMessage(initReq);
    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.id, 1);
    assert.equal(res.result.serverInfo.name, 'ema-mcp');
    assert.equal(res.result.serverInfo.version, '0.5.0');
    assert.ok(res.result.capabilities.tools);
  } finally {
    cleanupTempWorkspace(ws);
  }
});

test('MCP: tools/list returns all 5 canonical EMA tools', async () => {
  const ws = createTempWorkspace();
  try {
    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
    });

    const listReq = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    };

    const res = await server.handleMessage(listReq);
    assert.equal(res.id, 2);
    assert.ok(Array.isArray(res.result.tools));
    const toolNames = res.result.tools.map((t) => t.name);
    assert.ok(toolNames.includes('ema_recall'));
    assert.ok(toolNames.includes('ema_add'));
    assert.ok(toolNames.includes('ema_context'));
    assert.ok(toolNames.includes('ema_validate'));
    assert.ok(toolNames.includes('ema_promote'));
  } finally {
    cleanupTempWorkspace(ws);
  }
});

// ── MCP Tool Execution: Candidate Flow (add -> validate -> promote) ──────────

test('MCP: ema_add creates candidate in candidate queue', async () => {
  const ws = createTempWorkspace();
  try {
    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
    });

    const addReq = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'ema_add',
        arguments: {
          title: 'Distributed Tracing Pattern',
          content: 'Use OpenTelemetry with standard span propagators.',
          type: 'Solution',
          confidence: 'High',
        },
      },
    };

    const res = await server.handleMessage(addReq);
    assert.equal(res.id, 3);
    assert.ok(res.result.content[0].text);
    const body = JSON.parse(res.result.content[0].text);
    assert.equal(body.status, 'candidate_created');
    assert.ok(body.candidate_id.startsWith('cand-'));
    assert.equal(body.candidate.authority_level, 'Candidate');
    assert.equal(body.candidate.validation_state, 'Unreviewed');
  } finally {
    cleanupTempWorkspace(ws);
  }
});

test('MCP: ema_validate updates candidate validation state', async () => {
  const ws = createTempWorkspace();
  try {
    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
    });

    // 1. Add candidate
    const addRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: {
        name: 'ema_add',
        arguments: {
          title: 'Circuit Breaker Pattern',
          content: 'Hystrix-style circuit breaker.',
        },
      },
    });
    const { candidate_id } = JSON.parse(addRes.result.content[0].text);

    // 2. Validate candidate
    const valRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: {
        name: 'ema_validate',
        arguments: {
          candidate_id,
          decision: 'Verified',
          notes: 'Integration test passes.',
        },
      },
    });
    const valBody = JSON.parse(valRes.result.content[0].text);
    assert.equal(valBody.status, 'validated');
    assert.equal(valBody.validation_state, 'Verified');
  } finally {
    cleanupTempWorkspace(ws);
  }
});

test('MCP: ema_promote promotes candidate to Project canonical memory', async () => {
  const ws = createTempWorkspace();
  try {
    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
      actor: 'project_admin',
    });

    // 1. Add candidate
    const addRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 20,
      method: 'tools/call',
      params: {
        name: 'ema_add',
        arguments: {
          title: 'Memory Caching Architecture',
          content: 'In-memory LRU cache.',
        },
      },
    });
    const { candidate_id } = JSON.parse(addRes.result.content[0].text);

    // 2. Promote candidate
    const promRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 21,
      method: 'tools/call',
      params: {
        name: 'ema_promote',
        arguments: {
          candidate_id,
          target_scope: 'project',
          rationale: 'Validated across performance suite.',
        },
      },
    });
    const promBody = JSON.parse(promRes.result.content[0].text);
    assert.equal(promBody.status, 'promoted');
    assert.equal(promBody.scope, 'project');
    assert.ok(promBody.promoted_from);
  } finally {
    cleanupTempWorkspace(ws);
  }
});

// ── MCP Tool Execution: Retrieval & Context ──────────────────────────────────

test('MCP: ema_recall queries authoritative memory and ema_context builds prompt', async () => {
  const ws = createTempWorkspace();
  try {
    // Seed canonical memory into index
    indexEKU(ws.db, {
      title: 'Kafka Consumer Group Rebalance',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      bodyText: 'Use cooperative sticky assignor for zero-stop rebalances.',
    }, 'docs/kafka.md');

    const server = createMCPServer({
      db: ws.db,
      projectRoot: ws.tmpDir,
    });

    // 1. Test ema_recall
    const recallRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 30,
      method: 'tools/call',
      params: {
        name: 'ema_recall',
        arguments: { query: 'kafka rebalance' },
      },
    });
    const recallBody = JSON.parse(recallRes.result.content[0].text);
    assert.equal(recallBody.results.length, 1);
    assert.equal(recallBody.results[0].title, 'Kafka Consumer Group Rebalance');

    // 2. Test ema_context
    const ctxRes = await server.handleMessage({
      jsonrpc: '2.0',
      id: 31,
      method: 'tools/call',
      params: {
        name: 'ema_context',
        arguments: { task_description: 'kafka rebalance configuration' },
      },
    });
    const ctxBody = JSON.parse(ctxRes.result.content[0].text);
    assert.ok(ctxBody.context_markdown.includes('Kafka Consumer Group Rebalance'));
    assert.ok(ctxBody.token_count > 0);
  } finally {
    cleanupTempWorkspace(ws);
  }
});

// ── CLI Execution ────────────────────────────────────────────────────────────

test('CLI: ema help displays CLI usage', () => {
  const cliPath = path.resolve('bin/ema-cli.mjs');
  const output = execFileSync(process.execPath, [cliPath, 'help'], { encoding: 'utf8' });
  assert.ok(output.includes('Engineering Memory Agent (EMA) CLI'));
  assert.ok(output.includes('ema index [docsDir]'));
  assert.ok(output.includes('ema verify [docsDir]'));
  assert.ok(output.includes('ema status'));
  assert.ok(output.includes('ema recall <query>'));
});

test('CLI: ema status runs and reports repository status', () => {
  const cliPath = path.resolve('bin/ema-cli.mjs');
  const output = execFileSync(process.execPath, [cliPath, 'status'], { encoding: 'utf8' });
  assert.ok(output.includes('[EMA CLI] Status Report'));
  assert.ok(output.includes('Pending candidates'));
});
