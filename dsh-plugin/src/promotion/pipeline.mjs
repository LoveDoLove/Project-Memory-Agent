/**
 * Engineering Memory Agent (EMA) — Promotion Pipeline Subsystem
 * Phase 6: Candidate Queue & Promotion Pipeline
 *
 * Implements candidate validation, scope promotion with authority verification,
 * global source independence enforcement (>= 2 independent repos), lineage tracking,
 * and quarantine coordination.
 *
 * Interfaces Introduced:
 *   createCandidate(data)
 *   validateCandidate(id, decision, options)
 *   promoteScope(id, targetScope, rationale, options)
 *   quarantineUnit(id, reason, options)
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  createCandidate,
  getCandidate,
  updateCandidate,
  removeCandidate,
  defaultCandidateDir,
} from '../storage/candidate-store.mjs';

import { evaluateAccess } from '../policy/authorization.mjs';
import { canPromoteAcrossIsolation, isHardIsolated } from '../policy/isolation.mjs';
import {
  buildPromotedFromBlock,
  validateGlobalPromotionEvidence,
  formatChangelogEntry,
} from './lineage.mjs';
import { serializeEKU } from '../core/eku.mjs';

export { createCandidate };

/**
 * Validates a candidate in the candidate queue.
 *
 * @param {string} id - Candidate ID
 * @param {string} decision - 'Verified' | 'Invalid' | 'Needs Review'
 * @param {object} [options]
 * @param {string} [options.actor='agent'] - Actor validating candidate
 * @param {string} [options.candidateDir] - Candidate storage directory
 * @param {string} [options.notes] - Validation rationale or notes
 * @returns {object} Updated candidate record
 */
export function validateCandidate(id, decision, options = {}) {
  const {
    actor = 'agent',
    candidateDir = defaultCandidateDir(),
    notes = '',
  } = options;

  const candidate = getCandidate(id, candidateDir);
  if (!candidate) {
    throw new Error(`Candidate not found: '${id}'`);
  }

  // 1. Authorization check: Actor must have 'validate' authority
  const auth = evaluateAccess(actor, 'validate', candidate.scope, isHardIsolated(candidate));
  if (!auth.allowed) {
    throw new Error(`Authorization denied for actor '${actor}' to validate candidate: ${auth.reason}`);
  }

  // 2. Validate decision value
  const validDecisions = ['Verified', 'Invalid', 'Needs Review'];
  if (!validDecisions.includes(decision)) {
    throw new Error(`Invalid validation decision '${decision}'. Must be one of: ${validDecisions.join(', ')}`);
  }

  const now = new Date().toISOString();
  const updates = {
    validation_state: decision,
    last_verified: now,
    validated_by: actor,
    validation_notes: notes,
  };

  return updateCandidate(id, updates, candidateDir);
}

/**
 * Promotes a candidate or project EKU to a target knowledge scope.
 *
 * @param {string|object} candidateOrId - Candidate ID or candidate object
 * @param {string} targetScope - 'project' | 'workspace' | 'global'
 * @param {string} rationale - Engineering rationale for promotion
 * @param {object} [options]
 * @param {string} [options.actor='project_admin'] - Actor authorizing promotion
 * @param {string} [options.candidateDir] - Candidate storage directory
 * @param {string} [options.docsDir] - Canonical destination directory for Markdown
 * @param {string} [options.changelogPath] - Path to CHANGELOG-MEMORY.md for audit logging
 * @param {boolean} [options.isIsolated=false] - Whether current scope is hard-isolated
 * @param {boolean} [options.writeToDisk=false] - Whether to write canonical markdown file
 * @returns {{
 *   success: boolean,
 *   promotedEKU: object,
 *   filePath?: string,
 *   changelogEntry?: string
 * }}
 */
