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
 *   3. Slash command -- registers /project-memory so users can trigger the
 *      automatic Project Memory workflow without selecting an Agent preset.
 *
 * Events listened to (best-effort, never throws into the harness loop):
 *   - agent/pre-step    -> inject first-time-init hint (once per agent)
 *   - agent/post-step   -> inject post-task compounding prompt (opt-in)
 *   - session/start     -> inject freshness warning if pending_updates > 0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { cbmApply, getOrCreateClient } from './codebase-memory-bridge.mjs'
import { applySlashCommand } from './slash-project-memory.mjs'
import { applyEmaSlashCommand } from './slash-ema.mjs'
import { handleUIRequest, startUIServer } from '../src/ui/server.mjs'

const PLUGIN_ID = 'dsh-project-memory'

/** Path to this plugin's own source -- used to resolve skills/ relative to the repo. */
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(PLUGIN_ROOT, '..')

// ── Native DSH System Bundled Skills Provider ─────────────────────────────────

const BUNDLED_SKILL_RANK = 600
const SKILL_PROVIDER_NAME = 'project-memory'
const SKILL_INVOCATION = { modelInvocable: true, userInvocable: true }

export const BUNDLED_SKILL_DEFINITIONS = [
  {
    name: 'knowledge-classification',
    description: 'Evidence-based project knowledge classification skill. Classifies verified repository findings - including claims extracted from existing multi-origin knowledge sources (AGENTS.md, CLAUDE.md, .cursor/rules/, .claude/, docs/) - into current facts, architecture, decisions, solutions, lessons, constraints, workflows, reference, historical, or obsolete knowledge; determines current-state status, durability, and knowledge value; resolves cross-source conflicts with evidence; detects semantic duplicates across origin tools; and returns recommendation-only classification decisions to the Project Memory orchestrator without modifying repository files.'
  },
  {
    name: 'knowledge-compounding',
    description: 'Extracts durable, reusable engineering knowledge from completed work, debugging sessions, migrations, incidents, and difficult implementation tasks. Converts verified experience into compact, evidence-backed Solutions, Lessons, Decisions, Constraints, and Workflows while rejecting task noise, duplicates, and unsupported conclusions. Read-only: produces knowledge proposals; memory-edit applies them.'
  },
  {
    name: 'knowledge-discovery',
    description: 'Discovers and inventories every pre-existing project knowledge source in a repository - AGENTS.md, CLAUDE.md, .cursor/rules/, .cursorrules, .windsurfrules, .github/copilot-instructions.md, .claude/, skills/, agents/, README.md, CONTRIBUTING.md, docs/, ADRs, lessons-learned files, generated AI documentation, and prior Project Memory output. Extracts atomic claims, tags provenance, detects overlaps and contradictions. Produces the Existing Knowledge Inventory for downstream verification. Read-only; never verifies, classifies, or edits.'
  },
  {
    name: 'memory-architecture',
    description: 'Designs and restructures the repository\'s Project Memory architecture for progressive loading, low redundancy, canonical knowledge ownership, and stable navigation. Determines domains, canonical locations, indexes, cross-references, document boundaries, and current-versus-historical separation. Designs reconstruction plans consolidating knowledge scattered across pre-existing origin tools (AGENTS.md, CLAUDE.md, .cursor/rules/, docs/) into one canonical architecture without modifying repository files.'
  },
  {
    name: 'memory-edit',
    description: 'Applies approved Project Memory changes to repository documentation - scoped additions, modifications, moves, merges, deletions, thin-pointer conversions, and navigation updates, including multi-source reconstruction consolidating pre-existing origin tools (AGENTS.md, CLAUDE.md, .cursor/rules/, .claude/) into one canonical location while preserving canonical ownership, historical boundaries, and reference integrity. Delegates bounded mechanical edits to cavecrew-builder; never performs blind bulk rewrites. Appends each change to docs/CHANGELOG-MEMORY.md for audit traceability.'
  },
  {
    name: 'memory-verification',
    description: 'Final verification gate for Project Memory after auditing, classification, architecture, compounding, cleanup, and edits. Cross-checks documentation against repository evidence, tests, configuration, build/CI, Git history, knowledge ownership, lifecycle status, references, navigation, and progressive-loading paths. Detects contradictions, stale knowledge, duplicate ownership, broken references, unsupported claims, and incomplete migrations. Emits PASS | PASS WITH WARNINGS | FAIL | BLOCKED.'
  },
  {
    name: 'obsolete-knowledge',
    description: 'Audits Project Memory for stale, obsolete, deprecated, or superseded knowledge. Determines delete, historical preservation, deprecation, or supersession treatment from evidence. Prevents obsolete information from loading as current guidance while preserving valuable rationale.'
  },
  {
    name: 'repository-audit',
    description: 'Evidence-first repository auditing skill. Discovers and verifies repository state across source code, tests, configuration, build/CI, Git history, documentation, and agent instructions. Verifies claims surfaced by knowledge-discovery, detects documentation mismatches, and produces a scoped evidence inventory with explicit coverage limitations. Read-only; makes no classification decisions or edits.'
  }
];

