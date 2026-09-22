/**
 * Engineering Memory Agent (EMA) — Core Constants & Domain Enums
 * Phase 1: Core EKU Domain Model & Schema v2
 *
 * Defines the authoritative 4-dimensional lifecycle model, knowledge scopes,
 * relationship types, and validation rules.
 */

// ── 1. Four Orthogonal Lifecycle Dimensions ──────────────────────────────────

/**
 * Lifecycle State: Active currency and evolution stage of the knowledge.
 * Mutually exclusive single value.
 */
export const LIFECYCLE_STATES = Object.freeze({
  DRAFT: 'draft',
  CURRENT: 'current',
  DEPRECATED: 'deprecated',
  SUPERSEDED: 'superseded',
  HISTORICAL: 'historical',
  ABANDONED: 'abandoned',
});

export const VALID_LIFECYCLE_STATES = Object.freeze(Object.values(LIFECYCLE_STATES));

/**
 * Validation State: Empirical verification health against repository reality.
 * Mutually exclusive single value.
 */
export const VALIDATION_STATES = Object.freeze({
  UNREVIEWED: 'unreviewed',
  NEEDS_REVIEW: 'needs_review',
  POTENTIALLY_STALE: 'potentially_stale',
  VERIFIED: 'verified',
  INVALID: 'invalid',
  QUARANTINED: 'quarantined',
});

export const VALID_VALIDATION_STATES = Object.freeze(Object.values(VALIDATION_STATES));

/**
 * Authority Level: Origin, trust, and promotion gate stage.
 * Mutually exclusive single value.
 */
export const AUTHORITY_LEVELS = Object.freeze({
  CANDIDATE: 'candidate',
  DERIVED: 'derived',
  CANONICAL: 'canonical',
});

export const VALID_AUTHORITY_LEVELS = Object.freeze(Object.values(AUTHORITY_LEVELS));

/**
 * Confidence Level: Degree of certainty based on evidence source diversity and strength.
 * Mutually exclusive single value.
 */
export const CONFIDENCE_LEVELS = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});

export const VALID_CONFIDENCE_LEVELS = Object.freeze(Object.values(CONFIDENCE_LEVELS));

// ── 2. Knowledge Scope & Isolation ──────────────────────────────────────────

/**
 * Knowledge Scope: Cross-repository boundary and visibility scope.
 * Execution scope (session, task) is strictly separate and out of scope for Phase 1.
 */
export const KNOWLEDGE_SCOPES = Object.freeze({
  PROJECT: 'project',
  WORKSPACE: 'workspace',
  GLOBAL: 'global',
});

export const VALID_KNOWLEDGE_SCOPES = Object.freeze(Object.values(KNOWLEDGE_SCOPES));

/**
 * Legacy scope values that are explicitly rejected as active Knowledge Scopes.
 * (They represent intra-project architectural granularity, which belongs in tags or paths).
 */
export const REJECTED_LEGACY_SCOPES = Object.freeze([
  'domain',
  'component',
  'subsystem',
]);

/**
 * Hard isolation mode.
 */
export const ISOLATION_MODES = Object.freeze({
  SOFT: 'soft',
  HARD: 'hard',
});

export const VALID_ISOLATION_MODES = Object.freeze(Object.values(ISOLATION_MODES));

// ── 3. Knowledge Document Types ──────────────────────────────────────────────

export const KNOWLEDGE_TYPES = Object.freeze({
  FACT: 'fact',
  ARCHITECTURE: 'architecture',
  DECISION: 'decision',
  SOLUTION: 'solution',
  LESSON: 'lesson',
  CONSTRAINT: 'constraint',
  WORKFLOW: 'workflow',
  REFERENCE: 'reference',
  HISTORY: 'history',
  OBSOLETE: 'obsolete',
});

export const VALID_KNOWLEDGE_TYPES = Object.freeze(Object.values(KNOWLEDGE_TYPES));

// ── 4. Relationship Types (12 Approved Types) ────────────────────────────────

/**
 * Typed relationship links (directional: current EKU is source, target is referenced unit).
 * Combines the 8 PMA canonical types + 4 approved EMA additions.
 */
export const RELATIONSHIP_TYPES = Object.freeze({
  // 8 Canonical PMA Types
  SUPERSEDES: 'supersedes',
  EVOLVED_FROM: 'evolved_from',
  RESOLVES: 'resolves',
  CAUSED_BY: 'caused_by',
  AFFECTS: 'affects',
  BELONGS_TO: 'belongs_to',
  CONTRADICTS: 'contradicts',
  DERIVED_FROM: 'derived_from',
  // 4 Approved EMA Additions
  PROMOTED_FROM: 'promoted_from',
  UPDATES: 'updates',
  EXTENDS: 'extends',
  DERIVES: 'derives',
});

export const VALID_RELATIONSHIP_TYPES = Object.freeze(Object.values(RELATIONSHIP_TYPES));

// ── 5. Legacy Lifecycle Compatibility Mappings ───────────────────────────────

/**
 * Legacy lifecycle values recognized for migration input and backward compatibility.
 * When parsed, these map to safe combinations in the 4-D model.
 * NOTE: Legacy conversion NEVER manufactures 'verified' certainty!
 */
export const LEGACY_LIFECYCLE_MAPPINGS = Object.freeze({
  in_progress: Object.freeze({
    status: LIFECYCLE_STATES.DRAFT,
    validation_state: VALIDATION_STATES.NEEDS_REVIEW,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
  }),
  partial: Object.freeze({
    status: LIFECYCLE_STATES.CURRENT,
    validation_state: VALIDATION_STATES.NEEDS_REVIEW,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
  }),
  experimental: Object.freeze({
    status: LIFECYCLE_STATES.DRAFT,
    validation_state: VALIDATION_STATES.UNREVIEWED,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
  }),
  unknown: Object.freeze({
    status: LIFECYCLE_STATES.DRAFT,
    validation_state: VALIDATION_STATES.UNREVIEWED,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
  }),
});

export const LEGACY_LIFECYCLE_TERMS = Object.freeze(Object.keys(LEGACY_LIFECYCLE_MAPPINGS));
