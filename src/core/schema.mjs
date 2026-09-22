/**
 * Engineering Memory Agent (EMA) — YAML Frontmatter Parser & Serializer
 * Phase 1: Core EKU Domain Model & Schema v2
 *
 * Implements a lightweight, self-contained, zero-dependency YAML frontmatter
 * parser and serializer tailored for canonical EKU documents.
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
  REJECTED_LEGACY_SCOPES,
  ISOLATION_MODES,
  VALID_ISOLATION_MODES,
  VALID_KNOWLEDGE_TYPES,
  VALID_RELATIONSHIP_TYPES,
  LEGACY_LIFECYCLE_MAPPINGS,
} from './constants.mjs';

import { parseEvidenceAnchor } from '../evidence/anchor.mjs';

// ── 1. Frontmatter Delimiter & Parsing Helpers ───────────────────────────────

/**
 * Strips comments from a line unless inside quotes.
 */
function stripComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === '#' && !inSingle && !inDouble) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

/**
 * Parses scalar YAML values: strings, numbers, booleans, dates, null.
 */
function parseScalar(val) {
  if (val === undefined || val === null) return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '~' || trimmed === 'null' || trimmed === 'Null' || trimmed === 'NULL') {
    return null;
  }
  if (trimmed === 'true' || trimmed === 'True' || trimmed === 'TRUE') return true;
  if (trimmed === 'false' || trimmed === 'False' || trimmed === 'FALSE') return false;

  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map(item => parseScalar(item.trim()));
  }

  // Numbers
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  return trimmed;
}

/**
 * Parses a block of lines into a JavaScript object/array based on indentation.
 */
function parseYamlLines(lines, startIndex = 0, currentIndent = 0) {
  const result = {};
  let i = startIndex;

  while (i < lines.length) {
    const rawLine = lines[i];
    const stripped = stripComment(rawLine);
    if (!stripped.trim()) {
      i++;
      continue;
    }

    const indent = rawLine.search(/\S/);
    if (indent < currentIndent) {
      break;
    }

    const content = stripped.trim();

    // Key-value pair: key: value
    const colonIdx = content.indexOf(':');
    if (colonIdx !== -1) {
      const key = content.slice(0, colonIdx).trim();
      const rest = content.slice(colonIdx + 1).trim();

      if (rest === '') {
        // Value might be a block array or nested object on subsequent lines
        if (i + 1 < lines.length) {
          const nextRaw = lines[i + 1];
          const nextStripped = stripComment(nextRaw);
          const nextIndent = nextRaw.search(/\S/);

          if (nextIndent > indent) {
            if (nextStripped.trim().startsWith('-')) {
              // Parse block array
              const { array, nextIndex } = parseBlockArray(lines, i + 1, nextIndent);
              result[key] = array;
              i = nextIndex;
              continue;
            } else {
              // Parse nested object
              const { obj, nextIndex } = parseYamlBlock(lines, i + 1, nextIndent);
              result[key] = obj;
              i = nextIndex;
              continue;
            }
          }
        }
        result[key] = null;
        i++;
      } else {
        result[key] = parseScalar(rest);
        i++;
      }
    } else {
      i++;
    }
  }

  return { obj: result, nextIndex: i };
}

function parseYamlBlock(lines, startIndex, currentIndent) {
  return parseYamlLines(lines, startIndex, currentIndent);
}

function parseBlockArray(lines, startIndex, currentIndent) {
  const array = [];
  let i = startIndex;

  while (i < lines.length) {
    const rawLine = lines[i];
    const stripped = stripComment(rawLine);
    if (!stripped.trim()) {
      i++;
      continue;
    }

    const indent = rawLine.search(/\S/);
    if (indent < currentIndent) {
      break;
    }

    const content = stripped.trim();
    if (!content.startsWith('-')) {
      break;
    }

    const afterDash = content.slice(1).trim();

    // Check if it's an inline item or the start of an object
    const colonIdx = afterDash.indexOf(':');
    if (colonIdx !== -1 && !afterDash.startsWith('[')) {
      // First key-value of an object in a list
      const itemObj = {};
      const firstKey = afterDash.slice(0, colonIdx).trim();
      const firstVal = afterDash.slice(colonIdx + 1).trim();
      itemObj[firstKey] = parseScalar(firstVal);

      // Collect sibling properties of this array item
      let j = i + 1;
      while (j < lines.length) {
        const subRaw = lines[j];
        const subStripped = stripComment(subRaw);
        if (!subStripped.trim()) {
          j++;
          continue;
        }
        const subIndent = subRaw.search(/\S/);
        if (subIndent <= indent) {
          break;
        }
        const subContent = subStripped.trim();
        if (subContent.startsWith('-')) {
          break;
        }
        const subColon = subContent.indexOf(':');
        if (subColon !== -1) {
          const subKey = subContent.slice(0, subColon).trim();
          const subVal = subContent.slice(subColon + 1).trim();
          itemObj[subKey] = parseScalar(subVal);
        }
        j++;
      }
      array.push(itemObj);
      i = j;
    } else {
      // Scalar list item
      array.push(parseScalar(afterDash));
      i++;
    }
  }

  return { array, nextIndex: i };
}