const BUNDLED_SKILLS_DIR = existsSync(join(PLUGIN_ROOT, '..', 'skills'))
  ? join(PLUGIN_ROOT, '..', 'skills')
  : join(REPO_ROOT, 'skills');

function stripSkillFrontmatter(value) {
  const match = value.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  return match ? value.slice(match[0].length).trim() : value.trim();
}

/**
 * Creates the system bundled skill provider conforming to DSH SkillRegistry.
 */
export function createBundledSkillProvider() {
  const candidates = BUNDLED_SKILL_DEFINITIONS.map(def => {
    const dir = join(BUNDLED_SKILLS_DIR, def.name);
    const file = join(dir, 'SKILL.md');
    return {
      name: def.name,
      description: def.description,
      invocation: SKILL_INVOCATION,
      provider: SKILL_PROVIDER_NAME,
      source: 'bundled',
      resourceBase: {
        kind: 'directory',
        path: dir,
      },
      rank: BUNDLED_SKILL_RANK,
      locator: pathToFileURL(file),
    };
  });

  return {
    name: SKILL_PROVIDER_NAME,
    list: () => Promise.resolve(candidates),
    async get(candidate) {
      let filePath;
      if (candidate.locator instanceof URL) {
        filePath = fileURLToPath(candidate.locator);
      } else if (typeof candidate.locator === 'string') {
        filePath = candidate.locator;
      } else {
        filePath = join(BUNDLED_SKILLS_DIR, candidate.name, 'SKILL.md');
      }
      const raw = await readFile(filePath, 'utf8');
      return {
        name: candidate.name,
        description: candidate.description,
        invocation: candidate.invocation,
        provider: candidate.provider,
        source: candidate.source,
        ...(candidate.resourceBase ? { resourceBase: candidate.resourceBase } : {}),
        content: stripSkillFrontmatter(raw),
      };
    }
  };
}

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

// ── Post-Task Compounding ─────────────────────────────────────────────────────

/** Check whether post-task compounding is enabled. */
function isCompoundingEnabled() {
  const env = process.env.COMPOUNDING_ENABLED
  if (env === undefined) return true  // default on
  return env !== '0' && env !== 'false' && env !== 'off'
}

/** Build the post-task compounding prompt. */
function buildCompoundingPrompt(workspaceRoot, lastTaskText) {
  const taskHint = lastTaskText
    ? `\n\nThe last task was: "${lastTaskText.slice(0, 200)}${lastTaskText.length > 200 ? '…' : ''}"`
    : ''

  return `Project Memory: Post-Task Compounding Check${taskHint}

Before ending this session, consider whether the completed work produced durable
engineering learning worth preserving.

Ask yourself:
1. Did this task solve a non-obvious problem?
2. Would another Agent plausibly rediscover the same issue or make the same mistake?
3. Is there a rejected approach worth recording to prevent repetition?
4. Does the knowledge survive the Durable Bar test
   (if this disappeared, would a future Agent still repeat the mistake)?

If YES to any of these, run the \`knowledge-compounding\` skill to extract
durable learning. If NO, skip compounding — not every task produces memory.

Do NOT compound: routine commands, temporary thoughts, terminal transcripts,
generic programming advice, or information already obvious from nearby code.

Decide now: compound or skip. If skipping, say "No durable knowledge identified."`
}

// ── Static Context Injection (EMA Phase 7) ────────────────────────────────────

/**
 * Builds compact L0 static engineering context from AGENTS.md.
 * Strictly capped at tokenBudget (default 500 tokens).
 *
 * @param {string} workspaceRoot
 * @param {number} [tokenBudget=500]
 * @returns {string|null}
 */
