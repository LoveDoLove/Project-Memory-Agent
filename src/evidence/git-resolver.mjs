/**
 * Engineering Memory Agent (EMA) — Git Evidence Resolver
 * Phase 2: Evidence Anchors & Grounding Subsystem
 *
 * Safely queries Git and the local filesystem to resolve historical commit
 * blobs, current working-tree content, and rename detection.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Checks if Git is installed and available in the given repository path.
 *
 * @param {string} repoPath
 * @returns {boolean}
 */
export function isGitAvailable(repoPath = process.cwd()) {
  try {
    const res = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return res.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Checks whether an immutable Git commit SHA exists in the local repository.
 *
 * @param {string} gitRef - Commit SHA
 * @param {string} repoPath - Path to repository root
 * @returns {boolean}
 */
export function verifyCommitExists(gitRef, repoPath = process.cwd()) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${gitRef}^{commit}`], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads historical file content from an immutable Git commit blob.
 *
 * @param {string} gitRef - Commit SHA
 * @param {string} filePath - Repository-relative file path
 * @param {string} repoPath - Repository root directory
 * @returns {{ exists: boolean, content?: string, commitExists: boolean, error?: string }}
 */
export function readBlobAtCommit(gitRef, filePath, repoPath = process.cwd()) {
  const commitExists = verifyCommitExists(gitRef, repoPath);
  if (!commitExists) {
    return { exists: false, commitExists: false, error: `Commit '${gitRef}' does not exist` };
  }

  try {
    const content = execFileSync('git', ['cat-file', '-p', `${gitRef}:${filePath}`], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { exists: true, commitExists: true, content };
  } catch (err) {
    return {
      exists: false,
      commitExists: true,
      error: `File '${filePath}' not found at commit '${gitRef}': ${err.message}`,
    };
  }
}

/**
 * Reads current working-tree file content from the filesystem.
 *
 * @param {string} filePath - Repository-relative file path
 * @param {string} repoPath - Repository root directory
 * @returns {{ exists: boolean, content?: string }}
 */
export function readWorkingTreeFile(filePath, repoPath = process.cwd()) {
  const fullPath = path.resolve(repoPath, filePath);
  try {
    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return { exists: false };
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return { exists: true, content };
  } catch {
    return { exists: false };
  }
}

/**
 * Checks whether a missing file was renamed in subsequent Git history.
 *
 * @param {string} gitRef - Original commit SHA
 * @param {string} filePath - Original repository-relative file path
 * @param {string} repoPath - Repository root directory
 * @returns {{ renamed: boolean, oldPath?: string, newPath?: string }}
 */
export function detectGitRename(gitRef, filePath, repoPath = process.cwd()) {
  try {
    // Check log with rename detection from gitRef to HEAD
    const logOutput = execFileSync(
      'git',
      ['log', '-M', '--follow', '--name-status', '-1', `${gitRef}..HEAD`, '--', filePath],
      {
        cwd: repoPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      }
    );

    // Look for lines like "R100  oldPath  newPath" or "R095  oldPath  newPath"
    const lines = logOutput.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts[0].startsWith('R') && parts.length >= 3) {
        return {
          renamed: true,
          oldPath: parts[1],
          newPath: parts[2],
        };
      }
    }

    return { renamed: false };
  } catch {
    return { renamed: false };
  }
}
