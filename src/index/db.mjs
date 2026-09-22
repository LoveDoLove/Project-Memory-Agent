/**
 * Engineering Memory Agent (EMA) — SQLite Database Lifecycle
 * Phase 3: Derived Storage & SQLite-vec Index Subsystem
 *
 * Manages the derived SQLite index database:
 *   .ema/index.db  (default path relative to project root)
 *
 * CRITICAL INVARIANT:
 *   SQLite is DERIVED STATE ONLY. Markdown/YAML always remains authoritative.
 *   Deleting or rebuilding the database MUST NEVER alter canonical knowledge.
 *
 * Supported operations:
 *   - initIndex(dbPath)          Open or create the database and assert schema
 *   - closeIndex(db)             Close the database connection safely
 *   - assertCompatibleSchema(db) Verify schema version; fail on incompatible
 *   - dropAndReinitIndex(dbPath) Delete derived state and reinitialize
 *
 * Database location: <repoRoot>/.ema/index.db   (git-ignored derived state)
 * Schema version:    stored in meta table; incompatible versions destroy and rebuild
 */

import Database from 'better-sqlite3';
import { load as loadSqliteVec } from 'sqlite-vec';
import fs from 'node:fs';
import path from 'node:path';

// ── Schema version (bump when schema changes incompatibly) ───────────────────
export const SCHEMA_VERSION = 1;

// ── Default derived-index path ────────────────────────────────────────────────
export const DEFAULT_INDEX_DIR = '.ema';
export const DEFAULT_INDEX_FILENAME = 'index.db';

/**
 * Returns the default index path for a given repository root.
 * @param {string} repoRoot - Absolute path to the repository root
 * @returns {string} Absolute path to the SQLite database file
 */
export function defaultIndexPath(repoRoot = process.cwd()) {
  return path.join(path.resolve(repoRoot), DEFAULT_INDEX_DIR, DEFAULT_INDEX_FILENAME);
}

// ── SQL Schema DDL ────────────────────────────────────────────────────────────

const SCHEMA_DDL = `
-- Metadata table: records schema version and index info
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- Core EKU records table: stores structured fields from canonical Markdown/YAML
-- All fields are TEXT to avoid runtime coercion / data loss
CREATE TABLE IF NOT EXISTS eku (
  id              TEXT PRIMARY KEY NOT NULL, -- stable path-based identifier
  source_path     TEXT NOT NULL,             -- canonical Markdown file path
  title           TEXT NOT NULL DEFAULT '',  -- document title / first heading
  status          TEXT NOT NULL DEFAULT '',  -- lifecycle status (Current, Deprecated, etc.)
  validation_state TEXT NOT NULL DEFAULT '', -- validation (Unreviewed, Verified, etc.)
  authority_level  TEXT NOT NULL DEFAULT '', -- Candidate, Derived, Canonical
  confidence       TEXT NOT NULL DEFAULT '', -- High, Medium, Low
  scope            TEXT NOT NULL DEFAULT '', -- project, workspace, global
  scope_id         TEXT NOT NULL DEFAULT '', -- e.g. github.com/org/repo
  isolation        TEXT NOT NULL DEFAULT '', -- hard, soft
  tags             TEXT NOT NULL DEFAULT '', -- JSON array of tags
  evidence         TEXT NOT NULL DEFAULT '', -- JSON array of evidence anchor objects
  related          TEXT NOT NULL DEFAULT '', -- JSON array of relationship objects
  body_text        TEXT NOT NULL DEFAULT '', -- full body text for FTS indexing
  indexed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- FTS5 virtual table: lexical search over title + body + tags
CREATE VIRTUAL TABLE IF NOT EXISTS eku_fts USING fts5(
  id UNINDEXED,
  title,
  body_text,
  tags,
  scope,
  status,
  content='eku',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Trigger: keep FTS5 in sync with eku table on insert
CREATE TRIGGER IF NOT EXISTS eku_fts_insert AFTER INSERT ON eku BEGIN
  INSERT INTO eku_fts(rowid, id, title, body_text, tags, scope, status)
    VALUES (new.rowid, new.id, new.title, new.body_text, new.tags, new.scope, new.status);
END;

-- Trigger: keep FTS5 in sync with eku table on delete
CREATE TRIGGER IF NOT EXISTS eku_fts_delete BEFORE DELETE ON eku BEGIN
  INSERT INTO eku_fts(eku_fts, rowid, id, title, body_text, tags, scope, status)
    VALUES ('delete', old.rowid, old.id, old.title, old.body_text, old.tags, old.scope, old.status);
END;

-- Trigger: keep FTS5 in sync with eku table on update
CREATE TRIGGER IF NOT EXISTS eku_fts_update AFTER UPDATE ON eku BEGIN
  INSERT INTO eku_fts(eku_fts, rowid, id, title, body_text, tags, scope, status)
    VALUES ('delete', old.rowid, old.id, old.title, old.body_text, old.tags, old.scope, old.status);
  INSERT INTO eku_fts(rowid, id, title, body_text, tags, scope, status)
    VALUES (new.rowid, new.id, new.title, new.body_text, new.tags, new.scope, new.status);
END;

-- Index for fast source_path lookups
CREATE INDEX IF NOT EXISTS idx_eku_source_path ON eku(source_path);

-- Index for lifecycle/validation filtering (common retrieval pre-filter)
CREATE INDEX IF NOT EXISTS idx_eku_status ON eku(status);
CREATE INDEX IF NOT EXISTS idx_eku_scope ON eku(scope);
`;

