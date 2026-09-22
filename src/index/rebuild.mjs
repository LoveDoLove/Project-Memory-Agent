/**
 * Engineering Memory Agent (EMA) — Index Rebuild Engine
 * Phase 3: Derived Storage & SQLite-vec Index Subsystem
 *
 * Implements rebuildIndex(docsPath, db, options) which:
 *   1. Discovers all canonical Markdown files under docsPath
 *   2. Parses YAML frontmatter and body text from each file
 *   3. Indexes each EKU record into the derived SQLite database
 *   4. Reports per-file success/skip/failure diagnostics
 *   5. Never modifies canonical Markdown/YAML
 *
 * CRITICAL INVARIANTS:
 *   - Source files are read-only. Never written, renamed, or deleted.
 *   - Malformed documents are skipped and logged; they do not halt rebuilding.
 *   - Index rebuild never manufactures validation_state: Verified.
 *   - Full rebuild is idempotent; repeating it returns the same derived state.
 *   - Deleting the database and rebuilding must produce canonical parity.
 *
 * Authorized Phase 3 scope only:
 *   - No retrieval policy, ranking, or authorization logic implemented here.
 *   - No candidate queue creation.
 *   - No cross-project data access.
 */

import fs from 'node:fs';
import path from 'node:path';

import { initIndex, closeIndex, dropAndReinitIndex, defaultIndexPath } from './db.mjs';
import { indexEKU, countIndexedEKUs } from './lexical-index.mjs';
import { initVectorIndex, storeVector } from './vector-index.mjs';

// ── Frontmatter parser (zero external dependencies) ──────────────────────────

/**
 * Parses YAML frontmatter from Markdown content.
 * Handles the `---` delimiter block at the start of the file.
 *
 * This is a minimal purpose-built parser for EKU frontmatter.
 * It does not handle YAML anchors/aliases/flow sequences/multiline blocks —
 * EKU frontmatter uses only flat key: value and key: [list] forms.
 *
 * @param {string} content - Raw file content
 * @returns {{ frontmatter: object, body: string }}
 */
export function parseFrontmatter(content) {
  if (typeof content !== 'string') {
    return { frontmatter: {}, body: '' };
  }

  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== '---') {
    return { frontmatter: {}, body: content };
  }

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) {
    return { frontmatter: {}, body: content };
  }

  const yamlLines = lines.slice(1, endIdx);
  const body = lines.slice(endIdx + 1).join('\n').trimStart();
  const frontmatter = parseMinimalYAML(yamlLines);

  return { frontmatter, body };
}

/**
 * Minimal YAML parser for EKU frontmatter.
 * Supports:
 *   - key: scalar_value
 *   - key: [item1, item2]
 *   - key:
 *       nested_key: value
 *   - Comments (#)
 *
 * Does NOT support multiline blocks, anchors, aliases, or arbitrary YAML.
 *
 * @param {string[]} yamlLines
 * @returns {object}
 */
function parseMinimalYAML(yamlLines) {
  const result = {};
  let i = 0;

  while (i < yamlLines.length) {
    const line = yamlLines[i];
    // Skip blank lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIdx).trim();
    let rest = line.slice(colonIdx + 1).trim();

    if (!key) { i++; continue; }

    // Inline array: key: [item1, item2]
    if (rest.startsWith('[')) {
      result[key] = parseInlineArray(rest);
      i++;
      continue;
    }

    // Scalar value
    if (rest !== '') {
      result[key] = unquote(rest);
      i++;
      continue;
    }

    // Possible indented block — look ahead for nested lines
    const blockLines = [];
    while (i + 1 < yamlLines.length && (yamlLines[i + 1].startsWith('  ') || yamlLines[i + 1].startsWith('\t'))) {
      i++;
      blockLines.push(yamlLines[i]);
    }

    if (blockLines.length === 0) {
      result[key] = null;
    } else {
      // Check if it's a sequence (starts with '-')
      if (blockLines.some(l => l.trim().startsWith('-'))) {
        result[key] = blockLines
          .filter(l => l.trim().startsWith('-'))
          .map(l => {
            const item = l.trim().slice(1).trim();
            // Each item might itself be an object (nested key: value pairs)
            if (item.includes(':') && !item.startsWith('"') && !item.startsWith("'")) {
              return parseBlockObject([item]);
            }
            return unquote(item);
          });
      } else {
        result[key] = parseBlockObject(blockLines);
      }
    }

    i++;
  }

  return result;
}

