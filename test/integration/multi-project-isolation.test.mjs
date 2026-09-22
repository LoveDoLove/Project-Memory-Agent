/**
 * EMA Phase 9 — Multi-Project Workspace Isolation Integration Tests
 *
 * Validates multi-project workspace behavior across two distinct repositories:
 * Repo A (isolated: true) and Repo B (isolated: false).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { initIndex, closeIndex, defaultIndexPath } from '../../src/index/db.mjs';
import { indexEKU } from '../../src/index/lexical-index.mjs';
import { emaRecall } from '../../src/retrieval/index.mjs';
import { evaluateAccess } from '../../src/policy/authorization.mjs';
import { applyQueryBoundary, evaluateIsolationBarrier } from '../../src/policy/isolation.mjs';

function setupTwoRepos() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-multiproj-'));
  const repoA = path.join(rootDir, 'repo-alpha'); // hard-isolated
  const repoB = path.join(rootDir, 'repo-beta');  // standard

  fs.mkdirSync(path.join(repoA, '.ema'), { recursive: true });
  fs.mkdirSync(path.join(repoB, '.ema'), { recursive: true });

  const dbA = initIndex(defaultIndexPath(repoA));
  const dbB = initIndex(defaultIndexPath(repoB));

  // Seed Repo A (Secret internal auth)
  indexEKU(dbA, {
    title: 'Alpha Internal OAuth Architecture',
    scope: 'project',
    scope_id: 'repo-alpha',
    status: 'Current',
    validation_state: 'Verified',
    authority_level: 'Canonical',
    confidence: 'High',
    isolation: 'hard',
    bodyText: 'Alpha OAuth server implementation details.',
  }, 'docs/auth.md');

  // Seed Repo B (Public API gateway)
  indexEKU(dbB, {
    title: 'Beta API Gateway Routing',
    scope: 'project',
    scope_id: 'repo-beta',
    status: 'Current',
    validation_state: 'Verified',
    authority_level: 'Canonical',
    confidence: 'High',
    isolation: 'soft',
    bodyText: 'Beta API gateway routes incoming requests.',
  }, 'docs/gateway.md');

  return { rootDir, repoA, repoB, dbA, dbB };
}

function teardownTwoRepos(env) {
  closeIndex(env.dbA);
  closeIndex(env.dbB);
  fs.rmSync(env.rootDir, { recursive: true, force: true });
}

test('Multi-Project: Hard-isolated repo A recall contains only repo A units', () => {
  const env = setupTwoRepos();
  try {
    const resA = emaRecall('OAuth', {
      db: env.dbA,
      actor: 'agent',
      context: { currentScopeId: 'repo-alpha', isIsolated: true },
    });

    assert.equal(resA.results.length, 1);
    assert.equal(resA.results[0].title, 'Alpha Internal OAuth Architecture');
  } finally {
    teardownTwoRepos(env);
  }
});

test('Multi-Project: Standard repo B cannot recall hard-isolated repo A knowledge', () => {
  const env = setupTwoRepos();
  try {
    // Caller in Repo B attempts to search for OAuth
    const resB = emaRecall('OAuth', {
      db: env.dbB,
      actor: 'agent',
      context: { currentScopeId: 'repo-beta', isIsolated: false },
    });

    assert.equal(resB.results.length, 0, 'Repo B must not have access to Repo A internal knowledge');
  } finally {
    teardownTwoRepos(env);
  }
});

test('Multi-Project: Zero-knowledge query boundary prunes foreign scopes for isolated caller', () => {
  const env = setupTwoRepos();
  try {
    const requestedScopes = [
      { scope: 'project', scopeId: 'repo-alpha' },
      { scope: 'project', scopeId: 'repo-beta' },
      { scope: 'workspace', scopeId: 'shared-ws' },
      { scope: 'global' },
    ];
    const filtered = applyQueryBoundary(requestedScopes, {
      isIsolated: true,
      currentScopeId: 'repo-alpha',
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].scopeId, 'repo-alpha');
  } finally {
    teardownTwoRepos(env);
  }
});

test('Multi-Project: Cross-project promotion out of isolated repo is rejected', () => {
  const env = setupTwoRepos();
  try {
    const check = evaluateIsolationBarrier(
      { scope: 'project', scopeId: 'repo-alpha', isIsolated: true },
      { scope: 'workspace', scopeId: 'shared-ws', isIsolated: false }
    );

    assert.equal(check.allowed, false);
    assert.equal(check.code, 404); // ScopeNotFound prevents disclosure of target/source
  } finally {
    teardownTwoRepos(env);
  }
});