/**
 * Extracts YAML frontmatter and Markdown body from a document string.
 */
export function parseFrontmatter(markdownText) {
  if (typeof markdownText !== 'string') {
    throw new TypeError('Expected markdownText to be a string');
  }

  const trimmed = markdownText.trimStart();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: markdownText, rawFrontmatter: '' };
  }

  const endIdx = trimmed.indexOf('\n---', 3);
  const altEndIdx = trimmed.indexOf('\n...', 3);
  let closeIdx = -1;
  let delimiterLen = 4;

  if (endIdx !== -1 && (altEndIdx === -1 || endIdx <= altEndIdx)) {
    closeIdx = endIdx;
  } else if (altEndIdx !== -1) {
    closeIdx = altEndIdx;
  }

  if (closeIdx === -1) {
    // Missing closing delimiter
    return { frontmatter: {}, body: markdownText, rawFrontmatter: '' };
  }

  const yamlContent = trimmed.slice(3, closeIdx);
  const body = trimmed.slice(closeIdx + delimiterLen).replace(/^\r?\n/, '');

  const lines = yamlContent.split(/\r?\n/);
  const { obj } = parseYamlLines(lines, 0, 0);

  return {
    frontmatter: obj,
    body,
    rawFrontmatter: yamlContent,
  };
}

// ── 2. Frontmatter Serializer ────────────────────────────────────────────────

function serializeValue(val, indent = 0) {
  const spaces = ' '.repeat(indent);
  if (val === null || val === undefined) {
    return 'null';
  }
  if (typeof val === 'boolean' || typeof val === 'number') {
    return String(val);
  }
  if (typeof val === 'string') {
    if (val.includes('\n') || val.includes(':') || val.includes('#') || val.startsWith('[') || val.startsWith('{')) {
      return JSON.stringify(val);
    }
    return val;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    // Check if simple scalars
    const isAllScalars = val.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
    if (isAllScalars && val.length <= 4) {
      return `[${val.map(v => typeof v === 'string' && (v.includes(',') || v.includes(' ')) ? JSON.stringify(v) : v).join(', ')}]`;
    }
    // Block array
    let out = '\n';
    for (let i = 0; i < val.length; i++) {
      const item = val[i];
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length === 0) {
          out += `${spaces}  - {}\n`;
        } else {
          const firstKey = keys[0];
          out += `${spaces}  - ${firstKey}: ${serializeValue(item[firstKey], indent + 4)}\n`;
          for (let k = 1; k < keys.length; k++) {
            const key = keys[k];
            out += `${spaces}    ${key}: ${serializeValue(item[key], indent + 4)}\n`;
          }
        }
      } else {
        out += `${spaces}  - ${serializeValue(item, indent + 4)}\n`;
      }
    }
    return out.trimEnd();
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    let out = '\n';
    for (const key of keys) {
      out += `${spaces}  ${key}: ${serializeValue(val[key], indent + 2)}\n`;
    }
    return out.trimEnd();
  }
  return String(val);
}

/**
 * Serializes a frontmatter object and body into a canonical Markdown document.
 */
