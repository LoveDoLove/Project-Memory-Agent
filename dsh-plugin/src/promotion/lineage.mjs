/**
 * Engineering Memory Agent (EMA) — Lineage & Provenance Tracking
 * Phase 6: Candidate Queue & Promotion Pipeline
 *
 * Implements promotion lineage building, global source independence verification
 * (min_sources_checked >= 2 across distinct repository IDs), and changelog auditing.
 */

import { parseEvidenceAnchor } from '../evidence/index.mjs';

/**
 * Builds the canonical `promoted_from` provenance metadata block.
 *
 * @param {object} params
 * @param {string} params.originScope - Original knowledge scope (e.g. 'project', 'workspace')
 * @param {string} params.originId - Original repository/workspace identifier
 * @param {string} params.validatedBy - Actor who validated the knowledge unit
 * @param {string} params.promotedBy - Actor who performed the promotion
 * @param {string} params.rationale - Explicit engineering rationale for promotion
 * @param {number} [params.minSourcesChecked=1] - Number of independent sources verified
 * @param {string} [params.auditRef] - Reference to audit record or changelog entry
 * @returns {object} Canonical promoted_from block
 */
export function buildPromotedFromBlock({
  originScope,
  originId,
  validatedBy,
  promotedBy,
  rationale,
  minSourcesChecked = 1,
  auditRef,
}) {
  return {
    origin_scope: originScope || 'project',
    origin_id: originId || 'default-project',
    validated_by: validatedBy || 'human',
    promoted_by: promotedBy || 'human',
    promoted_at: new Date().toISOString(),
    rationale: rationale || 'Promoted following verification',
    min_sources_checked: minSourcesChecked,
    audit_ref: auditRef || 'docs/CHANGELOG-MEMORY.md',
  };
}

/**
 * Enforces the Global scope promotion invariant:
 * Requires evidence from >= 2 INDEPENDENT repositories (distinct repo-id in canonical URI).
 * Multiple evidence files within the same repository do NOT satisfy this invariant.
 *
 * @param {Array<string|object>} evidenceList - List of evidence anchors or strings
 * @returns {{ valid: boolean, distinctRepoCount: number, repoIds: string[], reason?: string }}
 */
export function validateGlobalPromotionEvidence(evidenceList) {
  if (!Array.isArray(evidenceList) || evidenceList.length < 2) {
    return {
      valid: false,
      distinctRepoCount: Array.isArray(evidenceList) ? evidenceList.length : 0,
      repoIds: [],
      reason: 'Global scope requires evidence from ≥2 independent sources (less than 2 evidence items provided)',
    };
  }

  const distinctRepos = new Set();

  for (const item of evidenceList) {
    const uriStr = typeof item === 'string' ? item : (item.anchor || item.uri || '');
    if (uriStr.startsWith('ema://evidence/')) {
      const parsed = parseEvidenceAnchor(uriStr);
      if (parsed && parsed.repoId) {
        distinctRepos.add(parsed.repoId);
      }
    } else if (typeof item === 'object' && item.repoId) {
      distinctRepos.add(item.repoId);
    }
  }

  const repoIds = Array.from(distinctRepos);
  if (repoIds.length < 2) {
    return {
      valid: false,
      distinctRepoCount: repoIds.length,
      repoIds,
      reason: `Global scope requires evidence from ≥2 distinct repository IDs; found ${repoIds.length} distinct repository (${repoIds.join(', ') || 'none detected'})`,
    };
  }

  return {
    valid: true,
    distinctRepoCount: repoIds.length,
    repoIds,
  };
}

/**
 * Formats a changelog entry for appending to `docs/CHANGELOG-MEMORY.md`.
 *
 * @param {object} params
 * @param {string} params.action - e.g. 'PROMOTE', 'DEMOTE', 'QUARANTINE', 'VALIDATE'
 * @param {string} params.id - EKU ID
 * @param {string} params.title - Knowledge unit title
 * @param {string} params.fromScope - Original scope
 * @param {string} params.toScope - Target scope
 * @param {string} params.actor - Actor who authorized the action
 * @param {string} params.rationale - Justification
 * @returns {string} Markdown changelog block
 */
export function formatChangelogEntry({
  action,
  id,
  title,
  fromScope,
  toScope,
  actor,
  rationale,
}) {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toISOString();

  return `
### [${action}] ${title || id} (${dateStr})

- **Timestamp:** \`${timeStr}\`
- **Knowledge Unit ID:** \`${id}\`
- **Scope Transition:** \`${fromScope}\` → \`${toScope}\`
- **Authorized By:** \`${actor}\`
- **Rationale:** ${rationale}
`;
}
