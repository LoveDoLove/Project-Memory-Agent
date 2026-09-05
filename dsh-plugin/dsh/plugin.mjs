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
 *      workspace. Also falls back to global skill directories (~/.agents/skills/,
 *      ~/.claude/skills/, ~/.config/opencode/skills/) if the workspace doesn't
 *      have its own skills/. This makes the 8 Project Memory skills available
 *      wherever the profile is used.
 *
 *   2. First-time init -- when AGENTS.md is absent from the workspace root,
 *      this is a brand-new project. The plugin injects a short hint asking
 *      the agent to run the memory-architecture skill to bootstrap the
 *      Project Knowledge System (AGENTS.md + all skills + agents).
 *
 * Events listened to (best-effort, never throws into the harness loop):
 *   - agent/pre-step    -> inject first-time-init hint (once per agent)
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { cbmApply } from './codebase-memory-bridge.mjs'

const PLUGIN_ID = 'dsh-project-memory'

/** Path to this plugin's own source -- used to resolve skills/ relative to the repo. */
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(PLUGIN_ROOT, '..', '..')

// - Helpers -

/** Extract plain text from a user message ContentBlocks array. */
function extractText(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter(b => b && typeof b === 'object' && b.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('\n')
    .trim()
}

/** Resolve the workspace root from a Cordis payload or session event.
 * Tries candidates first, then walks up from each candidate looking for
 * AGENTS.md (so a payload cwd inside a subdirectory still resolves correctly).
 * Returns null when no workspace can be determined (e.g. DSH web GUI without
 * an explicit project cwd), so the caller can skip init-hint injection. */
function resolveWorkspace(payload) {
  const candidates = [
    payload?.cwd,
    payload?.agent?.cwd,
    payload?.session?.header?.cwd,
    payload?.session?.cwd,
    process.cwd(),
  ].filter(c => typeof c === 'string' && c.trim())
  for (const c of candidates) {
    const trimmed = c.trim()
    // If the candidate itself has AGENTS.md, use it directly.
    if (existsSync(join(trimmed, 'AGENTS.md'))) return trimmed
    // Walk up from candidate looking for AGENTS.md (up to 6 levels).
    let dir = trimmed
    for (let i = 0; i < 6; i++) {
      if (existsSync(join(dir, 'AGENTS.md'))) return dir
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  // No candidate resolved to a workspace with AGENTS.md.
  // Return null so callers skip init-hint injection.
  return null
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

// - Core plugin logic -

/** Default skill names managed by this plugin. */
const KNOWN_SKILLS = [
  'knowledge-classification',
  'knowledge-compounding',
  'knowledge-discovery',
  'memory-architecture',
  'memory-edit',
  'memory-verification',
  'obsolete-knowledge',
  'repository-audit',
]

/** Get possible global skill directories (where install.ps1 installs skills). */
function getGlobalSkillDirs() {
  return [
    join(homedir(), '.agents', 'skills'),       // Codex / universal
    join(homedir(), '.claude', 'skills'),       // Claude
    join(homedir(), '.config', 'opencode', 'skills'), // OpenCode
  ].filter(d => existsSync(d))
}

/** Discover and register skills from multiple possible locations.
 * Priority: workspace skills/ > global ~/.agents/skills/ > other globals. */
function registerWorkspaceSkills(ctx, workspaceRoot) {
  const registered = []
  const seen = new Set()

  /** Helper to register skills from a specific directory. */
  function registerFromDir(skillsDir, label) {
    if (!existsSync(skillsDir)) return
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const skill = readSkill(join(skillsDir, entry.name))
      if (!skill) continue
      if (seen.has(skill.name)) continue
      try {
        ctx.skills.register(skill)
        registered.push(skill.name)
        seen.add(skill.name)
      } catch {
        // duplicate or missing registry -- skip silently
      }
    }
  }

  // 1. Try workspace skills/ first (project-level skills take priority)
  registerFromDir(join(workspaceRoot, 'skills'), 'workspace')

  // 2. Fall back to global skill directories
  for (const dir of getGlobalSkillDirs()) {
    registerFromDir(dir, 'global')
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

// - Cordis apply -

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

  // Register cbm_* tools when ctx.tools is available (requires codebase-memory-mcp).
  if (ctx?.tools && typeof ctx.tools.register === 'function') {
    try {
      cbmApply(ctx)
      console.log('[project-memory] registered cbm_* codebase-memory tools')
    } catch {
      // codebase-memory-mcp not available -- skip silently
    }
  }

  const initHinted = new Set()

  // Listen for agent/pre-step to inject first-time-init hint when needed.
  if (typeof on === 'function') {
    try {
      on('agent/pre-step', (payload, next) => {
        try {
          const workspace = resolveWorkspace(payload)
          const agent = payload?.agent ?? payload

          // Only inject init hint when we have a confirmed workspace
          // (i.e. one that contains AGENTS.md) AND it doesn't have one yet.
          // Skip entirely when workspace cannot be determined (null)
          // to avoid noise in DSH web GUI sessions.
          if (workspace && needsInit(workspace) && agent && !initHinted.has(agent)) {
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
  }
}

export const name = PLUGIN_ID
/** Services this plugin requires from Cordis. */
export const inject = ['skills', 'tools']
