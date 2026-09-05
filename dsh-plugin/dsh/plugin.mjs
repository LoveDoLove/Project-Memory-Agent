/**
 * @lovedolove/dsh-project-memory -- DSH glue plugin.
 *
 * Patterns borrowed from:
 *   - graphflow/dsh/plugin.mjs  (Cordis event listeners, ctx.skills.register)
 *   - modlens/dsh/index.js       (same pattern, different feature surface)
 *
 * What this plugin does:
 *   1. Skill mount -- reads the workspace root from the session payload and
 *      registers every skills\/\*\/SKILL.md found there, relative to the active
 *      workspace. This makes the 8 Project Memory skills available wherever
 *      the profile is used, not just from one hard-coded parent path.
 *
 *   2. First-time init -- when AGENTS.md is absent from the workspace root,
 *      this is a brand-new project. The plugin injects a short hint asking
 *      the agent to run the memory-architecture skill to bootstrap the
 *      Project Knowledge System (AGENTS.md + all skills + agents).
 *
 *   3. Post-task memory prompt -- on turn/end, the plugin injects a compact
 *      question into the next user message: "Want to compound memory now?"
 *      so the agent knows to run knowledge-compounding when the task is done.
 *
 * Events listened to (best-effort, never throws into the harness loop):
 *   - agent/pre-step    -> inject first-time-init hint (once per agent)
 *   - session/event     -> inject post-task prompt on turn/end
 *   - agent/inbox/inserted (future) -> could auto-discover workspace on paste
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLUGIN_ID = 'dsh-project-memory'

/** Path to this plugin's own source -- used to resolve skills/ relative to the repo. */
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(PLUGIN_ROOT, '..', '..')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract plain text from a user message ContentBlocks array. */
function extractText(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter(b => b && typeof b === 'object' && b.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('\n')
    .trim()
}

/** Resolve the workspace root from a Cordis payload or session event. */
function resolveWorkspace(payload) {
  const candidates = [
    payload?.cwd,
    payload?.agent?.cwd,
    payload?.session?.header?.cwd,
    payload?.session?.cwd,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return process.cwd()
}

/** Read a skill SKILL.md and return its {name, description, content}. */
function readSkill(skillDir) {
  const skillFile = join(skillDir, 'SKILL.md')
  if (!existsSync(skillFile)) return null
  const content = readFileSync(skillFile, 'utf8')
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*/m)
  const meta = fmMatch ? parseFrontmatter(fmMatch[1]) : {}
  const body = fmMatch ? content.slice(fmMatch[0].length) : content
  return {
    name: meta.name || skillDir.split(/[/\\]/).pop(),
    description: meta.description || '',
    content: body.trim(),
    source: 'runtime',
    path: skillFile,
  }
}

function parseFrontmatter(block) {
  const out = {}
  for (const line of block.split('\n')) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    // Strip optional quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

// ── Core plugin logic ────────────────────────────────────────────────────────

/** Discover and register all skills relative to workspaceRoot. */
function registerWorkspaceSkills(ctx, workspaceRoot) {
  const skillsDir = join(workspaceRoot, 'skills')
  if (!existsSync(skillsDir)) return []

  const registered = []
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const skill = readSkill(join(skillsDir, entry.name))
    if (!skill) continue
    try {
      ctx.skills.register(skill)
      registered.push(skill.name)
    } catch {
      // duplicate or missing registry -- skip silently
    }
  }
  return registered
}

/** Check whether AGENTS.md exists -- absence means first-time init. */
function needsInit(workspaceRoot) {
  return !existsSync(join(workspaceRoot, 'AGENTS.md'))
}

/** First-time-init hint text. */
function buildInitHint(workspaceRoot) {
  return `Project Memory: this workspace has no AGENTS.md yet -- run the \`memory-architecture\` skill to bootstrap the Project Knowledge System. The 8 Project Memory skills are now available.`
}

/** Post-task memory-compound prompt. */
function buildPostTaskHint(workspaceRoot, taskId) {
  return `Task ${taskId} completed. Want to compound memory now? Run \`knowledge-compounding\` to extract durable lessons from this session.`
}

// ── Cordis apply ─────────────────────────────────────────────────────────────

/**
 * Main entry point -- called by Cordis when this plugin row is loaded.
 * @param {object} ctx  duck-typed Cordis context (skills, on, connection)
 * @param {object} [config]  optional plugin config
 * @returns {function?} disposer, called on unload
 */
export function apply(ctx, config = {}) {
  const skills = ctx?.skills
  const on = ctx?.on

  // 1. Register skills from the active workspace on load.
  //    The workspace root is whatever the session was started in.
  const initialWs = config.workspaceRoot ?? process.cwd()
  const registeredSkills = registerWorkspaceSkills(ctx, initialWs)
  if (registeredSkills.length > 0) {
    console.log(`[project-memory] registered ${registeredSkills.length} skill(s): ${registeredSkills.join(', ')}`)
  }

  const initHinted = new Set()
  const promptedTurns = new WeakSet()

  // 2. Listen for session events -> inject post-task prompt on turn/end.
  if (typeof on === 'function') {
    try {
      on('session/event', (session, event) => {
        try {
          if (!event || typeof event !== 'object') return
          const type = event?.type
          const data = event?.data

          // Agent turned: inject memory prompt.
          if (type === 'turn/end') {
            const reason = data?.reason ?? event?.reason
            const kind = reason && typeof reason === 'object' ? reason.kind : undefined
            // Skip interrupted/aborted turns.
            if (kind === 'interrupted' || kind === 'aborted') return

            const workspace = resolveWorkspace(session?.header ?? session ?? {})
            const taskId = `#${event?.seq ?? session?.id ?? '?'}`

            // Only prompt once per turn (avoid duplicate injections).
            if (promptedTurns.has(event)) return
            promptedTurns.add(event)

            // Only prompt if the workspace has AGENTS.md (i.e. memory system exists).
            // For new workspaces, we only show the init hint (handled by pre-step).
            if (!existsSync(join(workspace, 'AGENTS.md'))) return

            // Inject a compact user message at the end of the turn.
            // We append to the session's next user prompt via agent/pre-step.
            const hint = buildPostTaskHint(workspace, taskId)
            if (!session?.header?.cwd) return
            // Store hint on session for pre-step to pick up.
            if (!session.__pmPostTaskHint) session.__pmPostTaskHint = hint
          }
        } catch {
          // best-effort
        }
      })

      // 3. On agent/pre-step, inject first-time-init hint if needed.
      on('agent/pre-step', (payload, next) => {
        try {
          const workspace = resolveWorkspace(payload)
          const agent = payload?.agent ?? payload

          // First-time init hint (once per agent).
          if (needsInit(workspace) && agent && !initHinted.has(agent)) {
            initHinted.add(agent)
            if (typeof agent?.inject === 'function') {
              agent.inject({
                id: crypto.randomUUID(),
                role: 'user',
                content: [{ type: 'text', text: buildInitHint(workspace) }],
                source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
              })
              console.log(`[project-memory] injected first-time-init hint for ${workspace}`)
            }
          }

          // Post-task prompt -- prepend to next user turn if queued.
          // We scan all open sessions for queued hints.
          if (typeof ctx.get === 'function') {
            try {
              const sessions = ctx.get('sessions')
              if (sessions && typeof sessions.list === 'function') {
                for (const session of sessions.list()) {
                  const hint = session?.__pmPostTaskHint
                  if (hint && typeof agent?.inject === 'function') {
                    agent.inject({
                      id: crypto.randomUUID(),
                      role: 'user',
                      content: [{ type: 'text', text: hint }],
                      source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
                    })
                    delete session.__pmPostTaskHint
                  }
                }
              }
            } catch {
              // sessions service unavailable -- skip
            }
          }
        } catch {
          // best-effort
        }
        if (typeof next === 'function') return next()
        return undefined
      })
    } catch {
      // event bus missing -- plugin still works (skills are registered above)
    }
  }

  // 4. Return disposer -- Cordis calls this on unload.
  return () => {
    initHinted.clear()
    promptedTurns.clear()
  }
}

export const name = PLUGIN_ID
/** Services this plugin requires from Cordis. */
export const inject = ['skills']