export function buildStaticContext(workspaceRoot, tokenBudget = 500) {
  if (!workspaceRoot) return null
  const agentsFile = join(workspaceRoot, 'AGENTS.md')
  if (!existsSync(agentsFile)) return null

  try {
    const raw = readFileSync(agentsFile, 'utf8')
    let criticalRules = ''
    if (raw.includes('## Critical Rules')) {
      const start = raw.indexOf('## Critical Rules')
      const nextHeader = raw.indexOf('\n## ', start + 10)
      criticalRules = (nextHeader !== -1 ? raw.slice(start, nextHeader) : raw.slice(start)).trim()
    } else {
      criticalRules = `## Critical Rules\n1. Discover before assume\n2. Evidence before memory\n3. One canonical home per concept\n4. Current wins over historical`
    }

    const contextBlock = `[EMA Active Engineering Context]\nWorkspace: ${workspaceRoot}\n\n${criticalRules}\n\n- Scope Isolation: Hard isolation enforced across boundaries\n- Retrieval: 6-stage pipeline (Candidates excluded from active recall)`

    // Estimate tokens (4 chars per token)
    const maxChars = tokenBudget * 4
    if (contextBlock.length > maxChars) {
      return contextBlock.slice(0, maxChars - 30) + '\n...[context capped]'
    }
    return contextBlock
  } catch {
    return null
  }
}

// ── Freshness Warning ─────────────────────────────────────────────────────────

