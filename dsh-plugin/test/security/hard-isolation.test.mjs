/**
 * EMA Phase 4 — 6-Boundary Hard Isolation Security Tests
 * Proves zero cross-scope information leakage across hard isolation boundaries.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isHardIsolated,
  verifyStorageBoundary,
  getIsolatedIndexPath,
  applyQueryBoundary,
  evaluateIsolationBarrier,
  canPromoteAcrossIsolation,
  scrubExportPatterns,
  validateExport,
} from '../../src/policy/isolation.mjs';

import {
  evaluateAccess,
  getAuthorizedScopes,
  ACTOR,
  OPERATION,
  SCOPE,
  POLICY_CODE,
} from '../../src/policy/index.mjs';

// ── Boundary 1: Storage Boundary ─────────────────────────────────────────────

test('Storage Boundary: permits paths strictly within isolated root directory', () => {
  const root = '/isolated/secret-project';
  const target = '/isolated/secret-project/docs/arch.md';
  const res = verifyStorageBoundary(root, target);
  assert.equal(res.allowed, true);
});

test('Storage Boundary: blocks path traversal attempts escaping isolated root', () => {
  const root = '/isolated/secret-project';
  const target = '/isolated/secret-project/../../etc/passwd';
  const res = verifyStorageBoundary(root, target);
  assert.equal(res.allowed, false);
  assert.ok(res.reason.includes('Storage boundary violation'));
});

test('Storage Boundary: blocks writes into shared workspace from isolated project', () => {
  const root = '/isolated/secret-project';
  const sharedWorkspace = '/shared/workspace/docs/leak.md';
  const res = verifyStorageBoundary(root, sharedWorkspace);
  assert.equal(res.allowed, false);
});

// ── Boundary 2: Index Boundary ───────────────────────────────────────────────

test('Index Boundary: isolated project gets dedicated index path', () => {
  const isolatedPath = getIsolatedIndexPath('/repo/secret', true);
  const normalPath = getIsolatedIndexPath('/repo/normal', false);

  assert.ok(isolatedPath.includes('.ema/isolated/index.db') || isolatedPath.includes('.ema\\isolated\\index.db'));
  assert.ok(!normalPath.includes('isolated'));
  assert.notEqual(isolatedPath, normalPath);
});

// ── Boundary 3: Query Boundary (Zero-Knowledge No-Probe) ─────────────────────

test('Query Boundary: isolated caller can ONLY query its own scope (zero leakage of foreign scopes)', () => {
  const candidateScopes = [
    { scope: 'task', taskId: 'goal-99' },
    { scope: 'project', scopeId: 'github.com/org/isolated-repo' },
    { scope: 'project', scopeId: 'github.com/org/other-repo' },
    { scope: 'workspace', scopeId: '/shared/ws' },
    { scope: 'global', scopeId: 'global' },
  ];

  const callerContext = {
    currentScope: 'project',
    currentScopeId: 'github.com/org/isolated-repo',
    taskId: 'goal-99',
    isIsolated: true,
  };

  const filtered = applyQueryBoundary(candidateScopes, callerContext);

  // Must only contain its own task and project scopes.
  // Other-repo, workspace, and global MUST be pruned to achieve zero leakage.
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every(s => s.scopeId === 'github.com/org/isolated-repo' || s.taskId === 'goal-99'));
  assert.ok(!filtered.some(s => s.scope === 'workspace'));
  assert.ok(!filtered.some(s => s.scope === 'global'));
  assert.ok(!filtered.some(s => s.scopeId === 'github.com/org/other-repo'));
});

test('Query Boundary: un-isolated caller CANNOT probe or query hard-isolated project', () => {
  const candidateScopes = [
    { scope: 'project', scopeId: 'github.com/org/public-repo', isIsolated: false },
    { scope: 'project', scopeId: 'github.com/org/secret-repo', isIsolated: true },
    { scope: 'workspace', scopeId: '/shared/ws', isIsolated: false },
  ];

  const callerContext = {
    currentScopeId: 'github.com/org/public-repo',
    isIsolated: false,
  };

  const filtered = applyQueryBoundary(candidateScopes, callerContext);

  // Secret repo must be completely pruned
  assert.equal(filtered.length, 2);
  assert.ok(!filtered.some(s => s.scopeId === 'github.com/org/secret-repo'));
});

// ── Boundary 4: Authorization Boundary (No Existence Disclosure) ────────────

test('Authorization Boundary: cross-boundary probe returns ScopeNotFound (404), not existence confirmation', () => {
  const source = { scope: 'project', scopeId: 'public-repo', isIsolated: false };
  const target = { scope: 'project', scopeId: 'secret-repo', isIsolated: true };

  const barrier = evaluateIsolationBarrier(source, target);
  assert.equal(barrier.allowed, false);
  assert.equal(barrier.code, POLICY_CODE.SCOPE_NOT_FOUND, 'Must return ScopeNotFound to prevent existence probing');
});

test('Authorization Boundary: hard-isolated scope severs inheritance in getAuthorizedScopes', () => {
  const context = {
    currentScopeId: 'github.com/org/isolated-repo',
    workspaceId: '/shared/ws',
    isIsolated: true,
  };

  const scopes = getAuthorizedScopes(ACTOR.AGENT, context);

  // Inheritance to workspace and global must be completely severed!
  assert.equal(scopes.length, 1);
  assert.equal(scopes[0].scope, 'project');
  assert.equal(scopes[0].scopeId, 'github.com/org/isolated-repo');
  assert.equal(scopes[0].isIsolated, true);
});

// ── Boundary 5: Promotion Boundary ───────────────────────────────────────────

test('Promotion Boundary: promotion OUT of hard-isolated scope is strictly forbidden', () => {
  const source = { scope: 'project', isIsolated: true };
  const target = { scope: 'workspace', isIsolated: false };

  const res = canPromoteAcrossIsolation(source, target);
  assert.equal(res.allowed, false);
  assert.ok(res.reason.includes('Promotion OUT of hard-isolated scope is strictly forbidden'));
});

test('Promotion Boundary: promotion IN to hard-isolated scope is strictly forbidden', () => {
  const source = { scope: 'workspace', isIsolated: false };
  const target = { scope: 'project', isIsolated: true };

  const res = canPromoteAcrossIsolation(source, target);
  assert.equal(res.allowed, false);
  assert.ok(res.reason.includes('Promotion IN to hard-isolated scope is strictly forbidden'));
});

test('Promotion Boundary: evaluateAccess rejects promotion from isolated scope to workspace/global', () => {
  const res = evaluateAccess({
    actor: ACTOR.PROJECT_ADMIN,
    operation: OPERATION.PROMOTE,
    scope: SCOPE.WORKSPACE,
    isIsolated: true,
  });
  assert.equal(res.allowed, false);
  assert.equal(res.code, POLICY_CODE.FORBIDDEN);
});

// ── Boundary 6: Export Boundary (Pattern Scrubbing & Admin Control) ──────────

test('Export Boundary: export by agent actor is rejected for hard-isolated project', () => {
  const res = validateExport(ACTOR.AGENT, 'Some content', true);
  assert.equal(res.allowed, false);
  assert.ok(res.reason.includes('requires human or project_admin'));
});

test('Export Boundary: pattern scrubber redacts Bearer tokens, API keys, and private keys', () => {
  const sensitiveText = `
Here is an auth token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
Database password: password = "super_secret_production_password_123"
GitHub key: ghp_123456789012345678901234567890123456
Private key:
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1234567890abcdef...
-----END RSA PRIVATE KEY-----
`;

  const scrubbed = scrubExportPatterns(sensitiveText);
  assert.equal(scrubbed.clean, false);
  assert.ok(scrubbed.redactionsCount >= 4);
  assert.ok(!scrubbed.scrubbed.includes('eyJhbGciOiJIUzI1Ni'));
  assert.ok(!scrubbed.scrubbed.includes('super_secret_production_password_123'));
  assert.ok(!scrubbed.scrubbed.includes('ghp_123456789012345678901234567890123456'));
  assert.ok(!scrubbed.scrubbed.includes('BEGIN RSA PRIVATE KEY'));
  assert.ok(scrubbed.scrubbed.includes('[REDACTED_TOKEN]'));
  assert.ok(scrubbed.scrubbed.includes('[REDACTED_SECRET]'));
  assert.ok(scrubbed.scrubbed.includes('[REDACTED_KEY]'));
  assert.ok(scrubbed.scrubbed.includes('[REDACTED_PRIVATE_KEY]'));
});

test('Export Boundary: validateExport succeeds for human with clean scrubbed content', () => {
  const raw = 'api_key = "secret_12345678" and valid text.';
  const res = validateExport(ACTOR.HUMAN, raw, true);
  assert.equal(res.allowed, true);
  assert.ok(!res.scrubbedContent.includes('secret_12345678'));
  assert.ok(res.scrubbedContent.includes('[REDACTED_SECRET]'));
});
