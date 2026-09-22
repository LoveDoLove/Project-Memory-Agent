/**
 * Engineering Memory Agent (EMA) — Context Construction & Provenance Annotation
 * Phase 5: Authoritative 6-Stage Retrieval Engine
 *
 * Formats retrieved knowledge units into compact, progressively loadable context
 * with explicit provenance annotations, token budget enforcement, and contradiction banners.
 */

/**
 * Approximate token count for text (standard heuristic: 4 chars ~ 1 token).
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Builds provenance header for an EKU record.
 * Example: `[Scope: project | Status: Current | Validated: Verified | Confidence: High | Anchor: ema://...]`
 *
 * @param {object} eku
 * @returns {string}
 */
export function buildProvenanceHeader(eku) {
  const scope = eku.scope || 'project';
  const status = eku.status || 'Current';
  const validation = eku.validation_state || 'Unreviewed';
  const confidence = eku.confidence || 'Medium';

  let anchorStr = 'none';
  if (eku.evidence) {
    try {
      const arr = typeof eku.evidence === 'string' ? JSON.parse(eku.evidence) : eku.evidence;
      if (Array.isArray(arr) && arr.length > 0) {
        anchorStr = typeof arr[0] === 'string' ? arr[0] : (arr[0].anchor || arr[0].uri || 'present');
      }
    } catch {
      anchorStr = 'present';
    }
  }

  return `[Scope: ${scope} | Status: ${status} | Validated: ${validation} | Confidence: ${confidence} | Anchor: ${anchorStr}]`;
}

/**
 * Constructs prompt context markdown from ranked, filtered, and contradiction-annotated EKU records.
 *
 * @param {object} options
 * @param {Array<object>} options.results - Retrieved and ranked EKU records
 * @param {number} [options.tokenBudget=500] - Token budget limit
 * @param {string} [options.tier='L2'] - Progressive loading tier: 'L0' (one-line summaries), 'L1' (domain overview), 'L2' (full units)
 * @returns {{
 *   contextMarkdown: string,
 *   tokenCount: number,
 *   scopeBreakdown: object,
 *   explainability: object
 * }}
 */
export function buildContext({ results = [], tokenBudget = 500, tier = 'L2' }) {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      contextMarkdown: '',
      tokenCount: 0,
      scopeBreakdown: {},
      explainability: { retrievedCount: 0, includedCount: 0, reasons: [] },
    };
  }

  const sections = [];
  const scopeBreakdown = {};
  const reasons = [];
  let currentTokens = 0;

  for (const eku of results) {
    const scope = eku.scope || 'project';
    scopeBreakdown[scope] = (scopeBreakdown[scope] || 0) + 1;

    let ekuBlock = '';

    // If contradiction detected, prepend banner prominently
    if (eku.contradiction && eku.contradiction.banners && eku.contradiction.banners.length > 0) {
      for (const banner of eku.contradiction.banners) {
        ekuBlock += `> ⚠️ **CONTRADICTION ALERT**: ${banner}\n\n`;
      }
    }

    // Header with provenance
    const provHeader = buildProvenanceHeader(eku);
    const title = eku.title || eku.id || 'Knowledge Unit';

    if (tier === 'L0') {
      // L0: Compact one-line summary
      const summary = (eku.body_text || eku.bodyText || '').slice(0, 120).replace(/\n/g, ' ');
      ekuBlock += `### ${title}\n${provHeader}\n${summary}...\n`;
    } else {
      // L1 / L2: Full knowledge section
      const body = (eku.body_text || eku.bodyText || '').trim();
      ekuBlock += `### ${title}\n${provHeader}\n\n${body}\n`;
    }

    const blockTokens = estimateTokens(ekuBlock);

    // Enforce token budget: if adding this block exceeds budget, truncate or stop
    if (currentTokens + blockTokens > tokenBudget && sections.length > 0) {
      // If budget exceeded, include truncated or stop
      reasons.push({
        id: eku.id,
        action: 'budget_truncated',
        scores: eku.scores,
      });
      break;
    }

    sections.push(ekuBlock);
    currentTokens += blockTokens;
    reasons.push({
      id: eku.id,
      action: 'included',
      scores: eku.scores,
      scope: eku.scope,
      status: eku.status,
    });
  }

  const contextMarkdown = sections.join('\n---\n\n');
  const tokenCount = estimateTokens(contextMarkdown);

  return {
    contextMarkdown,
    tokenCount,
    scopeBreakdown,
    explainability: {
      retrievedCount: results.length,
      includedCount: sections.length,
      reasons,
    },
  };
}
