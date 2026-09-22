/**
 * Engineering Memory Agent (EMA) — MCP Tools Definition & Handlers
 * Phase 8: Standalone MCP Server & CLI Tooling
 *
 * Implements the 5 standard MCP tools:
 *   1. ema_recall
 *   2. ema_add
 *   3. ema_context
 *   4. ema_validate
 *   5. ema_promote
 */

import { emaRecall } from '../retrieval/index.mjs';
import { createCandidate, getCandidate } from '../storage/candidate-store.mjs';
import { validateCandidate, promoteScope } from '../promotion/index.mjs';
import { initIndex, defaultIndexPath } from '../index/db.mjs';

/**
 * Returns tool specifications for MCP `tools/list`.
 */
export function getToolDefinitions() {
  return [
    {
      name: 'ema_recall',
      description: 'Query authoritative engineering memory using the 6-stage retrieval pipeline with multi-dimensional ranking and explicit contradiction surfacing.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string' },
          scope: { type: 'string', enum: ['project', 'workspace', 'global'], description: 'Optional knowledge scope' },
          limit: { type: 'integer', default: 10, description: 'Maximum results to return' },
          include_warnings: { type: 'boolean', default: true, description: 'Include warnings for deprecated or stale units' },
        },
        required: ['query'],
      },
    },
    {
      name: 'ema_add',
      description: 'Propose a new knowledge unit into the candidate queue (.ema/candidates/). Always creates an unvalidated Candidate, never modifies canonical storage directly.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the knowledge unit' },
          content: { type: 'string', description: 'Detailed knowledge body text' },
          evidence_path: { type: 'string', description: 'Source code path or canonical evidence URI' },
          confidence: { type: 'string', enum: ['High', 'Medium', 'Low'], default: 'Medium' },
          type: { type: 'string', description: 'Knowledge type: Solution | Lesson | Decision | Constraint | Workflow | Architecture' },
          scope: { type: 'string', enum: ['project', 'workspace', 'global'], default: 'project' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'ema_context',
      description: 'Construct a token-budgeted prompt context block from authoritative memory, annotated with provenance headers and contradiction alerts.',
      inputSchema: {
        type: 'object',
        properties: {
          task_description: { type: 'string', description: 'Active engineering task description to find relevant context for' },
          token_budget: { type: 'integer', default: 500, description: 'Maximum token budget for generated context' },
          tier: { type: 'string', enum: ['L0', 'L1', 'L2'], default: 'L2' },
        },
      },
    },
    {
      name: 'ema_validate',
      description: 'Validate a candidate knowledge unit in the candidate queue with an explicit decision (Verified, Invalid, Needs Review).',
      inputSchema: {
        type: 'object',
        properties: {
          candidate_id: { type: 'string', description: 'ID of the candidate to validate' },
          decision: { type: 'string', enum: ['Verified', 'Invalid', 'Needs Review'], description: 'Validation verdict' },
          notes: { type: 'string', description: 'Validation notes or evidence references' },
        },
        required: ['candidate_id', 'decision'],
      },
    },
    {
      name: 'ema_promote',
      description: 'Promote an approved candidate to canonical knowledge scope (project, workspace, or global). Enforces actor authorization and global source independence (>= 2 repos).',
      inputSchema: {
        type: 'object',
        properties: {
          candidate_id: { type: 'string', description: 'ID of the candidate to promote' },
          target_scope: { type: 'string', enum: ['project', 'workspace', 'global'], description: 'Target knowledge scope' },
          rationale: { type: 'string', description: 'Engineering rationale for promotion' },
        },
        required: ['candidate_id', 'target_scope', 'rationale'],
      },
    },
    {
      name: 'ema_distill',
      description: 'Automatically distill and capture knowledge from a Git diff or text into the quarantined candidate queue (.ema/candidates/) with grounded evidence anchors. Never writes directly to canonical docs.',
      inputSchema: {
        type: 'object',
        properties: {
          diff: { type: 'string', description: 'Unified Git diff text to analyze and ground' },
          text: { type: 'string', description: 'Task summary or engineering explanation to distill' },
          title: { type: 'string', description: 'Optional explicit title for the candidate' },
          from_git: { type: 'boolean', description: 'Extract diff automatically from current Git working tree', default: false },
          scope: { type: 'string', enum: ['project', 'workspace', 'global'], default: 'project' },
        },
      },
    },
  ];
}

