/**
 * Engineering Memory Agent (EMA) — FTS5 Lexical Index
 * Phase 3: Derived Storage & SQLite-vec Index Subsystem
 *
 * Provides deterministic lexical indexing (insert/upsert/delete/search)
 * over the FTS5 virtual table in the derived SQLite index.
 *
 * AUTHORIZATION BOUNDARY:
 *   - FTS5 is a derived lexical lookup layer. It is NOT EMA's retrieval policy.
 *   - Results from FTS5 must not bypass Phase 4 authorization or Phase 5 ranking.
 *   - searchLexical() returns raw DB rows, not final retrieval output.
 *   - No lifecycle filtering (Current/Deprecated) is applied here — that is Phase 4.
 *
 * CRITICAL INVARIANT: Never sets or infers validation_state = Verified.
 *
 * Functions:
 *   indexEKU(db, eku)         — Insert or idempotently upsert an EKU record
 *   removeEKU(db, id)         — Remove an EKU record from the index
 *   searchLexical(db, query, scope, opts) — Lexical FTS5 lookup
 *   getIndexedEKU(db, id)     — Retrieve one EKU record by stable ID
 */

// ── EKU field extraction helpers ─────────────────────────────────────────────

/**
 * Compute a stable EKU identifier from its canonical source path.
 * The ID is the normalized POSIX-relative file path (no leading slashes).
 * @param {string} sourcePath - Repository-relative Markdown file path
 * @returns {string}
 */
export function ekuId(sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath.trim()) {
    throw new TypeError('EKU stable ID requires a non-empty source path string');
  }
  return sourcePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Extract indexable structured fields from an EKU object.
 * Reads from the EKU's validated frontmatter and rendered body text.
 *
 * Security: All extracted values are scalars (string) and will be
 * bound via parameterized SQL. No value is ever interpolated into SQL.
 *
 * @param {object} eku - EKU object (from Phase 1 parser or plain frontmatter object)
 * @param {string} sourcePath - Canonical file path
 * @returns {object} Flattened indexable record
 */
export function extractIndexRecord(eku, sourcePath) {
  if (!eku || typeof eku !== 'object') {
    throw new TypeError('Cannot extract index record from non-object EKU');
  }

  const id = ekuId(sourcePath);

  // Safely coerce arrays to JSON strings; scalar strings and nulls → strings
  const safe = (v) => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return JSON.stringify(v);
    return String(v);
  };

  // Body text: prefer explicit body field; fall back to extracted text
  const bodyText = safe(eku.bodyText || eku.body_text || eku.content || '');

  // Tags: normalize to JSON array string
  let tags = '';
  if (Array.isArray(eku.tags)) {
    tags = JSON.stringify(eku.tags);
  } else if (typeof eku.tags === 'string') {
    tags = eku.tags;
  }

  // Evidence: stored verbatim as JSON for retrieval reconstruction
  const evidence = Array.isArray(eku.evidence)
    ? JSON.stringify(eku.evidence)
    : safe(eku.evidence);

  // Related: stored verbatim as JSON
  const related = Array.isArray(eku.related)
    ? JSON.stringify(eku.related)
    : safe(eku.related);

  return {
    id,
    source_path: sourcePath.replace(/\\/g, '/').replace(/^\/+/, ''),
    title: safe(eku.title || ''),
    status: safe(eku.status || ''),
    validation_state: safe(eku.validation_state || ''),
    authority_level: safe(eku.authority_level || ''),
    confidence: safe(eku.confidence || ''),
    scope: safe(eku.scope || ''),
    scope_id: safe(eku.scope_id || ''),
    isolation: safe(eku.isolation || ''),
    tags,
    evidence,
    related,
    body_text: bodyText,
  };
}

// ── Parameterized SQL statements (no string interpolation) ───────────────────

const SQL_UPSERT_EKU = `
  INSERT INTO eku (
    id, source_path, title, status, validation_state, authority_level,
    confidence, scope, scope_id, isolation, tags, evidence, related, body_text,
    indexed_at
  )
  VALUES (
    @id, @source_path, @title, @status, @validation_state, @authority_level,
    @confidence, @scope, @scope_id, @isolation, @tags, @evidence, @related, @body_text,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  )
  ON CONFLICT(id) DO UPDATE SET
    source_path     = excluded.source_path,
    title           = excluded.title,
    status          = excluded.status,
    validation_state = excluded.validation_state,
    authority_level  = excluded.authority_level,
    confidence       = excluded.confidence,
    scope            = excluded.scope,
    scope_id         = excluded.scope_id,
    isolation        = excluded.isolation,
    tags             = excluded.tags,
    evidence         = excluded.evidence,
    related          = excluded.related,
    body_text        = excluded.body_text,
    indexed_at       = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
`;

const SQL_DELETE_EKU = `DELETE FROM eku WHERE id = ?`;

const SQL_GET_EKU = `SELECT * FROM eku WHERE id = ?`;

const SQL_GET_BY_PATH = `SELECT * FROM eku WHERE source_path = ?`;

const SQL_COUNT_EKU = `SELECT COUNT(*) AS total FROM eku`;

// ── Core indexing operations ──────────────────────────────────────────────────

/**
 * Indexes (inserts or idempotently updates) one EKU record in the derived database.
 *
 * Phase 3 authorized operation — canonical Markdown/YAML is never modified.
 *
 * @param {import('better-sqlite3').Database} db - Open database handle
 * @param {object} eku - EKU frontmatter object with optional bodyText
 * @param {string} sourcePath - Repository-relative canonical file path
 * @returns {{ id: string, op: 'insert'|'update' }}
 */
