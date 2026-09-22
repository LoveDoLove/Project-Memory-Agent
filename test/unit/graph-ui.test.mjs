/**
 * Engineering Memory Agent (EMA) — Visual Memory Graph Server Tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { initIndex, closeIndex, defaultIndexPath } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';
import { extractGraphData } from '../../src/ui/graph-data.mjs';
import { startUIServer } from '../../src/ui/server.mjs';
import { createCandidate } from '../../src/storage/candidate-store.mjs';

function createTestEnvironment() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-ui-test-'));
  const docsDir = path.join(tmpDir, 'docs');
  const candDir = path.join(tmpDir, '.ema', 'candidates');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(candDir, { recursive: true });

  const dbPath = defaultIndexPath(tmpDir);
  const db = initIndex(dbPath);

  const cleanup = () => {
    try { closeIndex(db); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  };

  return { tmpDir, docsDir, candDir, db, dbPath, cleanup };
}

test('Graph Data: extracts nodes, relationships, and contradiction edges', () => {
  const env = createTestEnvironment();
  try {
    // 1. Insert Canonical EKU
    indexEKU(env.db, {
      title: 'DSH Architecture Core',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      scope: 'project',
      tags: ['core', 'architecture'],
      related: [
        { type: 'contradicts', target: 'docs/deprecated-arch.md' },
        { type: 'supersedes', target: 'docs/old-v1.md' },
      ],
      bodyText: 'Canonical system architecture body.',
    }, 'docs/architecture.md');

    // 2. Insert Candidate EKU in candidate queue
    createCandidate({
      title: 'Proposed Token Cache Optimization',
      scope: 'project',
      evidence: ['ema://evidence/repo/sha/file.ts#line:10:25'],
      related: [{ type: 'affects', target: 'docs/architecture.md' }],
      body: 'Candidate proposing token caching.',
    }, env.candDir);

    const graph = extractGraphData(env.db, env.tmpDir);

    assert.equal(graph.stats.total_nodes, 2);
    assert.equal(graph.stats.canonical_count, 1);
    assert.equal(graph.stats.candidate_count, 1);
    assert.ok(graph.stats.total_edges >= 3);
    assert.equal(graph.stats.contradiction_count, 1);

    const contradictionEdge = graph.edges.find((e) => e.is_contradiction);
    assert.ok(contradictionEdge, 'Must have contradiction edge');
    assert.equal(contradictionEdge.type, 'contradicts');
  } finally {
    env.cleanup();
  }
});

test('UI Server: serves HTML SPA and API endpoints', async () => {
  const env = createTestEnvironment();
  let serverInstance;
  try {
    indexEKU(env.db, {
      title: 'Authentication Protocol',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      scope: 'project',
      bodyText: 'Details on Auth protocol.',
    }, 'docs/auth.md');

    serverInstance = await startUIServer({
      port: 3999, // use dedicated test port
      host: '127.0.0.1',
      db: env.db,
      repoRoot: env.tmpDir,
    });

    assert.ok(serverInstance.url.includes(':3999'));

    // Test GET /
    const htmlRes = await fetch(serverInstance.url);
    assert.equal(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes('<!DOCTYPE html>'));
    assert.ok(htmlText.includes('EMA Memory Graph'));

    // Test GET /api/graph
    const graphRes = await fetch(`${serverInstance.url}/api/graph`);
    assert.equal(graphRes.status, 200);
    const graphJson = await graphRes.json();
    assert.equal(graphJson.stats.total_nodes, 1);
    assert.equal(graphJson.nodes[0].title, 'Authentication Protocol');

    // Test GET /api/nodes/:id
    const nodeRes = await fetch(`${serverInstance.url}/api/nodes/${encodeURIComponent('docs/auth.md')}`);
    assert.equal(nodeRes.status, 200);
    const nodeJson = await nodeRes.json();
    assert.equal(nodeJson.title, 'Authentication Protocol');
    assert.equal(nodeJson.authority_level, 'Canonical');

  } finally {
    if (serverInstance) serverInstance.close();
    env.cleanup();
  }
});
