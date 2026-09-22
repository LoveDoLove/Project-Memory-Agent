/**
 * @lovedolove/dsh-project-memory — /project-memory slash command.
 *
 * Registers the user-facing `/project-memory` command that automatically
 * orchestrates Project Memory work: detect state, initialize / audit /
 * update / verify, and delegate to existing skills.
 *
 * The handler injects a structured prompt into the agent inbox so the
 * current agent (any preset) runs the workflow using available skills.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createUserMessage } from '@deepseek-ai/dsh-llm'

const COMMAND_NAME = 'project-memory'
const PLUGIN_ID = 'dsh-project-memory'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve the workspace root the same way the main plugin does. */
function resolveWorkspace(cwd) {
  const candidates = [cwd, process.cwd()].filter(c => typeof c === 'string' && c.trim())
  for (const c of candidates) {
    const trimmed = c.trim()
    if (existsSync(join(trimmed, 'AGENTS.md'))) return trimmed
    let dir = trimmed
    for (let i = 0; i < 6; i++) {
      const parent = join(dir, '..')
      if (parent === dir) break
      if (existsSync(join(dir, 'AGENTS.md'))) return dir
      dir = parent
    }
  }
  return null
}

/** Build the automatic workflow prompt injected into the agent inbox. */
function buildWorkflowPrompt(workspaceRoot, hasMemory, traceEnabled = false) {
  const traceNote = traceEnabled
    ? `\n\n**Retrieval Trace Mode:** Record every knowledge retrieval step in a trace object.\nLog each step as it happens. Include query, route taken, confidence, and final unit.\nPrint the trace at the end of the report under "## Retrieval Trace". Do not persist this trace to any file.`
    : ''

  if (!hasMemory) {
    return `Project Memory: Automatic initialization detected.${traceNote}

This workspace has no AGENTS.md yet. Run the full initialization workflow automatically:

1. Load the \`knowledge-discovery\` skill to inventory any pre-existing knowledge sources.
2. Load the \`repository-audit\` skill to gather repository evidence.
3. Load the \`knowledge-classification\` skill to classify findings.
4. Load the \`memory-architecture\` skill to design the memory architecture.
5. Load the \`memory-edit\` skill to create AGENTS.md and the initial documentation structure.
6. Load the \`memory-verification\` skill to verify the created memory.

Follow the routing table in agents/project-memory.md for skill selection. Produce a concise final report. Do not ask the user for mode selection — this is fully automatic.`
  }

  return `Project Memory: Automatic state detection and orchestration.${traceNote}

This workspace already has Project Memory (AGENTS.md present). Run the automatic workflow:

1. Load the \`knowledge-discovery\` skill to inventory existing knowledge sources and compare against current repository state.
2. Load the \`repository-audit\` skill to gather fresh repository evidence and detect changes since last memory update.
3. Compare repository evidence against existing Project Memory to identify:
   - Stale or missing knowledge
   - Obsolete information contradicted by current code
   - Architecture or dependency changes
   - New durable learning worth compounding
4. Load only the skills required by the detected changes (do NOT run every skill every time):
   - If only minor updates needed: \`obsolete-knowledge\` + \`memory-edit\` + \`memory-verification\`
   - If architecture changed: \`memory-architecture\` + \`memory-edit\` + \`memory-verification\`
   - If obsolete knowledge detected: \`obsolete-knowledge\` + \`memory-edit\` + \`memory-verification\`
   - If new durable learning identified: \`knowledge-compounding\` + \`knowledge-classification\` + \`memory-edit\` + \`memory-verification\`
   - If no meaningful changes: skip editing, run \`memory-verification\` only
5. Load the \`memory-verification\` skill as the final gate.

Follow the routing table in agents/project-memory.md. Produce a concise final report. Do not ask the user for mode selection — this is fully automatic. Idempotent: if memory is already up to date, report so without rewriting files.`
}

// ── Command registration ───────────────────────────────────────────────────

/**
 * Register the /project-memory slash command on the given Cordis context.
 * Must be called inside a ctx.effect() so it is cleaned up on unload.
 *
 * @param {object} ctx - Cordis context (must have commands)
 * @param {string} [workspaceRoot] - optional override for the workspace root
 */
export function applySlashCommand(ctx, workspaceRoot) {
  ctx.commands.register({
    name: COMMAND_NAME,
    description: 'Automatically analyze, initialize, update, or verify Project Memory for the current repository',
    handler(invocation) {
      // Resolve workspace: prefer agent session cwd, then plugin-provided root, then process cwd
      const sessionCwd = invocation.agent?.session?.header?.cwd
      const resolvedWorkspace = resolveWorkspace(sessionCwd ?? workspaceRoot)
      const hasMemory = resolvedWorkspace !== null && existsSync(join(resolvedWorkspace, 'AGENTS.md'))

      // Parse flags from invocation text (e.g. "/project-memory --trace")
      const rawText = typeof invocation.text === 'string' ? invocation.text : ''
      const hasTraceFlag = /\b--trace\b/.test(rawText)
      const traceFlag = hasTraceFlag ? ' (retrieval trace enabled)' : ''

      const prompt = buildWorkflowPrompt(resolvedWorkspace ?? '', hasMemory, hasTraceFlag)

      invocation.agent.followup(createUserMessage({
        content: [{ type: 'text', text: prompt }],
        source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
      }))

      const status = hasMemory ? 'audit & update' : 'initialize'
      return {
        kind: 'success',
        text: `Project Memory: running ${status}${traceFlag}… The agent will now analyze the repository and update Project Memory automatically.${hasTraceFlag ? ' Retrieval traces will be logged to session output.' : ''}`,
      }
    },
  })
}

export const name = `command-${COMMAND_NAME}`
