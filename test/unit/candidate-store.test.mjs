/**
 * EMA Phase 6 — Candidate Storage Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  defaultCandidateDir,
  ensureCandidateDir,
  generateCandidateId,
  createCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
  removeCandidate,
} from '../../src/storage/candidate-store.mjs';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ema-candidate-test-'));
}

function cleanupTempDir(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

test('Candidate Storage: defaultCandidateDir returns .ema/candidates under cwd', () => {
  const cwd = process.cwd();
  const expected = path.join(cwd, '.ema', 'candidates');
  assert.equal(defaultCandidateDir(), expected);
});

test('Candidate Storage: ensureCandidateDir creates directory if missing', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    assert.equal(fs.existsSync(candDir), false);
    ensureCandidateDir(candDir);
    assert.equal(fs.existsSync(candDir), true);
  } finally {
    cleanupTempDir(tmpDir);
  }
});

test('Candidate Storage: generateCandidateId produces URL-safe slug with timestamp', () => {
  const id1 = generateCandidateId('PostgreSQL Connection Pooling');
  assert.ok(id1.startsWith('cand-'));
  assert.ok(id1.includes('-postgresql-connection-pooling'));
  const id2 = generateCandidateId('');
  assert.ok(id2.startsWith('cand-'));
  assert.ok(id2.endsWith('-unit'));
});

test('Candidate Storage: createCandidate persists a JSON file with correct invariants', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    const data = {
      title: 'Test Candidate',
      bodyText: 'This is a test candidate.',
      evidence: ['ema://evidence/repo/abc123/file.md#sym:test'],
      related: [{ target: 'other.md', type: 'relates-to' }],
      tags: ['test', 'candidate'],
    };
    const candidate = createCandidate(data, candDir);

    // Check invariants
    assert.equal(candidate.authority_level, 'Candidate');
    assert.equal(candidate.validation_state, 'Unreviewed');
    assert.equal(candidate.confidence, 'Low');
    assert.equal(candidate.status, 'Draft');
    assert.equal(candidate.scope, 'project');

    // Check file exists
    const filePath = path.join(candDir, `${candidate.id}.json`);
    assert.equal(fs.existsSync(filePath), true);

    // Check content matches
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.title, data.title);
    assert.equal(parsed.body_text, data.bodyText);
    assert.deepEqual(parsed.evidence, data.evidence);
    assert.deepEqual(parsed.related, data.related);
    assert.deepEqual(parsed.tags, data.tags);
  } finally {
    cleanupTempDir(tmpDir);
  }
});

test('Candidate Storage: getCandidate retrieves persisted candidate by ID', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    const data = { title: 'Retrieve Me', bodyText: 'Content' };
    const created = createCandidate(data, candDir);
    const fetched = getCandidate(created.id, candDir);
    assert.equal(fetched?.id, created.id);
    assert.equal(fetched?.title, data.title);
  } finally {
    cleanupTempDir(tmpDir);
  }
});

test('Candidate Storage: listCandidates returns all candidates and respects filters', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    // Create three candidates
    createCandidate({ title: 'Alpha', bodyText: 'A' }, candDir);
    createCandidate({ title: 'Beta', bodyText: 'B', scope: 'workspace' }, candDir);
    const gamma = createCandidate({ title: 'Gamma', bodyText: 'C' }, candDir);
    updateCandidate(gamma.id, { validation_state: 'Needs Review' }, candDir);

    const all = listCandidates(candDir);
    assert.equal(all.length, 3);

    const projectOnly = listCandidates(candDir, { scope: 'project' });
    assert.equal(projectOnly.length, 2); // Alpha and Gamma

    const needsReview = listCandidates(candDir, { validation_state: 'Needs Review' });
    assert.equal(needsReview.length, 1);
    assert.equal(needsReview[0].title, 'Gamma');
  } finally {
    cleanupTempDir(tmpDir);
  }
});

test('Candidate Storage: updateCandidate modifies fields and persists changes', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    const data = { title: 'Original', bodyText: 'Original body' };
    const created = createCandidate(data, candDir);

    const updated = updateCandidate(created.id, {
      title: 'Updated',
      bodyText: 'Updated body',
      validation_state: 'Needs Review',
    }, candDir);

    assert.equal(updated.title, 'Updated');
    assert.equal(updated.bodyText, 'Updated body');
    assert.equal(updated.validation_state, 'Needs Review');

    // Verify persisted
    const fetched = getCandidate(created.id, candDir);
    assert.equal(fetched.title, 'Updated');
    assert.equal(fetched.bodyText, 'Updated body');
    assert.equal(fetched.validation_state, 'Needs Review');
  } finally {
    cleanupTempDir(tmpDir);
  }
});

test('Candidate Storage: removeCandidate deletes file and returns true/false', () => {
  const tmpDir = createTempDir();
  try {
    const candDir = path.join(tmpDir, '.ema', 'candidates');
    const data = { title: 'To Remove', bodyText: 'Content' };
    const created = createCandidate(data, candDir);

    const filePath = path.join(candDir, `${created.id}.json`);
    assert.equal(fs.existsSync(filePath), true);

    const removed = removeCandidate(created.id, candDir);
    assert.equal(removed, true);
    assert.equal(fs.existsSync(filePath), false);

    // Removing again returns false
    const removedAgain = removeCandidate(created.id, candDir);
    assert.equal(removedAgain, false);
  } finally {
    cleanupTempDir(tmpDir);
  }
});
