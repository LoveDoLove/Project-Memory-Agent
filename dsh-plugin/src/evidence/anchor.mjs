/**
 * Engineering Memory Agent (EMA) — Evidence Anchor Parser & Serializer
 * Phase 2: Evidence Anchors & Grounding Subsystem
 *
 * Implements deterministic parsing, serialization, and validation for
 * canonical evidence anchors:
 * ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
 */

import {
  LOGICAL_ANCHOR_TYPES,
  VALID_LOGICAL_ANCHOR_TYPES,
  EVIDENCE_URI_PREFIX,
  COMMIT_SHA_REGEX,
  DISALLOWED_MUTABLE_REFS,
} from './constants.mjs';

// ── 1. Repository-Relative Path Validation ───────────────────────────────────

/**
 * Validates that a file path is strictly repository-relative and safe.
 * Rejects traversal, absolute paths, Windows drives, UNC shares, and encoded traversal.
 *
 * @param {string} filePath - Path to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRepositoryRelativePath(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return { valid: false, error: 'File path must be a non-empty string' };
  }

  const p = filePath.trim();

  // Check URL-encoded traversal attempts (%2e = ., %2f = /, %5c = \)
  const lower = p.toLowerCase();
  if (
    lower.includes('%2e%2e') ||
    lower.includes('..%2f') ||
    lower.includes('..%5c') ||
    lower.includes('%2f..') ||
    lower.includes('%5c..')
  ) {
    return { valid: false, error: `Encoded path traversal attempt rejected: '${filePath}'` };
  }

  // Absolute POSIX path
  if (p.startsWith('/') || p.startsWith('\\')) {
    return { valid: false, error: `Absolute paths are disallowed; must be repository-relative: '${filePath}'` };
  }

  // Windows drive letter (e.g. C:\ or D:/)
  if (/^[a-zA-Z]:[\\/]/.test(p) || /^[a-zA-Z]:$/.test(p)) {
    return { valid: false, error: `Windows drive paths are disallowed; must be repository-relative: '${filePath}'` };
  }

  // UNC network share path (e.g. \\server\share)
  if (p.startsWith('\\\\') || p.startsWith('//')) {
    return { valid: false, error: `UNC network paths are disallowed: '${filePath}'` };
  }

  // Path traversal segments (..)
  const segments = p.split(/[\\/]+/);
  for (const seg of segments) {
    if (seg === '..') {
      return { valid: false, error: `Path traversal '..' segment disallowed: '${filePath}'` };
    }
  }

  return { valid: true };
}

// ── 2. Logical Anchor Parser & Validator ─────────────────────────────────────

/**
 * Parses and validates a logical anchor string (e.g. 'sym:verifyToken', 'line:42:55').
 * Exactly 8 approved forms: sym, ast, sec, test, cfg, pr, issue, line.
 *
 * @param {string} rawAnchor - Raw anchor string without leading '#'
 * @returns {{ type: string, value: string, raw: string, start?: number, end?: number }}
 */
export function parseLogicalAnchor(rawAnchor) {
  if (typeof rawAnchor !== 'string' || !rawAnchor.trim()) {
    throw new Error('Logical anchor must be a non-empty string');
  }

  const trimmed = rawAnchor.trim().replace(/^#/, '');
  const colonIdx = trimmed.indexOf(':');

  if (colonIdx === -1) {
    throw new Error(`Malformed logical anchor: missing ':' separator in '${rawAnchor}'`);
  }

  const type = trimmed.slice(0, colonIdx).toLowerCase();
  const value = trimmed.slice(colonIdx + 1).trim();

  if (!VALID_LOGICAL_ANCHOR_TYPES.includes(type)) {
    throw new Error(
      `Invalid logical anchor type '${type}'. Must be one of: ${VALID_LOGICAL_ANCHOR_TYPES.join(', ')}`
    );
  }

  if (!value) {
    throw new Error(`Empty value for logical anchor '${type}:' in '${rawAnchor}'`);
  }

  const result = {
    type,
    value,
    raw: `${type}:${value}`,
  };

  // Specific validation per type
  switch (type) {
    case LOGICAL_ANCHOR_TYPES.PR:
    case LOGICAL_ANCHOR_TYPES.ISSUE: {
      if (!/^\d+$/.test(value)) {
        throw new Error(`Logical anchor '${type}:${value}' requires a positive integer number`);
      }
      result.number = parseInt(value, 10);
      break;
    }
    case LOGICAL_ANCHOR_TYPES.LINE: {
      const parts = value.split(':');
      if (parts.length === 1) {
        if (!/^\d+$/.test(parts[0])) {
          throw new Error(`Invalid line number '${parts[0]}' in '${rawAnchor}'`);
        }
        const start = parseInt(parts[0], 10);
        if (start < 1) {
          throw new Error(`Line numbers must be >= 1, got ${start}`);
        }
        result.start = start;
        result.end = start;
      } else if (parts.length === 2) {
        if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
          throw new Error(`Invalid line range '${value}' in '${rawAnchor}'`);
        }
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (start < 1) {
          throw new Error(`Line numbers must be >= 1, got start: ${start}`);
        }
        if (end < start) {
          throw new Error(`Line range start (${start}) must be <= end (${end}) in '${rawAnchor}'`);
        }
        result.start = start;
        result.end = end;
      } else {
        throw new Error(`Malformed line range '${value}' in '${rawAnchor}'`);
      }
      break;
    }
    case LOGICAL_ANCHOR_TYPES.SYM:
    case LOGICAL_ANCHOR_TYPES.AST:
    case LOGICAL_ANCHOR_TYPES.SEC:
    case LOGICAL_ANCHOR_TYPES.TEST:
    case LOGICAL_ANCHOR_TYPES.CFG: {
      // Must be non-empty string (already checked above)
      break;
    }
    default:
      throw new Error(`Unsupported anchor type '${type}'`);
  }

  return result;
}

