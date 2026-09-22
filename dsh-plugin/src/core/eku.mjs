/**
 * Engineering Memory Agent (EMA) — EKU Domain Model & Factory
 * Phase 1: Core EKU Domain Model & Schema v2
 *
 * Defines the Engineering Knowledge Unit (EKU) domain entity,
 * parsing, serialization, and lifecycle-aware domain methods.
 */

import {
  LIFECYCLE_STATES,
  VALID_LIFECYCLE_STATES,
  VALIDATION_STATES,
  VALID_VALIDATION_STATES,
  AUTHORITY_LEVELS,
  VALID_AUTHORITY_LEVELS,
  CONFIDENCE_LEVELS,
  VALID_CONFIDENCE_LEVELS,
  KNOWLEDGE_SCOPES,
  VALID_KNOWLEDGE_SCOPES,
  ISOLATION_MODES,
  VALID_ISOLATION_MODES,
  KNOWLEDGE_TYPES,
  VALID_KNOWLEDGE_TYPES,
  LEGACY_LIFECYCLE_MAPPINGS,
} from './constants.mjs';

import {
  parseFrontmatter,
  serializeFrontmatter,
  validateEKU,
} from './schema.mjs';

/**
 * Engineering Knowledge Unit (EKU) Domain Entity
 */
export class EKU {
  constructor(fields = {}) {
    this.id = fields.id || null;
    this.title = fields.title || '';
    this.type = fields.type || KNOWLEDGE_TYPES.FACT;

    // Four Orthogonal Dimensions
    this.status = (fields.status || LIFECYCLE_STATES.CURRENT).toLowerCase();
    this.validation_state = (fields.validation_state || VALIDATION_STATES.UNREVIEWED).toLowerCase();
    this.authority_level = (fields.authority_level || AUTHORITY_LEVELS.CANONICAL).toLowerCase();
    this.confidence = (fields.confidence || CONFIDENCE_LEVELS.MEDIUM).toLowerCase();

    // Scope & Isolation
    this.scope = (fields.scope || KNOWLEDGE_SCOPES.PROJECT).toLowerCase();
    this.scope_id = fields.scope_id || null;
    this.isolation = (fields.isolation || ISOLATION_MODES.SOFT).toLowerCase();

    // Evidence & Relationships
    this.evidence = Array.isArray(fields.evidence) ? fields.evidence : [];
    this.related = Array.isArray(fields.related) ? fields.related : [];

    // Lineage & Lifecycle Pointers
    this.superseded_by = fields.superseded_by || null;
    this.promoted_from = fields.promoted_from || null;

    // Metadata
    this.tags = Array.isArray(fields.tags) ? fields.tags : [];
    this.created = fields.created || new Date().toISOString().slice(0, 10);
    this.last_verified = fields.last_verified || this.created;

    // Content Body (Markdown text excluding frontmatter)
    this.content = fields.content || '';

    // Preservation of track-specific or custom fields
    this.extra = fields.extra || {};
  }

  // ── Dimension Introspection Helpers ─────────────────────────────────────────

  isCanonical() {
    return this.authority_level === AUTHORITY_LEVELS.CANONICAL;
  }

  isCandidate() {
    return this.authority_level === AUTHORITY_LEVELS.CANDIDATE;
  }

  isDerived() {
    return this.authority_level === AUTHORITY_LEVELS.DERIVED;
  }

  isCurrent() {
    return this.status === LIFECYCLE_STATES.CURRENT;
  }

  isDraft() {
    return this.status === LIFECYCLE_STATES.DRAFT;
  }

  isDeprecated() {
    return this.status === LIFECYCLE_STATES.DEPRECATED;
  }

  isSuperseded() {
    return this.status === LIFECYCLE_STATES.SUPERSEDED;
  }

  isHistorical() {
    return this.status === LIFECYCLE_STATES.HISTORICAL;
  }

  isAbandoned() {
    return this.status === LIFECYCLE_STATES.ABANDONED;
  }

  isVerified() {
    return this.validation_state === VALIDATION_STATES.VERIFIED;
  }

  isPotentiallyStale() {
    return this.validation_state === VALIDATION_STATES.POTENTIALLY_STALE;
  }

  isQuarantined() {
    return this.validation_state === VALIDATION_STATES.QUARANTINED;
  }

  needsReview() {
    return (
      this.validation_state === VALIDATION_STATES.NEEDS_REVIEW ||
      this.validation_state === VALIDATION_STATES.UNREVIEWED ||
      this.validation_state === VALIDATION_STATES.POTENTIALLY_STALE
    );
  }

  /**
   * Converts the entity back to a frontmatter data dictionary.
   */
  toFrontmatter() {
    const fm = {
      title: this.title,
      type: this.type,
      status: this.status,
      validation_state: this.validation_state,
      authority_level: this.authority_level,
      confidence: this.confidence,
      scope: this.scope,
      created: this.created,
      last_verified: this.last_verified,
    };

    if (this.id) fm.id = this.id;
    if (this.scope_id) fm.scope_id = this.scope_id;
    if (this.isolation && this.isolation !== ISOLATION_MODES.SOFT) fm.isolation = this.isolation;
    if (this.evidence.length > 0) fm.evidence = this.evidence;
    if (this.related.length > 0) fm.related = this.related;
    if (this.superseded_by) fm.superseded_by = this.superseded_by;
    if (this.promoted_from) fm.promoted_from = this.promoted_from;
    if (this.tags.length > 0) fm.tags = this.tags;

    // Merge any extra track-specific attributes
    for (const [k, v] of Object.entries(this.extra)) {
      if (fm[k] === undefined && v !== undefined) {
        fm[k] = v;
      }
    }

    return fm;
  }

