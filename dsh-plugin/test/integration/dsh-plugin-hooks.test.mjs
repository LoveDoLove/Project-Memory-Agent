/**
 * EMA Phase 7 — DSH Plugin & Slash Command Integration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { apply, buildStaticContext } from '../../dsh/plugin.mjs';
import { parseEmaCommand, buildEmaPrompt } from '../../dsh/slash-ema.mjs';
import { estimateTokens } from '../../src/retrieval/context-builder.mjs';

function createMockCordis() {
  const registeredCommands = new Map();
  const registeredSkills = [];
  const eventListeners = new Map();

  const ctx = {
    skills: {
      register(skill) {
        registeredSkills.push(skill);
      },
    },
    commands: {
      register(cmd) {
        registeredCommands.set(cmd.name, cmd);
      },
    },
    effect(fn) {
      fn();
    },
    on(event, handler) {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(handler);
    },
    emit(event, payload) {
      const handlers = eventListeners.get(event) || [];
      for (const h of handlers) {
        h(payload, () => {});
      }
    },
    registeredCommands,
    registeredSkills,
    eventListeners,
  };

  return ctx;
}

// ── Static Context Injection (< 500 Tokens) ──────────────────────────────────

test('Static Context: buildStaticContext strictly stays under 500 tokens', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-plugin-test-'));
  try {
    const agentsContent = `# AGENTS.md
## Critical Rules
1. Discover before assume
2. Evidence before memory
3. One canonical home per concept
4. Current wins over historical
## Memory Navigation
Some nav details...`;
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), agentsContent, 'utf8');

    const ctxText = buildStaticContext(tmpDir, 500);
    assert.ok(ctxText, 'Context text must not be null');
    assert.ok(ctxText.includes('[EMA Active Engineering Context]'));
    assert.ok(ctxText.includes('Discover before assume'));

    const tokens = estimateTokens(ctxText);
    assert.ok(tokens <= 500, `Estimated tokens (${tokens}) must be <= 500 tokens`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Static Context: returns null when AGENTS.md is absent', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-empty-test-'));
  try {
    const ctxText = buildStaticContext(tmpDir, 500);
    assert.equal(ctxText, null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── /ema Slash Command Parsing & Prompts ────────────────────────────────────

test('Slash Command: parseEmaCommand parses recall, status, verify, and promote', () => {
  const r1 = parseEmaCommand('recall postgres connection pool');
  assert.equal(r1.subcommand, 'recall');
  assert.deepEqual(r1.args, ['postgres', 'connection', 'pool']);

  const r2 = parseEmaCommand('status');
  assert.equal(r2.subcommand, 'status');
  assert.deepEqual(r2.args, []);

  const r3 = parseEmaCommand('verify');
  assert.equal(r3.subcommand, 'verify');

  const r4 = parseEmaCommand('promote cand-123 workspace');
  assert.equal(r4.subcommand, 'promote');
  assert.deepEqual(r4.args, ['cand-123', 'workspace']);

  const r5 = parseEmaCommand('');
  assert.equal(r5.subcommand, 'default');
});

test('Slash Command: buildEmaPrompt constructs expected instructions per subcommand', () => {
  const recallPrompt = buildEmaPrompt('recall', ['rate', 'limiting'], '/ws');
  assert.ok(recallPrompt.includes('rate limiting'));
  assert.ok(recallPrompt.includes('Stage 1-6 retrieval pipeline'));

  const statusPrompt = buildEmaPrompt('status', [], '/ws');
  assert.ok(statusPrompt.includes('.ema/index.db'));
  assert.ok(statusPrompt.includes('.ema/candidates/'));

  const verifyPrompt = buildEmaPrompt('verify', [], '/ws');
  assert.ok(verifyPrompt.includes('memory-verification'));

  const promotePrompt = buildEmaPrompt('promote', ['cand-99', 'global'], '/ws');
  assert.ok(promotePrompt.includes('cand-99'));
  assert.ok(promotePrompt.includes('global'));
  assert.ok(promotePrompt.includes('≥2 independent repository sources'));
});

// ── Plugin Lifecycle & Seamless Coexistence ──────────────────────────────────

test('Plugin Lifecycle: registers both /project-memory and /ema commands seamlessly', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ema-cordis-test-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# AGENTS.md\n## Critical Rules\n1. Rule A', 'utf8');

    const ctx = createMockCordis();
    const disposer = apply(ctx, { workspaceRoot: tmpDir });

    // Both commands must be registered
    assert.ok(ctx.registeredCommands.has('project-memory'), 'Must register /project-memory');
    assert.ok(ctx.registeredCommands.has('ema'), 'Must register /ema');

    // Test /ema invocation
    const emaCmd = ctx.registeredCommands.get('ema');
    const injectedMessages = [];
    const mockAgent = {
      session: { header: { cwd: tmpDir } },
      followup(msg) {
        injectedMessages.push(msg);
      },
      inject(msg) {
        injectedMessages.push(msg);
      },
    };

    const res = emaCmd.handler({ text: 'recall postgres', agent: mockAgent });
    assert.equal(res.kind, 'success');
    assert.equal(injectedMessages.length, 1);
    assert.ok(injectedMessages[0].content[0].text.includes('Recall Query'));

    // Test agent/pre-step event triggers static context injection
    ctx.emit('agent/pre-step', { agent: mockAgent, cwd: tmpDir });

    // Should have injected static context (< 500 tokens)
    const contextMsg = injectedMessages.find(m => m.source?.form === 'context');
    assert.ok(contextMsg, 'Static context must be injected during agent/pre-step');
    assert.ok(contextMsg.content[0].text.includes('[EMA Active Engineering Context]'));

    if (typeof disposer === 'function') {
      disposer();
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