/** Check domain READMEs for pending_updates > 0 and return warning text. */
function buildFreshnessWarning(workspaceRoot) {
  try {
    const docsDir = join(workspaceRoot, 'docs')
    if (!existsSync(docsDir)) return null

    const warnings = []
    for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const readme = join(docsDir, entry.name, 'README.md')
      if (!existsSync(readme)) continue
      const content = readFileSync(readme, 'utf8')
      const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*/m)
      if (!fmMatch) continue
      const fm = parseFrontmatter(fmMatch[1])
      const pending = parseInt(fm.pending_updates, 10)
      if (!isNaN(pending) && pending > 0) {
        warnings.push(
          `- \`${entry.name}/README.md\`: ${pending} child document(s) updated since last index (${fm.last_indexed ?? 'unknown'})`
        )
      }
    }
    return warnings.length > 0
      ? `Project Memory: Domain freshness check\n\nThe following domain indexes may be stale — child documents have been updated\nsince the index was last refreshed:\n\n${warnings.join('\n')}\n\nConsider running \`/project-memory\` to refresh domain indexes.`
      : null
  } catch {
    return null
  }
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

  // 1. Register native DSH system bundled skills provider
  const registerBundled = (targetCtx) => {
    if (targetCtx?.skills && typeof targetCtx.skills.registerProvider === 'function') {
      try {
        const provider = createBundledSkillProvider();
        targetCtx.skills.registerProvider(() => provider);
        console.log(`[project-memory] registered 8 system bundled skills via ctx.skills.registerProvider`);
      } catch (err) {
        console.warn(`[project-memory] registerProvider error:`, err);
      }
    }
  };

  if (typeof ctx?.inject === 'function') {
    try {
      ctx.inject(['skills'], registerBundled);
    } catch {
      registerBundled(ctx);
    }
  } else {
    registerBundled(ctx);
  }

  // 2. Also register skills from active workspace or global directories
  const initialWs = config.workspaceRoot ?? process.cwd()
  const registeredSkills = registerWorkspaceSkills(ctx, initialWs)
  if (registeredSkills.length > 0) {
    console.log(`[project-memory] registered ${registeredSkills.length} workspace/global skill(s): ${registeredSkills.join(', ')}`)
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

   // 3. Register /project-memory and /ema slash commands (requires ctx.commands).
   if (ctx?.commands && typeof ctx.commands.register === 'function') {
     try {
       ctx.effect(() => {
         applySlashCommand(ctx, initialWs)
         applyEmaSlashCommand(ctx, initialWs)
       }, 'project-memory: slash-commands')
       console.log('[project-memory] registered /project-memory and /ema slash commands')
     } catch {
       // commands service unavailable -- skip silently
     }
   }

   // 4. Mount EMA Visual Memory Graph UI on ctx.webServer at /ema (when webServer service is available)
   if (typeof ctx.inject === 'function') {
     ctx.inject(['webServer'], (webCtx) => {
       webCtx.effect(() => {
         const dispose = webCtx.webServer.register({
           kind: 'prefix',
           path: '/ema',
           handler: async (req, res) => {
             await handleUIRequest(req, res, {
               basePath: '/ema',
               repoRoot: initialWs,
             });
           }
         }, 'project-memory: ui-server');
         return dispose;
       });
       console.log('[project-memory] mounted EMA Visual Memory Graph UI at /ema');
     });
   }

   // 5. Auto-start standalone EMA UI on port 3888 and codebase-memory-mcp (if available), and log UI URLs prominently.
   let standaloneServer = null;
   if (process.env.NODE_ENV !== 'test' && !process.execArgv.includes('--test')) {
     try {
       startUIServer({ port: 3888, repoRoot: initialWs }).then((inst) => {
         standaloneServer = inst;
       }).catch((err) => {
         if (err.code !== 'EADDRINUSE') {
           console.warn('[project-memory] standalone EMA UI server warning:', err.message);
         }
       });
     } catch {
       // best-effort
     }

     const cbmClient = getOrCreateClient();
     if (cbmClient) {
       cbmClient.start().then(() => {
         console.log('\n[project-memory] 🚀 Engineering Memory Agent is ready!');
         console.log('  📊 EMA Visual Memory Graph (mounted): http://127.0.0.1:3080/ema');
         console.log('  🌐 Standalone EMA UI:                http://127.0.0.1:3888');
         console.log('  🔍 Codebase Memory UI:               http://localhost:9749/');
         console.log('');
       }).catch((err) => {
         console.warn('[project-memory] codebase-memory-mcp failed to start:', err.message);
         // Still show the EMA UI banner even if codebase-memory fails
         console.log('\n[project-memory] 🚀 Engineering Memory Agent is ready!');
         console.log('  📊 EMA Visual Memory Graph (mounted): http://127.0.0.1:3080/ema');
         console.log('  🌐 Standalone EMA UI:                http://127.0.0.1:3888');
         console.log('');
       });
     } else {
       // codebase-memory-mcp not found, still show EMA UI banner
       console.log('\n[project-memory] 🚀 Engineering Memory Agent is ready!');
       console.log('  📊 EMA Visual Memory Graph (mounted): http://127.0.0.1:3080/ema');
       console.log('  🌐 Standalone EMA UI:                http://127.0.0.1:3888');
       console.log('  ⚠️  codebase-memory-mcp not installed (optional for advanced code search)');
       console.log('');
     }
   }

  const initHinted = new Set()
  const contextInjected = new Set()
  const compoundHinted = new Set()  // track agents that already got compounding prompt

  // Listen for agent/pre-step to inject static context and first-time-init hint when needed.
  if (typeof on === 'function') {
    try {
      on('agent/pre-step', (payload, next) => {
        try {
          const workspace = resolveWorkspace(payload)
          const agent = payload?.agent ?? payload

          // 1. Static context injection (staying under 500 tokens, once per agent)
          if (workspace && agent && !contextInjected.has(agent)) {
            const staticCtx = buildStaticContext(workspace, 500)
            if (staticCtx && typeof agent?.inject === 'function') {
              contextInjected.add(agent)
              agent.inject({
                id: crypto.randomUUID(),
                role: 'user',
                content: [{ type: 'text', text: staticCtx }],
                source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'context' },
              })
              console.log(`[project-memory] injected L0 static context (< 500 tokens) for ${workspace}`)
            }
          }

          // 2. Freshness warning: check domain READMEs for pending updates
          if (workspace) {
            const freshnessWarning = buildFreshnessWarning(workspace)
            if (freshnessWarning && typeof agent?.inject === 'function') {
              agent.inject({
                id: crypto.randomUUID(),
                role: 'user',
                content: [{ type: 'text', text: freshnessWarning }],
                source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
              })
              console.log(`[project-memory] injected freshness warning for ${workspace}`)
            }
          }

          // 3. First-time-init hint
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

    // Listen for agent/post-step to inject post-task compounding prompt.
    if (isCompoundingEnabled()) {
      try {
        on('agent/post-step', (payload, next) => {
          try {
            const workspace = resolveWorkspace(payload)
            const agent = payload?.agent ?? payload

            // Only inject once per agent per session
            if (!workspace || !agent || compoundHinted.has(agent)) return

            // Check if the last user message suggests substantial work was done
            const lastMsg = payload?.lastMessage ?? payload?.message
            const lastText = extractText(lastMsg?.content ?? lastMsg)
            const isSubstantialTask =
              lastText.length > 50 &&
              !lastText.startsWith('/project-memory') &&
              !lastText.startsWith('Project Memory')

            if (isSubstantialTask) {
              compoundHinted.add(agent)
              if (typeof agent?.inject === 'function') {
                agent.inject({
                  id: crypto.randomUUID(),
                  role: 'user',
                  content: [{ type: 'text', text: buildCompoundingPrompt(workspace, lastText) }],
                  source: { kind: 'plugin', plugin: PLUGIN_ID, form: 'instructions' },
                })
                console.log(`[project-memory] injected post-task compounding prompt for ${workspace}`)
              }
            }
          } catch {
            // best-effort
          }
          if (typeof next === 'function') return next()
          return undefined
        })
      } catch {
        // event bus missing post-step -- plugin still works
      }
    }
  }

  // 4. Return disposer -- Cordis calls this on unload.
  return () => {
    initHinted.clear()
    compoundHinted.clear()
    if (standaloneServer && typeof standaloneServer.close === 'function') {
      try { standaloneServer.close() } catch { /* ignore */ }
    }
  }
}

export const name = PLUGIN_ID
/** Services this plugin requires from Cordis. */
export const inject = ['skills', 'tools', 'commands']
