/**
 * EMA Phase 3 — Integration Test Suite
 * SQLite / FTS5 Local Index Subsystem
 *
 * Tests all Phase 3 authorized scope:
 *   - Database lifecycle (init, schema version, drop/reinit)
 *   - FTS5 lexical indexing (insert, upsert, search, delete, rebuild)
 *   - Vector index foundation (loading, schema, stubs)
 *   - Full rebuild engine (scan docs dir, frontmatter parse, index all EKUs)
 *   - Canonical-source invariant (markdown files never modified)
 *   - Lifecycle orthogonality (validation_state never manufactured as Verified)
 *   - Security (SQL injection, path traversal, malformed content)
 *   - Phase 1 regression (EKU schema invariants preserved)
 *   - Phase 2 regression (evidence anchor invariants preserved)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import {
  initIndex,
  closeIndex,
  dropAndReinitIndex,
  assertCompatibleSchema,
  getIndexMeta,
  defaultIndexPath,
  SCHEMA_VERSION,
} from '../../src/index/db.mjs';

import {
  indexEKU,
  removeEKU,
  getIndexedEKU,
  getIndexedEKUByPath,
  countIndexedEKUs,
  searchLexical,
  sanitizeFTS5Query,
  rebuildFTS5,
  ekuId,
  extractIndexRecord,
} from '../../src/index/lexical-index.mjs';

import {
  ensureSqliteVecLoaded,
  initVectorIndex,
  searchVector,
  storeVector,
  getVectorIndexStatus,
} from '../../src/index/vector-index.mjs';

import {
  parseFrontmatter,
  extractBodyText,
  discoverMarkdownFiles,
  rebuildIndexWithDB,
} from '../../src/index/rebuild.mjs';

// ── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a temporary directory and opens a fresh derived index in it.
 * Automatically cleaned up after each test.
 * @returns {{ db, tmpDir, dbPath, cleanup }}
 */
function createTestDB() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-p3-test-'));
  const dbPath = defaultIndexPath(tmpDir);
  const db = initIndex(dbPath);
  const cleanup = () => {
    try { closeIndex(db); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  };
  return { db, tmpDir, dbPath, cleanup };
}

/**
 * Creates a sample EKU frontmatter object for indexing tests.
 * @param {object} overrides
 */
