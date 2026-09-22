/**
 * Engineering Memory Agent (EMA) — 6-Boundary Hard Isolation Subsystem
 * Phase 4: Policy & Authorization Engine (Fail-Closed)
 *
 * Implements genuine security isolation across six explicit boundaries:
 *   1. Storage Boundary:      Physically separate directories/repositories.
 *   2. Index Boundary:        Dedicated SQLite DB file / vector index.
 *   3. Query Boundary:        Zero-knowledge no-probe query prohibition.
 *   4. Authorization Boundary: Fail-closed barrier without existence disclosure.
 *   5. Promotion Boundary:    Strict prohibition on cross-boundary promotion.
 *   6. Export Boundary:       Admin-controlled with pattern scrubbing.
 *
 * CRITICAL INVARIANT:
 *   Hard isolation provides true separation. It is NOT post-retrieval metadata filtering.
 *   Unauthorized callers receive ScopeNotFound/ZeroResults to prevent existence probing.
 */

import path from 'node:path';
import { ISOLATION_BOUNDARIES, POLICY_CODE, ISOLATION } from './constants.mjs';

/**
 * Checks if a scope or config is hard-isolated.
 * @param {object|string} scopeOrConfig
 * @returns {boolean}
 */
export function isHardIsolated(scopeOrConfig) {
  if (!scopeOrConfig) return false;
  if (typeof scopeOrConfig === 'string') {
    return scopeOrConfig.toLowerCase() === ISOLATION.HARD;
  }
  if (typeof scopeOrConfig === 'object') {
    const val = scopeOrConfig.isolation || scopeOrConfig.ema_isolation || scopeOrConfig.isIsolated;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === ISOLATION.HARD;
  }
  return false;
}

/**
 * 1. STORAGE BOUNDARY
 * Verifies that storage paths do not cross hard-isolation boundaries.
 * Prevents isolated projects from sharing storage directories or writing into shared workspace.
 *
 * @param {string} isolatedRoot - The hard-isolated project root
 * @param {string} targetPath - The target file or directory path
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function verifyStorageBoundary(isolatedRoot, targetPath) {
  if (!isolatedRoot || !targetPath) {
    return { allowed: false, reason: 'Missing storage boundary paths' };
  }
  const resolvedRoot = path.resolve(isolatedRoot);
  const resolvedTarget = path.resolve(targetPath);

  // Target must reside strictly within the isolated root directory
  const relative = path.relative(resolvedRoot, resolvedTarget);
  const isInside = !relative.startsWith('..') && !path.isAbsolute(relative);

  if (!isInside) {
    return {
      allowed: false,
      reason: `Storage boundary violation: target '${resolvedTarget}' escapes isolated root '${resolvedRoot}'`,
    };
  }
  return { allowed: true };
}

/**
 * 2. INDEX BOUNDARY
 * Returns dedicated index database path for an isolated project.
 * Ensures hard-isolated projects never write to or read from shared index files.
 *
 * @param {string} projectRoot - The project root directory
 * @param {boolean} [isIsolated=true]
 * @returns {string} Path to dedicated index file
 */
export function getIsolatedIndexPath(projectRoot, isIsolated = true) {
  const baseDir = path.resolve(projectRoot);
  const subDir = isIsolated ? '.ema/isolated' : '.ema';
  return path.join(baseDir, subDir, 'index.db');
}

/**
 * 3. QUERY BOUNDARY
 * Enforces zero-knowledge / no-probe query isolation.
 * If caller is in a hard-isolated context, queries are restricted strictly to that context.
 * External queries attempting to touch hard-isolated scopes are pruned with zero disclosure.
 *
 * @param {Array<{ scope: string, scopeId?: string, isIsolated?: boolean, isolation?: string }>} candidateScopes
 * @param {object} callerContext - { currentScope, currentScopeId, isIsolated }
 * @returns {Array<{ scope: string, scopeId?: string }>} Filtered authorized query scopes
 */
export function applyQueryBoundary(candidateScopes, callerContext = {}) {
  if (!Array.isArray(candidateScopes)) return [];

  const callerIsIsolated = isHardIsolated(callerContext);
  const callerScopeId = callerContext.currentScopeId || callerContext.scopeId;

  return candidateScopes.filter((candidate) => {
    const candidateIsIsolated = isHardIsolated(candidate);
    const candidateScopeId = candidate.scopeId || candidate.scope_id;

    // Case 1: Caller is hard-isolated
    // Can ONLY query its own exact scope; cannot query parent workspace, global, or other repos
    if (callerIsIsolated) {
      if (candidate.scope === 'project' && candidateScopeId === callerScopeId) {
        return true;
      }
      if (candidate.scope === 'task' && candidate.taskId === callerContext.taskId) {
        return true;
      }
      // Zero leakage: all external scopes pruned
      return false;
    }

    // Case 2: Caller is NOT hard-isolated, but candidate IS hard-isolated
    // An un-isolated caller can NEVER query a hard-isolated project
    if (candidateIsIsolated) {
      return false;
    }

    // Normal un-isolated query
    return true;
  });
}

/**
 * 4. AUTHORIZATION BOUNDARY
 * Evaluates whether cross-scope access is permitted under isolation rules.
 * Fails closed without disclosing the existence of an isolated scope.
 *
 * @param {object} source - { scope, scopeId, isIsolated }
 * @param {object} target - { scope, scopeId, isIsolated }
 * @returns {{ allowed: boolean, code: number, reason: string }}
 */
