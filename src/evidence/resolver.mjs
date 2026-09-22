/**
 * Engineering Memory Agent (EMA) — Evidence Anchor Resolver & Grounding Engine
 * Phase 2: Evidence Anchors & Grounding Subsystem
 *
 * Verifies evidence grounding against historical Git commit reality and detects
 * staleness against the active working tree.
 *
 * CRITICAL INVARIANT: Grounding verification is NOT equivalent to EKU validation.
 * Resolving an evidence anchor MUST NEVER automatically set an EKU's
 * validation_state to 'Verified'.
 */

import {
  GROUNDING_STATES,
  STALENESS_REASONS,
} from './constants.mjs';

import {
  parseEvidenceAnchor,
  EvidenceAnchor,
} from './anchor.mjs';

import {
  resolveLogicalAnchorInContent,
} from './staleness.mjs';

import {
  readBlobAtCommit,
  readWorkingTreeFile,
  detectGitRename,
} from './git-resolver.mjs';

/**
 * Resolves an evidence anchor and evaluates its grounding state.
 *
 * @param {string|object|EvidenceAnchor} anchorInput - Canonical URI or EvidenceAnchor
 * @param {object} [options] - Resolution options
 * @param {string} [options.repoPath=process.cwd()] - Repository root
 * @param {function} [options.commitReader] - Custom commit reader: (gitRef, filePath) => { exists, commitExists, content, error }
 * @param {function} [options.currentFileReader] - Custom current file reader: (filePath) => { exists, content }
 * @param {function} [options.renameDetector] - Custom rename detector: (gitRef, filePath) => { renamed, oldPath, newPath }
 * @returns {{ state: string, reason: string|null, anchor: EvidenceAnchor|null, error?: string, renameDetected?: { from: string, to: string }, verifiedAt: string }}
 */
export function resolveEvidenceAnchor(anchorInput, options = {}) {
  const verifiedAt = new Date().toISOString();

  // 1. Parse and validate anchor
  let anchor;
  try {
    anchor = parseEvidenceAnchor(anchorInput);
  } catch (err) {
    return {
      state: GROUNDING_STATES.INVALID,
      reason: STALENESS_REASONS.SYNTAX_INVALID,
      anchor: null,
      error: err.message,
      verifiedAt,
    };
  }

  const repoPath = options.repoPath || process.cwd();

  // 2. Read historical commit content
  const commitReader =
    options.commitReader ||
    ((ref, fp) => readBlobAtCommit(ref, fp, repoPath));

  const histBlob = commitReader(anchor.gitRef, anchor.filePath);

  if (!histBlob.commitExists) {
    return {
      state: GROUNDING_STATES.INVALID,
      reason: STALENESS_REASONS.COMMIT_MISSING,
      anchor,
      error: `Commit '${anchor.gitRef}' not found in repository`,
      verifiedAt,
    };
  }

  if (!histBlob.exists) {
    return {
      state: GROUNDING_STATES.INVALID,
      reason: STALENESS_REASONS.FILE_MISSING_AT_COMMIT,
      anchor,
      error: `File '${anchor.filePath}' was not found at commit '${anchor.gitRef}'`,
      verifiedAt,
    };
  }

  // Verify that the logical anchor existed in historical content
  const histAnchorRes = resolveLogicalAnchorInContent(anchor.logicalAnchor, histBlob.content || '');
  if (!histAnchorRes.resolved) {
    return {
      state: GROUNDING_STATES.INVALID,
      reason: STALENESS_REASONS.ANCHOR_UNRESOLVED_AT_COMMIT,
      anchor,
      error: `Logical anchor '#${anchor.logicalAnchor.raw}' was not found in commit content: ${histAnchorRes.details}`,
      verifiedAt,
    };
  }

  // 3. Inspect active working tree / current content
  const currentReader =
    options.currentFileReader ||
    ((fp) => readWorkingTreeFile(fp, repoPath));

  const currentFile = currentReader(anchor.filePath);

  if (!currentFile.exists) {
    // Check if Git detected a rename in subsequent history
    const renameDetector =
      options.renameDetector ||
      ((ref, fp) => detectGitRename(ref, fp, repoPath));

    const renameResult = renameDetector(anchor.gitRef, anchor.filePath);

    if (renameResult.renamed && renameResult.newPath) {
      // Historical anchor remains unchanged! Rename is reported in metadata.
      return {
        state: GROUNDING_STATES.STALE,
        reason: STALENESS_REASONS.FILE_RENAMED,
        anchor,
        renameDetected: {
          from: anchor.filePath,
          to: renameResult.newPath,
        },
        error: `File was moved or renamed to '${renameResult.newPath}'`,
        verifiedAt,
      };
    }

    return {
      state: GROUNDING_STATES.STALE,
      reason: STALENESS_REASONS.FILE_DELETED,
      anchor,
      error: `File '${anchor.filePath}' no longer exists in repository working tree`,
      verifiedAt,
    };
  }

  // File exists in working tree. Compare content with historical commit.
  if (currentFile.content === histBlob.content) {
    return {
      state: GROUNDING_STATES.FRESH,
      reason: null,
      anchor,
      matchLine: histAnchorRes.line,
      verifiedAt,
    };
  }

  // Content modified. Check if the logical anchor is still intact.
  const currAnchorRes = resolveLogicalAnchorInContent(anchor.logicalAnchor, currentFile.content || '');

  if (!currAnchorRes.resolved) {
    return {
      state: GROUNDING_STATES.STALE,
      reason: STALENESS_REASONS.ANCHOR_UNRESOLVED,
      anchor,
      error: `Logical anchor '#${anchor.logicalAnchor.raw}' is missing from current file: ${currAnchorRes.details}`,
      verifiedAt,
    };
  }

  // Anchor is still present in current file, but location or surrounding code drifted
  const lineShifted = currAnchorRes.line !== histAnchorRes.line;

  return {
    state: GROUNDING_STATES.STALE,
    reason: lineShifted ? STALENESS_REASONS.ANCHOR_SHIFTED : STALENESS_REASONS.CONTENT_CHANGED,
    anchor,
    historicalLine: histAnchorRes.line,
    currentLine: currAnchorRes.line,
    matchText: currAnchorRes.matchText,
    verifiedAt,
  };
}

/**
 * Checks staleness across an array of evidence items.
 *
 * @param {Array<string|object>} anchors - List of evidence anchors
 * @param {object} [options] - Resolution options
 * @returns {{ summary: { fresh: number, stale: number, invalid: number, total: number }, results: Array<object> }}
 */
export function checkStaleness(anchors = [], options = {}) {
  const results = [];
  let fresh = 0;
  let stale = 0;
  let invalid = 0;

  for (const item of anchors) {
    const res = resolveEvidenceAnchor(item, options);
    results.push(res);
    if (res.state === GROUNDING_STATES.FRESH) fresh++;
    else if (res.state === GROUNDING_STATES.STALE) stale++;
    else invalid++;
  }

  return {
    summary: {
      fresh,
      stale,
      invalid,
      total: anchors.length,
    },
    results,
  };
}
