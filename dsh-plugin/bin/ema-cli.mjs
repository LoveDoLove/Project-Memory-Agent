#!/usr/bin/env node
/**
 * Engineering Memory Agent (EMA) — Maintenance CLI Tooling
 * Phase 8: Standalone MCP Server & CLI Tooling
 */

import fs from 'node:fs';
import path from 'node:path';
import { rebuildIndex } from '../src/index/rebuild.mjs';
import { initIndex, closeIndex, defaultIndexPath, getIndexMeta } from '../src/index/db.mjs';
import { emaRecall } from '../src/retrieval/index.mjs';
import { listCandidates, defaultCandidateDir } from '../src/storage/candidate-store.mjs';
import { validateEKU } from '../src/core/schema.mjs';
import { parseFrontmatter } from '../src/index/rebuild.mjs';
import { startUIServer } from '../src/ui/server.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  const projectRoot = process.cwd();

  switch (command) {
    case 'index': {
      const docsDir = args[1] || path.join(projectRoot, 'docs');
      console.log(`[EMA CLI] Rebuilding derived index from '${docsDir}'...`);
      const startTime = Date.now();
      const stats = rebuildIndex(docsDir, { projectRoot });
      const elapsed = Date.now() - startTime;
      console.log(`[EMA CLI] Index rebuilt successfully in ${elapsed}ms:`);
      console.log(`  - Indexed units: ${stats.indexed}`);
      console.log(`  - Skipped files: ${stats.skipped}`);
      console.log(`  - Failed files: ${stats.failed}`);
      break;
    }

    case 'verify': {
      const docsDir = args[1] || path.join(projectRoot, 'docs');
      console.log(`[EMA CLI] Verifying knowledge units in '${docsDir}'...`);

      let total = 0;
      let valid = 0;
      let invalid = 0;
      let skipped = 0;
      const issues = [];

      function walk(dir) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.ema' && entry.name !== 'research') {
              walk(fullPath);
            }
          } else if (entry.name.endsWith('.md')) {
            total++;
            const content = fs.readFileSync(fullPath, 'utf8');
            const { frontmatter } = parseFrontmatter(content);
            if (!frontmatter || Object.keys(frontmatter).length === 0) {
              skipped++;
              continue;
            }
            const validation = validateEKU(frontmatter);
            if (validation.valid) {
              valid++;
            } else {
              invalid++;
              issues.push({ path: fullPath, error: validation.errors.join(', ') });
            }
          }
        }
      }

      walk(docsDir);

      console.log(`[EMA CLI] Verification complete:`);
      console.log(`  - Total files scanned: ${total}`);
      console.log(`  - Valid units: ${valid}`);
      console.log(`  - Non-EKU / skipped docs: ${skipped}`);
      console.log(`  - Issues detected: ${invalid}`);

      if (issues.length > 0) {
        console.log(`\nIssues:`);
        for (const iss of issues) {
          console.log(`  - ${path.relative(projectRoot, iss.path)}: ${iss.error}`);
        }
      }
      break;
    }

    case 'status': {
      const dbPath = defaultIndexPath(projectRoot);
      const candDir = defaultCandidateDir(projectRoot);

      console.log(`[EMA CLI] Status Report for '${projectRoot}':`);

      if (fs.existsSync(dbPath)) {
        try {
          const db = initIndex(dbPath);
          const meta = getIndexMeta(db);
          const countRow = db.prepare('SELECT COUNT(*) as count FROM eku').get();
          closeIndex(db);
          console.log(`  - Database: ${dbPath} (Schema version: ${meta.schema_version})`);
          console.log(`  - Indexed knowledge units: ${countRow.count}`);
        } catch (err) {
          console.log(`  - Database error: ${err.message}`);
        }
      } else {
        console.log(`  - Database: Not initialized (.ema/index.db does not exist)`);
      }

      const candidates = listCandidates(candDir);
      console.log(`  - Pending candidates: ${candidates.length} in '${candDir}'`);
      break;
    }

    case 'recall': {
      const query = args.slice(1).join(' ');
      if (!query.trim()) {
        console.error('[EMA CLI] Error: Please provide a search query.');
        process.exit(1);
      }

      const dbPath = defaultIndexPath(projectRoot);
      if (!fs.existsSync(dbPath)) {
        console.error(`[EMA CLI] Error: Database not found at ${dbPath}. Run 'ema index' first.`);
        process.exit(1);
      }

      const db = initIndex(dbPath);
      try {
        const res = emaRecall(query, {
          db,
          actor: 'agent',
          context: { currentScopeId: 'cli-project' },
        });

        console.log(`[EMA CLI] Found ${res.results.length} result(s) for "${query}":\n`);
        for (const [idx, item] of res.results.entries()) {
          console.log(`[${idx + 1}] ${item.title} (Score: ${item.scores?.composite})`);
          console.log(`    Scope: ${item.scope} | Status: ${item.status} | Validation: ${item.validation_state}`);
          if (item.warnings && item.warnings.length > 0) {
            console.log(`    ⚠️  Warnings: ${item.warnings.join('; ')}`);
          }
          if (item.contradiction?.detected) {
            console.log(`    🚨 Contradiction: ${item.contradiction.banners[0]}`);
          }
          console.log('');
        }
      } finally {
        closeIndex(db);
      }
      break;
    }

    case 'ui': {
      let port = 3888;
      let host = '127.0.0.1';

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--port' && args[i + 1]) {
          port = parseInt(args[i + 1], 10) || 3888;
          i++;
        } else if (args[i] === '--host' && args[i + 1]) {
          host = args[i + 1];
          i++;
        }
      }

      console.log(`[EMA CLI] Starting Visual Memory Graph server...`);
      const { url } = await startUIServer({ port, host, repoRoot: projectRoot });
      console.log(`\n  🚀 EMA Visual Memory Graph is running at:`);
      console.log(`     ${url}\n`);
      console.log(`  Press Ctrl+C to stop.\n`);

      // Keep process alive
      await new Promise(() => {});
      break;
    }

    case 'ingest': {
      const { ingestKnowledge } = await import('../src/ingest/distill.mjs');
      let diffPath = null;
      let textInput = null;
      let fromGit = false;
      let title = null;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--diff' && args[i + 1]) {
          diffPath = args[i + 1];
          i++;
        } else if (args[i] === '--text' && args[i + 1]) {
          textInput = args[i + 1];
          i++;
        } else if (args[i] === '--title' && args[i + 1]) {
          title = args[i + 1];
          i++;
        } else if (args[i] === '--git') {
          fromGit = true;
        }
      }

      let input = {};
      if (diffPath) {
        input.diff = fs.readFileSync(path.resolve(projectRoot, diffPath), 'utf8');
      } else if (textInput) {
        input.text = textInput;
      } else {
        // Default to Git working tree
        fromGit = true;
        input.fromGitWorkingTree = true;
      }

      console.log(`[EMA CLI] Ingesting knowledge into candidate queue...`);
      const res = ingestKnowledge(input, { repoRoot: projectRoot, title });

      console.log(`\n  ✅ Successfully captured candidate knowledge unit:`);
      console.log(`     - Candidate ID:     ${res.candidateId}`);
      console.log(`     - Title:            ${res.candidate.title}`);
      console.log(`     - Authority Level:  ${res.candidate.authority_level} (Quarantined)`);
      console.log(`     - Validation:       ${res.candidate.validation_state}`);
      console.log(`     - Evidence Anchors: ${(res.candidate.evidence || []).length}`);
      console.log(`     - Saved File:       ${path.relative(projectRoot, res.filePath)}`);
      console.log(`\n  👉 Review or promote with:`);
      console.log(`     ema promote ${res.candidateId} project\n`);
      break;
    }

    case 'promote': {
      const { promoteScope } = await import('../src/promotion/pipeline.mjs');
      const candidateId = args[1];
      const targetScope = args[2] || 'project';
      if (!candidateId) {
        console.error('[EMA CLI] Error: Please provide a candidate ID to promote. Example: ema promote <id> project');
        process.exit(1);
      }

      console.log(`[EMA CLI] Promoting candidate '${candidateId}' to ${targetScope} scope...`);
      const promoteRes = promoteScope(candidateId, targetScope, 'Promoted via EMA CLI', {
        actor: 'human',
        candidateDir: path.join(projectRoot, '.ema', 'candidates'),
        docsDir: path.join(projectRoot, 'docs'),
        writeToDisk: true,
      });

      if (promoteRes.success) {
        console.log(`\n  🎉 Candidate promoted successfully!`);
        console.log(`     - New Canonical Path: ${promoteRes.filePath}`);
        console.log(`     - Scope:              ${promoteRes.promotedEKU.scope}`);
        console.log(`     - Authority Level:    ${promoteRes.promotedEKU.authority_level}\n`);
      } else {
        console.error(`\n  ❌ Promotion failed.`);
        process.exit(1);
      }
      break;
    }

    case 'help':
    default: {
      console.log(`Engineering Memory Agent (EMA) CLI

Usage:
  ema index [docsDir]            Rebuild derived SQLite + vector index from Markdown docs
  ema verify [docsDir]           Validate all knowledge units against EKU Schema v2
  ema status                     Report database health, index counts, and candidate queue
  ema recall <query>             Execute 6-stage authoritative recall query
  ema ui [--port 3888]           Launch interactive Visual Memory Graph Web UI
  ema ingest [--git|--diff|--text] Auto-distill and capture knowledge into candidate queue
  ema promote <id> [scope]       Promote candidate to canonical knowledge (project|workspace)
  ema help                       Display this help message
`);
      break;
    }
  }
}

main().catch((err) => {
  console.error(`[EMA CLI] Fatal error:`, err);
  process.exit(1);
});
