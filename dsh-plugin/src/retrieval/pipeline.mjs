/**
 * Engineering Memory Agent (EMA) — Authoritative 6-Stage Retrieval Engine
 * Phase 5: Authoritative 6-Stage Retrieval Engine
 *
 * Implements the approved 6-stage retrieval sequence:
 *   Stage 1: Authorization Gate (Fail-Closed)
 *   Stage 2: Candidate Retrieval (Authorized Scopes Only via FTS5/Lexical)
 *   Stage 3: Lifecycle & Maintenance Filtering
 *   Stage 4: Multi-Dimensional Authority Ranking
 *   Stage 5: Conflict & Contradiction Detection
 *   Stage 6: Context Construction & Provenance Annotation
 *
 * Interfaces Introduced:
 *   emaRecall(query, options)
 *   buildContext(options)
 */

import { searchLexical } from '../index/lexical-index.mjs';
import { evaluateAccess, getAuthorizedScopes } from '../policy/authorization.mjs';
import { isHardIsolated } from '../policy/isolation.mjs';
import { rankCandidates } from './ranking.mjs';
import { annotateContradictions, detectContradictions } from './contradiction.mjs';
import { buildContext } from './context-builder.mjs';

// Excluded lifecycle states in Stage 3
const EXCLUDED_STATUSES = new Set(['Draft', 'Superseded', 'Historical', 'Abandoned']);
const EXCLUDED_VALIDATION_STATES = new Set(['Invalid', 'Quarantined']);

/**
 * Executes the authoritative 6-stage retrieval sequence.
 *
 * @param {string} query - The search query text
 * @param {object} options
 * @param {import('better-sqlite3').Database} options.db - SQLite database instance
 * @param {string} [options.actor='agent'] - Caller actor ('human' | 'agent' | 'system' | 'project_admin')
 * @param {object} [options.context={}] - Execution context ({ currentScopeId, workspaceId, taskId, isIsolated })
 * @param {string} [options.scope] - Optional scope restriction
 * @param {number} [options.limit=10] - Maximum results to return
 * @param {number} [options.tokenBudget=500] - Token budget for context assembly
 * @param {string} [options.tier='L2'] - Progressive loading tier ('L0' | 'L1' | 'L2')
 * @param {boolean} [options.includeWarnings=true] - Whether to include warnings on deprecated/stale items
 * @param {object} [options.weights] - Optional dimension ranking weights
 * @returns {{
 *   results: Array<object>,
 *   explainability: object,
 *   contradictions: Array<object>,
 *   contextMarkdown: string,
 *   tokenCount: number
 * }}
 */