function parseBlockObject(lines) {
  const obj = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const k = line.slice(0, colonIdx).trim();
    const v = line.slice(colonIdx + 1).trim();
    if (k) obj[k] = unquote(v);
  }
  return obj;
}

function parseInlineArray(str) {
  const inner = str.replace(/^\[/, '').replace(/\].*$/, '');
  return inner.split(',').map(item => unquote(item.trim())).filter(Boolean);
}

function unquote(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Extracts body text from Markdown content (strips Markdown syntax for FTS).
 * Returns plain text suitable for lexical indexing.
 *
 * @param {string} body - Markdown body text
 * @returns {string} Plain text for indexing
 */
export function extractBodyText(body) {
  if (typeof body !== 'string') return '';

  return body
    // Remove code blocks (``` fenced)
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`[^`]*`/g, ' ')
    // Remove Markdown headings (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove links, keep link text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ── File discovery ────────────────────────────────────────────────────────────

/**
 * Recursively discovers Markdown files under a directory.
 * Excludes: node_modules, .git, .ema (derived state), hidden directories.
 *
 * @param {string} dir - Directory to scan
 * @returns {string[]} Absolute paths to .md files
 */
export function discoverMarkdownFiles(dir) {
  const results = [];
  const EXCLUDED_DIRS = new Set(['node_modules', '.git', '.ema', '.npm', '.cache']);

  function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return; // Unreadable directory — skip
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(path.join(d, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.join(d, entry.name));
      }
    }
  }

  walk(path.resolve(dir));
  return results;
}

// ── Rebuild engine ────────────────────────────────────────────────────────────

/**
 * Rebuilds the derived index from canonical Markdown/YAML documents.
 *
 * This is a FULL REBUILD — the derived database is dropped and recreated.
 * Canonical documents are NEVER modified.
 *
 * @param {string} docsPath - Canonical docs directory to scan (e.g. 'docs/')
 * @param {object} [options]
 * @param {string} [options.dbPath] - Override database path
 * @param {string} [options.repoRoot] - Repository root (defaults to cwd)
 * @param {boolean} [options.verbose] - Log progress
 * @param {import('better-sqlite3').Database} [options.db] - Existing open DB handle (for testing)
 * @returns {{ indexed: number, skipped: number, failed: number, dbPath: string, diagnostics: Array }}
 */
export function rebuildIndex(docsPath, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const absDocsPath = path.resolve(repoRoot, docsPath);

  if (!fs.existsSync(absDocsPath)) {
    throw new Error(`rebuildIndex: docsPath '${absDocsPath}' does not exist`);
  }

  const { initIndex: _initIdx, dropAndReinitIndex: _dropReinit } = { initIndex, dropAndReinitIndex };

  let db;
  let ownedDb = false;

  if (options.db) {
    db = options.db;
  } else {
    const dbPath = options.dbPath || defaultIndexPath(repoRoot);
    db = dropAndReinitIndex(dbPath);
    ownedDb = true;

    try {
      initVectorIndex(db);
    } catch {
      // Non-fatal
    }
  }

  const diagnostics = [];
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  const markdownFiles = discoverMarkdownFiles(absDocsPath);

  if (options.verbose) {
    process.stderr.write(`[ema-rebuild] Found ${markdownFiles.length} Markdown files under '${absDocsPath}'\n`);
  }

  const indexAll = db.transaction(() => {
    for (const absFilePath of markdownFiles) {
      let relPath;
      try {
        relPath = path.relative(repoRoot, absFilePath).replace(/\\/g, '/');

        const rawContent = fs.readFileSync(absFilePath, 'utf8');
        const { frontmatter, body } = parseFrontmatter(rawContent);

        // Skip files without EMA frontmatter (no recognized EMA key)
        const hasFrontmatter =
          frontmatter.status !== undefined ||
          frontmatter.validation_state !== undefined ||
          frontmatter.authority_level !== undefined ||
          frontmatter.scope !== undefined ||
          frontmatter.title !== undefined;

        if (!hasFrontmatter) {
          skipped++;
          diagnostics.push({ path: relPath, op: 'skip', reason: 'No EMA frontmatter' });
          continue;
        }

        // Extract body text for FTS
        const bodyText = extractBodyText(body);

        const eku = { ...frontmatter, bodyText };
        indexEKU(db, eku, relPath);
        try {
          const tagsStr = Array.isArray(eku.tags) ? eku.tags.join(' ') : (eku.tags || '');
          const textForVector = `${eku.title || ''} ${bodyText} ${tagsStr}`.trim();
          storeVector(db, relPath, textForVector);
        } catch {
          // Vector indexing failure is non-fatal
        }
        indexed++;

        if (options.verbose) {
          process.stderr.write(`[ema-rebuild] Indexed: ${relPath}\n`);
        }
      } catch (err) {
        failed++;
        diagnostics.push({
          path: relPath || absFilePath,
          op: 'failed',
          reason: err.message,
        });
        // Non-fatal: continue rebuilding remaining files
        if (options.verbose) {
          process.stderr.write(`[ema-rebuild] Failed: ${relPath || absFilePath} — ${err.message}\n`);
        }
      }
    }
  });

  try {
    indexAll();
  } finally {
    if (ownedDb) {
      closeIndex(db);
    }
  }

  const result = {
    indexed,
    skipped,
    failed,
    total: markdownFiles.length,
    dbPath: options.db ? '(external)' : (options.dbPath || '(default)'),
    diagnostics,
  };

  if (options.verbose) {
    process.stderr.write(
      `[ema-rebuild] Complete: ${indexed} indexed, ${skipped} skipped, ${failed} failed (${markdownFiles.length} total)\n`
    );
  }

  return result;
}

/**
 * Helper: lazy-import db.mjs to avoid circular dependency.
 * @returns {{ defaultIndexPath: function }}
 */
function await_import_db() {
  // Synchronous import workaround for module resolution
  // Using require-like pattern for top-level sync resolution
  const { defaultIndexPath } = _db_module_ref;
  return { defaultIndexPath };
}

// Module-level reference — set after module loads to avoid circular import
export let _db_module_ref = { defaultIndexPath: null };

/**
 * Synchronous rebuild using an already-initialized database handle.
 * Safe for unit testing; does not create or destroy the derived database.
 *
 * @param {string} docsPath - Absolute path to docs directory
 * @param {import('better-sqlite3').Database} db - Pre-initialized open DB handle
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {boolean} [options.verbose]
 * @returns {{ indexed: number, skipped: number, failed: number, total: number, diagnostics: Array }}
 */
export function rebuildIndexWithDB(docsPath, db, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const absDocsPath = path.resolve(repoRoot, docsPath);

  if (!fs.existsSync(absDocsPath)) {
    throw new Error(`rebuildIndexWithDB: docsPath '${absDocsPath}' does not exist`);
  }

  const diagnostics = [];
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  const markdownFiles = discoverMarkdownFiles(absDocsPath);

  const indexAll = db.transaction(() => {
    for (const absFilePath of markdownFiles) {
      let relPath;
      try {
        relPath = path.relative(repoRoot, absFilePath).replace(/\\/g, '/');

        const rawContent = fs.readFileSync(absFilePath, 'utf8');
        const { frontmatter, body } = parseFrontmatter(rawContent);

        const hasFrontmatter =
          frontmatter.status !== undefined ||
          frontmatter.validation_state !== undefined ||
          frontmatter.authority_level !== undefined ||
          frontmatter.scope !== undefined ||
          frontmatter.title !== undefined;

        if (!hasFrontmatter) {
          skipped++;
          diagnostics.push({ path: relPath, op: 'skip', reason: 'No EMA frontmatter' });
          continue;
        }

        const bodyText = extractBodyText(body);
        const eku = { ...frontmatter, bodyText };
        indexEKU(db, eku, relPath);
        try {
          const tagsStr = Array.isArray(eku.tags) ? eku.tags.join(' ') : (eku.tags || '');
          const textForVector = `${eku.title || ''} ${bodyText} ${tagsStr}`.trim();
          storeVector(db, relPath, textForVector);
        } catch {
          // Vector indexing failure is non-fatal
        }
        indexed++;

      } catch (err) {
        failed++;
        diagnostics.push({
          path: relPath || absFilePath,
          op: 'failed',
          reason: err.message,
        });
      }
    }
  });

  indexAll();

  return { indexed, skipped, failed, total: markdownFiles.length, diagnostics };
}
