/**
 * Engineering Memory Agent (EMA) — /ema slash command
 * Phase 7: DSH Plugin & Skill Evolution
 *
 * Registers the user-facing `/ema` slash command supporting subcommands:
 *   - `/ema recall <query>`: Authoritative retrieval across authorized scopes
 *   - `/ema status`: Reports memory status, index health, candidate queue count
 *   - `/ema verify`: Runs memory verification gate across all tiers
 *   - `/ema promote <id> <scope>`: Promotes candidate or project EKU to target scope
 *   - `/ema`: Defaults to automatic EMA inspection & recall workflow
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createUserMessage } from '@deepseek-ai/dsh-llm';

const COMMAND_NAME = 'ema';
const PLUGIN_ID = 'dsh-engineering-memory';

/**
 * Parses user input string into subcommand and arguments.
 * @param {string} text
 * @returns {{ subcommand: string, args: string[] }}
 */
export function parseEmaCommand(text = '') {
  const trimmed = text.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { subcommand: 'default', args: [] };
  }

  const sub = parts[0].toLowerCase();
  const knownSubs = ['recall', 'status', 'verify', 'promote', 'ui', 'ingest'];
  if (knownSubs.includes(sub)) {
    return { subcommand: sub, args: parts.slice(1) };
  }

  return { subcommand: 'default', args: parts };
}

/**
 * Builds the appropriate prompt based on the /ema subcommand.
 *
 * @param {string} subcommand
 * @param {string[]} args
 * @param {string} workspaceRoot
 * @returns {string} Prompt text to inject into agent followup
 */
export function buildEmaPrompt(subcommand, args = [], workspaceRoot = '') {
  switch (subcommand) {
    case 'recall': {
      const query = args.join(' ');
      return `Engineering Memory Agent: Recall Query
Please search authoritative engineering memory for: "${query}".
1. Apply Stage 1-6 retrieval pipeline (authorized scopes, lifecycle filtering, multi-dimensional ranking).
2. Surface any contradictions explicitly with warning banners.
3. Present results with full provenance headers.`;
    }

    case 'status': {
      return `Engineering Memory Agent: Status Check
Please check the current health and status of EMA in workspace '${workspaceRoot}':
1. Verify database index state (.ema/index.db).
2. Count pending candidates in .ema/candidates/.
3. Check for any stale or quarantined knowledge units.
4. Report memory summary and scope breakdown.`;
    }

    case 'verify': {
      return `Engineering Memory Agent: Memory Verification Gate
Please execute the full memory-verification skill across all tiers:
1. Verify evidence anchors and Git commit references.
2. Check 4-dimensional lifecycle consistency.
3. Validate scope boundaries and isolation rules.
4. Output verification verdict: PASS | PASS WITH WARNINGS | FAIL.`;
    }

    case 'promote': {
      const id = args[0] || '<candidate-id>';
      const targetScope = args[1] || 'project';
      return `Engineering Memory Agent: Scope Promotion Request
Please validate and promote knowledge unit '${id}' to '${targetScope}' scope:
1. Check actor authorization and hard isolation barriers.
2. If promoting to 'global', enforce ≥2 independent repository sources.
3. Update promoted_from lineage block and append audit log to docs/CHANGELOG-MEMORY.md.`;
    }

    case 'ui': {
      return `Engineering Memory Agent: Visual Memory Graph
Access the EMA Visual Memory Graph:
1. In DSH Web: Open directly in your browser at http://127.0.0.1:3080/ema (mounted automatically when dsh web runs).
2. Standalone Server: Run 'ema ui' or 'node bin/ema-cli.mjs ui --port 3888'.
3. Features: Interactive force-directed canvas graph, node coloring, live inspection drawer, and one-click candidate promotion.`;
    }

    case 'ingest': {
      return `Engineering Memory Agent: Auto-Distillation & Ingestion
Please execute auto-distillation on current changes:
1. Run 'ema ingest --git' or analyze current git diff / task findings.
2. Extract grounded evidence anchors (commit SHA, file path, symbol/line).
3. Safely store the resulting knowledge unit in .ema/candidates/ with Candidate + Unreviewed invariants.`;
    }

    case 'default':
    default: {
      return `Engineering Memory Agent: Automatic Memory Orchestration
Please run the authoritative EMA workflow for '${workspaceRoot}':
1. Inspect repository state, active scopes, and candidate queue.
2. Recall relevant architecture and solution patterns for current work.
3. Verify memory integrity and report actionable summary.`;
    }
  }
}

/**
 * Registers the /ema command on the Cordis context.
 *
 * @param {object} ctx - Cordis context
 * @param {string} [workspaceRoot] - Workspace root
 */
export function applyEmaSlashCommand(ctx, workspaceRoot) {
  if (!ctx?.commands || typeof ctx.commands.register !== 'function') {
    return;
  }

  ctx.commands.register({
    name: COMMAND_NAME,
    description: 'Engineering Memory Agent: recall, verify, promote, or inspect memory status',
    handler(invocation) {
      const rawText = typeof invocation.text === 'string' ? invocation.text : '';
      const { subcommand, args } = parseEmaCommand(rawText);
      const sessionCwd = invocation.agent?.session?.header?.cwd || workspaceRoot || process.cwd();

      const prompt = buildEmaPrompt(subcommand, args, sessionCwd);

      if (invocation.agent && typeof invocation.agent.followup === 'function') {
        invocation.agent.followup(createUserMessage({
          content: [{ type: 'text', text: prompt }],
          source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
        }));
      }

      return {
        kind: 'success',
        text: `EMA: executing '/ema ${subcommand}'… Agent is now processing your request.`,
      };
    },
  });
}

export const name = `command-${COMMAND_NAME}`;
