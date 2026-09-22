/**
 * Engineering Memory Agent (EMA) — Auto-Distillation & Ingestion Engine
 *
 * Implements automated, zero-friction memory capture:
 *   1. Analyzes Git diffs, commits, and code modifications.
 *   2. Extracts grounded evidence anchors with SHA, file path, and symbol/line anchors.
 *   3. Links modifications to existing knowledge units via hybrid search.
 *   4. Strictly stores in .ema/candidates/ with Candidate + Unreviewed invariants (never directly in canonical docs/).
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

import { createEvidenceAnchor } from '../evidence/anchor.mjs';
import { createCandidate, defaultCandidateDir } from '../storage/candidate-store.mjs';
import { searchLexical } from '../index/lexical-index.mjs';

/**
 * Parses unified Git diff text into structured file hunks.
 * @param {string} diffText
 * @returns {Array<{
 *   filePath: string,
 *   hunks: Array<{ newStart: number, newCount: number, symbol: string, added: string[], deleted: string[] }>
 * }>}
 */
export function parseGitDiff(diffText) {
  if (typeof diffText !== 'string' || !diffText.trim()) return [];

  const files = [];
  const lines = diffText.split(/\r?\n/);
  let currentFile = null;
  let currentHunk = null;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      // Example: diff --git a/src/auth.ts b/src/auth.ts
      const match = line.match(/b\/(.+)$/);
      const filePath = match ? match[1] : '';
      currentFile = { filePath, hunks: [] };
      files.push(currentFile);
      currentHunk = null;
    } else if (line.startsWith('@@ ')) {
      // Example: @@ -14,6 +14,9 @@ function authenticate()
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,(\d+))? @@(?:\s*(.*))?/);
      if (match && currentFile) {
        const newStart = parseInt(match[2], 10);
        const newCount = match[3] ? parseInt(match[3], 10) : 1;
        const symbolHeader = (match[4] || '').trim();

        // Extract clean symbol name if present (e.g. export function test(), class Foo)
        let symbol = '';
        const symMatch = symbolHeader.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var|interface|type)\s+([a-zA-Z0-9_$]+)/);
        if (symMatch) {
          symbol = symMatch[1];
        } else if (symbolHeader && /^[a-zA-Z0-9_$]+/.test(symbolHeader)) {
          symbol = symbolHeader.split(/[\s(:]/)[0];
        }

        currentHunk = {
          newStart,
          newCount,
          symbol,
          added: [],
          deleted: [],
        };
        currentFile.hunks.push(currentHunk);
      }
    } else if (currentHunk) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.added.push(line.slice(1));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.deleted.push(line.slice(1));
      }
    }
  }

  return files.filter((f) => f.filePath && f.hunks.length > 0);
}

/**
 * Retrieves the current Git repository context (origin ID and commit SHA).
 * Falls back to deterministic mock values if Git is unavailable.
 *
 * @param {string} repoRoot
 * @returns {{ repoId: string, gitRef: string }}
 */