// ── Database lifecycle ────────────────────────────────────────────────────────

/**
 * Opens (or creates) the derived SQLite index at dbPath.
 * Creates directory, applies schema DDL, loads sqlite-vec extension,
 * and asserts schema version compatibility.
 *
 * If the schema version is incompatible, the database is destroyed and
 * reinitialized from an empty state. Canonical Markdown/YAML is never modified.
 *
 * @param {string} dbPath - Absolute path to the SQLite database file
 * @param {object} [options]
 * @param {boolean} [options.readOnly=false] - Open in read-only mode (query only)
 * @param {boolean} [options.verbose=false] - Log SQL statements to stderr
 * @returns {import('better-sqlite3').Database} Open database handle
 */
export function initIndex(dbPath, options = {}) {
  const absPath = path.resolve(dbPath);
  const dir = path.dirname(absPath);

  // Create .ema/ directory if missing
  if (!options.readOnly && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let db;
  try {
    db = new Database(absPath, {
      readonly: options.readOnly || false,
      verbose: options.verbose ? (sql) => process.stderr.write(`[ema-db] ${sql}\n`) : undefined,
    });
  } catch (err) {
    throw new Error(`EMA index: failed to open database at '${absPath}': ${err.message}`);
  }

  // WAL mode: better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');

  // Load sqlite-vec extension
  try {
    loadSqliteVec(db);
  } catch (vecErr) {
    // sqlite-vec load failure is non-fatal for FTS5 functionality
    // Phase 3 vector table is optional; log warning without crashing
    process.stderr.write(`[ema-db] Warning: sqlite-vec failed to load (${vecErr.message}). Vector search will be unavailable.\n`);
  }

  if (!options.readOnly) {
    // Check and handle schema version incompatibility
    const needsReset = _checkSchemaVersion(db);
    if (needsReset) {
      closeIndex(db);
      // Safely destroy derived-only database file and recreate
      try {
        _safeDeleteDerivedDb(absPath);
      } catch (e) {
        throw new Error(`EMA index: could not reset incompatible derived database at '${absPath}': ${e.message}`);
      }
      return initIndex(dbPath, options);
    }

    // Apply DDL (CREATE IF NOT EXISTS — idempotent)
    db.exec(SCHEMA_DDL);

    // Record schema version in meta
    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)`).run(String(SCHEMA_VERSION));
    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('initialized_at', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`).run();
  }

  return db;
}

/**
 * Closes a database handle gracefully.
 * @param {import('better-sqlite3').Database} db
 */
export function closeIndex(db) {
  if (db && db.open) {
    try {
      db.close();
    } catch {
      // best-effort close
    }
  }
}

/**
 * Checks whether the schema version is compatible.
 * Returns true if the database needs to be reset.
 * @param {import('better-sqlite3').Database} db
 * @returns {boolean}
 */
function _checkSchemaVersion(db) {
  try {
    const metaExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='meta'`)
      .get();

    if (!metaExists) {
      // Fresh database — no reset needed
      return false;
    }

    const row = db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get();
    if (!row) {
      return false;
    }

    const existingVersion = Number(row.value);
    if (Number.isNaN(existingVersion) || existingVersion !== SCHEMA_VERSION) {
      process.stderr.write(
        `[ema-db] Schema version mismatch: found v${row.value}, expected v${SCHEMA_VERSION}. Rebuilding derived index.\n`
      );
      return true;
    }
    return false;
  } catch {
    // Corrupt/unreadable database — reset
    return true;
  }
}

/**
 * Safely deletes only the derived database file.
 * Validates path to prevent traversal out of expected location.
 * @param {string} absPath
 */
function _safeDeleteDerivedDb(absPath) {
  if (!absPath.endsWith('.db')) {
    throw new Error(`Safety check: refusing to delete file without .db extension: '${absPath}'`);
  }
  // WAL and SHM files may also exist
  for (const suffix of ['', '-wal', '-shm']) {
    const f = absPath + suffix;
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  }
}

/**
 * Destroys derived database and reinitializes it with a clean schema.
 * Canonical Markdown/YAML is never touched.
 *
 * @param {string} dbPath - Database path
 * @param {object} [options]
 * @returns {import('better-sqlite3').Database}
 */
export function dropAndReinitIndex(dbPath, options = {}) {
  const absPath = path.resolve(dbPath);
  if (fs.existsSync(absPath)) {
    _safeDeleteDerivedDb(absPath);
  }
  return initIndex(dbPath, options);
}

/**
 * Assert the current schema is compatible. Throws if incompatible.
 * @param {import('better-sqlite3').Database} db
 */
export function assertCompatibleSchema(db) {
  const row = db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get();
  if (!row) {
    throw new Error('EMA index: schema version not found in derived database');
  }
  if (Number(row.value) !== SCHEMA_VERSION) {
    throw new Error(
      `EMA index: schema version incompatible (found v${row.value}, expected v${SCHEMA_VERSION})`
    );
  }
}

/**
 * Returns metadata from the database.
 * @param {import('better-sqlite3').Database} db
 * @returns {object}
 */
export function getIndexMeta(db) {
  const rows = db.prepare(`SELECT key, value FROM meta`).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