  /**
   * Serializes the EKU entity to canonical Markdown with YAML frontmatter.
   */
  toMarkdown() {
    return serializeFrontmatter(this.toFrontmatter(), this.content);
  }
}

/**
 * Creates an EKU instance with defaults.
 */
export function createEKU(fields = {}) {
  return new EKU(fields);
}

/**
 * Parses a UTF-8 Markdown string into a validated EKU domain entity.
 *
 * @param {string} markdownString - Raw Markdown file content.
 * @param {object} [options] - Parsing and validation options.
 * @param {string} [options.storageMode='canonical'] - 'canonical' or 'candidate_queue'.
 * @param {boolean} [options.skipGlobalSourceCheck=false] - For test overrides.
 * @returns {{ eku: EKU, valid: boolean, errors: string[], warnings: string[] }}
 */
export function parseEKU(markdownString, options = {}) {
  const { frontmatter, body } = parseFrontmatter(markdownString);
  const warnings = [];

  const rawStatus = typeof frontmatter.status === 'string' ? frontmatter.status.toLowerCase() : '';
  let status = rawStatus;
  let validation_state = typeof frontmatter.validation_state === 'string' ? frontmatter.validation_state.toLowerCase() : null;
  let authority_level = typeof frontmatter.authority_level === 'string' ? frontmatter.authority_level.toLowerCase() : null;

  // Check legacy lifecycle mapping
  if (LEGACY_LIFECYCLE_MAPPINGS[rawStatus]) {
    const legacy = LEGACY_LIFECYCLE_MAPPINGS[rawStatus];
    warnings.push(`Legacy lifecycle state '${rawStatus}' mapped to status: '${legacy.status}', validation_state: '${legacy.validation_state}', authority_level: '${legacy.authority_level}'.`);
    status = legacy.status;
    if (!validation_state) validation_state = legacy.validation_state;
    if (!authority_level) authority_level = legacy.authority_level;
  }

  // Safe defaults for legacy PMA documents missing 4-D dimensions
  // CRITICAL: Syntactic conversion NEVER manufactures 'verified'!
  if (!validation_state) {
    validation_state = VALIDATION_STATES.UNREVIEWED;
  }
  if (!authority_level) {
    authority_level = AUTHORITY_LEVELS.CANONICAL;
  }

  const scope = typeof frontmatter.scope === 'string' ? frontmatter.scope.toLowerCase() : KNOWLEDGE_SCOPES.PROJECT;
  const isolation = typeof frontmatter.isolation === 'string' ? frontmatter.isolation.toLowerCase() : ISOLATION_MODES.SOFT;
  const confidence = typeof frontmatter.confidence === 'string' ? frontmatter.confidence.toLowerCase() : CONFIDENCE_LEVELS.MEDIUM;

  // Extract known standard fields vs extra
  const standardFields = new Set([
    'id', 'title', 'type', 'status', 'validation_state', 'authority_level',
    'confidence', 'scope', 'scope_id', 'isolation', 'evidence', 'related',
    'superseded_by', 'promoted_from', 'tags', 'created', 'last_verified',
  ]);

  const extra = {};
  for (const [k, v] of Object.entries(frontmatter)) {
    if (!standardFields.has(k)) {
      extra[k] = v;
    }
  }

  const ekuData = {
    id: frontmatter.id || null,
    title: frontmatter.title || '',
    type: frontmatter.type || '',
    status,
    validation_state,
    authority_level,
    confidence,
    scope,
    scope_id: frontmatter.scope_id || null,
    isolation,
    evidence: frontmatter.evidence || [],
    related: frontmatter.related || [],
    superseded_by: frontmatter.superseded_by || null,
    promoted_from: frontmatter.promoted_from || null,
    tags: frontmatter.tags || [],
    created: frontmatter.created || '',
    last_verified: frontmatter.last_verified || '',
    content: body,
    extra,
  };

  const validationResult = validateEKU(ekuData, options);
  warnings.push(...validationResult.warnings);

  const eku = new EKU(ekuData);

  return {
    eku,
    valid: validationResult.valid,
    errors: validationResult.errors,
    warnings,
  };
}

/**
 * Serializes an EKU entity or object to canonical Markdown with YAML frontmatter.
 *
 * @param {EKU|object} eku - The EKU entity to serialize.
 * @returns {string} - Serialized Markdown string.
 */
export function serializeEKU(eku) {
  if (!eku) {
    throw new TypeError('Cannot serialize undefined or null EKU');
  }
  if (eku instanceof EKU) {
    return eku.toMarkdown();
  }
  return serializeFrontmatter(eku, eku.content || '');
}
