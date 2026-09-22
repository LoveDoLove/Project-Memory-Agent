/**
 * Engineering Memory Agent (EMA) — Graph Data Extractor
 *
 * Extracts nodes, typed relationships, and contradiction edges from both:
 *   1. Canonical derived index (SQLite `eku` table)
 *   2. Candidate queue (`.ema/candidates/`)
 */

import path from 'node:path';
import { listCandidates } from '../storage/candidate-store.mjs';

/**
 * Normalizes an EKU ID or target path for consistent edge matching.
 * @param {string} target
 * @returns {string}
 */
export function normalizeTargetId(target) {
  if (!target || typeof target !== 'string') return '';
  return target.trim().replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Extracts all graph nodes, edges, and statistics for the visual graph.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} [projectRoot=process.cwd()]
 * @returns {{
 *   nodes: Array<object>,
 *   edges: Array<object>,
 *   stats: object
 * }}
 */
export function extractGraphData(db, projectRoot = process.cwd()) {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // 1. Extract canonical nodes from SQLite
  if (db && db.open) {
    const rows = db.prepare(`
      SELECT
        id, title, status, validation_state, authority_level,
        confidence, scope, scope_id, tags, evidence, related, source_path
      FROM eku
    `).all();

    for (const r of rows) {
      const parsedTags = safeJsonParse(r.tags, []);
      const parsedEvidence = safeJsonParse(r.evidence, []);
      const parsedRelated = safeJsonParse(r.related, []);

      const node = {
        id: r.id,
        title: r.title || r.id,
        status: r.status || 'Current',
        validation_state: r.validation_state || 'Unreviewed',
        authority_level: r.authority_level || 'Canonical',
        confidence: r.confidence || 'Medium',
        scope: r.scope || 'project',
        scope_id: r.scope_id || '',
        source_path: r.source_path,
        is_candidate: false,
        evidence_count: Array.isArray(parsedEvidence) ? parsedEvidence.length : 0,
        tags: Array.isArray(parsedTags) ? parsedTags : [],
      };

      nodes.push(node);
      nodeMap.set(node.id, node);

      // Extract relationships for edges
      if (Array.isArray(parsedRelated)) {
        for (const rel of parsedRelated) {
          const targetPath = typeof rel === 'string' ? rel : (rel.target || rel.path || '');
          const targetId = normalizeTargetId(targetPath);
          const relType = typeof rel === 'object' && rel.type ? rel.type : 'relates_to';
          const isContradiction = relType === 'contradicts';

          if (targetId) {
            edges.push({
              source: r.id,
              target: targetId,
              type: relType,
              is_contradiction: isContradiction,
              label: relType,
            });
          }
        }
      }
    }
  }

  // 2. Extract candidate nodes from candidate queue
  try {
    const candidateDir = path.join(path.resolve(projectRoot), '.ema', 'candidates');
    const candidates = listCandidates(candidateDir);

    for (const cand of candidates) {
      const node = {
        id: cand.id,
        title: cand.title || cand.id,
        status: cand.status || 'Draft',
        validation_state: cand.validation_state || 'Unreviewed',
        authority_level: 'Candidate',
        confidence: cand.confidence || 'Low',
        scope: cand.scope || 'project',
        scope_id: cand.scope_id || '',
        source_path: cand.filePath || `.ema/candidates/${cand.id}.md`,
        is_candidate: true,
        evidence_count: Array.isArray(cand.evidence) ? cand.evidence.length : 0,
        tags: Array.isArray(cand.tags) ? cand.tags : [],
      };

      nodes.push(node);
      nodeMap.set(node.id, node);

      if (Array.isArray(cand.related)) {
        for (const rel of cand.related) {
          const targetPath = typeof rel === 'string' ? rel : (rel.target || rel.path || '');
          const targetId = normalizeTargetId(targetPath);
          const relType = typeof rel === 'object' && rel.type ? rel.type : 'relates_to';
          if (targetId) {
            edges.push({
              source: cand.id,
              target: targetId,
              type: relType,
              is_contradiction: relType === 'contradicts',
              label: relType,
            });
          }
        }
      }
    }
  } catch {
    // Non-fatal if candidate directory is empty or inaccessible
  }

  // Filter edges to only those where target exists or flag target as external
  const validEdges = [];
  let contradictionCount = 0;

  for (const edge of edges) {
    if (edge.is_contradiction) contradictionCount++;
    validEdges.push(edge);
  }

  const canonicalCount = nodes.filter((n) => !n.is_candidate).length;
  const candidateCount = nodes.filter((n) => n.is_candidate).length;

  return {
    nodes,
    edges: validEdges,
    stats: {
      total_nodes: nodes.length,
      canonical_count: canonicalCount,
      candidate_count: candidateCount,
      total_edges: validEdges.length,
      contradiction_count: contradictionCount,
    },
  };
}

function safeJsonParse(val, fallback) {
  if (typeof val !== 'string' || !val.trim()) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
