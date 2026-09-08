# DSH Plugin Lifecycle Evidence
#
# This file documents the lifecycle verification of @lovedolove/dsh-project-memory v0.4.26.
# Evidence is captured via isolated temporary profiles to avoid affecting real user data.
#
# Verification steps (read-only / isolated):
#   1. install  - dry-run package inspection + npm pack validation
#   2. start    - syntax check on all entry points (no runtime execution)
#   3. uninstall - no state to clean; bundle is npm-managed

## 1. Install Evidence

### 1a. npm pack --dry-run (package contents)
```
npm notice package: @lovedolove/dsh-project-memory@0.4.26
npm notice Tarball Contents
npm notice 836B  cordis.patch.yml
npm notice 12.1kB dsh/codebase-memory-bridge.mjs
npm notice 9.9kB  dsh/plugin.mjs
npm notice 5.4kB  dsh/slash-project-memory.mjs
npm notice 571B   lib/index.js
npm notice 1.3kB  package.json
npm notice total files: 6
```

### 1b. npm ls (dependency graph — no extraneous packages)
```
@lovedolove/dsh-project-memory@0.4.26
+-- @deepseek-ai/cordis@4.0.2
`-- @deepseek-ai/dsh-llm@0.1.2-rc.1
```
No extraneous or unexpected packages. `@deepseek-ai/dsh-skill-filesystem` removed (entry ID collision fix).

### 1c. dsh.bundle manifest validation
`dsh-plugin/package.json` declares:
```json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "compatibility": {
    "dshReleases": {
      "0.1.2-rc.1": "compatible",
      "0.1.3-alpha.1": "compatible",
      "0.1.3-alpha.2": "compatible"
    },
    "nodeVersions": ">=18.0.0 <23.0.0",
    "dshVersions": ">=0.1.2-rc.1 <0.2.0-0"
  }
}
```

### 1d. cordis.patch.yml entries (no protected ID collisions)
```yaml
- insert:
    - id: pma-skill-dir          # unique: not skill-filesystem
      name: cordis:plugin
      config:
        customSkillDirs: [skills]
        includeDefaultRoots: true
- insert:
    - id: project-memory-dsh     # unique plugin loader ID
      name: '@lovedolove/dsh-project-memory/dsh'
```

## 2. Start Evidence (static validation — no profile execution)

### 2a. Node.js syntax check (all entry points)
```
node --check lib/index.js           → exit 0  ✓
node --check dsh/plugin.mjs         → exit 0  ✓
node --check dsh/slash-project-memory.mjs → exit 0  ✓
node --check dsh/codebase-memory-bridge.mjs → exit 0  ✓
```

### 2b. Export validation
| Entry Point | Exported Name | Exported inject |
|---|---|---|
| `lib/index.js` | `dsh-project-memory` | `[]` |
| `dsh/plugin.mjs` | `dsh-project-memory` | `['skills','tools','commands']` |
| `dsh/slash-project-memory.mjs` | `command-project-memory` | — |

### 2c. No protected component impersonation
- No `@deepseek-ai/*` package re-export / override
- No replacement of official DSH entry IDs (`skill-filesystem` is NOT used)
- `@deepseek-ai/dsh-llm` used only for `createUserMessage` (standard dependency)
- `@deepseek-ai/dsh-tools` is a DSH-host-provided module (not listed as dependency — correct)

## 3. Uninstall Evidence
No persistent state is written by the bundle itself. All install/uninstall is managed by:
- DSH profile plugin system (`dsh plugin --profile <name> remove @lovedolove/dsh-project-memory`)
- npm (uninstall removes node_modules, no leftover files)

## 4. Entry ID Inventory
| ID | Type | Owner | Status |
|---|---|---|---|
| `pma-skill-dir` | Cordis insert row | @lovedolove/dsh-project-memory | ✅ unique |
| `project-memory-dsh` | Cordis bundle loader | @lovedolove/dsh-project-memory | ✅ unique |
| `dsh-project-memory` | Plugin module name | @lovedolove/dsh-project-memory | ✅ unique |
| `command-project-memory` | Slash command name | @lovedolove/dsh-project-memory | ✅ unique |
| `skill-filesystem` | — | NOT used by this plugin | ✅ resolved (was collision) |

## 5. SemVer
- Previous version: 0.4.25
- New version: 0.4.26
- Change type: patch (bug fix — entry ID collision resolution)
