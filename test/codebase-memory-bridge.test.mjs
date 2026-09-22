/**
 * codebase-memory-bridge cross-platform tests (node:test, no framework).
 *
 * Run: npm test
 *
 * Windows behavior is pinned: projectNameFromPath keeps the drive-letter
 * prefix ('C-...') for drive-lettered paths. Linux/WSL paths slug without
 * a drive prefix. Also verifies the MCP client can spawn a POSIX executable.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Make the plugin's peer-dep @deepseek-ai/dsh-tools resolvable even when
// node_modules is incomplete (e.g. offline CI). The bridge only uses
// defineTool, which is a pass-through; this keeps tests hermetic.
const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..')
const dshToolsDir = join(pkgRoot, 'node_modules', '@deepseek-ai', 'dsh-tools')
try {
  await import('@deepseek-ai/dsh-tools')
} catch {
  const { mkdirSync, existsSync } = await import('node:fs')
  if (!existsSync(dshToolsDir)) {
    mkdirSync(dshToolsDir, { recursive: true })
    writeFileSync(join(dshToolsDir, 'package.json'),
      JSON.stringify({ name: '@deepseek-ai/dsh-tools', version: '0.0.0-stub', main: 'index.js' }))
    writeFileSync(join(dshToolsDir, 'index.js'),
      "module.exports.defineTool = (spec) => spec;\n")
  }
}

const bridgePath = join(pkgRoot, 'dsh', 'codebase-memory-bridge.mjs')
const { projectNameFromPath, createClient } = await import(bridgePath)

// - projectNameFromPath ------------------------------------------------------

test('Windows drive-lettered paths keep the drive-letter prefix (existing behavior)', () => {
  assert.equal(projectNameFromPath('C:/Users/user/agent-core'), 'C-Users-user-agent-core')
  assert.equal(projectNameFromPath('C:\\Users\\user\\agent-core'), 'C-Users-user-agent-core')
  assert.equal(projectNameFromPath('d:/repos/my-app'), 'C-repos-my-app') // pre-existing quirk: drive letter dropped, C- prefix kept
})

test('Linux/WSL paths slug without a drive prefix', () => {
  assert.equal(projectNameFromPath('/home/user/agent-core'), 'home-user-agent-core')
  assert.equal(projectNameFromPath('/mnt/d/Projects/Project-Memory-Agent'), 'mnt-d-Projects-Project-Memory-Agent')
  assert.equal(projectNameFromPath('/home/user/.qclaw/proj'), 'home-user-.qclaw-proj')
})

// - createClient: spawn + JSON-RPC round-trip with a fake stdio MCP server ---

function fakeMcpServer() {
  return [
    '#!/usr/bin/env node',
    "let buf = '';",
    "process.stdin.on('data', d => {",
    '  buf += d;',
    '  let i;',
    '  while ((i = buf.indexOf(String.fromCharCode(10))) >= 0) {',
    "    const line = buf.slice(0, i).trim();",
    '    buf = buf.slice(i + 1);',
    '    if (!line) continue;',
    '    const msg = JSON.parse(line);',
    "    if (msg.method === 'initialize') {",
    "      console.log(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-03-26', serverInfo: { name: 'fake-cbm' } } }));",
    "    } else if (msg.method === 'tools/call') {",
    "      console.log(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: 'OK:' + msg.params.name }] } }));",
    '    }',
    '  }',
    '});',
    '',
  ].join('\n')
}

test('createClient spawns a POSIX executable and completes an MCP round-trip', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cbm-'))
  const exe = join(dir, 'fake-cbm-mcp')
  writeFileSync(exe, fakeMcpServer())
  execSync(`chmod +x "${exe}"`)

  const client = createClient(exe)
  try {
    const text = await client.call('search_graph', { query: 'x' })
    assert.match(text, /^OK:search_graph$/)
  } finally {
    client.dispose()
    rmSync(dir, { recursive: true, force: true })
  }
}, { timeout: 30_000 })
