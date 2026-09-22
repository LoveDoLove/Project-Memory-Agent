/**
 * Engineering Memory Agent (EMA) — Logical Anchor Resolution & Staleness Checker
 * Phase 2: Evidence Anchors & Grounding Subsystem
 *
 * Inspects document and source code content to find and verify the presence
 * of the 8 approved logical anchor types: sym, ast, sec, test, cfg, pr, issue, line.
 */

import {
  LOGICAL_ANCHOR_TYPES,
} from './constants.mjs';

/**
 * Resolves a logical anchor against a text content string.
 *
 * @param {object} logicalAnchor - Parsed logical anchor { type, value, start?, end? }
 * @param {string} content - Raw file content to inspect
 * @returns {{ resolved: boolean, line?: number, matchText?: string, details?: string }}
 */
export function resolveLogicalAnchorInContent(logicalAnchor, content) {
  if (!logicalAnchor || typeof logicalAnchor !== 'object') {
    return { resolved: false, details: 'Invalid logical anchor object' };
  }
  if (typeof content !== 'string') {
    return { resolved: false, details: 'Content must be a string' };
  }

  const lines = content.split(/\r?\n/);
  const type = logicalAnchor.type;
  const value = logicalAnchor.value;

  switch (type) {
    case LOGICAL_ANCHOR_TYPES.LINE: {
      const start = logicalAnchor.start || parseInt(value.split(':')[0], 10);
      const end = logicalAnchor.end || (value.includes(':') ? parseInt(value.split(':')[1], 10) : start);

      if (start < 1 || start > lines.length) {
        return {
          resolved: false,
          details: `Line start ${start} out of bounds (file has ${lines.length} lines)`,
        };
      }
      if (end < start || end > lines.length) {
        return {
          resolved: false,
          details: `Line end ${end} out of bounds (file has ${lines.length} lines)`,
        };
      }

      const matchLines = lines.slice(start - 1, end).join('\n');
      return {
        resolved: true,
        line: start,
        endLine: end,
        matchText: matchLines,
      };
    }

    case LOGICAL_ANCHOR_TYPES.SEC: {
      // Decode URI components if needed (e.g. %20 -> space)
      let decodedHeading = value;
      try {
        decodedHeading = decodeURIComponent(value);
      } catch {
        // keep as-is
      }
      const headingClean = decodedHeading.trim().toLowerCase();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#')) {
          const textAfterHashes = line.replace(/^#+\s*/, '').trim().toLowerCase();
          if (textAfterHashes === headingClean || textAfterHashes.includes(headingClean)) {
            return {
              resolved: true,
              line: i + 1,
              matchText: line,
            };
          }
        }
      }
      return { resolved: false, details: `Heading '${decodedHeading}' not found in content` };
    }

    case LOGICAL_ANCHOR_TYPES.SYM: {
      const symName = value.trim();
      // Regex looking for function, class, const, let, var, def, fn, interface, type
      // or word boundary for the symbol identifier
      const escapedSym = symName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const declPattern = new RegExp(
        `(?:class|function|interface|type|const|let|var|def|fn|struct|enum)\\s+${escapedSym}\\b|\\b${escapedSym}\\s*(?:=|:\\s*\\(|\\()`,
        'i'
      );
      const fallbackPattern = new RegExp(`\\b${escapedSym}\\b`);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (declPattern.test(line)) {
          return {
            resolved: true,
            line: i + 1,
            matchText: line.trim(),
          };
        }
      }

      // Fallback: search for exact word token
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (fallbackPattern.test(line)) {
          return {
            resolved: true,
            line: i + 1,
            matchText: line.trim(),
          };
        }
      }

      return { resolved: false, details: `Symbol '${symName}' definition not found in content` };
    }

    case LOGICAL_ANCHOR_TYPES.TEST: {
      const testId = value.trim().toLowerCase();
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();
        if (
          (lower.includes('test(') || lower.includes('it(') || lower.includes('describe(') || lower.includes('def test_')) &&
          lower.includes(testId)
        ) {
          return {
            resolved: true,
            line: i + 1,
            matchText: line.trim(),
          };
        }
      }
      // General token search for test identifier
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(testId)) {
          return {
            resolved: true,
            line: i + 1,
            matchText: lines[i].trim(),
          };
        }
      }
      return { resolved: false, details: `Test identifier '${value}' not found in content` };
    }

    case LOGICAL_ANCHOR_TYPES.CFG: {
      const cfgPath = value.trim().replace(/^\$\.?/, '');
      const parts = cfgPath.split('.');
      const lastKey = parts[parts.length - 1];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(cfgPath) || (lastKey && line.includes(lastKey))) {
          return {
            resolved: true,
            line: i + 1,
            matchText: line.trim(),
          };
        }
      }
      return { resolved: false, details: `Config path '${value}' not found in content` };
    }

    case LOGICAL_ANCHOR_TYPES.AST: {
      const astPath = value.trim();
      // Inspect for selectors or key node names in content
      const nodeName = astPath.split(/[./\\[\]]+/).filter(Boolean).pop() || astPath;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(nodeName)) {
          return {
            resolved: true,
            line: i + 1,
            matchText: lines[i].trim(),
          };
        }
      }
      return { resolved: false, details: `AST node/path '${astPath}' not found in content` };
    }

    case LOGICAL_ANCHOR_TYPES.PR:
    case LOGICAL_ANCHOR_TYPES.ISSUE: {
      const num = String(logicalAnchor.number || value).trim();
      const pattern = new RegExp(`(?:#|PR\\s*#?|issue\\s*#?)${num}\\b`, 'i');
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i]) || lines[i].includes(num)) {
          return {
            resolved: true,
            line: i + 1,
            matchText: lines[i].trim(),
          };
        }
      }
      return { resolved: false, details: `${type.toUpperCase()} #${num} reference not found in content` };
    }

    default:
      return { resolved: false, details: `Unsupported anchor type '${type}'` };
  }
}
