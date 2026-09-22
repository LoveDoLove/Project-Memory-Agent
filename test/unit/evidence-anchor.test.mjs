/**
 * Engineering Memory Agent (EMA) — Phase 2 Unit Tests
 * Test Suite: Evidence Anchors & Grounding Subsystem
 *
 * Verifies:
 * - Canonical evidence URI parsing and serialization.
 * - All eight approved logical anchor types (sym, ast, sec, test, cfg, pr, issue, line).
 * - Immutable Git reference enforcement and rejection of mutable refs (HEAD, main, master).
 * - Repository-relative path validation and traversal rejection (POSIX, Windows drive, UNC, encoded).
 * - Evidence resolver and grounding states (fresh, stale, invalid).
 * - Historical anchor immutability during file rename / refactor.
 * - Grounding resolution does NOT manufacture 'Verified' validation_state.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

import {
  LOGICAL_ANCHOR_TYPES,
  GROUNDING_STATES,
  STALENESS_REASONS,
} from '../../src/evidence/constants.mjs';

import {
  EvidenceAnchor,
  parseEvidenceAnchor,
  createEvidenceAnchor,
  serializeEvidenceAnchor,
  validateEvidenceAnchor,
  parseLogicalAnchor,
  validateRepositoryRelativePath,
} from '../../src/evidence/anchor.mjs';

import {
  resolveLogicalAnchorInContent,
} from '../../src/evidence/staleness.mjs';

import {
  resolveEvidenceAnchor,
  checkStaleness,
} from '../../src/evidence/resolver.mjs';

import {
  validateEKU,
  parseEKU,
} from '../../src/core/index.mjs';

// ── 1. Canonical Evidence URI Parsing & Serialization ────────────────────────

test('Anchor Parsing: parses valid canonical evidence URI into EvidenceAnchor', () => {
  const uri = 'ema://evidence/github.com/org/repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth/jwt.ts#sym:verifyToken';
  const anchor = parseEvidenceAnchor(uri);

  assert.strictEqual(anchor.repoId, 'github.com/org/repo');
  assert.strictEqual(anchor.gitRef, '9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b');
  assert.strictEqual(anchor.filePath, 'src/auth/jwt.ts');
  assert.strictEqual(anchor.logicalAnchor.type, 'sym');
  assert.strictEqual(anchor.logicalAnchor.value, 'verifyToken');
  assert.strictEqual(anchor.logicalAnchor.raw, 'sym:verifyToken');
  assert.strictEqual(anchor.toURI(), uri);
});

test('Anchor Round-Trip: structured object -> canonical URI -> parsed object preserves identity', () => {
  const original = createEvidenceAnchor({
    repoId: 'github.com/org/my-project',
    gitRef: '8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
    filePath: 'packages/core/src/index.ts',
    logicalAnchor: 'line:10:25',
  });

  const uri = original.toURI();
  const parsed = parseEvidenceAnchor(uri);

  assert.strictEqual(parsed.repoId, original.repoId);
  assert.strictEqual(parsed.gitRef, original.gitRef);
  assert.strictEqual(parsed.filePath, original.filePath);
  assert.strictEqual(parsed.logicalAnchor.type, 'line');
  assert.strictEqual(parsed.logicalAnchor.start, 10);
  assert.strictEqual(parsed.logicalAnchor.end, 25);
  assert.strictEqual(parsed.toURI(), uri);
});

// ── 2. All Eight Approved Logical Anchor Types ───────────────────────────────

test('Logical Anchors: accepts all eight approved anchor types', () => {
  const testCases = [
    { raw: 'sym:verifyToken', expectedType: 'sym', expectedVal: 'verifyToken' },
    { raw: 'ast:ClassDeclaration[name=AuthService]', expectedType: 'ast', expectedVal: 'ClassDeclaration[name=AuthService]' },
    { raw: 'sec:Authentication%20Flow', expectedType: 'sec', expectedVal: 'Authentication%20Flow' },
    { raw: 'test:should_expire_jwt_after_ttl', expectedType: 'test', expectedVal: 'should_expire_jwt_after_ttl' },
    { raw: 'cfg:$.security.jwt.algorithms', expectedType: 'cfg', expectedVal: '$.security.jwt.algorithms' },
    { raw: 'pr:142', expectedType: 'pr', expectedVal: '142', expectedNum: 142 },
    { raw: 'issue:89', expectedType: 'issue', expectedVal: '89', expectedNum: 89 },
    { raw: 'line:42:55', expectedType: 'line', expectedVal: '42:55', expectedStart: 42, expectedEnd: 55 },
    { raw: 'line:42', expectedType: 'line', expectedVal: '42', expectedStart: 42, expectedEnd: 42 },
  ];

  for (const tc of testCases) {
    const parsed = parseLogicalAnchor(tc.raw);
    assert.strictEqual(parsed.type, tc.expectedType);
    assert.strictEqual(parsed.value, tc.expectedVal);
    if (tc.expectedNum !== undefined) assert.strictEqual(parsed.number, tc.expectedNum);
    if (tc.expectedStart !== undefined) assert.strictEqual(parsed.start, tc.expectedStart);
    if (tc.expectedEnd !== undefined) assert.strictEqual(parsed.end, tc.expectedEnd);
  }
});

test('Logical Anchors: rejects malformed and unapproved anchor forms', () => {
  assert.throws(() => parseLogicalAnchor('foo:bar'), /Invalid logical anchor type 'foo'/);
  assert.throws(() => parseLogicalAnchor('sym:'), /Empty value for logical anchor/);
  assert.throws(() => parseLogicalAnchor('pr:not-a-number'), /requires a positive integer number/);
  assert.throws(() => parseLogicalAnchor('issue:xyz'), /requires a positive integer number/);
  assert.throws(() => parseLogicalAnchor('line:0:10'), /Line numbers must be >= 1/);
  assert.throws(() => parseLogicalAnchor('line:50:20'), /start \(50\) must be <= end \(20\)/);
  assert.throws(() => parseLogicalAnchor('missing_colon'), /missing ':' separator/);
});

// ── 3. Immutable Git Reference Validation & Mutable Ref Rejection ────────────

test('Git References: accepts valid 40-char full SHA and 7-char short SHA', () => {
  const fullSha = '9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b';
  const shortSha = '9f8a2c1';

  const anchor1 = parseEvidenceAnchor(`ema://evidence/repo/${fullSha}/file.ts#sym:test`);
  assert.strictEqual(anchor1.gitRef, fullSha);

  const anchor2 = parseEvidenceAnchor(`ema://evidence/repo/${shortSha}/file.ts#sym:test`);
  assert.strictEqual(anchor2.gitRef, shortSha);
});

test('Git References: rejects mutable branch references (HEAD, main, master, dev)', () => {
  const mutableRefs = ['HEAD', 'main', 'master', 'develop', 'dev', 'trunk', 'latest'];

  for (const ref of mutableRefs) {
    assert.throws(
      () => parseEvidenceAnchor(`ema://evidence/repo/${ref}/file.ts#sym:test`),
      /Mutable Git reference/i,
      `Expected mutable ref '${ref}' to be rejected`
    );
  }
});

test('Git References: rejects malformed non-hex references', () => {
  assert.throws(
    () => parseEvidenceAnchor('ema://evidence/repo/not-a-hex-sha-xyz/file.ts#sym:test'),
    /Invalid Git reference/i
  );
});

// ── 4. Repository-Relative Path Validation & Traversal Rejection ─────────────

test('Path Validation: accepts valid nested repository-relative paths', () => {
  const validPaths = [
    'src/auth/jwt.ts',
    'packages/core/sub/module.py',
    'README.md',
    'config/settings.json',
  ];

  for (const p of validPaths) {
    const res = validateRepositoryRelativePath(p);
    assert.strictEqual(res.valid, true, `Path '${p}' should be valid`);
  }
});

test('Path Validation: rejects path traversal, absolute paths, Windows drives, UNC and encoded traversals', () => {
  const dangerousPaths = [
    '../secret.txt',
    'src/../../etc/passwd',
    '/etc/passwd',
    '\\Windows\\System32',
    'C:\\projects\\app.ts',
    'D:/code/file.js',
    '\\\\server\\share\\file.ts',
    'src/%2e%2e%2fsecret.txt',
    'src/..%2fsecret.txt',
  ];

  for (const p of dangerousPaths) {
    const res = validateRepositoryRelativePath(p);
    assert.strictEqual(res.valid, false, `Dangerous path '${p}' should be rejected`);
  }
});

// ── 5. Logical Anchor Resolution in Content ──────────────────────────────────

test('Staleness Resolver: resolves symbols, headings, tests, configs, and line ranges in text', () => {
  const sourceCode = `// Authentication Module
export async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

export class AuthManager {
  login() {}
}

describe('AuthModule Tests', () => {
  it('should_expire_jwt_after_ttl', () => {});
});
`;

  // 1. Symbol resolution
  const symRes = resolveLogicalAnchorInContent(parseLogicalAnchor('sym:verifyToken'), sourceCode);
  assert.strictEqual(symRes.resolved, true);
  assert.strictEqual(symRes.line, 2);

  // 2. Class symbol resolution
  const classRes = resolveLogicalAnchorInContent(parseLogicalAnchor('sym:AuthManager'), sourceCode);
  assert.strictEqual(classRes.resolved, true);
  assert.strictEqual(classRes.line, 7);

  // 3. Test resolution
  const testRes = resolveLogicalAnchorInContent(parseLogicalAnchor('test:should_expire_jwt_after_ttl'), sourceCode);
  assert.strictEqual(testRes.resolved, true);
  assert.strictEqual(testRes.line, 12);

  // 4. Line range resolution
  const lineRes = resolveLogicalAnchorInContent(parseLogicalAnchor('line:2:4'), sourceCode);
  assert.strictEqual(lineRes.resolved, true);
  assert.strictEqual(lineRes.line, 2);
  assert.strictEqual(lineRes.endLine, 4);

  // 5. Missing symbol
  const missingRes = resolveLogicalAnchorInContent(parseLogicalAnchor('sym:nonExistentSymbol'), sourceCode);
  assert.strictEqual(missingRes.resolved, false);
});

// ── 6. Evidence Grounding Resolver & Staleness States ─────────────────────────

test('Evidence Resolver: returns fresh for matching historical and current content', () => {
  const fileContent = 'function verifyToken() { return true; }';
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: fileContent }),
    currentFileReader: () => ({ exists: true, content: fileContent }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.FRESH);
  assert.strictEqual(res.reason, null);
  assert.strictEqual(res.matchLine, 1);
});

test('Evidence Resolver: returns stale with anchor_shifted when lines drift', () => {
  const histContent = 'function verifyToken() { return true; }';
  const currContent = '// Added banner line\n// Added header line\nfunction verifyToken() { return true; }';
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: histContent }),
    currentFileReader: () => ({ exists: true, content: currContent }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.STALE);
  assert.strictEqual(res.reason, STALENESS_REASONS.ANCHOR_SHIFTED);
  assert.strictEqual(res.historicalLine, 1);
  assert.strictEqual(res.currentLine, 3);
});

test('Evidence Resolver: returns stale with anchor_unresolved when symbol deleted', () => {
  const histContent = 'function verifyToken() { return true; }';
  const currContent = 'function verifyOAuth() { return true; }'; // verifyToken removed!
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: histContent }),
    currentFileReader: () => ({ exists: true, content: currContent }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.STALE);
  assert.strictEqual(res.reason, STALENESS_REASONS.ANCHOR_UNRESOLVED);
});

test('Evidence Resolver: returns stale with file_deleted when file missing in working tree', () => {
  const histContent = 'function verifyToken() { return true; }';
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: histContent }),
    currentFileReader: () => ({ exists: false }),
    renameDetector: () => ({ renamed: false }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.STALE);
  assert.strictEqual(res.reason, STALENESS_REASONS.FILE_DELETED);
});

test('Evidence Resolver: preserves historical anchor and detects rename when file renamed', () => {
  const histContent = 'function verifyToken() { return true; }';
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: histContent }),
    currentFileReader: () => ({ exists: false }),
    renameDetector: () => ({ renamed: true, oldPath: 'src/auth.ts', newPath: 'src/security/auth.ts' }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.STALE);
  assert.strictEqual(res.reason, STALENESS_REASONS.FILE_RENAMED);
  assert.deepStrictEqual(res.renameDetected, {
    from: 'src/auth.ts',
    to: 'src/security/auth.ts',
  });
  // Critical Invariant: Historical anchor remains unchanged!
  assert.strictEqual(res.anchor.filePath, 'src/auth.ts');
});

test('Evidence Resolver: returns invalid when commit is missing in repository', () => {
  const anchor = 'ema://evidence/my-repo/11223344556677889900aabbccddeeff11223344/src/auth.ts#sym:verifyToken';

  const res = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: false, commitExists: false }),
  });

  assert.strictEqual(res.state, GROUNDING_STATES.INVALID);
  assert.strictEqual(res.reason, STALENESS_REASONS.COMMIT_MISSING);
});

// ── 7. Grounding Invariant: Resolver Never Manufactures EKU 'Verified' ──────

test('Grounding Invariant: resolving an anchor does not set EKU validation_state to Verified', () => {
  const fileContent = 'function verifyToken() { return true; }';
  const anchor = 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken';

  const resolution = resolveEvidenceAnchor(anchor, {
    commitReader: () => ({ exists: true, commitExists: true, content: fileContent }),
    currentFileReader: () => ({ exists: true, content: fileContent }),
  });

  assert.strictEqual(resolution.state, GROUNDING_STATES.FRESH);

  // Parse an unreviewed EKU referencing this anchor
  const ekuMarkdown = `---
title: Token Verification Pattern
type: solution
status: current
validation_state: unreviewed
authority_level: canonical
confidence: medium
scope: project
created: "2026-09-22"
last_verified: "2026-09-22"
evidence:
  - anchor: "${anchor}"
    type: source
---

Content body.`;

  const parsed = parseEKU(ekuMarkdown);
  assert.strictEqual(parsed.valid, true);

  // Critical Invariant: EKU validation state MUST remain 'unreviewed'
  assert.strictEqual(parsed.eku.validation_state, 'unreviewed');
  assert.notStrictEqual(parsed.eku.validation_state, 'verified');
});

// ── 8. Batch Staleness Checker ───────────────────────────────────────────────

test('Batch Staleness: checks multiple anchors and aggregates results accurately', () => {
  const matchingContent = 'function verifyToken() {}\nfunction checkAuth() {}';
  const histModified = 'function oldFunc() { return 1; }';
  const currModified = 'function oldFunc() { return 2; }'; // content modified!

  const anchors = [
    'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:verifyToken',
    'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:checkAuth',
    'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/other.ts#sym:oldFunc',
    'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/auth.ts#sym:neverExisted',
  ];

  const res = checkStaleness(anchors, {
    commitReader: (ref, fp) => {
      if (fp === 'src/auth.ts') return { exists: true, commitExists: true, content: matchingContent };
      if (fp === 'src/other.ts') return { exists: true, commitExists: true, content: histModified };
      return { exists: false, commitExists: true };
    },
    currentFileReader: (fp) => {
      if (fp === 'src/auth.ts') return { exists: true, content: matchingContent };
      if (fp === 'src/other.ts') return { exists: true, content: currModified };
      return { exists: false };
    },
  });

  assert.strictEqual(res.summary.total, 4);
  assert.strictEqual(res.summary.fresh, 2);
  assert.strictEqual(res.summary.stale, 1);
  assert.strictEqual(res.summary.invalid, 1);
});

// ── 9. EKU Integration: Validator Validates Embedded Canonical Anchors ───────

test('EKU Integration: validator rejects malformed embedded evidence anchors', () => {
  const badEku = {
    title: 'Doc with bad anchor',
    type: 'solution',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'canonical',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
    evidence: [
      {
        anchor: 'ema://evidence/repo/HEAD/file.ts#sym:verify', // Mutable HEAD rejected!
        type: 'source',
      },
    ],
  };

  const res = validateEKU(badEku);
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Mutable Git reference 'HEAD' is disallowed/);
});

test('EKU Integration: validator accepts valid embedded canonical anchors and legacy items', () => {
  const mixedEku = {
    title: 'Doc with mixed evidence',
    type: 'solution',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'canonical',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
    evidence: [
      {
        anchor: 'ema://evidence/my-repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/src/file.ts#sym:verify',
        type: 'source',
      },
      {
        path: 'tests/file.test.ts:42',
        type: 'test',
      },
    ],
  };

  const res = validateEKU(mixedEku);
  assert.strictEqual(res.valid, true, `Unexpected errors: ${res.errors.join(', ')}`);
});

// ── 10. Additional Edge Cases & Real Git Integration ─────────────────────────

test('Anchor Parsing: rejects missing URI components and bad schemes', () => {
  assert.throws(() => parseEvidenceAnchor(''), /cannot be null or empty/);
  assert.throws(() => parseEvidenceAnchor('https://example.com'), /must start with 'ema:\/\/evidence\/'/);
  assert.throws(() => parseEvidenceAnchor('ema://evidence/repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/file.ts'), /missing '#' fragment/);
  assert.throws(() => parseEvidenceAnchor('ema://evidence/repo/9f8a2c1b4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b/file.ts#'), /empty logical anchor fragment/);
  assert.throws(() => parseEvidenceAnchor('ema://evidence/repo#sym:test'), /path must contain at least/);
});

test('Staleness Resolver: resolves sec, test, cfg, pr, and ast in realistic texts', () => {
  const doc = `# System Architecture

## Authentication Flow
Detailed description of tokens.

Config:
{"jwt": {"algorithm": "ES256"}}

See PR #42 and issue #105.
`;

  // Section anchor
  const secRes = resolveLogicalAnchorInContent(parseLogicalAnchor('sec:Authentication%20Flow'), doc);
  assert.strictEqual(secRes.resolved, true);
  assert.strictEqual(secRes.line, 3);

  // Config anchor
  const cfgRes = resolveLogicalAnchorInContent(parseLogicalAnchor('cfg:jwt.algorithm'), doc);
  assert.strictEqual(cfgRes.resolved, true);

  // PR anchor
  const prRes = resolveLogicalAnchorInContent(parseLogicalAnchor('pr:42'), doc);
  assert.strictEqual(prRes.resolved, true);

  // Issue anchor
  const issueRes = resolveLogicalAnchorInContent(parseLogicalAnchor('issue:105'), doc);
  assert.strictEqual(issueRes.resolved, true);

  // AST anchor
  const astRes = resolveLogicalAnchorInContent(parseLogicalAnchor('ast:System Architecture'), doc);
  assert.strictEqual(astRes.resolved, true);
});

test('End-to-End Real Git: resolves real commit blob and heading anchor from repo', () => {
  let headSha;
  try {
    headSha = execSync('git rev-parse HEAD', { cwd: process.cwd(), encoding: 'utf8' }).trim();
  } catch {
    headSha = 'e2bed4702a0f56ac48feedba583aa43c7e0ecb9c';
  }
  const anchor = `ema://evidence/Project-Memory-Agent/${headSha}/AGENTS.md#sec:Critical%20Rules`;

  const res = resolveEvidenceAnchor(anchor, { repoPath: process.cwd() });
  assert.ok(res.state === GROUNDING_STATES.FRESH || res.state === GROUNDING_STATES.STALE);
  assert.strictEqual(res.anchor.filePath, 'AGENTS.md');
  assert.strictEqual(res.anchor.gitRef, headSha);
});
