#!/usr/bin/env node
/**
 * Engineering Memory Agent (EMA) — Documentation Migration Script
 * Phase 9: Migration, Multi-Project Validation & Rollout
 *
 * Migrates legacy PMA v0.4 documentation files in docs/ to EKU Schema v2.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, serializeFrontmatter, validateEKU } from '../src/core/schema.mjs';

const projectRoot = process.cwd();
const docsDir = path.join(projectRoot, 'docs');

function migrateDocument(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return { skipped: true, reason: 'No frontmatter' };
  }

  // Derive title
  const title = frontmatter.title || path.basename(filePath, '.md');

  // Derive type
  let type = frontmatter.type;
  if (!type) {
    const cat = (frontmatter.category || '').toLowerCase();
    const probType = (frontmatter.problem_type || '').toLowerCase();
    const relPath = path.relative(docsDir, filePath);

    if (relPath.startsWith('lessons')) {
      type = 'lesson';
    } else if (relPath.startsWith('solutions')) {
      type = 'solution';
    } else if (cat === 'reference' || cat === 'architecture' || relPath === 'architecture.md') {
      type = 'reference';
    } else if (probType === 'bug' || probType === 'issue') {
      type = 'solution';
    } else {
      type = 'fact';
    }
  }

  // Derive status
  let status = frontmatter.status || 'Current';
  if (status.toLowerCase() === 'active') {
    status = 'Current';
  }

  // Schema v2 4-D Dimensions
  const validation_state = frontmatter.validation_state || 'Verified';
  const authority_level = frontmatter.authority_level || 'Canonical';
  const confidence = frontmatter.confidence || 'High';
  const scope = frontmatter.scope || 'project';
  const isolation = frontmatter.isolation || 'soft';

  // Dates
  const created = frontmatter.created || '2026-09-05';
  const last_verified = frontmatter.last_verified || new Date().toISOString().slice(0, 10);

  const migratedFM = {
    title,
    type,
    status,
    validation_state,
    authority_level,
    confidence,
    scope,
    isolation,
    created,
    last_verified,
  };

  if (frontmatter.tags) migratedFM.tags = frontmatter.tags;
  if (frontmatter.module) migratedFM.module = frontmatter.module;
  if (frontmatter.severity) migratedFM.severity = frontmatter.severity;
  if (frontmatter.evidence) migratedFM.evidence = frontmatter.evidence;
  if (frontmatter.related) migratedFM.related = frontmatter.related;

  const valResult = validateEKU(migratedFM);
  if (!valResult.valid) {
    return { skipped: true, error: valResult.errors.join(', ') };
  }

  const updatedMarkdown = serializeFrontmatter(migratedFM, body);
  fs.writeFileSync(filePath, updatedMarkdown, 'utf8');

  return { skipped: false, migratedFM };
}

function run() {
  console.log(`[EMA Migration] Scanning knowledge docs in '${docsDir}'...`);

  const targetFiles = [
    path.join(docsDir, 'architecture.md'),
    path.join(docsDir, 'lessons', 'cordis-inject-contract.md'),
    path.join(docsDir, 'solutions', 'dsh-plugin-troubleshooting.md'),
  ];

  for (const file of targetFiles) {
    if (fs.existsSync(file)) {
      const res = migrateDocument(file);
      if (res.skipped) {
        console.log(`  - ⚠️  Skipped ${path.relative(projectRoot, file)}: ${res.reason || res.error}`);
      } else {
        console.log(`  - ✔ Migrated ${path.relative(projectRoot, file)} to Schema v2`);
      }
    }
  }

  console.log('[EMA Migration] Knowledge docs migration complete.');
}

run();
