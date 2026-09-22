/**
 * Engineering Memory Agent (EMA) — Multi-Dimensional Authority Ranking
 * Phase 5: Authoritative 6-Stage Retrieval Engine
 *
 * Implements transparent, multi-dimensional ranking across 6 orthogonal dimensions:
 *   1. relevance_score:    Lexical/Vector similarity match [0.0 - 1.0]
 *   2. evidence_strength:  Primary source / tests vs indirect [0.0 - 1.0]
 *   3. validation_tier:    Verified (1.0) > Needs Review (0.5) > Potentially Stale (0.4) > Unreviewed (0.2)
 *   4. scope_proximity:    Project (1.0) > Workspace (0.8) > Global (0.6)
 *   5. freshness_tier:     Recency decay based on last_verified / indexed_at [0.0 - 1.0]
 *   6. confidence_score:   High (1.0) > Medium (0.6) > Low (0.3)
 *
 * CRITICAL INVARIANT:
 *   Never returns a single opaque score! Every result includes its full
 *   multi-dimensional breakdown for auditability and explainability.
 */

/**
 * Calculates evidence strength score [0.0 - 1.0].
 * High for primary code/test anchors; lower for legacy/unanchored items.
 * @param {Array|string} evidence
 * @returns {number}
 */
export function calculateEvidenceStrength(evidence) {
  if (!evidence) return 0.1;
  let arr = evidence;
  if (typeof evidence === 'string') {
    try {
      arr = JSON.parse(evidence);
    } catch {
      return evidence.trim() ? 0.3 : 0.1;
    }
  }
  if (!Array.isArray(arr) || arr.length === 0) return 0.1;

  let hasCanonicalUri = false;
  let hasCodeAnchor = false;

  for (const item of arr) {
    const anchorStr = typeof item === 'string' ? item : (item.anchor || item.uri || '');
    if (anchorStr.startsWith('ema://evidence/')) {
      hasCanonicalUri = true;
      if (anchorStr.includes('#sym:') || anchorStr.includes('#test:') || anchorStr.includes('#ast:')) {
        hasCodeAnchor = true;
      }
    }
  }

  if (hasCanonicalUri && hasCodeAnchor) return 1.0;
  if (hasCanonicalUri) return 0.8;
  return 0.5;
}

/**
 * Calculates validation tier score [0.0 - 1.0].
 * @param {string} validationState
 * @returns {number}
 */
export function calculateValidationTier(validationState) {
  const s = (validationState || '').toLowerCase();
  switch (s) {
    case 'verified':
      return 1.0;
    case 'needs review':
      return 0.5;
    case 'potentially stale':
      return 0.4;
    case 'unreviewed':
    default:
      return 0.2;
  }
}

/**
 * Calculates scope proximity score [0.0 - 1.0].
 * Project-local is highest proximity, followed by Workspace, then Global.
 * @param {string} scope
 * @returns {number}
 */
export function calculateScopeProximity(scope) {
  const s = (scope || '').toLowerCase();
  switch (s) {
    case 'task':
    case 'project':
      return 1.0;
    case 'workspace':
      return 0.8;
    case 'global':
      return 0.6;
    default:
      return 0.5;
  }
}

/**
 * Calculates confidence score [0.0 - 1.0].
 * @param {string} confidence
 * @returns {number}
 */
export function calculateConfidenceScore(confidence) {
  const c = (confidence || '').toLowerCase();
  switch (c) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.3;
    default:
      return 0.5;
  }
}

/**
 * Calculates freshness decay [0.0 - 1.0] based on date strings.
 * @param {string} dateStr
 * @returns {number}
 */
export function calculateFreshnessTier(dateStr) {
  if (!dateStr) return 0.5;
  try {
    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return 0.5;
    const now = Date.now();
    const daysOld = Math.max(0, (now - timestamp) / (1000 * 60 * 60 * 24));

    if (daysOld <= 30) return 1.0;
    if (daysOld <= 90) return 0.8;
    if (daysOld <= 180) return 0.6;
    if (daysOld <= 365) return 0.4;
    return 0.2;
  } catch {
    return 0.5;
  }
}

/**
 * Ranks a list of candidate EKU records using multi-dimensional scoring.
 *
 * @param {Array<object>} candidates - List of candidate records
 * @param {object} [weights] - Optional dimension weights (summing to ~1.0)
 * @returns {Array<object>} Candidates augmented with dimensional score breakdowns, sorted by composite score
 */
export function rankCandidates(candidates, weights = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const w = {
    relevance: weights.relevance ?? 0.30,
    evidence: weights.evidence ?? 0.20,
    validation: weights.validation ?? 0.20,
    proximity: weights.proximity ?? 0.15,
    freshness: weights.freshness ?? 0.05,
    confidence: weights.confidence ?? 0.10,
  };

  const scored = candidates.map((rec, idx) => {
    // Relevance score: if rank or bm25 provided, normalize it; otherwise inverse position rank
    let relevance = 0.5;
    if (typeof rec.relevance_score === 'number') {
      relevance = Math.min(1.0, Math.max(0.0, rec.relevance_score));
    } else if (typeof rec.rank === 'number') {
      // FTS5 rank: lower is better (e.g. -10 to -0.1). Normalize to [0, 1].
      relevance = Math.min(1.0, Math.max(0.1, 1.0 / (1.0 + Math.abs(rec.rank))));
    } else {
      relevance = Math.max(0.1, 1.0 - (idx * 0.05));
    }

    const evidenceStrength = calculateEvidenceStrength(rec.evidence);
    const validationTier = calculateValidationTier(rec.validation_state);
    const scopeProximity = calculateScopeProximity(rec.scope);
    const freshnessTier = calculateFreshnessTier(rec.last_verified || rec.indexed_at || rec.created);
    const confidenceScore = calculateConfidenceScore(rec.confidence);

    const compositeScore = Number(
      (
        relevance * w.relevance +
        evidenceStrength * w.evidence +
        validationTier * w.validation +
        scopeProximity * w.proximity +
        freshnessTier * w.freshness +
        confidenceScore * w.confidence
      ).toFixed(4)
    );

    const scores = {
      composite: compositeScore,
      relevance: Number(relevance.toFixed(3)),
      evidence_strength: Number(evidenceStrength.toFixed(3)),
      validation_tier: Number(validationTier.toFixed(3)),
      scope_proximity: Number(scopeProximity.toFixed(3)),
      freshness_tier: Number(freshnessTier.toFixed(3)),
      confidence: Number(confidenceScore.toFixed(3)),
    };

    return {
      ...rec,
      scores,
    };
  });

  // Sort descending by composite score
  scored.sort((a, b) => b.scores.composite - a.scores.composite);

  return scored;
}
