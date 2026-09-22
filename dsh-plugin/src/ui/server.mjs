/**
 * Engineering Memory Agent (EMA) — Visual Memory Graph HTTP Server
 *
 * Lightweight, zero-dependency Node.js HTTP server.
 * Serves the interactive Memory Graph UI and provides JSON APIs for graph data,
 * node details, and candidate promotion.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import { extractGraphData } from './graph-data.mjs';
import { renderHtml } from './template.mjs';
import { getCandidate } from '../storage/candidate-store.mjs';
import { promoteScope } from '../promotion/pipeline.mjs';
import { rebuildIndex } from '../index/rebuild.mjs';
import { defaultIndexPath, initIndex } from '../index/db.mjs';

/**
 * Creates and starts the EMA Visual Memory Graph HTTP server.
 *
 * @param {object} [options]
 * @param {number} [options.port=3888] - HTTP port
 * @param {string} [options.host='127.0.0.1'] - Bind host
 * @param {import('better-sqlite3').Database} [options.db] - Open database handle
 * @param {string} [options.repoRoot=process.cwd()] - Repository root
 * @returns {Promise<{ server: http.Server, url: string, close: Function }>}
 */
export function startUIServer(options = {}) {
  const port = options.port || 3888;
  const host = options.host || '127.0.0.1';
  const repoRoot = path.resolve(options.repoRoot || process.cwd());

  let db = options.db;
  let ownedDb = false;

  if (!db) {
    try {
      db = initIndex(defaultIndexPath(repoRoot));
      ownedDb = true;
    } catch {
      // Database may not exist yet; gracefully proceed
    }
  }

  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://${host}:${port}`);
    const pathname = urlObj.pathname;

    // CORS headers for local tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // 1. Root SPA HTML
      if (req.method === 'GET' && pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderHtml());
        return;
      }

      // 2. Graph Data API
      if (req.method === 'GET' && pathname === '/api/graph') {
        const data = extractGraphData(db, repoRoot);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }

      // 3. Node Detail API
      if (req.method === 'GET' && pathname.startsWith('/api/nodes/')) {
        const rawId = decodeURIComponent(pathname.slice('/api/nodes/'.length));
        const details = getNodeDetails(rawId, db, repoRoot);
        if (details) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(details));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'NodeNotFound', id: rawId }));
        }
        return;
      }

      // 4. Promote Candidate API
      if (req.method === 'POST' && pathname.startsWith('/api/promote/')) {
        const candidateId = decodeURIComponent(pathname.slice('/api/promote/'.length));
        const candidateDir = path.join(repoRoot, '.ema', 'candidates');
        const docsDir = path.join(repoRoot, 'docs');

        const promoteResult = promoteScope(candidateId, 'project', 'Promoted via Visual Memory Graph UI', {
          actor: 'human',
          candidateDir,
          docsDir,
          writeToDisk: true,
        });

        if (promoteResult.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(promoteResult));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(promoteResult));
        }
        return;
      }

      // 5. Reindex API
      if (req.method === 'POST' && pathname === '/api/reindex') {
        const reindexResult = rebuildIndex('docs', { repoRoot, db });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reindexResult));
        return;
      }

      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'InternalServerError', message: err.message }));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const url = `http://${host}:${port}`;
      resolve({
        server,
        url,
        close: () => {
          server.close();
          if (ownedDb && db && db.open) {
            try { db.close(); } catch { /* ignore */ }
          }
        },
      });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Retrieves node details from SQLite or file on disk.
 */
function getNodeDetails(id, db, repoRoot) {
  // Check canonical SQLite
  if (db && db.open) {
    const row = db.prepare(`SELECT * FROM eku WHERE id = ?`).get(id);
    if (row) {
      let content = row.body_text || '';
      const absPath = path.resolve(repoRoot, row.source_path || id);
      if (fs.existsSync(absPath)) {
        try {
          content = fs.readFileSync(absPath, 'utf8');
        } catch {
          // Fallback to body_text
        }
      }

      return {
        id: row.id,
        title: row.title,
        status: row.status,
        validation_state: row.validation_state,
        authority_level: row.authority_level,
        confidence: row.confidence,
        scope: row.scope,
        scope_id: row.scope_id,
        source_path: row.source_path,
        is_candidate: false,
        tags: safeParse(row.tags, []),
        evidence: safeParse(row.evidence, []),
        related: safeParse(row.related, []),
        content,
      };
    }
  }

  // Check candidate store
  try {
    const candidateDir = path.join(repoRoot, '.ema', 'candidates');
    const cand = getCandidate(id, candidateDir);
    if (cand) {
      const rawContent = cand.body || cand.body_text || cand.content || '';
      return {
        ...cand,
        is_candidate: true,
        content: rawContent,
      };
    }
  } catch {
    // Non-fatal
  }

  return null;
}

function safeParse(str, fallback) {
  if (typeof str !== 'string' || !str.trim()) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