export function serializeFrontmatter(frontmatter, body = '') {
  let yaml = '---\n';

  // Standard field order for canonical readability
  const preferredOrder = [
    'id',
    'title',
    'type',
    'status',
    'validation_state',
    'authority_level',
    'confidence',
    'scope',
    'scope_id',
    'isolation',
    'evidence',
    'related',
    'superseded_by',
    'promoted_from',
    'tags',
    'created',
    'last_verified',
  ];

  const seen = new Set();

  for (const field of preferredOrder) {
    if (frontmatter[field] !== undefined) {
      seen.add(field);
      yaml += `${field}: ${serializeValue(frontmatter[field], 0)}\n`;
    }
  }

  // Remaining custom or track-specific fields
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!seen.has(key)) {
      yaml += `${key}: ${serializeValue(value, 0)}\n`;
    }
  }

  yaml += '---\n\n';
  return yaml + (body || '').trimStart();
}

// ── 3. EKU Semantic Validator ────────────────────────────────────────────────

/**
 * Validates an EKU object against Schema v2 rules and architectural invariants.
 *
 * @param {object} eku - The normalized EKU data object.
 * @param {object} [options] - Validation options.
 * @param {string} [options.storageMode='canonical'] - 'canonical' or 'candidate_queue'.
 * @param {boolean} [options.skipGlobalSourceCheck=false] - For testing overrides.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateEKU(eku, options = {}) {
  const errors = [];
  const warnings = [];
  const storageMode = options.storageMode || 'canonical';

  if (!eku || typeof eku !== 'object') {
    return { valid: false, errors: ['EKU must be an object'], warnings: [] };
  }

  // 1. Required Identity & Title
  if (!eku.title || typeof eku.title !== 'string' || !eku.title.trim()) {
    errors.push("Missing or invalid required field: 'title'");
  }

  // 2. Knowledge Type
  if (!eku.type || !VALID_KNOWLEDGE_TYPES.includes(eku.type.toLowerCase())) {
    errors.push(`Invalid knowledge type '${eku.type}'. Must be one of: ${VALID_KNOWLEDGE_TYPES.join(', ')}`);
  }

  // 3. Lifecycle State
  const rawStatus = (eku.status || '').toLowerCase();
  if (!rawStatus) {
    errors.push("Missing required lifecycle field: 'status'");
  } else if (VALID_LIFECYCLE_STATES.includes(rawStatus)) {
    // Valid approved EMA lifecycle state
  } else if (LEGACY_LIFECYCLE_MAPPINGS[rawStatus]) {
    warnings.push(`Legacy lifecycle state '${rawStatus}' detected. Mapped to 4-D model; update document frontmatter.`);
  } else {
    errors.push(`Invalid lifecycle state '${eku.status}'. Must be one of: ${VALID_LIFECYCLE_STATES.join(', ')}`);
  }

  // 4. Validation State
  const valState = (eku.validation_state || '').toLowerCase();
  if (valState && !VALID_VALIDATION_STATES.includes(valState)) {
    errors.push(`Invalid validation state '${eku.validation_state}'. Must be one of: ${VALID_VALIDATION_STATES.join(', ')}`);
  }

  // 5. Authority Level
  const authLevel = (eku.authority_level || '').toLowerCase();
  if (authLevel && !VALID_AUTHORITY_LEVELS.includes(authLevel)) {
    errors.push(`Invalid authority level '${eku.authority_level}'. Must be one of: ${VALID_AUTHORITY_LEVELS.join(', ')}`);
  }

  // 6. Confidence Level
  const confidence = (eku.confidence || '').toLowerCase();
  if (!confidence) {
    errors.push("Missing required confidence field: 'confidence'");
  } else if (!VALID_CONFIDENCE_LEVELS.includes(confidence)) {
    errors.push(`Invalid confidence level '${eku.confidence}'. Must be one of: ${VALID_CONFIDENCE_LEVELS.join(', ')}`);
  }

  // 7. Knowledge Scope
  const scope = (eku.scope || '').toLowerCase();
  if (scope) {
    if (REJECTED_LEGACY_SCOPES.includes(scope)) {
      errors.push(`Legacy scope '${scope}' is rejected. Knowledge Scope must be one of: ${VALID_KNOWLEDGE_SCOPES.join(', ')}. Use tags or file paths for domain/component granularity.`);
    } else if (!VALID_KNOWLEDGE_SCOPES.includes(scope)) {
      errors.push(`Invalid knowledge scope '${eku.scope}'. Must be one of: ${VALID_KNOWLEDGE_SCOPES.join(', ')}`);
    }
  }

  // 8. Isolation Mode
  const isolation = (eku.isolation || '').toLowerCase();
  if (isolation && !VALID_ISOLATION_MODES.includes(isolation)) {
    errors.push(`Invalid isolation mode '${eku.isolation}'. Must be one of: ${VALID_ISOLATION_MODES.join(', ')}`);
  }

  // 9. Dates
  if (!eku.created || typeof eku.created !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(eku.created)) {
    errors.push("Missing or malformed required date field: 'created' (expected 'YYYY-MM-DD')");
  }
  if (!eku.last_verified || typeof eku.last_verified !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(eku.last_verified)) {
    errors.push("Missing or malformed required date field: 'last_verified' (expected 'YYYY-MM-DD')");
  }

  // 10. Mutually Exclusive State Combinations
  // Invariant: Candidate cannot be Current in canonical storage
  if (authLevel === AUTHORITY_LEVELS.CANDIDATE && rawStatus === LIFECYCLE_STATES.CURRENT && storageMode === 'canonical') {
    errors.push("Invariant violation: Authority Level 'candidate' cannot have Lifecycle State 'current' in canonical storage. Candidates are work-in-progress and must be promoted before becoming current.");
  }

  // Invariant: Unreviewed cannot be Verified
  if (valState === VALIDATION_STATES.UNREVIEWED && valState === VALIDATION_STATES.VERIFIED) {
    errors.push("Invariant violation: Validation State cannot be simultaneously 'unreviewed' and 'verified'");
  }

  // 11. Supersession Invariant
  if (rawStatus === LIFECYCLE_STATES.SUPERSEDED) {
    if (!eku.superseded_by || typeof eku.superseded_by !== 'string' || !eku.superseded_by.trim()) {
      errors.push("Supersession invariant violation: Document with status 'superseded' MUST have a non-empty 'superseded_by' target path.");
    }
  }

  // 12. Global Promotion Precondition
  if (scope === KNOWLEDGE_SCOPES.GLOBAL && !options.skipGlobalSourceCheck) {
    if (authLevel && authLevel !== AUTHORITY_LEVELS.CANONICAL) {
      errors.push(`Global scope requires authority_level '${AUTHORITY_LEVELS.CANONICAL}', found '${authLevel}'`);
    }
    const minSources = eku.promoted_from?.min_sources_checked;
    if (typeof minSources !== 'number' || minSources < 2) {
      errors.push(`Global scope promotion requires at least 2 independent project evidence sources (promoted_from.min_sources_checked >= 2), found ${minSources ?? 'none'}`);
    }
  }

  // 13. Relationship Typing Validation
  if (eku.related && Array.isArray(eku.related)) {
    for (let idx = 0; idx < eku.related.length; idx++) {
      const rel = eku.related[idx];
      if (typeof rel === 'string') {
        // Plain string path is valid (backward-compatible loose association)
        continue;
      }
      if (typeof rel === 'object' && rel !== null) {
        const target = rel.target || rel.path;
        if (!target || typeof target !== 'string') {
          errors.push(`Related relationship at index ${idx} missing 'target' or 'path'`);
        }
        if (rel.type) {
          const relType = rel.type.toLowerCase();
          if (!VALID_RELATIONSHIP_TYPES.includes(relType)) {
            errors.push(`Invalid relationship type '${rel.type}' at index ${idx}. Must be one of: ${VALID_RELATIONSHIP_TYPES.join(', ')}`);
          }
        }
      } else {
        errors.push(`Invalid item in 'related' list at index ${idx}: expected string or object`);
      }
    }
  }

  // 14. Evidence Anchor Validation
  if (eku.evidence && Array.isArray(eku.evidence)) {
    for (let idx = 0; idx < eku.evidence.length; idx++) {
      const ev = eku.evidence[idx];
      if (typeof ev === 'string') {
        if (ev.startsWith('ema://evidence/')) {
          try {
            parseEvidenceAnchor(ev);
          } catch (err) {
            errors.push(`Invalid evidence anchor at index ${idx}: ${err.message}`);
          }
        }
      } else if (typeof ev === 'object' && ev !== null) {
        if (ev.anchor) {
          try {
            parseEvidenceAnchor(ev.anchor);
          } catch (err) {
            errors.push(`Invalid evidence anchor at index ${idx}: ${err.message}`);
          }
        } else if (!ev.path) {
          errors.push(`Evidence item at index ${idx} missing 'path' or 'anchor'`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