export function getGitRepoContext(repoRoot = process.cwd()) {
  let gitRef = '';
  let repoId = '';

  try {
    gitRef = execSync('git rev-parse HEAD', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Deterministic 40-char SHA fallback for non-git directories
    const hash = crypto.createHash('sha1').update(repoRoot).digest('hex');
    gitRef = hash.padEnd(40, '0');
  }

  try {
    const origin = execSync('git config --get remote.origin.url', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (origin) {
      // Normalize git@github.com:org/repo.git or https://github.com/org/repo
      repoId = origin
        .replace(/^git@([^:]+):/, '$1/')
        .replace(/^https?:\/\//, '')
        .replace(/\.git$/, '');
    }
  } catch {
    repoId = `local/${path.basename(repoRoot)}`;
  }

  if (!repoId) {
    repoId = `local/${path.basename(repoRoot)}`;
  }

  return { repoId, gitRef };
}

/**
 * Distills a Candidate EKU from unified Git diff text.
 *
 * @param {string} diffText
 * @param {object} [options]
 * @param {string} [options.title] - Explicit candidate title
 * @param {string} [options.repoRoot=process.cwd()]
 * @param {import('better-sqlite3').Database} [options.db] - For relationship inference
 * @param {string} [options.scope='project']
 * @returns {object} Unreviewed Candidate EKU
 */
export function distillDiff(diffText, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const parsedFiles = parseGitDiff(diffText);

  if (parsedFiles.length === 0) {
    throw new Error('Cannot distill knowledge from empty or invalid diff');
  }

  const { repoId, gitRef } = getGitRepoContext(repoRoot);
  const evidenceList = [];
  const modifiedFiles = [];
  const modifiedSymbols = [];

  for (const file of parsedFiles) {
    // Validate repository relative path
    const relPath = file.filePath.replace(/^\/+/, '');
    modifiedFiles.push(relPath);

    for (const hunk of file.hunks) {
      let logicalAnchor = null;
      if (hunk.symbol) {
        logicalAnchor = `sym:${hunk.symbol}`;
        modifiedSymbols.push(hunk.symbol);
      } else {
        const endLine = hunk.newStart + Math.max(1, hunk.newCount) - 1;
        logicalAnchor = hunk.newCount > 1 ? `line:${hunk.newStart}:${endLine}` : `line:${hunk.newStart}`;
      }

      try {
        const anchor = createEvidenceAnchor({
          repoId,
          gitRef,
          filePath: relPath,
          logicalAnchor,
        });
        evidenceList.push(anchor.toURI());
      } catch {
        // Fallback line anchor
        try {
          const fb = createEvidenceAnchor({
            repoId,
            gitRef,
            filePath: relPath,
            logicalAnchor: `line:${hunk.newStart}`,
          });
          evidenceList.push(fb.toURI());
        } catch {
          // Skip ungrounded hunk
        }
      }
    }
  }

  // Determine Title & Category
  const isFix = /fix|bug|error|issue|patch|fail|resolve/i.test(diffText);
  const primarySymbol = modifiedSymbols[0] || '';
  const primaryFile = modifiedFiles[0] ? path.basename(modifiedFiles[0]) : 'codebase';

  let title = options.title;
  if (!title) {
    if (isFix) {
      title = primarySymbol ? `Fix: Resolve issue in ${primarySymbol}` : `Fix: Resolve problem in ${primaryFile}`;
    } else {
      title = primarySymbol ? `Feature: Implementation of ${primarySymbol}` : `Update: Modifications in ${primaryFile}`;
    }
  }

  // Infer related EKUs from existing derived index
  const related = [];
  if (options.db && options.db.open) {
    const searchTerms = [primaryFile, primarySymbol].filter(Boolean);
    for (const term of searchTerms) {
      try {
        const hits = searchLexical(options.db, term, options.scope || 'project', { limit: 2 });
        for (const h of hits) {
          if (!related.some((r) => r.target === h.id)) {
            related.push({
              type: isFix ? 'resolves' : 'affects',
              target: h.id,
            });
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }

  const tags = ['git-diff', isFix ? 'solution' : 'architecture'];
  for (const f of modifiedFiles) {
    const ext = path.extname(f).replace(/^\./, '');
    if (ext && !tags.includes(ext)) tags.push(ext);
  }

  const body = `## Context and Problem\n` +
    `Automated memory capture from Git changes in: ${modifiedFiles.join(', ')}.\n\n` +
    `## Changes and Solution\n` +
    `- Modified files: ${modifiedFiles.map((f) => `\`${f}\``).join(', ')}\n` +
    (modifiedSymbols.length > 0 ? `- Modified symbols: ${modifiedSymbols.map((s) => `\`${s}\``).join(', ')}\n\n` : '\n') +
    `## Evidence Anchors\n` +
    `${evidenceList.map((e) => `- \`${e}\``).join('\n')}\n`;

  return {
    title,
    status: 'Draft',
    validation_state: 'Unreviewed',
    authority_level: 'Candidate',
    confidence: 'Medium',
    scope: options.scope || 'project',
    scope_id: options.scopeId || repoId,
    isolation: 'hard',
    tags,
    evidence: evidenceList,
    related,
    body,
  };
}

/**
 * Distills a Candidate EKU from text content (e.g. task summary, incident report).
 *
 * @param {string} text
 * @param {object} [options]
 * @returns {object} Unreviewed Candidate EKU
 */
export function distillText(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Cannot distill knowledge from empty text');
  }

  const repoRoot = options.repoRoot || process.cwd();
  const { repoId, gitRef } = getGitRepoContext(repoRoot);

  const firstLine = text.trim().split(/\r?\n/)[0].replace(/^#+\s*/, '');
  const title = options.title || (firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine);

  const evidenceList = options.evidence || [];

  return {
    title,
    status: 'Draft',
    validation_state: 'Unreviewed',
    authority_level: 'Candidate',
    confidence: 'Medium',
    scope: options.scope || 'project',
    scope_id: options.scopeId || repoId,
    isolation: 'hard',
    tags: options.tags || ['text-distill'],
    evidence: evidenceList,
    related: options.related || [],
    body: text.trim(),
  };
}

/**
 * High-level Ingestion function:
 * Captures knowledge from diff, git, or text, formats it as an EKU,
 * and writes it to .ema/candidates/<id>.json in the candidate queue.
 *
 * CRITICAL INVARIANT: Never writes directly to docs/ canonical storage.
 *
 * @param {object} input
 * @param {string} [input.diff] - Unified git diff
 * @param {string} [input.text] - Arbitrary text/summary
 * @param {boolean} [input.fromGitWorkingTree=false] - Read uncommitted git diff
 * @param {object} [options]
 * @returns {{ success: boolean, candidateId: string, candidate: object, filePath: string }}
 */
export function ingestKnowledge(input = {}, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const candidateDir = options.candidateDir || defaultCandidateDir(repoRoot);

  let candidateData = null;

  if (input.diff) {
    candidateData = distillDiff(input.diff, { ...options, repoRoot });
  } else if (input.fromGitWorkingTree) {
    let diff = '';
    try {
      // Check staged + unstaged changes
      diff = execSync('git diff HEAD', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      if (!diff.trim()) {
        diff = execSync('git diff HEAD~1', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      }
    } catch {
      throw new Error('Failed to extract git diff from repository working tree');
    }

    if (!diff.trim()) {
      throw new Error('No git changes detected in working tree to ingest');
    }

    candidateData = distillDiff(diff, { ...options, repoRoot });
  } else if (input.text) {
    candidateData = distillText(input.text, { ...options, repoRoot });
  } else {
    throw new Error('ingestKnowledge requires diff, fromGitWorkingTree, or text input');
  }

  // Persist into quarantined candidate store
  const savedCandidate = createCandidate(candidateData, candidateDir);

  return {
    success: true,
    candidateId: savedCandidate.id,
    candidate: savedCandidate,
    filePath: path.join(candidateDir, `${savedCandidate.id}.json`),
  };
}
