/**
 * Engineering Memory Agent (EMA) — Standalone Stdio MCP Server
 * Phase 8: Standalone MCP Server & CLI Tooling
 *
 * Implements standard JSON-RPC 2.0 over stdio for integration with external
 * AI coding agents (Cursor, Claude Code, OpenCode, Codex).
 */

import readline from 'node:readline';
import { getToolDefinitions, executeToolCall } from './tools.mjs';

/**
 * Creates an EMA MCP Server instance.
 *
 * @param {object} [options]
 * @param {import('better-sqlite3').Database} [options.db]
 * @param {string} [options.projectRoot]
 * @param {string} [options.candidateDir]
 * @param {string} [options.docsDir]
 * @param {string} [options.changelogPath]
 * @param {NodeJS.ReadableStream} [options.input]
 * @param {NodeJS.WritableStream} [options.output]
 * @returns {object} Server controller
 */
export function createMCPServer(options = {}) {
  const context = {
    db: options.db,
    projectRoot: options.projectRoot || process.cwd(),
    candidateDir: options.candidateDir,
    docsDir: options.docsDir,
    changelogPath: options.changelogPath,
    actor: options.actor || 'agent',
  };

  let rl = null;
  let running = false;

  /**
   * Processes a single JSON-RPC request object and returns the response object.
   * @param {object} request
   * @returns {Promise<object|null>}
   */
  async function handleMessage(request) {
    if (!request || typeof request !== 'object') {
      return {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: invalid JSON-RPC payload' },
      };
    }

    const { id, method, params } = request;

    // Notifications (no id)
    if (id === undefined || id === null) {
      if (method === 'notifications/initialized') {
        // Notification acknowledged
        return null;
      }
      return null;
    }

    try {
      switch (method) {
        case 'initialize': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'ema-mcp',
                version: '0.5.0',
              },
            },
          };
        }

        case 'ping': {
          return {
            jsonrpc: '2.0',
            id,
            result: {},
          };
        }

        case 'tools/list': {
          const tools = getToolDefinitions();
          return {
            jsonrpc: '2.0',
            id,
            result: { tools },
          };
        }

        case 'tools/call': {
          const toolName = params?.name;
          const args = params?.arguments || {};
          const result = await executeToolCall(toolName, args, context);

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          };
        }

        default: {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: '${method}'`,
            },
          };
        }
      }
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message || 'Internal tool execution error',
        },
      };
    }
  }

  function start(input = options.input || process.stdin, output = options.output || process.stdout) {
    if (running) return;
    running = true;

    rl = readline.createInterface({
      input,
      output: null,
      terminal: false,
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const parsed = JSON.parse(trimmed);
        const response = await handleMessage(parsed);
        if (response) {
          output.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: invalid JSON' },
        };
        output.write(JSON.stringify(errorResponse) + '\n');
      }
    });
  }

  function stop() {
    if (rl) {
      rl.close();
      rl = null;
    }
    running = false;
  }

  return {
    handleMessage,
    start,
    stop,
    getContext: () => context,
  };
}