function sampleEKU(overrides = {}) {
  return {
    title: 'Test EKU Title',
    status: 'Current',
    validation_state: 'Unreviewed',
    authority_level: 'Canonical',
    confidence: 'High',
    scope: 'project',
    scope_id: 'github.com/test/repo',
    isolation: 'hard',
    tags: ['architecture', 'indexing'],
    evidence: [],
    related: [],
    bodyText: 'Test body text about indexing and retrieval.',
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Section 1: Database Lifecycle
// ════════════════════════════════════════════════════════════════════════════

test('DB: initIndex creates database with correct schema version', () => {
  const { db, cleanup } = createTestDB();
  try {
    const meta = getIndexMeta(db);
    assert.equal(meta.schema_version, String(SCHEMA_VERSION));
    assert.ok(meta.initialized_at);
  } finally {
    cleanup();
  }
});

test('DB: initIndex is idempotent on repeated calls', () => {
  const { db, tmpDir, dbPath, cleanup } = createTestDB();
  try {
    closeIndex(db);
    // Re-open the same database
    const db2 = initIndex(dbPath);
    const meta = getIndexMeta(db2);
    assert.equal(meta.schema_version, String(SCHEMA_VERSION));
    closeIndex(db2);
  } finally {
    cleanup();
  }
});

test('DB: eku table, eku_fts table, and meta table created on init', () => {
  const { db, cleanup } = createTestDB();
  try {
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all()
      .map((r) => r.name);
    assert.ok(tables.includes('meta'), 'meta table must exist');
    assert.ok(tables.includes('eku'), 'eku table must exist');
    // FTS5 shadow tables
    const ftsTables = tables.filter((t) => t.startsWith('eku_fts'));
    assert.ok(ftsTables.length > 0, 'FTS5 table must exist');
  } finally {
    cleanup();
  }
});

test('DB: defaultIndexPath returns path ending in /.ema/index.db', () => {
  const p = defaultIndexPath('/tmp/myproject');
  assert.ok(p.endsWith('.ema/index.db') || p.endsWith('.ema\\index.db'));
});

test('DB: dropAndReinitIndex destroys existing data and creates fresh schema', () => {
  const { db, tmpDir, dbPath, cleanup } = createTestDB();
  try {
    // Insert a record
    indexEKU(db, sampleEKU(), 'docs/test.md');
    assert.equal(countIndexedEKUs(db), 1);
    closeIndex(db);

    // Drop and reinit
    const db2 = dropAndReinitIndex(dbPath);
    assert.equal(countIndexedEKUs(db2), 0, 'Derived data should be gone after drop');
    const meta = getIndexMeta(db2);
    assert.equal(meta.schema_version, String(SCHEMA_VERSION));
    closeIndex(db2);
  } finally {
    cleanup();
  }
});

test('DB: assertCompatibleSchema does not throw on valid schema', () => {
  const { db, cleanup } = createTestDB();
  try {
    assert.doesNotThrow(() => assertCompatibleSchema(db));
  } finally {
    cleanup();
  }
});

test('DB: sqlite-vec extension loads successfully', () => {
  const { db, cleanup } = createTestDB();
  try {
    const vecResult = ensureSqliteVecLoaded(db);
    assert.ok(vecResult.loaded, `sqlite-vec should load: ${vecResult.error}`);
    assert.ok(vecResult.version, 'sqlite-vec version should be present');
  } finally {
    cleanup();
  }
});

test('DB: WAL mode is enabled', () => {
  const { db, cleanup } = createTestDB();
  try {
    const row = db.prepare(`PRAGMA journal_mode`).get();
    assert.equal(row.journal_mode, 'wal');
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 2: FTS5 Indexing Operations
// ════════════════════════════════════════════════════════════════════════════

test('Indexing: indexEKU inserts a new EKU record', () => {
  const { db, cleanup } = createTestDB();
  try {
    const result = indexEKU(db, sampleEKU(), 'docs/architecture.md');
    assert.equal(result.op, 'insert');
    assert.equal(result.id, 'docs/architecture.md');
  } finally {
    cleanup();
  }
});

test('Indexing: repeated indexEKU on same path is idempotent (upsert)', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/architecture.md');
    const r2 = indexEKU(db, sampleEKU({ title: 'Updated Title' }), 'docs/architecture.md');
    assert.equal(r2.op, 'update');
    assert.equal(countIndexedEKUs(db), 1, 'Only one record should exist after upsert');
    const rec = getIndexedEKU(db, 'docs/architecture.md');
    assert.equal(rec.title, 'Updated Title');
  } finally {
    cleanup();
  }
});

test('Indexing: multiple distinct EKUs indexed correctly', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ title: 'A' }), 'docs/a.md');
    indexEKU(db, sampleEKU({ title: 'B' }), 'docs/b.md');
    indexEKU(db, sampleEKU({ title: 'C' }), 'docs/c.md');
    assert.equal(countIndexedEKUs(db), 3);
  } finally {
    cleanup();
  }
});

test('Indexing: removeEKU deletes specified EKU from derived index', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/delete-me.md');
    assert.equal(countIndexedEKUs(db), 1);
    const removed = removeEKU(db, 'docs/delete-me.md');
    assert.equal(removed, true);
    assert.equal(countIndexedEKUs(db), 0);
  } finally {
    cleanup();
  }
});

test('Indexing: removeEKU returns false for non-existent ID', () => {
  const { db, cleanup } = createTestDB();
  try {
    const removed = removeEKU(db, 'nonexistent/path.md');
    assert.equal(removed, false);
  } finally {
    cleanup();
  }
});

