/**
 * Engineering Memory Agent (EMA) — Evidence Anchor Constants
 * Phase 2: Evidence Anchors & Grounding Subsystem
 *
 * Defines URI patterns, logical anchor types, grounding states,
 * staleness reasons, and path validation constraints.
 */

// ── 1. Approved Logical Anchor Types (Exactly 8 Types) ───────────────────────

export const LOGICAL_ANCHOR_TYPES = Object.freeze({
  SYM: 'sym',     // Function, class, interface, or variable name
  AST: 'ast',     // AST node selector / path
  SEC: 'sec',     // Structural Markdown heading
  TEST: 'test',   // Test suite or test case identifier
  CFG: 'cfg',     // Configuration path or JSONPath
  PR: 'pr',       // Pull request reference number
  ISSUE: 'issue', // Issue tracker reference number
  LINE: 'line',   // Fallback line or line-range number
});

export const VALID_LOGICAL_ANCHOR_TYPES = Object.freeze(Object.values(LOGICAL_ANCHOR_TYPES));

// ── 2. Grounding States (Verification Health of Evidence) ─────────────────────

export const GROUNDING_STATES = Object.freeze({
  FRESH: 'fresh',     // Resolvable, intact at commit and working tree
  STALE: 'stale',     // Code drift, content changed, line shifted, or renamed
  INVALID: 'invalid', // Commit missing, file missing, or syntax/target unresolved
});

export const VALID_GROUNDING_STATES = Object.freeze(Object.values(GROUNDING_STATES));

// ── 3. Staleness and Drift Reasons ──────────────────────────────────────────

export const STALENESS_REASONS = Object.freeze({
  CONTENT_CHANGED: 'content_changed',
  FILE_DELETED: 'file_deleted',
  FILE_RENAMED: 'file_renamed',
  ANCHOR_UNRESOLVED: 'anchor_unresolved',
  ANCHOR_SHIFTED: 'anchor_shifted',
  COMMIT_MISSING: 'commit_missing',
  FILE_MISSING_AT_COMMIT: 'file_missing_at_commit',
  ANCHOR_UNRESOLVED_AT_COMMIT: 'anchor_unresolved_at_commit',
  SYNTAX_INVALID: 'syntax_invalid',
});

export const VALID_STALENESS_REASONS = Object.freeze(Object.values(STALENESS_REASONS));

// ── 4. URI Scheme & Reference Constraints ───────────────────────────────────

export const EVIDENCE_URI_PREFIX = 'ema://evidence/';

/**
 * Regex matching immutable Git commit SHAs (7 to 40 hexadecimal characters).
 */
export const COMMIT_SHA_REGEX = /^[0-9a-fA-F]{7,40}$/;

/**
 * Mutable references that are strictly disallowed as canonical evidence.
 */
export const DISALLOWED_MUTABLE_REFS = Object.freeze([
  'head',
  'main',
  'master',
  'trunk',
  'develop',
  'dev',
  'latest',
]);
