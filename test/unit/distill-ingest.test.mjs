/**
 * Engineering Memory Agent (EMA) — Auto-Distillation & Ingestion Tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseGitDiff,
  distillDiff,
  distillText,
  ingestKnowledge,
} from '../../src/ingest/distill.mjs';

import { executeToolCall } from '../../src/mcp/tools.mjs';
import { getCandidate } from '../../src/storage/candidate-store.mjs';

const SAMPLE_DIFF = `diff --git a/src/auth/jwt.ts b/src/auth/jwt.ts
index 1234567..89abcdef 100644
--- a/src/auth/jwt.ts
+++ b/src/auth/jwt.ts
@@ -10,6 +10,12 @@ export function verifyToken(token: string) {
   if (!token) throw new Error("Missing token");
+  try {
+    return parseJwt(token);
+  } catch (err) {
+    throw new Error("Invalid JWT token format");
+  }
 }
`;

function createTestEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-distill-test-'));
  const candDir = path.join(tmpDir, '.ema', 'candidates');
  const docsDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(candDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  const cleanup = () => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  };

  return { tmpDir, candDir, docsDir, cleanup };
}

// ── 1. Diff Parser Unit Tests ────────────────────────────────────────────────

test('Distill Parser: extracts file paths, hunk lines, and symbol names', () => {
  const parsed = parseGitDiff(SAMPLE_DIFF);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].filePath, 'src/auth/jwt.ts');
  assert.equal(parsed[0].hunks.length, 1);
  assert.equal(parsed[0].hunks[0].newStart, 10);
  assert.equal(parsed[0].hunks[0].symbol, 'verifyToken');
  assert.ok(parsed[0].hunks[0].added.length >= 5);
});

// ── 2. Distillation Invariants Tests ─────────────────────────────────────────

test('Distill Engine: maintains Candidate + Unreviewed invariants with grounded anchors', () => {
  const env = createTestEnv();
  try {
    const candidate = distillDiff(SAMPLE_DIFF, { repoRoot: env.tmpDir });

    assert.equal(candidate.authority_level, 'Candidate');
    assert.equal(candidate.validation_state, 'Unreviewed');
    assert.equal(candidate.status, 'Draft');
    assert.equal(candidate.confidence, 'Medium');
    assert.ok(candidate.title.includes('verifyToken') || candidate.title.includes('jwt.ts'));

    // Verify Grounded Evidence Anchors
    assert.ok(candidate.evidence.length > 0);
    const anchor = candidate.evidence[0];
    assert.ok(anchor.startsWith('ema://evidence/'));
    assert.ok(anchor.includes('/src/auth/jwt.ts#sym:verifyToken'));
  } finally {
    env.cleanup();
  }
});

// ── 3. Candidate Queue Storage Invariant ──────────────────────────────────────

test('Ingest Pipeline: stores candidate in .ema/candidates and never touches docs/', () => {
  const env = createTestEnv();
  try {
    const result = ingestKnowledge({ diff: SAMPLE_DIFF }, {
      repoRoot: env.tmpDir,
      candidateDir: env.candDir,
    });

    assert.ok(result.success);
    assert.ok(result.candidateId);
    assert.ok(fs.existsSync(result.filePath));

    // Invariant: docs/ canonical directory must remain completely untouched
    const docsFiles = fs.readdirSync(env.docsDir);
    assert.equal(docsFiles.length, 0, 'Canonical docs/ must NEVER be written to directly during ingestion');

    // Retrieve from candidate queue
    const saved = getCandidate(result.candidateId, env.candDir);
    assert.ok(saved);
    assert.equal(saved.authority_level, 'Candidate');
    assert.equal(saved.validation_state, 'Unreviewed');
  } finally {
    env.cleanup();
  }
});

// ── 4. MCP ema_distill Integration Test ──────────────────────────────────────

test('MCP Server: ema_distill tool ingests diff into candidate queue', async () => {
  const env = createTestEnv();
  try {
    const res = await executeToolCall('ema_distill', {
      diff: SAMPLE_DIFF,
      title: 'Fix: JWT Token Parsing Graceful Handling',
      scope: 'project',
    }, {
      projectRoot: env.tmpDir,
      candidateDir: env.candDir,
    });

    assert.ok(res.candidate_id);
    assert.equal(res.authority_level, 'Candidate');
    assert.equal(res.validation_state, 'Unreviewed');
    assert.ok(res.evidence_count > 0);
    assert.ok(fs.existsSync(res.filePath));
  } finally {
    env.cleanup();
  }
});