test('Indexing: getIndexedEKU returns null when not found', () => {
  const { db, cleanup } = createTestDB();
  try {
    const rec = getIndexedEKU(db, 'does/not/exist.md');
    assert.equal(rec, null);
  } finally {
    cleanup();
  }
});

test('Indexing: getIndexedEKUByPath retrieves record by source path', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ title: 'Path Lookup Test' }), 'docs/path.md');
    const rec = getIndexedEKUByPath(db, 'docs/path.md');
    assert.ok(rec, 'Record should be found by path');
    assert.equal(rec.title, 'Path Lookup Test');
  } finally {
    cleanup();
  }
});

test('Indexing: all EKU lifecycle fields are preserved in index', () => {
  const { db, cleanup } = createTestDB();
  try {
    const eku = sampleEKU({
      status: 'Deprecated',
      validation_state: 'Needs Review',
      authority_level: 'Derived',
      confidence: 'Low',
      scope: 'workspace',
      isolation: 'soft',
    });
    indexEKU(db, eku, 'docs/preserved.md');
    const rec = getIndexedEKU(db, 'docs/preserved.md');
    assert.equal(rec.status, 'Deprecated');
    assert.equal(rec.validation_state, 'Needs Review');
    assert.equal(rec.authority_level, 'Derived');
    assert.equal(rec.confidence, 'Low');
    assert.equal(rec.scope, 'workspace');
    assert.equal(rec.isolation, 'soft');
  } finally {
    cleanup();
  }
});

test('Indexing: evidence array is stored as JSON string (not mutated)', () => {
  const { db, cleanup } = createTestDB();
  try {
    const evidence = [
      { anchor: 'ema://evidence/github.com/org/repo/abc1234/src/auth.ts#sym:authenticate', type: 'source' },
    ];
    indexEKU(db, sampleEKU({ evidence }), 'docs/evidence-test.md');
    const rec = getIndexedEKU(db, 'docs/evidence-test.md');
    const parsed = JSON.parse(rec.evidence);
    assert.equal(parsed.length, 1);
    assert.ok(parsed[0].anchor.startsWith('ema://evidence/'));
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 3: FTS5 Lexical Search
// ════════════════════════════════════════════════════════════════════════════

test('FTS5: searchLexical finds indexed EKU by title term', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ title: 'Authentication Architecture', bodyText: '' }), 'docs/auth.md');
    const results = searchLexical(db, 'authentication');
    assert.ok(results.length > 0, 'Should find authentication in title');
    assert.ok(results.some((r) => r.title === 'Authentication Architecture'));
  } finally {
    cleanup();
  }
});

test('FTS5: searchLexical finds indexed EKU by body text term', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ bodyText: 'JWT token refresh rotation security' }), 'docs/jwt.md');
    const results = searchLexical(db, 'token');
    assert.ok(results.length > 0, 'Should find token in body text');
  } finally {
    cleanup();
  }
});

test('FTS5: searchLexical with scope filter returns only matching scope', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ scope: 'project', bodyText: 'project data retrieval' }), 'docs/proj.md');
    indexEKU(db, sampleEKU({ scope: 'workspace', bodyText: 'workspace data retrieval' }), 'docs/ws.md');
    const projectResults = searchLexical(db, 'retrieval', 'project');
    const wsResults = searchLexical(db, 'retrieval', 'workspace');
    assert.ok(projectResults.every((r) => r.scope === 'project'), 'Scope filter must be applied');
    assert.ok(wsResults.every((r) => r.scope === 'workspace'), 'Scope filter must be applied');
    assert.equal(projectResults.length, 1);
    assert.equal(wsResults.length, 1);
  } finally {
    cleanup();
  }
});

test('FTS5: empty query returns empty array', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/test.md');
    const results = searchLexical(db, '');
    assert.deepEqual(results, []);
  } finally {
    cleanup();
  }
});

