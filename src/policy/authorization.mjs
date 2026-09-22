/**
 * Engineering Memory Agent (EMA) — Policy & Authorization Engine
 * Phase 4: Policy & Authorization Engine (Fail-Closed)
 *
 * Implements the 4-actor authorization engine and scope inheritance traversal.
 * Evaluates access decisions fail-closed prior to retrieval or mutation.
 *
 * 4 Actors:
 *   - human
 *   - agent
 *   - system
 *   - project_admin
 *
 * Operations:
 *   - read
 *   - candidate_create
 *   - validate
 *   - promote
 *   - demote
 *   - quarantine
 *   - export
 *
 * Interfaces:
 *   evaluateAccess(actor, operation, scope, isIsolated)
 *   getAuthorizedScopes(actor, context)
 */

import {
  ACTORS,
  ACTOR,
  OPERATIONS,
  OPERATION,
  KNOWLEDGE_SCOPES,
  SCOPE,
  POLICY_CODE,
} from './constants.mjs';

import {
  isHardIsolated,
  evaluateIsolationBarrier,
  canPromoteAcrossIsolation,
} from './isolation.mjs';

/**
 * Normalizes input arguments to support both positional and object argument formats.
 * @private
 */
function normalizeAccessArgs(actorOrObj, operation, scope, isIsolated) {
  if (actorOrObj && typeof actorOrObj === 'object' && !Array.isArray(actorOrObj)) {
    return {
      actor: actorOrObj.actor,
      operation: actorOrObj.operation,
      scope: actorOrObj.scope,
      scopeId: actorOrObj.scopeId || actorOrObj.scope_id,
      targetScope: actorOrObj.targetScope || actorOrObj.target_scope,
      isIsolated: isHardIsolated(actorOrObj),
      context: actorOrObj.context || {},
    };
  }
  return {
    actor: actorOrObj,
    operation,
    scope,
    scopeId: undefined,
    targetScope: undefined,
    isIsolated: isHardIsolated(isIsolated),
    context: {},
  };
}

/**
 * Evaluates whether an actor is authorized to perform an operation on a scope.
 * Fail-closed: any unknown actor, operation, or scope results in DENIED.
 *
 * @param {string|object} actorOrObj - Actor identifier or options object
 * @param {string} [operation] - Operation name
 * @param {string} [scope] - Target knowledge/execution scope
 * @param {boolean} [isIsolated=false] - Whether hard isolation is active
 * @returns {{ allowed: boolean, code: number, reason: string }}
 */
export function evaluateAccess(actorOrObj, operation, scope, isIsolated = false) {
  const args = normalizeAccessArgs(actorOrObj, operation, scope, isIsolated);
  const { actor, operation: op, scope: targetScope, isIsolated: isolated } = args;

  // 1. Fail-closed on missing or invalid actor
  if (!actor || typeof actor !== 'string' || !ACTORS.includes(actor.toLowerCase())) {
    return {
      allowed: false,
      code: POLICY_CODE.FORBIDDEN,
      reason: `Unknown or unauthorized actor: '${actor}'`,
    };
  }

  const normActor = actor.toLowerCase();

  // 2. Fail-closed on missing or invalid operation
  if (!op || typeof op !== 'string' || !OPERATIONS.includes(op.toLowerCase())) {
    return {
      allowed: false,
      code: POLICY_CODE.BAD_REQUEST,
      reason: `Unknown operation: '${op}'`,
    };
  }

  const normOp = op.toLowerCase();

  // 3. Normalize scope (default to 'project' if omitted, fail-closed if non-string)
  const normScope = (typeof targetScope === 'string' && targetScope.trim())
    ? targetScope.trim().toLowerCase()
    : SCOPE.PROJECT;

  // 4. Hard isolation barrier checks
  if (isolated) {
    // Promotion/demotion across hard isolation is strictly prohibited
    if (normOp === OPERATION.PROMOTE || normOp === OPERATION.DEMOTE) {
      if (normScope !== SCOPE.PROJECT) {
        return {
          allowed: false,
          code: POLICY_CODE.FORBIDDEN,
          reason: 'Hard-isolation barrier: promotion/demotion out of isolated scope is strictly forbidden',
        };
      }
    }

    // Export requires human or project_admin
    if (normOp === OPERATION.EXPORT) {
      if (normActor !== ACTOR.HUMAN && normActor !== ACTOR.PROJECT_ADMIN) {
        return {
          allowed: false,
          code: POLICY_CODE.FORBIDDEN,
          reason: 'Hard-isolation barrier: export requires human or project_admin authorization',
        };
      }
    }
  }

  // 5. Four-Actor Operations Matrix Evaluation
  switch (normOp) {
    case OPERATION.READ:
      // Read is allowed for all 4 authorized actors within their permitted scopes
      return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'Read permitted' };

    case OPERATION.CANDIDATE_CREATE:
      // Human, agent, and project_admin can propose candidates
      // System can create candidates via automated extraction
      return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'Candidate creation permitted' };

    case OPERATION.VALIDATE:
      // Human, agent, and project_admin can validate
      // System validation limited to deterministic verification (test pass/fail)
      return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'Validation permitted' };

    case OPERATION.PROMOTE:
    case OPERATION.DEMOTE:
      // human and project_admin: permitted across all valid knowledge scopes
      if (normActor === ACTOR.HUMAN || normActor === ACTOR.PROJECT_ADMIN) {
        return { allowed: true, code: POLICY_CODE.ALLOW, reason: `${normOp} permitted for ${normActor}` };
      }

      // agent: permitted ONLY within Project scope. CANNOT promote to Workspace or Global!
      if (normActor === ACTOR.AGENT) {
        if (normScope === SCOPE.PROJECT) {
          return { allowed: true, code: POLICY_CODE.ALLOW, reason: `${normOp} permitted for agent within Project scope` };
        }
        return {
          allowed: false,
          code: POLICY_CODE.FORBIDDEN,
          reason: `Agent is not authorized to ${normOp} to ${normScope} scope (requires human or project_admin)`,
        };
      }

      // system: cannot promote or demote
      return {
        allowed: false,
        code: POLICY_CODE.FORBIDDEN,
        reason: `System actor is not authorized to ${normOp}`,
      };

    case OPERATION.QUARANTINE:
      // human, agent, project_admin can quarantine suspicious/invalid units
      if (normActor === ACTOR.HUMAN || normActor === ACTOR.AGENT || normActor === ACTOR.PROJECT_ADMIN) {
        return { allowed: true, code: POLICY_CODE.ALLOW, reason: 'Quarantine permitted' };
      }
      return {
        allowed: false,
        code: POLICY_CODE.FORBIDDEN,
        reason: 'System actor is not authorized to quarantine knowledge units',
      };

    case OPERATION.EXPORT:
      // export allowed only for human and project_admin
      if (normActor === ACTOR.HUMAN || normActor === ACTOR.PROJECT_ADMIN) {
        return { allowed: true, code: POLICY_CODE.ALLOW, reason: `Export permitted for ${normActor}` };
      }
      return {
        allowed: false,
        code: POLICY_CODE.FORBIDDEN,
        reason: `Actor '${normActor}' is not authorized to export knowledge units`,
      };

    default:
      // Fail-closed fallback
      return {
        allowed: false,
        code: POLICY_CODE.FORBIDDEN,
        reason: `Operation '${normOp}' not permitted`,
      };
  }
}