// ── 3. EvidenceAnchor Domain Entity ──────────────────────────────────────────

export class EvidenceAnchor {
  constructor(fields = {}) {
    this.repoId = fields.repoId || '';
    this.gitRef = fields.gitRef || '';
    this.filePath = (fields.filePath || '').replace(/\\/g, '/');
    this.logicalAnchor = fields.logicalAnchor || null;
  }

  /**
   * Serializes the anchor into canonical URI format:
   * ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
   */
  toURI() {
    if (!this.repoId || !this.gitRef || !this.filePath || !this.logicalAnchor) {
      throw new Error('Cannot serialize incomplete EvidenceAnchor to URI');
    }
    const cleanRepoId = this.repoId.replace(/^\/+|\/+$/g, '');
    const cleanGitRef = this.gitRef.trim();
    const cleanPath = this.filePath.replace(/^\/+/, '');
    const rawAnchor = this.logicalAnchor.raw || `${this.logicalAnchor.type}:${this.logicalAnchor.value}`;

    return `${EVIDENCE_URI_PREFIX}${cleanRepoId}/${cleanGitRef}/${cleanPath}#${rawAnchor}`;
  }

  toString() {
    return this.toURI();
  }

  toJSON() {
    return {
      repoId: this.repoId,
      gitRef: this.gitRef,
      filePath: this.filePath,
      logicalAnchor: this.logicalAnchor,
      uri: this.toURI(),
    };
  }
}

// ── 4. Validation ────────────────────────────────────────────────────────────

/**
 * Validates an EvidenceAnchor instance or anchor data object.
 *
 * @param {EvidenceAnchor|object} anchor - Anchor to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEvidenceAnchor(anchor) {
  const errors = [];

  if (!anchor || typeof anchor !== 'object') {
    return { valid: false, errors: ['Evidence anchor must be a non-null object'] };
  }

  // 1. Repo ID
  if (!anchor.repoId || typeof anchor.repoId !== 'string' || !anchor.repoId.trim()) {
    errors.push("Missing required field: 'repoId'");
  }

  // 2. Git Reference (Immutable commit SHA required)
  const gitRef = typeof anchor.gitRef === 'string' ? anchor.gitRef.trim() : '';
  if (!gitRef) {
    errors.push("Missing required field: 'gitRef'");
  } else {
    const lowerRef = gitRef.toLowerCase();
    if (DISALLOWED_MUTABLE_REFS.includes(lowerRef)) {
      errors.push(`Mutable Git reference '${gitRef}' is disallowed in canonical evidence. Must be an immutable commit SHA.`);
    } else if (!COMMIT_SHA_REGEX.test(gitRef)) {
      errors.push(`Invalid Git reference '${gitRef}'. Expected immutable commit SHA (7 to 40 hexadecimal characters).`);
    }
  }

  // 3. File Path
  const pathValidation = validateRepositoryRelativePath(anchor.filePath);
  if (!pathValidation.valid) {
    errors.push(pathValidation.error);
  }

  // 4. Logical Anchor
  if (!anchor.logicalAnchor) {
    errors.push("Missing required field: 'logicalAnchor'");
  } else if (typeof anchor.logicalAnchor === 'string') {
    try {
      parseLogicalAnchor(anchor.logicalAnchor);
    } catch (err) {
      errors.push(`Invalid logical anchor: ${err.message}`);
    }
  } else if (typeof anchor.logicalAnchor === 'object') {
    const raw = anchor.logicalAnchor.raw || `${anchor.logicalAnchor.type}:${anchor.logicalAnchor.value}`;
    try {
      parseLogicalAnchor(raw);
    } catch (err) {
      errors.push(`Invalid logical anchor: ${err.message}`);
    }
  } else {
    errors.push("Field 'logicalAnchor' must be a string or parsed anchor object");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ── 5. Factory and Serializer Functions ──────────────────────────────────────

/**
 * Creates an EvidenceAnchor with validation.
 *
 * @param {object} fields - { repoId, gitRef, filePath, logicalAnchor }
 * @returns {EvidenceAnchor}
 */
