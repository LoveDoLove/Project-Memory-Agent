/**
 * EMA Phase 5 — Contradiction Surfacing Security Tests
 * Proves conflicting knowledge is NEVER silently resolved, suppressed, or hidden.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { initIndex, closeIndex } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';
import { emaRecall } from '../../src/retrieval/index.mjs';

function createTempDb() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-contradiction-test-'));
  const dbPath = path.join(tmpDir, 'test-index.db');
  const db = initIndex(dbPath);
  return { db, dbPath, tmpDir };
}

function cleanupTempDb({ db, tmpDir }) {
  closeIndex(db);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

test('Contradiction: conflicting EKUs are both surfaced with explicit banners (never silently resolved)', () => {
  const { db, tmpDir } = createTempDb();
  try {
    // EKU A: Recommends PostgreSQL pooling
    indexEKU(db, {
      title: 'PostgreSQL Pooling Standard',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'High',
      related: [
        { target: 'docs/db-direct.md', type: 'contradicts' },
      ],
      bodyText: 'We use PgBouncer connection pooling for all services.',
    }, 'docs/db-pooling.md');

    // EKU B: Recommends Direct Connections (contradicts EKU A)
    indexEKU(db, {
      title: 'Direct Connection Standard',
      scope: 'project',
      status: 'Current',
      validation_state: 'Verified',
      authority_level: 'Canonical',
      confidence: 'Medium',
      related: [
        { target: 'docs/db-pooling.md', type: 'contradicts' },
      ],
      bodyText: 'Services must connect directly to Postgres without pooling.',
    }, 'docs/db-direct.md');

    const res = emaRecall('connection pooling postgres', {
      db,
      actor: 'agent',
      context: { currentScopeId: 'test-repo' },
    });

    // 1. Both contradicting units MUST be retrieved
    assert.equal(res.results.length, 2, 'Both contradicting units must be retrieved');

    const titles = res.results.map(r => r.title);
    assert.ok(titles.includes('PostgreSQL Pooling Standard'));
    assert.ok(titles.includes('Direct Connection Standard'));

    // 2. Contradiction must be flagged in top-level contradictions list
    assert.equal(res.contradictions.length, 1);
    assert.ok(res.contradictions[0].banner.includes('CONTRADICTION'));

    // 3. Both units must have contradiction banners attached
    for (const item of res.results) {
      assert.ok(item.contradiction, 'Each contradicting unit must have contradiction metadata');
      assert.equal(item.contradiction.detected, true);
      assert.ok(item.contradiction.banners.length > 0);
      assert.ok(item.contradiction.banners[0].includes('CONTRADICTION'));
    }

    // 4. In the generated context markdown, contradiction alert must be prominent
    assert.ok(res.contextMarkdown.includes('CONTRADICTION ALERT'));
    assert.ok(res.contextMarkdown.includes('PostgreSQL Pooling Standard'));
    assert.ok(res.contextMarkdown.includes('Direct Connection Standard'));
  } finally {
    cleanupTempDb({ db, tmpDir });
  }
});
