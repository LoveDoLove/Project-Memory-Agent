/**
 * EMA Phase 5 — 6-Stage Retrieval Engine Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { initIndex, closeIndex } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';
import { emaRecall, buildContext } from '../../src/retrieval/index.mjs';

function createTempDb() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-retrieval-test-'));
  const dbPath = path.join(tmpDir, 'test-index.db');
  const db = initIndex(dbPath);
  return { db, dbPath, tmpDir };
}

function cleanupTempDb({ db, tmpDir }) {
  closeIndex(db);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Stage 1: Authorization Gate ──────────────────────────────────────────────

test('Stage 1: unauthorized actor is rejected fail-closed with empty results', () => {
  const { db, tmpDir } = createTempDb();
  try {
    const res = emaRecall('database', {
      db,
      actor: 'invalid_hacker',
      context: { currentScopeId: 'test-repo' },
    });
    assert.equal(res.results.length, 0);
    assert.equal(res.explainability.status, 'UNAUTHORIZED');
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

test('Stage 1: forbidden scope request is rejected fail-closed', () => {
  const { db, tmpDir } = createTempDb();
  try {
    const res = emaRecall('database', {
      db,
      actor: 'agent',
      scope: 'other-forbidden-scope',
      context: { currentScopeId: 'test-repo', isIsolated: true },
    });
    assert.equal(res.results.length, 0);
    assert.equal(res.explainability.status, 'SCOPE_FORBIDDEN');
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

// ── Stage 3: Lifecycle & Maintenance Filtering ─────────────────────────────

test('Stage 3: Candidate authority records are strictly excluded from active retrieval', () => {
  const { db, tmpDir } = createTempDb();
  try {
    // 1. Authoritative canonical unit
    indexEKU(db, {
      title: 'Canonical Architecture Guideline',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      bodyText: 'This is verified canonical memory for database operations.',
    }, 'docs/arch.md');

    // 2. Candidate unvalidated unit
    indexEKU(db, {
      title: 'Candidate Proposal Guideline',
      scope: 'project',
      status: 'Current',
      validation_state: 'Unreviewed',
      authority_level: 'Candidate',
      confidence: 'Low',
      bodyText: 'This is unvalidated candidate proposal for database operations.',
    }, 'docs/candidate.md');

    const res = emaRecall('database', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    assert.equal(res.results.length, 1);
    assert.equal(res.results[0].title, 'Canonical Architecture Guideline');
    assert.equal(res.results[0].authority_level, 'Canonical');

    // Verify candidate was recorded in excluded log
    assert.ok(res.explainability.excluded.some(e => e.reason.includes('Candidate excluded')));
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

test('Stage 3: Draft, Superseded, Historical, and Abandoned are strictly excluded', () => {
  const { db, tmpDir } = createTempDb();
  try {
    const statuses = ['Draft', 'Superseded', 'Historical', 'Abandoned'];
    for (const st of statuses) {
      indexEKU(db, {
        title: `${st} Knowledge Unit`,
        scope: 'project',
        status: st,
        validation_state: 'Verified',
        authority_level: 'Canonical',
        bodyText: `Knowledge about deployment with status ${st}.`,
      }, `docs/${st.toLowerCase()}.md`);
    }

    const res = emaRecall('deployment', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    assert.equal(res.results.length, 0);
    assert.equal(res.explainability.excluded.length, 4);
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

test('Stage 3: Invalid and Quarantined validation states are strictly excluded', () => {
  const { db, tmpDir } = createTempDb();
  try {
    indexEKU(db, {
      title: 'Invalid Knowledge Unit',
      scope: 'project',
      status: 'Current',
      validation_state: 'Invalid',
      authority_level: 'Canonical',
      bodyText: 'Flawed deployment instruction.',
    }, 'docs/invalid.md');

    indexEKU(db, {
      title: 'Quarantined Knowledge Unit',
      scope: 'project',
      status: 'Current',
      validation_state: 'Quarantined',
      authority_level: 'Canonical',
      bodyText: 'Contradicted deployment instruction.',
    }, 'docs/quarantined.md');

    const res = emaRecall('deployment', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    assert.equal(res.results.length, 0);
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

test('Stage 3: Deprecated and Potentially Stale include warning annotations', () => {
  const { db, tmpDir } = createTempDb();
  try {
    indexEKU(db, {
      title: 'Old Deprecated API',
      scope: 'project',
      status: 'Deprecated',
      validation_state: 'Potentially Stale',
      authority_level: 'Canonical',
      confidence: 'Medium',
      bodyText: 'Legacy API endpoints for authentication.',
    }, 'docs/legacy.md');

    const res = emaRecall('authentication', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    assert.equal(res.results.length, 1);
    assert.ok(res.results[0].warnings.length >= 2);
    assert.ok(res.results[0].warnings.some(w => w.includes('Deprecated')));
    assert.ok(res.results[0].warnings.some(w => w.includes('potentially stale')));
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

// ── Stage 4: Multi-Dimensional Authority Ranking ───────────────────────────

test('Stage 4: returns transparent multi-dimensional scores (no opaque score)', () => {
  const { db, tmpDir } = createTempDb();
  try {
    indexEKU(db, {
      title: 'High Verified Memory',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      evidence: [
        'ema://evidence/repo-1/abc1234/src/server.mjs#sym:startServer',
      ],
      bodyText: 'Full architectural details for server lifecycle.',
    }, 'docs/server.md');

    const res = emaRecall('server', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    assert.equal(res.results.length, 1);
    const item = res.results[0];
    assert.ok(item.scores, 'Must have scores object');
    assert.equal(typeof item.scores.composite, 'number');
    assert.equal(typeof item.scores.relevance, 'number');
    assert.equal(typeof item.scores.evidence_strength, 'number');
    assert.equal(typeof item.scores.validation_tier, 'number');
    assert.equal(typeof item.scores.scope_proximity, 'number');
    assert.equal(typeof item.scores.freshness_tier, 'number');
    assert.equal(typeof item.scores.confidence, 'number');

    assert.equal(item.scores.validation_tier, 1.0); // Verified
    assert.equal(item.scores.confidence, 1.0);      // High
    assert.equal(item.scores.scope_proximity, 1.0); // Project
    assert.equal(item.scores.evidence_strength, 1.0); // Canonical URI + #sym:
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});

// ── Stage 6: Context Construction ───────────────────────────────────────────

test('Stage 6: buildContext produces formatted markdown with provenance headers', () => {
  const results = [
    {
      id: 'eku-1',
      title: 'DB Connection Setup',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      confidence: 'High',
      evidence: ['ema://evidence/repo-1/abc1234/src/db.mjs#sym:initDb'],
      body_text: 'Use connection pooling with 10 max connections.',
      scores: { composite: 0.95 },
    },
  ];

  const ctx = buildContext({ results, tokenBudget: 200, tier: 'L2' });
  assert.ok(ctx.contextMarkdown.includes('### DB Connection Setup'));
  assert.ok(ctx.contextMarkdown.includes('[Scope: project | Status: Current | Validated: Verified'));
  assert.ok(ctx.contextMarkdown.includes('Use connection pooling'));
  assert.ok(ctx.tokenCount > 0);
  assert.equal(ctx.scopeBreakdown.project, 1);
});
