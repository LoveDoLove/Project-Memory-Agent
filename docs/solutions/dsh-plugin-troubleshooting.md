---
title: "DSH Plugin Boot Failures — Triple-Layer Error Diagnosis"
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
 * registers every skills/*/SKILL.md found there  ← */ closes comment
 */
// The word "found" is now outside the comment → SyntaxError
```

**Fix:** Escape the `/` and `*` inside comments: `skills\/\*\/SKILL.md`

### 2. Duplicate Loader Entry (TypeError)

`install.ps1` wrote `project-memory-dsh` into the **profile's** `cordis.patch.yml`, while the plugin's own `cordis.patch.yml` (loaded via `dsh.profile.bundles`) also defined the same entry. Cordis applies all patch layers in a single `EntryGroup`, so the same ID registered twice → `duplicate loader entry id`.

**Fix:** `install.ps1` only writes a clean empty layer (`[]`) to the profile patch. The plugin manages its own patches via the bundle mechanism.

### 3. Missing Inject Declaration (RuntimeError)

`lib/index.js` exported `inject = []` (empty), but `plugin.mjs:apply()` immediately accessed `ctx.skills`. Cordis uses the module's `inject` export to decide which services to wait for before calling `apply()`. Empty array → no waiting → `ctx.skills` not yet available → error.

**Fix:** Add `export const inject = ['skills']` to `plugin.mjs`. Reference: `@deepseek-ai/dsh-skill-badge` uses the same pattern.

---

## Solution

### Step 1 — Fix syntax: escape `*/` in JSDoc comments

```javascript
// In dsh/plugin.mjs, change:
*      registers every skills/*/SKILL.md found there,
// To:
*      registers every skills\/\*\/SKILL.md found there,
```

### Step 2 — Fix installer: don't write plugin entries to profile patch

```powershell
# In install.ps1, Remove-Plugin-ToProfile should only write empty layer:
$emptyPatch = "# Your patch layer...\n[]`n"
[System.IO.File]::WriteAllText($patchPath, $emptyPatch, [System.Text.UTF8Encoding]::new($false))
```

### Step 3 — Fix inject: declare required services

```javascript
// In dsh/plugin.mjs, add after export const name:
export const name = PLUGIN_ID
export const inject = ['skills']
```

Also update `lib/index.js` if it's used as a secondary entry point.

---

## Verification

- `node --check dsh-plugin/dsh/plugin.mjs` → exit 0
- `Invoke-Pester install.tests.ps1` → 10/10 passed
- `dsh --profile web --dump-config` → loads `project-memory-dsh` correctly
- `npm view @lovedolove/dsh-project-memory version` → 0.4.2

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
1. SyntaxError → check plugin.mjs for unescaped */ in comments
2. duplicate loader entry id → check both profile AND plugin cordis.patch.yml
3. cannot get property "X" without inject → check lib/index.js for inject=['X']
4. ERR_MODULE_NOT_FOUND → check package is installed
```

**Design rule:** A DSH bundle plugin must declare `inject` in its primary entry point. The module's `inject` array tells Cordis which services to resolve before calling `apply()`.