export function indexEKU(db, eku, sourcePath) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }

  const record = extractIndexRecord(eku, sourcePath);

  // Check if record exists for reporting op type
  const existing = db.prepare(SQL_GET_EKU).get(record.id);
  db.prepare(SQL_UPSERT_EKU).run(record);

  return {
    id: record.id,
    op: existing ? 'update' : 'insert',
  };
}

/**
 * Removes an EKU record from the derived index by its stable ID.
 * Canonical Markdown file is never deleted or modified.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} id - Stable EKU identifier (normalized source path)
 * @returns {boolean} True if a row was deleted, false if not found
 */
export function removeEKU(db, id) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }
  if (typeof id !== 'string' || !id.trim()) {
    throw new TypeError('removeEKU: id must be a non-empty string');
  }

  const result = db.prepare(SQL_DELETE_EKU).run(id.trim());
  return result.changes > 0;
}

/**
 * Retrieves a single indexed EKU record by stable ID.
 * Returns null when not found.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @returns {object|null}
 */
export function getIndexedEKU(db, id) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }
  return db.prepare(SQL_GET_EKU).get(id) ?? null;
}

/**
 * Retrieves a single indexed EKU record by canonical source path.
 * @param {import('better-sqlite3').Database} db
 * @param {string} sourcePath
 * @returns {object|null}
 */
export function getIndexedEKUByPath(db, sourcePath) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }
  const normalized = sourcePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return db.prepare(SQL_GET_BY_PATH).get(normalized) ?? null;
}

/**
 * Returns the count of indexed EKU records.
 * @param {import('better-sqlite3').Database} db
 * @returns {number}
 */
export function countIndexedEKUs(db) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }
  const row = db.prepare(SQL_COUNT_EKU).get();
  return row ? row.total : 0;
}

// ── FTS5 lexical search ───────────────────────────────────────────────────────

/**
 * Performs a deterministic FTS5 lexical search over indexed EKUs.
 *
 * SCOPE NOTE: This returns raw DB rows, NOT final retrieval output.
 * Phase 4 authorization and Phase 5 ranking must be applied by callers.
 *
 * @param {import('better-sqlite3').Database} db - Open database handle
 * @param {string} query - Raw search query string
 * @param {string} [scope] - Optional scope filter: 'project' | 'workspace' | 'global'
 * @param {object} [opts]
 * @param {number} [opts.limit=50] - Maximum results to return
 * @param {number} [opts.offset=0] - Result offset for pagination
 * @returns {Array<object>} Array of matching EKU records (from eku table, not fts virtual table)
 */
export function searchLexical(db, query, scope, opts = {}) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }

  if (typeof query !== 'string' || !query.trim()) {
    return [];
  }

  // Sanitize query for FTS5: escape double-quotes, wrap in quotes for exact phrase matching
  const safeQuery = sanitizeFTS5Query(query.trim());
  if (!safeQuery) {
    return [];
  }

  const limit = (opts && Number.isInteger(opts.limit) && opts.limit > 0) ? opts.limit : 50;
  const offset = (opts && Number.isInteger(opts.offset) && opts.offset >= 0) ? opts.offset : 0;

  // Build scope filter (parameterized; no string interpolation of user values)
  if (scope && typeof scope === 'string' && scope.trim()) {
    const rows = db.prepare(`
      SELECT eku.*
      FROM eku
      JOIN eku_fts ON eku.rowid = eku_fts.rowid
      WHERE eku_fts MATCH ?
        AND eku.scope = ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(safeQuery, scope.trim(), limit, offset);
    return rows;
  }

  // No scope filter
  const rows = db.prepare(`
    SELECT eku.*
    FROM eku
    JOIN eku_fts ON eku.rowid = eku_fts.rowid
    WHERE eku_fts MATCH ?
    ORDER BY rank
    LIMIT ? OFFSET ?
  `).all(safeQuery, limit, offset);

  return rows;
}

/**
 * Sanitizes a user-supplied query string for use in FTS5 MATCH clauses.
 * Strips or escapes FTS5 special characters that could alter query semantics.
 *
 * Security: This prevents FTS5 query injection (structured query injection
 * that would bypass intended search behavior).
 *
 * @param {string} rawQuery
 * @returns {string|null} Sanitized query string, or null if empty after sanitization
 */
export function sanitizeFTS5Query(rawQuery) {
  if (typeof rawQuery !== 'string') return null;

  // Trim and remove control characters
  let q = rawQuery.trim().replace(/[\x00-\x1F\x7F]/g, ' ');

  // Collapse whitespace
  q = q.replace(/\s+/g, ' ').trim();

  if (!q) return null;

  // Escape FTS5 double-quote characters (column filter "col:term" syntax)
  // by wrapping the whole query in double quotes for simple phrase search.
  // This disables FTS5 operators (AND, OR, NOT, NEAR) deliberately:
  // retrieval policy operators belong in Phase 5, not Phase 3.
  q = q.replace(/"/g, '""');
  return `"${q}"`;
}

/**
 * Rebuilds the FTS5 index from the current eku table content.
 * Used after bulk inserts or when the FTS5 shadow tables are out of sync.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function rebuildFTS5(db) {
  if (!db || !db.open) {
    throw new Error('EMA index: database is not open');
  }
  db.prepare(`INSERT INTO eku_fts(eku_fts) VALUES ('rebuild')`).run();
}