/**
 * Executes an MCP tool call by name.
 *
 * @param {string} toolName - Tool name
 * @param {object} args - Tool arguments
 * @param {object} context - Execution context ({ db, projectRoot, candidateDir, docsDir, changelogPath })
 * @returns {Promise<object>} Result payload
 */
export async function executeToolCall(toolName, args = {}, context = {}) {
  const projectRoot = context.projectRoot || process.cwd();
  const db = context.db || initIndex(defaultIndexPath(projectRoot));

  switch (toolName) {
    case 'ema_recall': {
      const recallRes = emaRecall(args.query || '', {
        db,
        actor: context.actor || 'agent',
        scope: args.scope,
        limit: args.limit || 10,
        context: {
          currentScopeId: context.currentScopeId || 'default-project',
          isIsolated: context.isIsolated || false,
        },
      });

      return {
        results: recallRes.results,
        explainability: recallRes.explainability,
        contradictions: recallRes.contradictions,
      };
    }

    case 'ema_add': {
      const candidate = createCandidate(
        {
          title: args.title,
          body_text: args.content,
          type: args.type || 'Solution',
          confidence: args.confidence || 'Medium',
          scope: args.scope || 'project',
          evidence: args.evidence_path ? [args.evidence_path] : [],
        },
        context.candidateDir
      );

      return {
        candidate_id: candidate.id,
        status: 'candidate_created',
        candidate,
      };
    }

    case 'ema_context': {
      const query = args.task_description || 'general architecture';
      const recallRes = emaRecall(query, {
        db,
        actor: context.actor || 'agent',
        limit: 10,
        tokenBudget: args.token_budget || 500,
        tier: args.tier || 'L2',
        context: {
          currentScopeId: context.currentScopeId || 'default-project',
          isIsolated: context.isIsolated || false,
        },
      });

      return {
        context_markdown: recallRes.contextMarkdown,
        token_count: recallRes.tokenCount,
        scope_breakdown: recallRes.explainability?.explainabilityLog?.scopeBreakdown || {},
      };
    }

    case 'ema_validate': {
      const updated = validateCandidate(args.candidate_id, args.decision, {
        actor: context.actor || 'agent',
        candidateDir: context.candidateDir,
        notes: args.notes || '',
      });

      return {
        candidate_id: updated.id,
        validation_state: updated.validation_state,
        status: 'validated',
      };
    }

    case 'ema_promote': {
      const result = promoteScope(args.candidate_id, args.target_scope, args.rationale, {
        actor: context.actor || 'project_admin',
        candidateDir: context.candidateDir,
        docsDir: context.docsDir,
        changelogPath: context.changelogPath,
        writeToDisk: true,
      });

      return {
        candidate_id: args.candidate_id,
        scope: result.promotedEKU.scope,
        status: 'promoted',
        promoted_from: result.promotedEKU.promoted_from,
        file_path: result.filePath,
      };
    }

    case 'ema_distill': {
      const { ingestKnowledge } = await import('../ingest/distill.mjs');
      const result = ingestKnowledge(
        {
          diff: args.diff,
          text: args.text,
          fromGitWorkingTree: args.from_git,
        },
        {
          title: args.title,
          scope: args.scope || 'project',
          repoRoot: projectRoot,
          candidateDir: context.candidateDir,
          db,
        }
      );

      return {
        candidate_id: result.candidateId,
        title: result.candidate.title,
        authority_level: result.candidate.authority_level,
        validation_state: result.candidate.validation_state,
        evidence_count: result.candidate.evidence ? result.candidate.evidence.length : 0,
        filePath: result.filePath,
      };
    }

    default:
      throw new Error(`Unknown tool: '${toolName}'`);
  }
}