export function evaluateIsolationBarrier(source, target) {
  const sourceIsolated = isHardIsolated(source);
  const targetIsolated = isHardIsolated(target);

  // If neither is hard-isolated, no hard isolation barrier is tripped
  if (!sourceIsolated && !targetIsolated) {
    return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'No hard isolation barrier' };
  }

  // Same scope and same scope ID: allowed
  const sameScope = source.scope === target.scope && source.scopeId === target.scopeId;
  if (sameScope && sourceIsolated && targetIsolated) {
    return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'Intra-isolated scope access' };
  }

  // Cross-boundary attempt: fail closed.
  // Security invariant: To prevent existence probing, return SCOPE_NOT_FOUND rather than
  // revealing that an isolated scope exists at the target.
  return {
    allowed: false,
    code: POLICY_CODE.SCOPE_NOT_FOUND,
    reason: 'ScopeNotFound: cross-boundary access blocked by hard isolation',
  };
}

/**
 * 5. PROMOTION BOUNDARY
 * Validates promotion permissions under hard isolation.
 * Strict rule:
 *   - Promotion OUT of an isolated scope is FORBIDDEN.
 *   - Promotion IN to an isolated scope is FORBIDDEN.
 *
 * @param {object} sourceScope - { scope, isIsolated }
 * @param {object} targetScope - { scope, isIsolated }
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canPromoteAcrossIsolation(sourceScope, targetScope) {
  const srcIsolated = isHardIsolated(sourceScope);
  const tgtIsolated = isHardIsolated(targetScope);

  if (srcIsolated) {
    return {
      allowed: false,
      reason: 'Promotion OUT of hard-isolated scope is strictly forbidden (zero leakage)',
    };
  }

  if (tgtIsolated) {
    return {
      allowed: false,
      reason: 'Promotion IN to hard-isolated scope is strictly forbidden',
    };
  }

  return { allowed: true };
}

/**
 * 6. EXPORT BOUNDARY
 * Pattern scrubber for export of engineering knowledge.
 * Detects and scrubs sensitive patterns (keys, tokens, credentials, absolute secret paths)
 * before any knowledge can be exported.
 *
 * @param {string} content
 * @returns {{ clean: boolean, scrubbed: string, redactionsCount: number, detectedPatterns: string[] }}
 */
export function scrubExportPatterns(content) {
  if (typeof content !== 'string') {
    return { clean: true, scrubbed: '', redactionsCount: 0, detectedPatterns: [] };
  }

  let scrubbed = content;
  let redactionsCount = 0;
  const detectedPatterns = [];

  // Patterns to scrub:
  // 1. Bearer tokens / JWTs
  const bearerRegex = /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/g;
  if (bearerRegex.test(scrubbed)) {
    detectedPatterns.push('bearer_jwt_token');
    scrubbed = scrubbed.replace(bearerRegex, 'Bearer [REDACTED_TOKEN]');
    redactionsCount++;
  }

  // 2. Generic secret assignments (e.g. api_key = "...", secret = '...')
  const secretKeyRegex = /(api[_-]?key|secret|password|passwd|token|auth[_-]?token)\s*[:=]\s*["']([^"']{8,})["']/gi;
  if (secretKeyRegex.test(scrubbed)) {
    detectedPatterns.push('secret_key_assignment');
    scrubbed = scrubbed.replace(secretKeyRegex, '$1: "[REDACTED_SECRET]"');
    redactionsCount++;
  }

  // 3. AWS / GitHub token prefixes (e.g. ghp_..., gho_..., AKIA...)
  const knownPrefixRegex = /\b(ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16})\b/g;
  if (knownPrefixRegex.test(scrubbed)) {
    detectedPatterns.push('prefixed_api_token');
    scrubbed = scrubbed.replace(knownPrefixRegex, '[REDACTED_KEY]');
    redactionsCount++;
  }

  // 4. PEM private keys
  const pemKeyRegex = /-----BEGIN [A-Z\s]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z\s]+ PRIVATE KEY-----/g;
  if (pemKeyRegex.test(scrubbed)) {
    detectedPatterns.push('pem_private_key');
    scrubbed = scrubbed.replace(pemKeyRegex, '[REDACTED_PRIVATE_KEY]');
    redactionsCount++;
  }

  return {
    clean: redactionsCount === 0,
    scrubbed,
    redactionsCount,
    detectedPatterns,
  };
}

/**
 * Validates an export operation for a hard-isolated project.
 * Requires human or project_admin actor and clean scrubbing.
 *
 * @param {string} actor - Actor performing export ('human' | 'project_admin')
 * @param {string} rawContent - Content to export
 * @param {boolean} [isIsolated=true]
 * @returns {{ allowed: boolean, scrubbedContent: string, reason?: string }}
 */
export function validateExport(actor, rawContent, isIsolated = true) {
  if (isIsolated) {
    if (actor !== 'human' && actor !== 'project_admin') {
      return {
        allowed: false,
        scrubbedContent: '',
        reason: 'Hard-isolated export requires human or project_admin actor with explicit approval',
      };
    }
  }

  const { scrubbed, redactionsCount, detectedPatterns } = scrubExportPatterns(rawContent);

  return {
    allowed: true,
    scrubbedContent: scrubbed,
    redactionsCount,
    detectedPatterns,
  };
}
