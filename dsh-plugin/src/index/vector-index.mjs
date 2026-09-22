/**
 * Engineering Memory Agent (EMA) — sqlite-vec Vector Index Foundation
 * Phase 3: Derived Storage & SQLite-vec Index Subsystem
 *
 * Establishes the Phase 3 authorized vector-index compatibility foundation.
 *
 * SCOPE NOTE — Phase 3 Authorization:
 *   The Development Plan explicitly names `sqlite-vec` and `vector-index.mjs`
 *   as Phase 3 scope. However:
 *
 *   - Vector EMBEDDINGS (model inference, ONNX runtime, fastembed-js, bge-small)
 *     are deferred to a later sub-phase pending embedding model selection
 *     (Development Plan §23 Open Question #2).
 *
 *   - This module establishes the SCHEMA FOUNDATION and sqlite-vec extension
 *     loading compatibility layer so Phase 5 can add vector similarity without
 *     a schema migration.
 *
 *   - `searchVector()` is implemented as a stub that returns an empty result
 *     with a clear NOT_AVAILABLE status. Phase 5 must supply the embedding
 *     model and activate the vector search path.
 *
 * Phase 4+ functionality NOT implemented here:
 *   - Retrieval policy or ranking
 *   - Authorization or scope firewalls
 *   - Candidate queues or promotion
 *
 * INVARIANT: This module never sets validation_state = Verified.
 */

import { load as loadSqliteVec } from 'sqlite-vec';

// ── Phase 3 Vector Dimension Placeholder ────────────────────────────────────
// Placeholder dimension. When the embedding model is chosen in Phase 5,
// this must match the embedding output (e.g. 384 for all-MiniLM-L6-v2).
export const VECTOR_DIMENSION_PLACEHOLDER = 384;

// ── Schema DDL for vector table (created during initVectorIndex) ─────────────
export const VECTOR_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS eku_vec_meta (
    id          TEXT PRIMARY KEY NOT NULL REFERENCES eku(id) ON DELETE CASCADE,
    model_name  TEXT NOT NULL DEFAULT '',
    embedded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`;

/**
 * Ensures sqlite-vec is loaded for a given database connection.
 * Called as part of initIndex() in db.mjs. Also callable independently.
 *
 * @param {import('better-sqlite3').Database} db - Open database handle
 * @returns {{ loaded: boolean, version?: string, error?: string }}
 */
export function ensureSqliteVecLoaded(db) {
  try {
    loadSqliteVec(db);
    const row = db.prepare(`SELECT vec_version() AS v`).get();
    return { loaded: true, version: row ? row.v : 'unknown' };
  } catch (err) {
    return { loaded: false, error: err.message };
  }
}

/**
 * Creates the vector metadata table in the derived database.
 * This is the Phase 3 schema foundation — actual vector storage columns
 * (using vec0 virtual tables) will be added when the embedding model is
 * selected in Phase 5.
 *
 * Calling this function multiple times is safe (idempotent via CREATE IF NOT EXISTS).
 *
 * @param {import('better-sqlite3').Database} db
 */
export function initVectorIndex(db) {
  if (!db || !db.open) {
    throw new Error('EMA vector-index: database is not open');
  }
  db.exec(VECTOR_TABLE_DDL);
}

/**
 * Stub: Performs a vector similarity search.
 *
 * This function is NOT operational in Phase 3. It returns a structured
 * NOT_AVAILABLE result to clearly communicate to callers that vector
 * search requires Phase 5 embedding infrastructure.
 *
 * @param {import('better-sqlite3').Database} db - Open database handle
 * @param {Float32Array|number[]} _vector - Query embedding vector (ignored in Phase 3)
 * @param {string} [_scope] - Scope filter (ignored in Phase 3)
 * @param {object} [_opts] - Search options (ignored in Phase 3)
 * @returns {{ status: 'NOT_AVAILABLE', reason: string, results: [] }}
 */
export function searchVector(_db, _vector, _scope, _opts = {}) {
  return {
    status: 'NOT_AVAILABLE',
    reason:
      'Vector search requires Phase 5 embedding infrastructure (embedding model selection is an open Phase 3 question per Development Plan §23).',
    results: [],
  };
}

/**
 * Stub: Stores a vector embedding for an EKU.
 * Not operational in Phase 3.
 *
 * @param {import('better-sqlite3').Database} _db
 * @param {string} _ekuId
 * @param {Float32Array|number[]} _embedding
 * @param {string} _modelName
 * @returns {{ status: 'NOT_AVAILABLE', reason: string }}
 */
export function storeVector(_db, _ekuId, _embedding, _modelName) {
  return {
    status: 'NOT_AVAILABLE',
    reason:
      'Vector storage requires Phase 5 embedding infrastructure.',
  };
}

/**
 * Returns the vector index availability status for this Phase.
 * @returns {{ phase3Available: false, reason: string }}
 */
export function getVectorIndexStatus() {
  return {
    phase3Available: false,
    reason:
      'Vector similarity search is deferred to Phase 5 pending embedding model selection (Development Plan §23, Open Question #2). sqlite-vec extension is loaded; schema foundation is ready.',
  };
}
