/**
 * Engineering Memory Agent (EMA) — Index Subsystem Barrel
 * Phase 3: Derived Storage & SQLite-vec Index Subsystem
 *
 * Exports all Phase 3 authorized index interfaces:
 *
 * Database Lifecycle:
 *   initIndex(dbPath, options)         → Database handle
 *   closeIndex(db)                     → void
 *   dropAndReinitIndex(dbPath)         → Database handle
 *   assertCompatibleSchema(db)         → void | throws
 *   getIndexMeta(db)                   → object
 *   defaultIndexPath(repoRoot)         → string
 *   SCHEMA_VERSION                     → number
 *
 * Lexical Indexing (FTS5):
 *   indexEKU(db, eku, sourcePath)      → { id, op }
 *   removeEKU(db, id)                  → boolean
 *   getIndexedEKU(db, id)              → object | null
 *   getIndexedEKUByPath(db, path)      → object | null
 *   countIndexedEKUs(db)               → number
 *   searchLexical(db, query, scope, opts) → Array<object>
 *   sanitizeFTS5Query(rawQuery)        → string | null
 *   rebuildFTS5(db)                    → void
 *   ekuId(sourcePath)                  → string
 *   extractIndexRecord(eku, path)      → object
 *
 * Vector Index (Phase 3 Foundation — search not yet operational):
 *   ensureSqliteVecLoaded(db)          → { loaded, version?, error? }
 *   initVectorIndex(db)                → void
 *   searchVector(db, vector, scope)    → { status: 'NOT_AVAILABLE', results: [] }
 *   storeVector(db, ekuId, embedding, model) → { status: 'NOT_AVAILABLE' }
 *   getVectorIndexStatus()             → { phase3Available: false, reason }
 *
 * Rebuild Engine:
 *   rebuildIndex(docsPath, options)    → { indexed, skipped, failed, total, dbPath, diagnostics }
 *   rebuildIndexWithDB(docsPath, db, options) → { indexed, skipped, failed, total, diagnostics }
 *   parseFrontmatter(content)          → { frontmatter, body }
 *   extractBodyText(body)              → string
 *   discoverMarkdownFiles(dir)         → string[]
 */

export {
  // Database lifecycle
  initIndex,
  closeIndex,
  dropAndReinitIndex,
  assertCompatibleSchema,
  getIndexMeta,
  defaultIndexPath,
  SCHEMA_VERSION,
  DEFAULT_INDEX_DIR,
  DEFAULT_INDEX_FILENAME,
} from './db.mjs';

export {
  // Lexical indexing (FTS5)
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
} from './lexical-index.mjs';

export {
  // Vector index (Phase 3 foundation)
  ensureSqliteVecLoaded,
  initVectorIndex,
  searchVector,
  storeVector,
  getVectorIndexStatus,
  VECTOR_DIMENSION_PLACEHOLDER,
  VECTOR_TABLE_DDL,
} from './vector-index.mjs';

export {
  // Rebuild engine
  rebuildIndex,
  rebuildIndexWithDB,
  parseFrontmatter,
  extractBodyText,
  discoverMarkdownFiles,
} from './rebuild.mjs';
