/**
 * Engineering Memory Agent (EMA) — Vector Indexing & Hybrid RRF Search Tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  DEFAULT_EMBEDDING_DIMENSION,
  embedTextSync,
  cosineSimilarity,
  tokenizeCodeAndText,
} from '../../src/index/embedding-provider.mjs';

import {
  initVectorIndex,
  storeVector,
  searchVector,
  getVectorIndexStatus,
} from '../../src/index/vector-index.mjs';

import { initIndex, closeIndex, defaultIndexPath } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';
import { emaRecall } from '../../src/retrieval/pipeline.mjs';

function createTestDB() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-vec-test-'));
  const dbPath = defaultIndexPath(tmpDir);
  const db = initIndex(dbPath);
  initVectorIndex(db);
  const cleanup = () => {
    try { closeIndex(db); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  };
  return { db, tmpDir, dbPath, cleanup };
}

// ── 1. Embedding Provider Unit Tests ─────────────────────────────────────────

test('Embedding Provider: produces 384-dimensional normalized Float32Array', () => {
  const vec = embedTextSync('Cordis plugin injection architecture');
  assert.ok(vec instanceof Float32Array);
  assert.equal(vec.length, DEFAULT_EMBEDDING_DIMENSION);

  // Check L2 unit norm
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  assert.ok(Math.abs(Math.sqrt(sumSq) - 1.0) < 1e-4, 'Vector must be unit normalized');
});

test('Embedding Provider: tokenizes code identifiers and subwords', () => {
  const tokens = tokenizeCodeAndText('export function handle_auth_request(userId)');
  assert.ok(tokens.includes('handle_auth_request'));
  assert.ok(tokens.includes('auth'));
  assert.ok(tokens.includes('request'));
  assert.ok(tokens.includes('userid'));
});

test('Embedding Provider: semantic similarity correlates with relatedness', () => {
  const v1 = embedTextSync('DSH plugin boot failure and cordis error');
  const v2 = embedTextSync('cordis plugin bootstrap error diagnosis');
  const v3 = embedTextSync('baking fresh chocolate cookies in the kitchen');

  const simRelated = cosineSimilarity(v1, v2);
  const simUnrelated = cosineSimilarity(v1, v3);

  assert.ok(simRelated > simUnrelated, `Expected related (${simRelated}) > unrelated (${simUnrelated})`);
  assert.ok(simRelated > 0.35, 'Related texts should have significant similarity');
});

// ── 2. Vector Index & sqlite-vec Integration ─────────────────────────────────

test('Vector Index: storeVector and searchVector KNN query', () => {
  const { db, cleanup } = createTestDB();
  try {
    // Insert EKU record first
    indexEKU(db, {
      title: 'Cordis Plugin Architecture',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      scope: 'project',
      bodyText: 'Details about cordis inject and patch mechanism in DSH runtime.',
    }, 'docs/cordis.md');

    // Store vector
    const storeRes = storeVector(db, 'docs/cordis.md', 'Cordis Plugin Architecture cordis inject patch');
    assert.equal(storeRes.status, 'OK');

    // Query vector
    const searchRes = searchVector(db, 'cordis plugin mechanics', 'project');
    assert.equal(searchRes.status, 'OK');
    assert.ok(searchRes.results.length > 0);
    assert.equal(searchRes.results[0].id, 'docs/cordis.md');
    assert.ok(searchRes.results[0].score > 0.5);
  } finally {
    cleanup();
  }
});

test('Vector Index: rejects dimension mismatch gracefully', () => {
  const { db, cleanup } = createTestDB();
  try {
    const invalidVec = new Float32Array(16);
    const storeRes = storeVector(db, 'docs/test.md', invalidVec);
    assert.equal(storeRes.status, 'NOT_AVAILABLE');

    const searchRes = searchVector(db, invalidVec);
    assert.equal(searchRes.status, 'NOT_AVAILABLE');
  } finally {
    cleanup();
  }
});

// ── 3. Hybrid RRF Retrieval Integration ──────────────────────────────────────

test('Hybrid Retrieval: emaRecall fuses lexical and vector signals via RRF', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, {
      title: 'Authentication Token Validation Protocol',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      scope: 'project',
      bodyText: 'Security verification for OAuth bearer JWT credentials.',
    }, 'docs/auth.md');

    storeVector(db, 'docs/auth.md', 'Authentication Token Validation Protocol Security verification for OAuth bearer JWT credentials.');

    // Query using synonyms / semantic phrase
    const recallRes = emaRecall('jwt token credentials verification', {
      db,
      actor: 'agent',
      scope: 'project',
    });

    assert.ok(recallRes.results.length > 0);
    assert.equal(recallRes.results[0].id, 'docs/auth.md');
    assert.ok(recallRes.contextMarkdown.includes('Authentication Token Validation Protocol'));
  } finally {
    cleanup();
  }
});
