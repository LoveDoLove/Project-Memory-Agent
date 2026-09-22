/**
 * EMA Phase 6 — Candidate Queue & Promotion Pipeline Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  createCandidate,
  validateCandidate,
  promoteScope,
  quarantineUnit,
} from '../../src/promotion/index.mjs';

import { getCandidate } from '../../src/storage/candidate-store.mjs';

function createTempWorkspace() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-promotion-test-'));
  const candidateDir = path.join(tmpDir, '.ema', 'candidates');
  const docsDir = path.join(tmpDir, 'docs');
  const changelogPath = path.join(tmpDir, 'CHANGELOG-MEMORY.md');

  fs.mkdirSync(candidateDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(changelogPath, '# Memory Audit Log\n', 'utf8');

  return { tmpDir, candidateDir, docsDir, changelogPath };
}

function cleanupTempWorkspace(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Candidate Validation ───────────────────────────────────────────────────

test('Promotion: validateCandidate updates validation state to Verified with audit notes', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Database Retry Logic',
      bodyText: 'Exponential backoff implementation.',
      evidence: ['ema://evidence/repo-1/abc1234/src/db.mjs#sym:connect'],
    }, ws.candidateDir);

    assert.equal(cand.validation_state, 'Unreviewed');

    const updated = validateCandidate(cand.id, 'Verified', {
      actor: 'human',
      candidateDir: ws.candidateDir,
      notes: 'Code verified against unit tests.',
    });

    assert.equal(updated.validation_state, 'Verified');
    assert.equal(updated.validated_by, 'human');
    assert.equal(updated.validation_notes, 'Code verified against unit tests.');
    assert.ok(updated.last_verified);
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

// ── Scope Promotion to Project ─────────────────────────────────────────────

test('Promotion: promoteScope to Project creates canonical EKU and removes from candidate queue', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Postgres Connection Pooling',
      bodyText: 'Use PgBouncer with 20 connections max.',
      evidence: ['ema://evidence/repo-1/abc1234/src/pool.mjs#sym:initPool'],
    }, ws.candidateDir);

    const result = promoteScope(cand.id, 'project', 'Approved for production use', {
      actor: 'agent',
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
      writeToDisk: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.promotedEKU.authority_level, 'Canonical');
    assert.equal(result.promotedEKU.validation_state, 'Verified');
    assert.equal(result.promotedEKU.scope, 'project');
    assert.ok(result.promotedEKU.promoted_from);
    assert.equal(result.promotedEKU.promoted_from.promoted_by, 'agent');
    assert.equal(result.promotedEKU.promoted_from.rationale, 'Approved for production use');

    // Candidate should be deleted from candidate store
    const removed = getCandidate(cand.id, ws.candidateDir);
    assert.equal(removed, null);

    // Canonical file should exist on disk
    assert.ok(fs.existsSync(result.filePath));

    // Changelog entry should be appended
    const changelog = fs.readFileSync(ws.changelogPath, 'utf8');
    assert.ok(changelog.includes('[PROMOTE] Postgres Connection Pooling'));
    assert.ok(changelog.includes('Approved for production use'));
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

// ── Scope Promotion to Workspace: Actor Authority Enforcement ──────────────

test('Promotion: agent is rejected from promoting to Workspace scope (requires project_admin or human)', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Shared Linter Config',
      bodyText: 'ESLint rules for workspace.',
    }, ws.candidateDir);

    assert.throws(() => {
      promoteScope(cand.id, 'workspace', 'Promoting shared rules', {
        actor: 'agent',
        candidateDir: ws.candidateDir,
      });
    }, /Authorization denied/);
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

test('Promotion: project_admin can promote to Workspace scope', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Shared Logger Standard',
      bodyText: 'Winston JSON logging standard.',
      evidence: ['ema://evidence/repo-1/abc1234/src/logger.mjs#sym:createLogger'],
    }, ws.candidateDir);

    const res = promoteScope(cand.id, 'workspace', 'Standardized across team repos', {
      actor: 'project_admin',
      candidateDir: ws.candidateDir,
      docsDir: ws.docsDir,
      changelogPath: ws.changelogPath,
    });

    assert.equal(res.success, true);
    assert.equal(res.promotedEKU.scope, 'workspace');
    assert.equal(res.promotedEKU.promoted_from.promoted_by, 'project_admin');
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

// ── Global Promotion: Independent Sources Invariant ───────────────────────

test('Promotion: Global promotion fails if evidence has fewer than 2 independent repository IDs', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Universal Error Handling Standard',
      bodyText: 'Global error response schema.',
      evidence: [
        // Two anchors, but in the SAME repository ('repo-alpha')
        'ema://evidence/repo-alpha/abc1234/src/errors.mjs#sym:ErrorHandler',
        'ema://evidence/repo-alpha/abc1234/src/api.mjs#sym:handleRoute',
      ],
    }, ws.candidateDir);

    assert.throws(() => {
      promoteScope(cand.id, 'global', 'Universal architecture pattern', {
        actor: 'project_admin',
        candidateDir: ws.candidateDir,
      });
    }, /Global promotion rejected.*distinct repository IDs/);
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

test('Promotion: Global promotion succeeds with >= 2 distinct repository IDs in evidence', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Universal Rate Limiting Pattern',
      bodyText: 'Token bucket rate limiter.',
      evidence: [
        // Two independent repositories: 'repo-payments' and 'repo-auth'
        'ema://evidence/repo-payments/abc1234/src/rate.mjs#sym:limiter',
        'ema://evidence/repo-auth/def5678/src/gate.mjs#sym:checkRate',
      ],
    }, ws.candidateDir);

    const res = promoteScope(cand.id, 'global', 'Proven across payments and auth repos', {
      actor: 'project_admin',
      candidateDir: ws.candidateDir,
      changelogPath: ws.changelogPath,
    });

    assert.equal(res.success, true);
    assert.equal(res.promotedEKU.scope, 'global');
    assert.ok(res.promotedEKU.promoted_from.min_sources_checked >= 2);
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

// ── Hard Isolation Enforcement in Promotion ────────────────────────────────

test('Promotion: promotion OUT of hard-isolated scope is blocked', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Proprietary Algorithm',
      bodyText: 'Classified IP.',
      isolation: 'hard',
      isIsolated: true,
    }, ws.candidateDir);

    assert.throws(() => {
      promoteScope(cand.id, 'workspace', 'Trying to export out of isolated scope', {
        actor: 'project_admin',
        candidateDir: ws.candidateDir,
        isIsolated: true,
      });
    }, /Hard-isolation violation.*forbidden/);
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});

// ── Quarantine Subsystem ───────────────────────────────────────────────────

test('Quarantine: quarantineUnit sets validation_state to Quarantined with reason', () => {
  const ws = createTempWorkspace();
  try {
    const cand = createCandidate({
      title: 'Conflicting Migration Strategy',
      bodyText: 'Run raw DROP TABLE in production migration.',
    }, ws.candidateDir);

    const quarantined = quarantineUnit(cand.id, 'Direct conflict with zero-downtime policy', {
      actor: 'human',
      candidateDir: ws.candidateDir,
    });

    assert.equal(quarantined.validation_state, 'Quarantined');
    assert.equal(quarantined.quarantine_reason, 'Direct conflict with zero-downtime policy');
    assert.equal(quarantined.quarantined_by, 'human');
  } finally {
    cleanupTempWorkspace(ws.tmpDir);
  }
});