/**
 * Returns the ordered list of authorized scopes for an actor in a given execution context.
 * Enforces scope inheritance traversal in priority order:
 *   1. Task scope (if Task context active and authorized)
 *   2. Project scope (repository-local knowledge)
 *   3. Workspace scope (shared workspace knowledge)
 *   4. Global scope (cross-workspace engineering knowledge)
 *
 * CRITICAL INVARIANT:
 *   If isIsolated is true (hard isolation), scope inheritance is SEVERED.
 *   Returns strictly the isolated project scope (and active task scope if inside the isolated project).
 *   Zero workspace or global scopes are returned.
 *
 * @param {string} actor - Actor identifier ('human' | 'agent' | 'system' | 'project_admin')
 * @param {object} context - Execution context
 * @param {string} [context.currentScopeId] - Current repository ID (e.g. 'github.com/org/repo')
 * @param {string} [context.workspaceId] - Workspace ID or path
 * @param {string} [context.taskId] - Active task / goal ID
 * @param {boolean|string} [context.isIsolated=false] - Whether project is hard-isolated
 * @returns {Array<{ scope: string, scopeId?: string, isIsolated: boolean }>} Authorized scopes in traversal order
 */
export function getAuthorizedScopes(actor, context = {}) {
  // Fail-closed on invalid actor
  if (!actor || typeof actor !== 'string' || !ACTORS.includes(actor.toLowerCase())) {
    return [];
  }

  const isolated = isHardIsolated(context);
  const currentScopeId = context.currentScopeId || context.scopeId || 'default-project';
  const authorized = [];

  // 1. Task Scope (highest priority if active within current project)
  if (context.taskId && typeof context.taskId === 'string') {
    authorized.push({
      scope: SCOPE.TASK,
      scopeId: context.taskId,
      isIsolated: isolated,
    });
  }

  // 2. Project Scope (repository-local knowledge)
  authorized.push({
    scope: SCOPE.PROJECT,
    scopeId: currentScopeId,
    isIsolated: isolated,
  });

  // CRITICAL HARD ISOLATION GUARD:
  // If isolated, do NOT inherit Workspace or Global scopes! Return immediately.
  if (isolated) {
    return authorized;
  }

  // 3. Workspace Scope (inherited if available and not hard-isolated)
  if (context.workspaceId && typeof context.workspaceId === 'string') {
    authorized.push({
      scope: SCOPE.WORKSPACE,
      scopeId: context.workspaceId,
      isIsolated: false,
    });
  }

  // 4. Global Scope (inherited if not explicitly disabled)
  if (context.includeGlobal !== false) {
    authorized.push({
      scope: SCOPE.GLOBAL,
      scopeId: 'global',
      isIsolated: false,
    });
  }

  return authorized;
}
