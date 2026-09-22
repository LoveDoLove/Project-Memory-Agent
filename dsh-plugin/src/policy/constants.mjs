/**
 * Engineering Memory Agent (EMA) — Policy & Authorization Constants
 * Phase 4: Policy & Authorization Engine (Fail-Closed)
 *
 * Defines canonical actors, operations, scopes, isolation modes, and decision codes.
 */

// ── Actors ───────────────────────────────────────────────────────────────────
export const ACTORS = Object.freeze(['human', 'agent', 'system', 'project_admin']);

export const ACTOR = Object.freeze({
  HUMAN: 'human',
  AGENT: 'agent',
  SYSTEM: 'system',
  PROJECT_ADMIN: 'project_admin',
});

// ── Operations ───────────────────────────────────────────────────────────────
export const OPERATIONS = Object.freeze([
  'read',
  'candidate_create',
  'validate',
  'promote',
  'demote',
  'quarantine',
  'export',
]);

export const OPERATION = Object.freeze({
  READ: 'read',
  CANDIDATE_CREATE: 'candidate_create',
  VALIDATE: 'validate',
  PROMOTE: 'promote',
  DEMOTE: 'demote',
  QUARANTINE: 'quarantine',
  EXPORT: 'export',
});

// ── Knowledge Scopes ─────────────────────────────────────────────────────────
export const KNOWLEDGE_SCOPES = Object.freeze(['project', 'workspace', 'global']);

export const EXECUTION_SCOPES = Object.freeze(['session', 'task']);

export const ALL_SCOPES = Object.freeze([...EXECUTION_SCOPES, ...KNOWLEDGE_SCOPES]);

export const SCOPE = Object.freeze({
  TASK: 'task',
  SESSION: 'session',
  PROJECT: 'project',
  WORKSPACE: 'workspace',
  GLOBAL: 'global',
});

// ── Isolation Modes ──────────────────────────────────────────────────────────
export const ISOLATION_MODES = Object.freeze(['hard', 'soft']);

export const ISOLATION = Object.freeze({
  HARD: 'hard',
  SOFT: 'soft',
});

// ── Decision Status Codes ───────────────────────────────────────────────────
export const POLICY_CODE = Object.freeze({
  ALLOW: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  SCOPE_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
});

// ── Six Hard Isolation Boundaries ───────────────────────────────────────────
export const ISOLATION_BOUNDARIES = Object.freeze([
  'storage',
  'index',
  'query',
  'authorization',
  'promotion',
  'export',
]);
