/**
 * EMA Phase 4 — Policy & Authorization Engine Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateAccess,
  getAuthorizedScopes,
  ACTOR,
  OPERATION,
  SCOPE,
  POLICY_CODE,
} from '../../src/policy/index.mjs';

// ── 4-Actor Matrix Verification ──────────────────────────────────────────────

test('Policy: read operation is permitted for all 4 authorized actors', () => {
  for (const actor of ['human', 'agent', 'system', 'project_admin']) {
    const res = evaluateAccess(actor, OPERATION.READ, SCOPE.PROJECT);
    assert.equal(res.allowed, true, `Actor ${actor} should be allowed to read`);
    assert.equal(res.code, POLICY_CODE.ALLOW);
  }
});

test('Policy: candidate_create is permitted for all 4 actors', () => {
  for (const actor of ['human', 'agent', 'system', 'project_admin']) {
    const res = evaluateAccess(actor, OPERATION.CANDIDATE_CREATE, SCOPE.PROJECT);
    assert.equal(res.allowed, true, `Actor ${actor} should be allowed to create candidates`);
  }
});

test('Policy: validate is permitted for all 4 actors', () => {
  for (const actor of ['human', 'agent', 'system', 'project_admin']) {
    const res = evaluateAccess(actor, OPERATION.VALIDATE, SCOPE.PROJECT);
    assert.equal(res.allowed, true, `Actor ${actor} should be allowed to validate`);
  }
});

test('Policy: human actor has full promote/demote/quarantine/export authority', () => {
  assert.equal(evaluateAccess(ACTOR.HUMAN, OPERATION.PROMOTE, SCOPE.GLOBAL).allowed, true);
  assert.equal(evaluateAccess(ACTOR.HUMAN, OPERATION.DEMOTE, SCOPE.WORKSPACE).allowed, true);
  assert.equal(evaluateAccess(ACTOR.HUMAN, OPERATION.QUARANTINE, SCOPE.PROJECT).allowed, true);
  assert.equal(evaluateAccess(ACTOR.HUMAN, OPERATION.EXPORT, SCOPE.PROJECT).allowed, true);
});

test('Policy: project_admin has full promote/demote/quarantine/export authority', () => {
  assert.equal(evaluateAccess(ACTOR.PROJECT_ADMIN, OPERATION.PROMOTE, SCOPE.GLOBAL).allowed, true);
  assert.equal(evaluateAccess(ACTOR.PROJECT_ADMIN, OPERATION.DEMOTE, SCOPE.WORKSPACE).allowed, true);
  assert.equal(evaluateAccess(ACTOR.PROJECT_ADMIN, OPERATION.QUARANTINE, SCOPE.PROJECT).allowed, true);
  assert.equal(evaluateAccess(ACTOR.PROJECT_ADMIN, OPERATION.EXPORT, SCOPE.PROJECT).allowed, true);
});

test('Policy: agent is allowed to promote/demote in Project scope only', () => {
  const projRes = evaluateAccess(ACTOR.AGENT, OPERATION.PROMOTE, SCOPE.PROJECT);
  assert.equal(projRes.allowed, true, 'Agent should be able to promote within Project scope');

  const wsRes = evaluateAccess(ACTOR.AGENT, OPERATION.PROMOTE, SCOPE.WORKSPACE);
  assert.equal(wsRes.allowed, false, 'Agent must NOT be able to promote to Workspace scope');
  assert.equal(wsRes.code, POLICY_CODE.FORBIDDEN);

  const globalRes = evaluateAccess(ACTOR.AGENT, OPERATION.PROMOTE, SCOPE.GLOBAL);
  assert.equal(globalRes.allowed, false, 'Agent must NOT be able to promote to Global scope');
});

test('Policy: agent is NOT authorized to export', () => {
  const res = evaluateAccess(ACTOR.AGENT, OPERATION.EXPORT, SCOPE.PROJECT);
  assert.equal(res.allowed, false);
  assert.equal(res.code, POLICY_CODE.FORBIDDEN);
});

test('Policy: system actor cannot promote, demote, quarantine, or export', () => {
  assert.equal(evaluateAccess(ACTOR.SYSTEM, OPERATION.PROMOTE, SCOPE.PROJECT).allowed, false);
  assert.equal(evaluateAccess(ACTOR.SYSTEM, OPERATION.DEMOTE, SCOPE.PROJECT).allowed, false);
  assert.equal(evaluateAccess(ACTOR.SYSTEM, OPERATION.QUARANTINE, SCOPE.PROJECT).allowed, false);
  assert.equal(evaluateAccess(ACTOR.SYSTEM, OPERATION.EXPORT, SCOPE.PROJECT).allowed, false);
});

// ── Fail-Closed Security Checks ──────────────────────────────────────────────

test('Policy Fail-Closed: unknown actor is rejected with 403', () => {
  const res = evaluateAccess('unknown_hacker', OPERATION.READ, SCOPE.PROJECT);
  assert.equal(res.allowed, false);
  assert.equal(res.code, POLICY_CODE.FORBIDDEN);
});

test('Policy Fail-Closed: null or undefined actor is rejected with 403', () => {
  assert.equal(evaluateAccess(null, OPERATION.READ, SCOPE.PROJECT).allowed, false);
  assert.equal(evaluateAccess(undefined, OPERATION.READ, SCOPE.PROJECT).allowed, false);
});

test('Policy Fail-Closed: unknown operation is rejected with 400', () => {
  const res = evaluateAccess(ACTOR.HUMAN, 'drop_table', SCOPE.PROJECT);
  assert.equal(res.allowed, false);
  assert.equal(res.code, POLICY_CODE.BAD_REQUEST);
});

test('Policy Fail-Closed: object argument format is supported', () => {
  const res = evaluateAccess({
    actor: ACTOR.AGENT,
    operation: OPERATION.PROMOTE,
    scope: SCOPE.PROJECT,
    isIsolated: false,
  });
  assert.equal(res.allowed, true);
});

// ── Scope Inheritance Traversal ──────────────────────────────────────────────

test('Scope Traversal: getAuthorizedScopes returns Task -> Project -> Workspace -> Global in priority order', () => {
  const context = {
    taskId: 'goal-1234',
    currentScopeId: 'github.com/org/repo',
    workspaceId: '/path/to/workspace',
    isIsolated: false,
  };
  const scopes = getAuthorizedScopes(ACTOR.AGENT, context);
  assert.equal(scopes.length, 4);
  assert.equal(scopes[0].scope, 'task');
  assert.equal(scopes[0].scopeId, 'goal-1234');
  assert.equal(scopes[1].scope, 'project');
  assert.equal(scopes[1].scopeId, 'github.com/org/repo');
  assert.equal(scopes[2].scope, 'workspace');
  assert.equal(scopes[3].scope, 'global');
});

test('Scope Traversal: without taskId, returns Project -> Workspace -> Global', () => {
  const context = {
    currentScopeId: 'github.com/org/repo',
    workspaceId: '/path/to/workspace',
    isIsolated: false,
  };
  const scopes = getAuthorizedScopes(ACTOR.AGENT, context);
  assert.equal(scopes.length, 3);
  assert.equal(scopes[0].scope, 'project');
  assert.equal(scopes[1].scope, 'workspace');
  assert.equal(scopes[2].scope, 'global');
});

test('Scope Traversal: invalid actor returns empty array (fail-closed)', () => {
  assert.deepEqual(getAuthorizedScopes('invalid-actor', {}), []);
  assert.deepEqual(getAuthorizedScopes(null, {}), []);
});
