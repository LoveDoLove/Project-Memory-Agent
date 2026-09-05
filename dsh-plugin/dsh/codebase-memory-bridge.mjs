/**
 * dsh-codebase-memory bridge — embedded from https://github.com/jiayan-xu/dsh-codebase-memory
 *
 * Provides cbm_* tools (semantic code search, snippets, architecture, trace)
 * by spawning codebase-memory-mcp.exe as a persistent stdio MCP child process.
 * Requires codebase-memory-mcp installed or CBM_EXE env var pointing to the exe.
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

/** C:/Users/user/agent-core → C-Users-user-agent-core；点号保留（.qclaw → -.qclaw） */
export function projectNameFromPath(p) {
  const norm = p.replace(/[\\/]+/g, '/');
  const body = norm.replace(/^[A-Za-z]:/, '');
  const slug = body.replace(/^\/+/, '').replace(/\//g, '-');
  return 'C-' + slug;
}

/** 常驻 MCP 客户端：延迟启动 + 自动重连 + id 匹配并发。 */
export function createClient(exePath) {
  let child = null;
  let buf = '';
  let nextId = 1;
  const pending = new Map();
  let startPromise = null;

  const ensureStarted = () => {
    if (child && !child.killed) return Promise.resolve();
    if (startPromise) return startPromise;
    startPromise = (async () => {
      const c = spawn(exePath, ['--ui=true'], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      child = c;
      c.stdout.on('data', (d) => {
        buf += d.toString('utf8');
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          let msg;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if (msg.id && pending.has(msg.id)) {
            const { resolve: res, reject: rej, timer } = pending.get(msg.id);
            pending.delete(msg.id);
            clearTimeout(timer);
            if (msg.error) rej(new Error(JSON.stringify(msg.error).slice(0, 400)));
            else res(msg.result);
          }
        }
      });
      c.on('error', (err) => {
        for (const [, p] of pending) clearTimeout(p.timer);
        pending.clear();
        child = null;
        startPromise = null;
      });
      c.on('exit', () => {
        for (const [, p] of pending) clearTimeout(p.timer);
        pending.clear();
        child = null;
        startPromise = null;
      });
      const initId = nextId++;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(initId);
          reject(new Error('codebase-memory initialize timeout'));
        }, 30_000);
        pending.set(initId, {
          resolve: () => {
            clearTimeout(timer);
            resolve();
          },
          reject: () => {
            clearTimeout(timer);
            reject(new Error('codebase-memory initialize rejected'));
          },
          timer,
        });
        c.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: initId,
          method: 'initialize',
          params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'dsh-codebase-memory', version: '0.1.0' } },
        }) + '\n');
      });
      c.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
      startPromise = null;
    })().catch((e) => {
      startPromise = null;
      throw e;
    });
    return startPromise;
  };

  const rpc = async (method, params = {}) => {
    await ensureStarted();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`codebase-memory rpc timeout: ${method}`));
      }, 120_000);
      pending.set(id, { resolve, reject, timer });
      try {
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      } catch (e) {
        clearTimeout(timer);
        pending.delete(id);
        reject(e);
      }
    });
  };

  const call = async (name, args = {}) => {
    const r = await rpc('tools/call', { name, arguments: args });
    if (r?.isError) {
      const parts = (r.content || []).map((c) => (c.type === 'text' ? c.text ?? '' : JSON.stringify(c)));
      throw new Error(parts.join('\n') || `codebase-memory tool failed: ${name}`);
    }
    const text = (r?.content || []).map((c) => (c.type === 'text' ? c.text ?? '' : JSON.stringify(c))).join('\n');
    return text || '{}';
  };

  const dispose = () => {
    for (const [, p] of pending) clearTimeout(p.timer);
    pending.clear();
    if (child && !child.killed) child.kill();
    child = null;
    startPromise = null;
  };

  return { rpc, call, dispose };
}

/** Find codebase-memory-mcp.exe. Tries env var, then common install locations,
 * then PATH (so any user installation works regardless of where it's placed). */