export function createEvidenceAnchor(fields = {}) {
  let logical = fields.logicalAnchor;
  if (typeof logical === 'string') {
    logical = parseLogicalAnchor(logical);
  }

  const anchor = new EvidenceAnchor({
    repoId: fields.repoId,
    gitRef: fields.gitRef,
    filePath: fields.filePath,
    logicalAnchor: logical,
  });

  const val = validateEvidenceAnchor(anchor);
  if (!val.valid) {
    throw new Error(`Cannot create invalid EvidenceAnchor: ${val.errors.join('; ')}`);
  }

  return anchor;
}

/**
 * Serializes an EvidenceAnchor or anchor object to canonical URI.
 *
 * @param {EvidenceAnchor|object} anchor
 * @returns {string}
 */
export function serializeEvidenceAnchor(anchor) {
  if (!anchor) {
    throw new TypeError('Cannot serialize undefined or null EvidenceAnchor');
  }
  if (anchor instanceof EvidenceAnchor) {
    return anchor.toURI();
  }
  return createEvidenceAnchor(anchor).toURI();
}

/**
 * Parses a canonical evidence URI string or object into an EvidenceAnchor entity.
 * Supports format: ema://evidence/<repo-id>/<git-ref>/<file-path>#<logical-anchor>
 *
 * @param {string|object} input - URI string or data object
 * @returns {EvidenceAnchor}
 */
export function parseEvidenceAnchor(input) {
  if (!input) {
    throw new Error('Evidence anchor input cannot be null or empty');
  }

  if (input instanceof EvidenceAnchor) {
    return input;
  }

  if (typeof input === 'object') {
    // If object has 'anchor' property containing the URI string
    if (typeof input.anchor === 'string') {
      return parseEvidenceAnchor(input.anchor);
    }
    return createEvidenceAnchor(input);
  }

  if (typeof input !== 'string') {
    throw new TypeError(`Expected evidence anchor to be string or object, got ${typeof input}`);
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith(EVIDENCE_URI_PREFIX)) {
    throw new Error(`Malformed evidence URI: must start with '${EVIDENCE_URI_PREFIX}', got '${trimmed}'`);
  }

  const afterPrefix = trimmed.slice(EVIDENCE_URI_PREFIX.length);
  const hashIdx = afterPrefix.indexOf('#');

  if (hashIdx === -1) {
    throw new Error(`Malformed evidence URI: missing '#' fragment anchor in '${trimmed}'`);
  }

  const pathPart = afterPrefix.slice(0, hashIdx);
  const rawLogicalAnchor = afterPrefix.slice(hashIdx + 1);

  if (!rawLogicalAnchor.trim()) {
    throw new Error(`Malformed evidence URI: empty logical anchor fragment in '${trimmed}'`);
  }

  const parsedLogical = parseLogicalAnchor(rawLogicalAnchor);

  // Parse pathPart: <repo-id>/<git-ref>/<file-path>
  const segments = pathPart.split('/').filter(Boolean);
  if (segments.length < 3) {
    throw new Error(
      `Malformed evidence URI: path must contain at least <repo-id>/<git-ref>/<file-path>, got '${pathPart}'`
    );
  }

  // Identify the gitRef segment:
  // Look for the segment matching commit SHA or mutable ref
  let refIndex = -1;

  for (let i = 1; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (COMMIT_SHA_REGEX.test(seg) || DISALLOWED_MUTABLE_REFS.includes(seg.toLowerCase())) {
      refIndex = i;
      break;
    }
  }

  // Fallback: if no obvious hex SHA was found, check if segments[1] was intended as ref
  if (refIndex === -1) {
    // Attempt standard single-token repoId at index 0, gitRef at index 1
    refIndex = 1;
  }

  const repoId = segments.slice(0, refIndex).join('/');
  const gitRef = segments[refIndex];
  const filePath = segments.slice(refIndex + 1).join('/');

  if (!filePath) {
    throw new Error(`Malformed evidence URI: missing file path after git-ref in '${trimmed}'`);
  }

  return createEvidenceAnchor({
    repoId,
    gitRef,
    filePath,
    logicalAnchor: parsedLogical,
  });
}
