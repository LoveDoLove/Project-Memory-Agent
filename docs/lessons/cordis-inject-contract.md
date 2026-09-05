---
title: "Cordis Plugin Contract - inject, patch, and bundle mechanics"
problem_type: knowledge
category: architecture_pattern
module: "dsh / cordis"
status: active
created: "2026-09-05"
last_verified: "2026-09-05"
tags:
  - cordis
  - dsh
  - plugin
  - architecture
severity: medium
---

# Cordis Plugin Contract

When building a DeepSeek Harness (DSH) bundle plugin, three contracts must be satisfied or the profile fails to boot with cryptic errors.

---

## Contract 1: `inject` Must Declare Required Services

Cordis reads `inject` from the plugin's module export to decide which services to resolve before calling `apply()`:

```javascript
// CORRECT:
export const inject = ['skills']
export function apply(ctx) {
  const skills = ctx.skills  // safe - waited for
}

// WRONG: missing inject -> apply() called before skills exists
export function apply(ctx) {
  const skills = ctx.skills  // TypeError: cannot get property "skills" without inject
}
```

**Reference:** `@deepseek-ai/dsh-skill-badge` uses `const inject = ["skills"]` - same pattern.

---

## Contract 2: Bundle Patches vs Profile Patches Are Separate Layers

DSH composes the plugin tree by applying patch layers in order:

```text
dsh-base         -> cordis.patch.yml (core plugins)
dsh-web-app      -> cordis.patch.yml (web UI)
[other bundles]  -> their patches
────────────────────────────────
profile cordis.patch.yml  (user customizations - KEEP CLEAN)
```

**Rule:** A plugin MUST NOT write its loader entries to the profile's `cordis.patch.yml`. The plugin's own `cordis.patch.yml` (declared in `package.json` as `dsh.bundle.patch`) is automatically loaded when the package is listed in `dsh.profile.bundles`.

Writing the same entry to both layers causes:
```
TypeError: duplicate loader entry id: <id>
```

**Correct installer behavior:** Write only an empty layer (`[]`) to the profile patch. The plugin manages its own patches.

---

## Contract 3: JSDoc Comments Cannot Contain Unescaped `*/`

JavaScript block comments end at the first `*/` encountered, even inside string-like content:

```javascript
// BROKEN - */ closes the comment prematurely:
/**
 * registers every skills/*/SKILL.md found there
 */
// The word "found" is now parsed as code -> SyntaxError

// FIXED - escape the characters:
/**
 * registers every skills\/\*\/SKILL.md found there
 */
```

This applies to ALL JSDoc comments, not just those mentioning `*/`. Any `*/` sequence in a comment body must be escaped.

---

## Diagnostic Decision Tree

When a DSH profile fails to boot, use this tree:

```text
Error type?
├── SyntaxError: Unexpected identifier 'found'
│   └── Check plugin.mjs JSDoc comments for unescaped */
│
├── TypeError: duplicate loader entry id: <name>
│   └── Check BOTH profile AND plugin cordis.patch.yml
│       for the same entry ID
│
├── Error: cannot get property "X" without inject
│   └── Check lib/index.js or plugin.mjs for
│       export const inject = ['X']
│
└── Error: Cannot find package '<name>'
    └── Package not installed: pnpm add <package>
```

---

## Why This Matters

These contracts are non-obvious. An experienced Agent would need to:
1. Read `@deepseek-ai/cordis` source to understand `inject` resolution
2. Trace through `dsh-app-boot` to understand patch layer merging
3. Understand that `*/` in JSDoc comments is a JavaScript parsing issue, not a documentation issue

Without this knowledge, each new plugin author will independently encounter and debug the same three errors.