test('FTS5: whitespace-only query returns empty array', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/test.md');
    const results = searchLexical(db, '   ');
    assert.deepEqual(results, []);
  } finally {
    cleanup();
  }
});

test('FTS5: returns raw rows with no lifecycle filtering applied', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ status: 'Deprecated', bodyText: 'deprecated system flow' }), 'docs/depr.md');
    indexEKU(db, sampleEKU({ status: 'Current', bodyText: 'current system flow' }), 'docs/curr.md');
    // Phase 3 returns ALL rows including Deprecated (no Phase 4 filtering)
    const results = searchLexical(db, 'system');
    const statuses = results.map((r) => r.status);
    assert.ok(statuses.includes('Deprecated'), 'Phase 3 must return Deprecated rows (no lifecycle filter)');
    assert.ok(statuses.includes('Current'));
  } finally {
    cleanup();
  }
});

test('FTS5: limit and offset pagination works', () => {
  const { db, cleanup } = createTestDB();
  try {
    for (let i = 0; i < 5; i++) {
      indexEKU(db, sampleEKU({ bodyText: `shared concept number ${i}` }), `docs/page${i}.md`);
    }
    const first2 = searchLexical(db, 'concept', undefined, { limit: 2, offset: 0 });
    const next2 = searchLexical(db, 'concept', undefined, { limit: 2, offset: 2 });
    assert.equal(first2.length, 2);
    assert.equal(next2.length, 2);
    // IDs should differ between pages
    const page1Ids = first2.map((r) => r.id);
    const page2Ids = next2.map((r) => r.id);
    assert.ok(!page1Ids.some((id) => page2Ids.includes(id)), 'Pages must not overlap');
  } finally {
    cleanup();
  }
});

test('FTS5: rebuildFTS5 does not crash on populated index', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/a.md');
    indexEKU(db, sampleEKU(), 'docs/b.md');
    assert.doesNotThrow(() => rebuildFTS5(db));
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 4: FTS5 Query Sanitization (Security)
// ════════════════════════════════════════════════════════════════════════════

test('Security: sanitizeFTS5Query wraps query in double-quotes (disables FTS5 operators)', () => {
  const sanitized = sanitizeFTS5Query('authentication');
  assert.ok(sanitized.startsWith('"'), 'Must start with double-quote');
  assert.ok(sanitized.endsWith('"'), 'Must end with double-quote');
});

test('Security: sanitizeFTS5Query escapes embedded double-quotes', () => {
  const sanitized = sanitizeFTS5Query('auth "col:value"');
  assert.ok(sanitized.includes('""'), 'Internal double-quotes must be escaped');
  assert.ok(!sanitized.match(/(?<!")[^"]"(?!")/), 'No unescaped single double-quote');
});

test('Security: sanitizeFTS5Query disables FTS5 AND/OR/NOT operators', () => {
  // Operators inside double-quoted FTS5 phrase are treated as literals
  const sanitized = sanitizeFTS5Query('auth AND secret OR password NOT hash');
  // When wrapped in double-quotes, AND/OR/NOT are literal tokens
  assert.ok(sanitized.startsWith('"') && sanitized.endsWith('"'));
});

test('Security: sanitizeFTS5Query returns null for empty or control-char-only input', () => {
  assert.equal(sanitizeFTS5Query(''), null);
  assert.equal(sanitizeFTS5Query('   '), null);
  assert.equal(sanitizeFTS5Query('\x00\x01\x1F'), null);
});

test('Security: SQL injection via indexEKU source path is safe (parameterized)', () => {
  const { db, cleanup } = createTestDB();
  try {
    // Path contains SQL injection payload
    const maliciousPath = "docs/'; DROP TABLE eku; --";
    // Should not throw and should not execute the drop statement
    assert.doesNotThrow(() =>
      indexEKU(db, sampleEKU({ title: 'Injection Test' }), maliciousPath)
    );
    const count = countIndexedEKUs(db);
    assert.equal(count, 1, 'eku table must still exist and have 1 record');
  } finally {
    cleanup();
  }
});

