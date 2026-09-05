---
title: "DSH Plugin Boot Failures Ã¢â‚¬â€ Triple-Layer Error Diagnosis"
problem_type: bug
category: integration_issue
module: "dsh-plugin / cordis loader"
status: active
created: "2026-09-05"
last_verified: "2026-09-05"
tags:
  - dsh
  - cordis
  - plugin
  - troubleshooting
severity: high
---

## Problem

Installing `@lovedolove/dsh-project-memory` into a DSH profile caused `dsh web` to fail with one of three cryptic errors:

1. `SyntaxError: Unexpected identifier 'found'`
2. `TypeError: duplicate loader entry id: project-memory-dsh`
3. `Error: cannot get property "skills" without inject`

All three errors appeared at different stages of debugging, and each pointed to a different root cause.

---

## Root Cause

Three independent mistakes in the plugin's design and the installer's logic:

### 1. JSDoc Comment Closure (SyntaxError)

The plugin's `dsh/plugin.mjs` contained a JSDoc comment with `skills/*/SKILL.md`. JavaScript treats `*/` as the end of a block comment, so the parser saw `found` as executable code:

```javascript
// BEFORE (broken):
/**
 * registers every skills/*/SKILL.md found there  Ã¢â€ Â */ closes comment
 */
// The word "found" is now outside the comment Ã¢â€ â€™ SyntaxError
```

**Fix:** Escape the `/` and `*` inside comments: `skills\/\*\/SKILL.md`

### 2. Duplicate Loader Entry (TypeError)

`install.ps1` wrote `project-memory-dsh` into the **profile's** `cordis.patch.yml`, while the plugin's own `cordis.patch.yml` (loaded via `dsh.profile.bundles`) also defined the same entry. Cordis applies all patch layers in a single `EntryGroup`, so the same ID registered twice Ã¢â€ â€™ `duplicate loader entry id`.

**Fix:** `install.ps1` only writes a clean empty layer (`[]`) to the profile patch. The plugin manages its own patches via the bundle mechanism.

### 3. Missing Inject Declaration (RuntimeError)

`lib/index.js` exported `inject = []` (empty), but `plugin.mjs:apply()` immediately accessed `ctx.skills`. Cordis uses the module's `inject` export to decide which services to wait for before calling `apply()`. Empty array Ã¢â€ â€™ no waiting Ã¢â€ â€™ `ctx.skills` not yet available Ã¢â€ â€™ error.

**Fix:** Add `export const inject = ['skills']` to `plugin.mjs`. Reference: `@deepseek-ai/dsh-skill-badge` uses the same pattern.

---

## Solution

### Step 1 Ã¢â‚¬â€ Fix syntax: escape `*/` in JSDoc comments

```javascript
// In dsh/plugin.mjs, change:
*      registers every skills/*/SKILL.md found there,
// To:
*      registers every skills\/\*\/SKILL.md found there,
```

### Step 2 Ã¢â‚¬â€ Fix installer: don't write plugin entries to profile patch