export function promoteScope(candidateOrId, targetScope, rationale, options = {}) {
  const {
    actor = 'project_admin',
    candidateDir = defaultCandidateDir(),
    docsDir,
    changelogPath,
    isIsolated = false,
    writeToDisk = false,
  } = options;

  // 1. Resolve candidate record
  let candidate = null;
  if (typeof candidateOrId === 'string') {
    candidate = getCandidate(candidateOrId, candidateDir);
    if (!candidate) {
      throw new Error(`Candidate not found: '${candidateOrId}'`);
    }
  } else if (candidateOrId && typeof candidateOrId === 'object') {
    candidate = candidateOrId;
  } else {
    throw new Error('Candidate ID or candidate object is required');
  }

  const normTarget = (targetScope || '').toLowerCase();
  const validScopes = ['project', 'workspace', 'global'];
  if (!validScopes.includes(normTarget)) {
    throw new Error(`Invalid target scope '${targetScope}'. Must be one of: ${validScopes.join(', ')}`);
  }

  // 2. Authorization check: Actor must be authorized to promote to targetScope
  const auth = evaluateAccess(actor, 'promote', normTarget, isIsolated);
  if (!auth.allowed) {
    throw new Error(`Authorization denied: ${auth.reason}`);
  }

  // 3. Hard Isolation Boundary Check
  const isolationCheck = canPromoteAcrossIsolation(
    { scope: candidate.scope, isIsolated },
    { scope: normTarget, isIsolated: false }
  );
  if (!isolationCheck.allowed) {
    throw new Error(`Hard-isolation violation: ${isolationCheck.reason}`);
  }

  // 4. Global Scope Precondition: >= 2 independent repository evidence anchors
  let minSources = 1;
  if (normTarget === 'global') {
    const evidenceValidation = validateGlobalPromotionEvidence(candidate.evidence);
    if (!evidenceValidation.valid) {
      throw new Error(`Global promotion rejected: ${evidenceValidation.reason}`);
    }
    minSources = evidenceValidation.distinctRepoCount;
  }

  // 5. Build Promoted Canonical EKU
  const now = new Date().toISOString();
  const promotedFromBlock = buildPromotedFromBlock({
    originScope: candidate.scope || 'project',
    originId: candidate.scope_id || candidate.origin_id || 'default-project',
    validatedBy: candidate.validated_by || actor,
    promotedBy: actor,
    rationale,
    minSourcesChecked: minSources,
    auditRef: changelogPath ? path.basename(changelogPath) : 'docs/CHANGELOG-MEMORY.md',
  });

  const promotedEKU = {
    ...candidate,
    scope: normTarget,
    authority_level: 'Canonical',
    validation_state: 'Verified',
    status: 'Current',
    confidence: candidate.confidence && candidate.confidence !== 'Low' ? candidate.confidence : 'Medium',
    last_verified: now,
    promoted_from: promotedFromBlock,
  };

  delete promotedEKU.candidate_file;
  delete promotedEKU.extracted_at;

  // 6. Format Changelog Entry
  let changelogEntry;
  if (changelogPath) {
    changelogEntry = formatChangelogEntry({
      action: 'PROMOTE',
      id: promotedEKU.id,
      title: promotedEKU.title,
      fromScope: candidate.scope || 'candidate_queue',
      toScope: normTarget,
      actor,
      rationale,
    });

    if (fs.existsSync(changelogPath)) {
      fs.appendFileSync(changelogPath, `\n${changelogEntry}\n`, 'utf8');
    }
  }

  // 7. Write to canonical storage if requested
  let targetFilePath;
  if (writeToDisk && docsDir) {
    const filename = `${promotedEKU.id}.md`;
    targetFilePath = path.join(docsDir, filename);
    const serialized = serializeEKU(promotedEKU, promotedEKU.body_text || '');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(targetFilePath, serialized, 'utf8');
  }

  // 8. Remove from candidate store
  if (candidate.id) {
    removeCandidate(candidate.id, candidateDir);
  }

  return {
    success: true,
    promotedEKU,
    filePath: targetFilePath,
    changelogEntry,
  };
}

/**
 * Places a knowledge unit into Quarantine due to contradiction or conflict.
 *
 * @param {string|object} unitOrId
 * @param {string} reason - Justification for quarantine
 * @param {object} [options]
 * @param {string} [options.actor='agent']
 * @param {string} [options.candidateDir]
 * @returns {object} Updated record marked as Quarantined
 */
export function quarantineUnit(unitOrId, reason, options = {}) {
  const { actor = 'agent', candidateDir = defaultCandidateDir() } = options;

  let unit = null;
  if (typeof unitOrId === 'string') {
    unit = getCandidate(unitOrId, candidateDir);
    if (!unit) {
      throw new Error(`Knowledge unit not found: '${unitOrId}'`);
    }
  } else if (unitOrId && typeof unitOrId === 'object') {
    unit = unitOrId;
  } else {
    throw new Error('Knowledge unit identifier or object is required');
  }

  const auth = evaluateAccess(actor, 'quarantine', unit.scope || 'project', isHardIsolated(unit));
  if (!auth.allowed) {
    throw new Error(`Authorization denied for actor '${actor}' to quarantine: ${auth.reason}`);
  }

  const updates = {
    validation_state: 'Quarantined',
    quarantine_reason: reason || 'Unresolved contradiction detected',
    quarantined_by: actor,
    quarantined_at: new Date().toISOString(),
  };

  if (typeof unitOrId === 'string') {
    return updateCandidate(unitOrId, updates, candidateDir);
  }

  return {
    ...unit,
    ...updates,
  };
}