function findExe() {
  // 1. Explicit override
  if (process.env.CBM_EXE && existsSync(process.env.CBM_EXE)) return process.env.CBM_EXE
  const homedir = os.homedir()
  const candidates = [
    // Official installer path
    path.join(homedir, 'AppData', 'Local', 'Programs', 'codebase-memory-mcp', 'codebase-memory-mcp.exe'),
    // ~/.local/bin (common manual install)
    path.join(homedir, '.local', 'bin', 'codebase-memory-mcp.exe'),
    // Current working directory
    path.join(process.cwd(), 'codebase-memory-mcp.exe'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  // 2. Search PATH
  const pathEnv = (process.env.PATH || '').split(path.delimiter)
  for (const dir of pathEnv) {
    if (!dir) continue
    const exe = path.join(dir, 'codebase-memory-mcp.exe')
    if (existsSync(exe)) return exe
  }
  return null
}

const EXE = findExe()

/** Register cbm_* tools on ctx when ctx.tools is available. */
export function cbmApply(ctx) {
  const client = createClient(EXE);
  ctx.effect(() => () => client.dispose());

  const tool = (name, description, parameters, exec) => ctx.effect(() => ctx.tools.register(defineTool({
    name,
    description,
    parameters,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    isConcurrencySafe: () => true,
    execute: exec,
  })), `project-memory.cbm.${name}`);

  const withProject = (args) => {
    const a = { ...args };
    if (a.project === undefined && a.repo) a.project = projectNameFromPath(a.repo);
    if (a.project === undefined && process.env.CBM_DEFAULT_PROJECT) a.project = process.env.CBM_DEFAULT_PROJECT;
    return a;
  };

  tool('cbm_projects', '列出已索引项目（codebase-memory 知识图谱），含 git 状态与节点/边规模。', {
    repo: { type: 'string', description: '可选：当前工作目录（仅用于上下文）' },
  }, async (args) => {
    void args;
    return client.call('list_projects', {});
  });

  tool('cbm_search', '语义搜索代码知识图谱（search_graph）：按函数/类/路由/变量名或自然语言检索，返回 qualified_name/行号/BM25 排名。优先于 grep 定位代码定义与关系。', {
    query: { type: 'string', description: '搜索关键词或自然语言描述（必填）' },
    project: { type: 'string', description: '项目名（如 C-Users-user-agent-core）；缺省用 repo 推导' },
    repo: { type: 'string', description: '仓库路径（用于推导 project），如 C:/Users/user/agent-core' },
  }, async (args) => {
    const a = withProject(args);
    if (!a.project) throw new Error('缺少 project：传 project 或 repo 路径');
    return client.call('search_graph', { query: a.query, project: a.project });
  });

  tool('cbm_snippet', '读取函数/类/符号源码（get_code_snippet）。先 cbm_search 拿到 qualified_name 再传入。', {
    qualified_name: { type: 'string', description: '符号全限定名（来自 cbm_search），必填' },
    project: { type: 'string', description: '项目名；缺省用 repo 推导' },
    repo: { type: 'string', description: '仓库路径（用于推导 project）' },
    include_neighbors: { type: 'boolean', description: '是否包含相邻符号，默认 false' },
  }, async (args) => {
    const a = withProject(args);
    if (!a.project) throw new Error('缺少 project：传 project 或 repo 路径');
    return client.call('get_code_snippet', {
      qualified_name: a.qualified_name,
      project: a.project,
      include_neighbors: !!a.include_neighbors,
    });
  });

  tool('cbm_arch', '代码架构总览（get_architecture）：包/服务/依赖/路由/语言 + Leiden 社区聚类，可限 path 前缀。', {
    project: { type: 'string', description: '项目名；缺省用 repo 推导' },
    repo: { type: 'string', description: '仓库路径（用于推导 project）' },
    path: { type: 'string', description: '可选目录前缀限定（如 apps/hoa）' },
    aspects: { type: 'string', description: '逗号分隔 aspect 列表：all/overview/structure/dependencies/routes/languages/packages（默认 all）' },
  }, async (args) => {
    const a = withProject(args);
    if (!a.project) throw new Error('缺少 project：传 project 或 repo 路径');
    const p = { project: a.project };
    if (a.path) p.path = a.path;
    if (a.aspects) p.aspects = a.aspects.split(',').map((s) => s.trim());
    return client.call('get_architecture', p);
  });

  tool('cbm_trace', '代码路径追踪（trace_path）：调用链（calls）/数据流（data_flow）/跨服务 HTTP 路径（cross_service），替代 grep 找调用方/被调方。', {
    function_name: { type: 'string', description: '函数/方法名（必填）' },
    project: { type: 'string', description: '项目名；缺省用 repo 推导' },
    repo: { type: 'string', description: '仓库路径（用于推导 project）' },
    direction: { type: 'string', description: 'inbound（调用方）/outbound（被调方）/both，默认 both' },
    depth: { type: 'number', description: '深度，默认 3' },
    mode: { type: 'string', description: 'calls/data_flow/cross_service，默认 calls' },
  }, async (args) => {
    const a = withProject(args);
    if (!a.project) throw new Error('缺少 project：传 project 或 repo 路径');
    const p = { function_name: a.function_name, project: a.project, depth: a.depth || 3, mode: a.mode || 'calls', direction: a.direction || 'both' };
    return client.call('trace_path', p);
  });

  tool('cbm_search_code', '图增强代码搜索（search_code）：grep 文本匹配后用知识图谱富化——按包含函数去重、按结构重要性排序。', {
    pattern: { type: 'string', description: '文本/正则模式（必填）' },
    project: { type: 'string', description: '项目名；缺省用 repo 推导' },
    repo: { type: 'string', description: '仓库路径（用于推导 project）' },
    file_pattern: { type: 'string', description: 'grep --include glob（如 *.rs）' },
    path_filter: { type: 'string', description: '结果路径正则过滤（如 ^src/）' },
  }, async (args) => {
    const a = withProject(args);
    if (!a.project) throw new Error('缺少 project：传 project 或 repo 路径');
    const p = { pattern: a.pattern, project: a.project };
    if (a.file_pattern) p.file_pattern = a.file_pattern;
    if (a.path_filter) p.path_filter = a.path_filter;
    return client.call('search_code', p);
  });
}