```powershell
# In install.ps1, Remove-Plugin-ToProfile should only write empty layer:
$emptyPatch = "# Your patch layer...\n[]`n"
[System.IO.File]::WriteAllText($patchPath, $emptyPatch, [System.Text.UTF8Encoding]::new($false))
```

### Step 3 Ã¢â‚¬â€ Fix inject: declare required services

```javascript
// In dsh/plugin.mjs, add after export const name:
export const name = PLUGIN_ID
export const inject = ['skills']
```

Also update `lib/index.js` if it's used as a secondary entry point.

---

## Verification

- `node --check dsh-plugin/dsh/plugin.mjs` Ã¢â€ â€™ exit 0
- `Invoke-Pester install.tests.ps1` Ã¢â€ â€™ 10/10 passed
- `dsh --profile web --dump-config` Ã¢â€ â€™ loads `project-memory-dsh` correctly
- `npm view @lovedolove/dsh-project-memory version` Ã¢â€ â€™ 0.4.2

---

## Evidence

- Source: `dsh-plugin/dsh/plugin.mjs` line 10 (before fix)
- Source: `dsh-plugin/lib/index.js` (missing inject)
- Source: `install.ps1` lines 85-108 (old patch-writing logic)
- Test: `dsh --profile web --dump-config` outputs `- id: project-memory-dsh`
- Test: npm registry shows v0.4.2 published
- Git: commits `d7e7e73`, `c0cdc9e`, `332a704`

---

## Why It Matters

A future Agent debugging a DSH plugin boot failure will see one of these three errors. Without this document, they would need to:
1. Search DSH source code to understand `inject`
2. Trace through cordis-plugin-loader to understand patch layer merging
3. Manually test each hypothesis

This document compresses ~2 hours of debugging into a single reference.

---

## Future Guidance

**Diagnostic sequence for DSH plugin boot failures:**

```text
1. SyntaxError Ã¢â€ â€™ check plugin.mjs for unescaped */ in comments
2. duplicate loader entry id Ã¢â€ â€™ check both profile AND plugin cordis.patch.yml
3. cannot get property "X" without inject Ã¢â€ â€™ check lib/index.js for inject=['X']
4. ERR_MODULE_NOT_FOUND Ã¢â€ â€™ check package is installed
```

**Design rule:** A DSH bundle plugin must declare `inject` in its primary entry point. The module's `inject` array tells Cordis which services to resolve before calling `apply()`.

---

## Bug 4: False "no AGENTS.md" Init Hint (Fixed in v0.4.4)

### Problem

After installing the plugin, DSH shows:

> Project Memory: this workspace has no AGENTS.md yet -- run the
> `memory-architecture` skill to bootstrap the Project Knowledge System.

But AGENTS.md clearly exists in the workspace.

### Root Cause

`resolveWorkspace()` used the first non-empty `payload.cwd` as-is, without
verifying that AGENTS.md actually exists there. When the DSH web GUI runs
from its own directory (e.g. `C:\Users\...\AppData\Local\pnpm\...`), the
plugin resolves to the wrong workspace and incorrectly triggers the
first-time init hint.

### Fix

Added an AGENTS.md existence check per candidate, with a walk-up search
(6 levels deep) from each candidate path. Falls back to `REPO_ROOT` when
no candidate has AGENTS.md.

```javascript
// Before (v0.4.3):
for (const c of candidates) {
  if (typeof c === 'string' && c.trim()) return c.trim()
}
return process.cwd()

// After (v0.4.4):
for (const c of candidates) {
  const trimmed = c.trim()
  if (existsSync(join(trimmed, 'AGENTS.md'))) return trimmed
  // Walk up looking for AGENTS.md
  let dir = trimmed
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, 'AGENTS.md'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
}
return REPO_ROOT
```

### Evidence

- npm: `@lovedolove/dsh-project-memory@0.4.4`
- Commit: `cb2bf22`
- Tests: 9/9 passed

---

## Bug 5: False Init Hint When Workspace Unresolvable (Fixed in v0.4.5)

### Problem

After v0.4.4's walk-up fix, DSH web still showed:

> Project Memory: this workspace has no AGENTS.md yet -- run the
> `memory-architecture` skill to bootstrap...

when opened from the DSH web GUI, even though AGENTS.md exists.

### Root Cause

`resolveWorkspace()` fell back to `REPO_ROOT` (the plugin package
directory: `node_modules/@lovedolove/dsh-project-memory`) when no
candidate cwd resolved. That directory has no AGENTS.md either, so
`needsInit()` returned `true` → hint injected every session.

The real issue: DSH web GUI runs from its own directory
(`C:\Users\...\pnpm\bin\node.EXE` or `~/.dsh/profiles/web`), and
walking up 6 levels from there never reaches the user's project on a
different drive (`D:\Projects\...`).

### Fix

`resolveWorkspace()` now returns `null` instead of `REPO_ROOT` when no
workspace is found. The pre-step handler checks `if (workspace && ...)`
before injecting the init hint. When the workspace can't be determined,
no hint is shown.

The post-task hint was already safe (it checks AGENTS.md existence
before queuing).

```javascript
// Before:
return REPO_ROOT  // → always has no AGENTS.md → always shows hint

// After:
return null  // → caller skips init-hint injection
```

### Why This Is Correct

The init hint is only meaningful when the agent is working in a project
that lacks AGENTS.md. When DSH can't determine the workspace (web GUI
without explicit project context), silently skipping is better than
showing a confusing hint about a directory that isn't the user's project.

Users in headless DSH or when DSH's payload.cwd correctly points to a
project directory will still get the init hint as expected.

### Evidence

- npm: `@lovedolove/dsh-project-memory@0.4.5`
- Commit: `40e8819`