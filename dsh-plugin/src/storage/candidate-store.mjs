/**
 * Engineering Memory Agent (EMA) — Candidate Storage Subsystem
 * Phase 6: Candidate Queue & Promotion Pipeline
 *
 * Stores pending knowledge candidates in `.ema/candidates/` as isolated,
 * unvalidated artifacts.
 *
 * CRITICAL INVARIANTS:
 *   - Candidates are NEVER stored in canonical `docs/` before validation and promotion.
 *   - Candidates ALWAYS have authority_level: 'Candidate' and validation_state: 'Unreviewed'.
 *   - Candidates are NEVER returned as authoritative knowledge in active retrieval.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Returns default candidate directory path.
 * @param {string} projectRoot
 * @returns {string}
 */
export function defaultCandidateDir(projectRoot = process.cwd()) {
  return path.join(path.resolve(projectRoot), '.ema', 'candidates');
}

/**
 * Ensures the candidate directory exists.
 * @param {string} candidateDir
 */
export function ensureCandidateDir(candidateDir) {
  if (!fs.existsSync(candidateDir)) {
    fs.mkdirSync(candidateDir, { recursive: true });
  }
}

/**
 * Generates a URL/file-safe candidate ID.
 * @param {string} title
 * @returns {string}
 */
export function generateCandidateId(title = 'candidate') {
  const timestamp = Date.now();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'unit';
  return `cand-${timestamp}-${slug}`;
}

/**
 * Creates and persists a new EKU candidate in the candidate queue.
 *
 * @param {object} data - EKU candidate payload
 * @param {string} [candidateDir] - Directory where candidates are stored
 * @returns {object} The persisted candidate record
 */
export function createCandidate(data = {}, candidateDir = defaultCandidateDir()) {
  ensureCandidateDir(candidateDir);

  const id = data.id || generateCandidateId(data.title);
  const now = new Date().toISOString();

  // Enforce mandatory Candidate invariants
  const candidateRecord = {
    ...data,
    id,
    title: data.title || 'Untitled Candidate',
    authority_level: 'Candidate',
    validation_state: 'Unreviewed',
    status: data.status || 'Draft',
    confidence: data.confidence || 'Low',
    scope: data.scope || 'project',
    scope_id: data.scope_id || 'default-project',
    isolation: data.isolation || 'soft',
    evidence: Array.isArray(data.evidence) ? data.evidence : (data.evidence ? [data.evidence] : []),
    related: Array.isArray(data.related) ? data.related : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    body_text: data.body_text || data.bodyText || data.content || '',
    created: data.created || now,
    extracted_at: now,
    candidate_file: `${id}.json`,
  };

  const filePath = path.join(candidateDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(candidateRecord, null, 2), 'utf8');

  return candidateRecord;
}

/**
 * Retrieves a candidate by ID.
 *
 * @param {string} id - Candidate ID
 * @param {string} [candidateDir] - Directory path
 * @returns {object|null} Candidate record or null if not found
 */
export function getCandidate(id, candidateDir = defaultCandidateDir()) {
  if (!id) return null;
  const filePath = path.join(candidateDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Lists all pending candidates in the candidate queue.
 *
 * @param {string} [candidateDir]
 * @param {object} [filter]
 * @returns {Array<object>}
 */
export function listCandidates(candidateDir = defaultCandidateDir(), filter = {}) {
  if (!fs.existsSync(candidateDir)) return [];

  const files = fs.readdirSync(candidateDir).filter((f) => f.endsWith('.json'));
  const candidates = [];

  for (const file of files) {
    try {
      const filePath = path.join(candidateDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const rec = JSON.parse(content);

      if (filter.scope && rec.scope !== filter.scope) continue;
      if (filter.validation_state && rec.validation_state !== filter.validation_state) continue;

      candidates.push(rec);
    } catch {
      // Ignore unparseable files
    }
  }

  return candidates;
}

/**
 * Updates an existing candidate in the queue.
 *
 * @param {string} id
 * @param {object} updates
 * @param {string} [candidateDir]
 * @returns {object|null} Updated candidate or null
 */
export function updateCandidate(id, updates = {}, candidateDir = defaultCandidateDir()) {
  const current = getCandidate(id, candidateDir);
  if (!current) return null;

  const updated = {
    ...current,
    ...updates,
    id: current.id, // ID remains immutable
  };

  const filePath = path.join(candidateDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

/**
 * Deletes a candidate from the queue (e.g. after promotion or rejection).
 *
 * @param {string} id
 * @param {string} [candidateDir]
 * @returns {boolean} True if deleted, false if not found
 */
export function removeCandidate(id, candidateDir = defaultCandidateDir()) {
  if (!id) return false;
  const filePath = path.join(candidateDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return false;

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}