test('Security: SQL injection via searchLexical query is safely sanitized', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU(), 'docs/test.md');
    // FTS5 MATCH injection attempt: closing quote + operator injection
    const injectedQuery = '\'; DROP TABLE eku; --';
    // Should not throw; sanitizer should quote the payload
    let results;
    assert.doesNotThrow(() => {
      results = searchLexical(db, injectedQuery);
    });
    // Table must still exist
    const count = countIndexedEKUs(db);
    assert.equal(count, 1, 'eku table must survive query with malicious input');
  } finally {
    cleanup();
  }
});

test('Security: malformed metadata content is indexed safely without crashing', () => {
  const { db, cleanup } = createTestDB();
  try {
    // Null values in fields
    const malformed = { title: null, status: undefined, tags: null, bodyText: null };
    assert.doesNotThrow(() => indexEKU(db, malformed, 'docs/malformed.md'));
    const rec = getIndexedEKU(db, 'docs/malformed.md');
    assert.ok(rec, 'Record should be created');
    assert.equal(rec.title, '', 'null title coerces to empty string');
  } finally {
    cleanup();
  }
});

test('Security: path traversal in source path is indexed as literal string', () => {
  const { db, cleanup } = createTestDB();
  try {
    // Path traversal attempt — indexing normalizes the path string but does not
    // access the filesystem. The source path is stored as a literal record key.
    const traversalPath = '../../../etc/passwd';
    indexEKU(db, sampleEKU({ title: 'Traversal' }), traversalPath);
    // The index stores the literal path; filesystem access is only done during rebuild
    const id = ekuId(traversalPath);
    const rec = getIndexedEKU(db, id);
    assert.ok(rec, 'Record stored with traversal path');
    assert.equal(rec.source_path, '../../../etc/passwd', 'Stored verbatim; Phase 3 does not validate FS access for indexEKU');
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 5: Frontmatter Parser
// ════════════════════════════════════════════════════════════════════════════

test('Parser: parseFrontmatter parses simple key-value frontmatter', () => {
  const content = `---
title: Test Title
status: Current
scope: project
---

Body text here.
`;
  const { frontmatter, body } = parseFrontmatter(content);
  assert.equal(frontmatter.title, 'Test Title');
  assert.equal(frontmatter.status, 'Current');
  assert.equal(frontmatter.scope, 'project');
  assert.ok(body.includes('Body text here'));
});

test('Parser: parseFrontmatter parses inline array syntax', () => {
  const content = `---
tags: [auth, security, jwt]
---
`;
  const { frontmatter } = parseFrontmatter(content);
  assert.deepEqual(frontmatter.tags, ['auth', 'security', 'jwt']);
});

test('Parser: parseFrontmatter returns empty object for file without frontmatter', () => {
  const content = `# Just a heading\n\nNo frontmatter here.`;
  const { frontmatter, body } = parseFrontmatter(content);
  assert.deepEqual(frontmatter, {});
  assert.equal(body, content);
});

test('Parser: parseFrontmatter handles unclosed frontmatter block gracefully', () => {
  const content = `---\ntitle: Unclosed\n# No closing ---`;
  const { frontmatter, body } = parseFrontmatter(content);
  // No closing delimiter — returns empty frontmatter with full content as body
  assert.deepEqual(frontmatter, {});
});

test('Parser: extractBodyText strips Markdown headings and formatting', () => {
  const body = `# Chapter 1\n\n## Section 2\n\n**Bold text** and _italic text_.\n\n\`\`\`js\nconst x = 1;\n\`\`\`\n\nLink [text](https://example.com).`;
  const text = extractBodyText(body);
  assert.ok(!text.includes('#'), 'Headings stripped');
  assert.ok(!text.includes('**'), 'Bold markers stripped');
  assert.ok(!text.includes('_italic_') || text.includes('italic'), 'Italic markers stripped');
  assert.ok(!text.includes('```'), 'Code blocks stripped');
  assert.ok(text.includes('text'), 'Link text preserved');
});

// ════════════════════════════════════════════════════════════════════════════
// Section 6: Rebuild Engine
// ════════════════════════════════════════════════════════════════════════════

function createDocsDir(files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-docs-'));
  const docsDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(docsDir, filename), content, 'utf8');
  }
  return { tmpDir, docsDir };
}

test('Rebuild: rebuildIndexWithDB indexes all EKU markdown files', () => {
  const eku1 = `---\ntitle: EKU One\nstatus: Current\nvalidation_state: Unreviewed\nscope: project\n---\n\nContent of EKU One.\n`;
  const eku2 = `---\ntitle: EKU Two\nstatus: Deprecated\nvalidation_state: Needs Review\nscope: project\n---\n\nContent of EKU Two.\n`;
  const noFrontmatter = `# Just a README\n\nNo frontmatter here.\n`;

  const { tmpDir, docsDir } = createDocsDir({ 'eku1.md': eku1, 'eku2.md': eku2, 'README.md': noFrontmatter });
  const { db, cleanup: cleanupDb } = createTestDB();

  try {
    const result = rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    assert.equal(result.indexed, 2, 'Two EKU files should be indexed');
    assert.equal(result.skipped, 1, 'One file without frontmatter should be skipped');
    assert.equal(result.failed, 0, 'No failures expected');
    assert.equal(result.total, 3, 'Total files scanned');
    assert.equal(countIndexedEKUs(db), 2);
  } finally {
    cleanupDb();
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('Rebuild: canonical Markdown files are NEVER modified by indexing', () => {
  const originalContent = `---\ntitle: Immutable\nstatus: Current\nvalidation_state: Unreviewed\nscope: project\n---\n\nCanonical content.\n`;
  const { tmpDir, docsDir } = createDocsDir({ 'immutable.md': originalContent });
  const { db, cleanup: cleanupDb } = createTestDB();

  try {
    rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    const after = fs.readFileSync(path.join(docsDir, 'immutable.md'), 'utf8');
    assert.equal(after, originalContent, 'Canonical document must be bit-for-bit identical after indexing');
  } finally {
    cleanupDb();
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('Rebuild: indexing never sets validation_state to Verified', () => {
  const content = `---\ntitle: Unreviewed\nstatus: Current\nvalidation_state: Unreviewed\nscope: project\n---\n\nContent.\n`;
  const { tmpDir, docsDir } = createDocsDir({ 'doc.md': content });
  const { db, cleanup: cleanupDb } = createTestDB();

  try {
    rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    const rec = getIndexedEKU(db, 'docs/doc.md');
    assert.ok(rec, 'Should be indexed');
    assert.notEqual(rec.validation_state, 'Verified', 'Indexing must NOT manufacture Verified');
    assert.equal(rec.validation_state, 'Unreviewed', 'validation_state must be preserved verbatim');
  } finally {
    cleanupDb();
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('Rebuild: rebuildIndexWithDB is idempotent (multiple runs produce same result)', () => {
  const eku = `---\ntitle: Stable\nstatus: Current\nvalidation_state: Unreviewed\nscope: project\n---\n\nContent.\n`;
  const { tmpDir, docsDir } = createDocsDir({ 'stable.md': eku });
  const { db, cleanup: cleanupDb } = createTestDB();

  try {
    rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    const count1 = countIndexedEKUs(db);
    // Run again — upsert semantics, same result
    rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    const count2 = countIndexedEKUs(db);
    assert.equal(count1, count2, 'Idempotent rebuild must produce same count');
    assert.equal(count2, 1);
  } finally {
    cleanupDb();
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('Rebuild: malformed documents are skipped without corrupting the database', () => {
  const validEku = `---\ntitle: Valid\nstatus: Current\nscope: project\n---\n\nValid content.\n`;
  // "Malformed" in terms of no recognized frontmatter keys
  const bareMarkdown = `# No frontmatter at all\n\nJust markdown.\n`;

  const { tmpDir, docsDir } = createDocsDir({
    'valid.md': validEku,
    'bare.md': bareMarkdown,
  });
  const { db, cleanup: cleanupDb } = createTestDB();

  try {
    const result = rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
    assert.equal(result.indexed, 1);
    assert.equal(result.skipped, 1);
    assert.equal(result.failed, 0);
    assert.equal(countIndexedEKUs(db), 1);
  } finally {
    cleanupDb();
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('Rebuild: discoverMarkdownFiles excludes node_modules and .ema directories', () => {
  const { tmpDir, docsDir } = createDocsDir({ 'real.md': '# Real file\n' });
  // Create excluded directories
  const nodeModulesDir = path.join(docsDir, 'node_modules');
  const emaDir = path.join(docsDir, '.ema');
  fs.mkdirSync(nodeModulesDir, { recursive: true });
  fs.mkdirSync(emaDir, { recursive: true });
  fs.writeFileSync(path.join(nodeModulesDir, 'package.md'), '# Should be excluded\n');
  fs.writeFileSync(path.join(emaDir, 'index.md'), '# Should be excluded\n');

  try {
    const files = discoverMarkdownFiles(docsDir);
    assert.ok(files.every((f) => !f.includes('node_modules')), 'node_modules must be excluded');
    assert.ok(files.every((f) => !f.includes('/.ema/')), '.ema must be excluded');
    assert.ok(files.some((f) => f.endsWith('real.md')), 'Real files must be included');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 7: Vector Index Foundation
// ════════════════════════════════════════════════════════════════════════════

test('Vector: initVectorIndex creates eku_vec_meta table', () => {
  const { db, cleanup } = createTestDB();
  try {
    initVectorIndex(db);
    const tbl = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='eku_vec_meta'`).get();
    assert.ok(tbl, 'eku_vec_meta table should be created');
  } finally {
    cleanup();
  }
});

test('Vector: searchVector returns NOT_AVAILABLE status (Phase 3 stub)', () => {
  const { db, cleanup } = createTestDB();
  try {
    const result = searchVector(db, new Float32Array([0.1, 0.2]));
    assert.equal(result.status, 'NOT_AVAILABLE');
    assert.deepEqual(result.results, []);
    assert.ok(result.reason && result.reason.length > 0);
  } finally {
    cleanup();
  }
});

test('Vector: storeVector returns NOT_AVAILABLE status (Phase 3 stub)', () => {
  const { db, cleanup } = createTestDB();
  try {
    const result = storeVector(db, 'docs/test.md', new Float32Array([0.1, 0.2]), 'test-model');
    assert.equal(result.status, 'NOT_AVAILABLE');
  } finally {
    cleanup();
  }
});

test('Vector: getVectorIndexStatus returns phase3Available: false', () => {
  const status = getVectorIndexStatus();
  assert.equal(status.phase3Available, false);
  assert.ok(typeof status.reason === 'string');
});

// ════════════════════════════════════════════════════════════════════════════
// Section 8: Canonical Ownership Invariants
// ════════════════════════════════════════════════════════════════════════════

test('Invariant: deleting derived database does not affect canonical markdown', () => {
  const content = `---\ntitle: Canonical\nstatus: Current\nscope: project\n---\n\nCanonical content.\n`;
  const { tmpDir, docsDir } = createDocsDir({ 'canonical.md': content });
  const dbPath = defaultIndexPath(tmpDir);
  const db = initIndex(dbPath);
  rebuildIndexWithDB(docsDir, db, { repoRoot: tmpDir });
  assert.equal(countIndexedEKUs(db), 1);
  closeIndex(db);

  // Destroy the derived database
  const db2 = dropAndReinitIndex(dbPath);
  assert.equal(countIndexedEKUs(db2), 0, 'Derived state gone after drop');
  closeIndex(db2);

  // Canonical file must be completely intact
  const fileContent = fs.readFileSync(path.join(docsDir, 'canonical.md'), 'utf8');
  assert.equal(fileContent, content, 'Canonical file must be unchanged after database deletion');

  // Rebuild can restore derived state from canonical
  const db3 = initIndex(dbPath);
  rebuildIndexWithDB(docsDir, db3, { repoRoot: tmpDir });
  assert.equal(countIndexedEKUs(db3), 1, 'Derived state restored after rebuild');
  closeIndex(db3);

  fs.rmSync(tmpDir, { recursive: true });
});

test('Invariant: lifecycle dimensions preserved verbatim during indexing', () => {
  const { db, cleanup } = createTestDB();
  try {
    const eku = sampleEKU({
      status: 'Superseded',
      validation_state: 'Quarantined',
      authority_level: 'Candidate',
      confidence: 'Low',
    });
    indexEKU(db, eku, 'docs/lifecycle.md');
    const rec = getIndexedEKU(db, 'docs/lifecycle.md');
    assert.equal(rec.status, 'Superseded');
    assert.equal(rec.validation_state, 'Quarantined');
    assert.equal(rec.authority_level, 'Candidate');
    assert.equal(rec.confidence, 'Low');
  } finally {
    cleanup();
  }
});

test('Invariant: Candidate authority_level is preserved (not promoted to Canonical)', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ authority_level: 'Candidate' }), 'docs/candidate.md');
    const rec = getIndexedEKU(db, 'docs/candidate.md');
    assert.equal(rec.authority_level, 'Candidate', 'Indexing must not change authority_level');
    assert.notEqual(rec.authority_level, 'Canonical');
  } finally {
    cleanup();
  }
});

test('Invariant: Historical status is preserved (not reclassified as Deleted)', () => {
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ status: 'Historical' }), 'docs/historical.md');
    const rec = getIndexedEKU(db, 'docs/historical.md');
    assert.equal(rec.status, 'Historical');
    assert.notEqual(rec.status, 'Deleted');
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 9: Phase 4+ Boundary Verification
// ════════════════════════════════════════════════════════════════════════════

test('Boundary: searchLexical returns raw DB rows without authorization filtering', () => {
  // Phase 3 MUST NOT apply authorization filtering — that is Phase 4's responsibility
  const { db, cleanup } = createTestDB();
  try {
    indexEKU(db, sampleEKU({ scope: 'global', bodyText: 'global knowledge unit' }), 'docs/global.md');
    // Phase 4 would apply scope/auth filtering; Phase 3 returns the raw row
    const results = searchLexical(db, 'knowledge');
    assert.ok(results.length > 0, 'Phase 3 returns raw rows including cross-scope (no Phase 4 firewall)');
  } finally {
    cleanup();
  }
});

test('Boundary: vector search is stubbed and returns NOT_AVAILABLE in Phase 3', () => {
  // Phase 5 activates actual vector similarity; Phase 3 only stubs it
  const { db, cleanup } = createTestDB();
  try {
    const result = searchVector(db, new Float32Array(384).fill(0.1));
    assert.equal(result.status, 'NOT_AVAILABLE');
  } finally {
    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section 10: ekuId helper
// ════════════════════════════════════════════════════════════════════════════

test('ekuId: normalizes path separators and removes leading slash', () => {
  assert.equal(ekuId('docs/arch.md'), 'docs/arch.md');
  assert.equal(ekuId('/docs/arch.md'), 'docs/arch.md');
  assert.equal(ekuId('docs\\arch.md'), 'docs/arch.md');
});

test('ekuId: throws for empty or non-string input', () => {
  assert.throws(() => ekuId(''), TypeError);
  assert.throws(() => ekuId(null), TypeError);
  assert.throws(() => ekuId(undefined), TypeError);
});