export function emaRecall(query, options = {}) {
  const {
    db,
    actor = 'agent',
    context = {},
    scope: requestedScope,
    limit = 10,
    tokenBudget = 500,
    tier = 'L2',
    weights,
  } = options;

  // ── Stage 1: Authorization Gate (Fail-Closed) ──────────────────────────────
  const actorAccess = evaluateAccess(actor, 'read', requestedScope || 'project', isHardIsolated(context));
  if (!actorAccess.allowed) {
    return {
      results: [],
      explainability: {
        stage: 1,
        status: 'UNAUTHORIZED',
        reason: actorAccess.reason,
        code: actorAccess.code,
      },
      contradictions: [],
      contextMarkdown: '',
      tokenCount: 0,
    };
  }

  const authorizedScopes = getAuthorizedScopes(actor, context);
  if (!authorizedScopes || authorizedScopes.length === 0) {
    return {
      results: [],
      explainability: {
        stage: 1,
        status: 'NO_AUTHORIZED_SCOPES',
        reason: 'Caller has no authorized scopes in current context',
      },
      contradictions: [],
      contextMarkdown: '',
      tokenCount: 0,
    };
  }

  // If a specific scope is requested, verify it is in authorized scopes
  let targetScopes = authorizedScopes;
  if (requestedScope) {
    const matched = authorizedScopes.find(
      (s) => s.scope.toLowerCase() === requestedScope.toLowerCase()
    );
    if (!matched) {
      return {
        results: [],
        explainability: {
          stage: 1,
          status: 'SCOPE_FORBIDDEN',
          reason: `Requested scope '${requestedScope}' is not in caller's authorized scopes`,
        },
        contradictions: [],
        contextMarkdown: '',
        tokenCount: 0,
      };
    }
    targetScopes = [matched];
  }

  // ── Stage 2: Candidate Retrieval (Authorized Scopes Only) ───────────────────
  if (!db) {
    return {
      results: [],
      explainability: { stage: 2, status: 'NO_DATABASE', reason: 'Database instance not provided' },
      contradictions: [],
      contextMarkdown: '',
      tokenCount: 0,
    };
  }

  const rawCandidates = [];
  const seenIds = new Set();

  // Multi-term candidate expansion (retrieves both exact phrase and term matches)
  const trimmed = query.trim();
  const queryTerms = trimmed.split(/\s+/).filter((t) => t.length > 2);
  const searchPhrases = [trimmed, ...queryTerms];

  for (const authScope of targetScopes) {
    for (const phrase of searchPhrases) {
      const matches = searchLexical(db, phrase, authScope.scope, { limit: limit * 2 });
      for (const m of matches) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          rawCandidates.push(m);
        }
      }
    }
  }

  // ── Stage 3: Lifecycle & Maintenance Filtering ─────────────────────────────
  // Strictly Exclude:
  //   - authority_level === 'Candidate' (NEVER return as authoritative)
  //   - status in [Draft, Superseded, Historical, Abandoned]
  //   - validation_state in [Invalid, Quarantined]
  const filteredCandidates = [];
  const excludedLog = [];

  for (const cand of rawCandidates) {
    // 1. Candidate authority exclusion
    if ((cand.authority_level || '').toLowerCase() === 'candidate') {
      excludedLog.push({ id: cand.id, reason: 'AuthorityLevel: Candidate excluded from active retrieval' });
      continue;
    }

    // 2. Status exclusion
    if (EXCLUDED_STATUSES.has(cand.status)) {
      excludedLog.push({ id: cand.id, reason: `Status: ${cand.status} excluded` });
      continue;
    }

    // 3. Validation state exclusion
    if (EXCLUDED_VALIDATION_STATES.has(cand.validation_state)) {
      excludedLog.push({ id: cand.id, reason: `ValidationState: ${cand.validation_state} excluded` });
      continue;
    }

    // Warning annotations for non-clean states
    const warnings = [];
    if (cand.status === 'Deprecated' || cand.status === 'Experimental') {
      warnings.push(`StatusWarning: Knowledge unit is ${cand.status}`);
    }
    if (cand.validation_state === 'Potentially Stale') {
      warnings.push('StalenessWarning: Knowledge unit is potentially stale');
    }
    if (cand.validation_state === 'Needs Review' || cand.validation_state === 'Unreviewed') {
      warnings.push(`ReviewWarning: Knowledge unit is ${cand.validation_state}`);
    }

    filteredCandidates.push({
      ...cand,
      warnings,
    });
  }

  // ── Stage 4: Multi-Dimensional Authority Ranking ───────────────────────────
  const rankedCandidates = rankCandidates(filteredCandidates, weights);

  // Truncate to requested limit before contradiction analysis
  const topCandidates = rankedCandidates.slice(0, limit);

  // ── Stage 5: Conflict & Contradiction Detection ────────────────────────────
  const contradictionSummary = detectContradictions(topCandidates);
  const annotatedCandidates = annotateContradictions(topCandidates);

  // ── Stage 6: Context Construction & Provenance Annotation ──────────────────
  const contextOutput = buildContext({
    results: annotatedCandidates,
    tokenBudget,
    tier,
  });

  return {
    results: annotatedCandidates,
    explainability: {
      stage: 6,
      status: 'COMPLETE',
      totalRetrieved: rawCandidates.length,
      filteredCount: filteredCandidates.length,
      excluded: excludedLog,
      authorizedScopes: targetScopes.map((s) => s.scope),
      contradictionsDetected: contradictionSummary.hasContradictions,
      explainabilityLog: contextOutput.explainability,
    },
    contradictions: contradictionSummary.pairs,
    contextMarkdown: contextOutput.contextMarkdown,
    tokenCount: contextOutput.tokenCount,
  };
}

export { buildContext };
