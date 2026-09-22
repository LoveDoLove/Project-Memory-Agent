# 项目记忆（Project Memory）

[![npm](https://img.shields.io/npm/v/@lovedolove/dsh-project-memory?label=npm&style=flat-square)](https://www.npmjs.com/package/@lovedolove/dsh-project-memory)
[![GitHub Stars][stars-shield]][stars-url] [![License][license-shield]][license-url] [![Platform][platform-shield]][platform-url]

> **为编码代理提供持久、基于证据的记忆系统。**

Project Memory 为每个编码代理提供一个单一、可信的仓库知识库——让代理不再重复学习相同的事实，也不再生成相互冲突的"记忆"文件。

```text
发现 → 验证 → 分类 → 提炼 → 重建 → 单一可信来源
```

代码告诉代理 **有什么**。Project Memory 帮助它们记住 **为什么**——并整理所有已经尝试记录这些知识的零散文件。

[🇬🇧 English](./README.md)

---

## 目录

- [为什么重要](#为什么重要)
- [快速开始](#快速开始)
- [支持平台](#支持平台)
- [DeepSeek Harness（DSH）插件](#deepseek-harnessdsh插件)
- [使用方法](#使用方法)
- [功能说明](#功能说明)
- [技能清单](#技能清单)
- [知识架构](#知识架构)
- [测试](#测试)
- [开源协议](#开源协议)

---

## 为什么重要

在没有统一记忆的情况下，每个代理（以及每款 AI 工具）都会重新发现架构、重新尝试已被拒绝的方案，并写出略有不同的结论。最终你会得到多个互相矛盾的"可信来源"。

有了 Project Memory，这些知识会被发现、与实际代码交叉验证，并重建为**一份可信赖的单一记忆**，供后续代理从同一个可信位置加载。

---

## 快速开始

### 一键通用安装（极速推荐）

支持 Linux、macOS 与 Windows，优先自动配置 **DeepSeek Harness (DSH)**：

**Linux / macOS / WSL：**
```bash
curl -fsSL https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.sh | bash
```

**Windows (PowerShell)：**
```powershell
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

一键脚本将自动执行：
1. **自动识别 DeepSeek Harness (DSH)**，将 `@lovedolove/dsh-project-memory` 插件挂载到当前活动的 DSH Profile 中。
2. 安装全局 `ema` 命令行工具到环境变量 PATH（`~/.local/bin/ema` 或 `%USERPROFILE%\.local\bin\ema.cmd`）。
3. 将 8 项核心工程记忆技能镜像到 `~/.agents/skills/`，并同步支持 Claude Code 及 OpenCode。
4. 在 DeepSeek Harness 中即刻激活 `/ema` 与 `/project-memory` 斜杠指令。

### 在 DeepSeek Harness 中使用（原生零配置极速安装）

参考 DeepSeek 官方标准（如 `dsh-univer-office`），只需一行 DSH 原生包管理命令，即可直接装完全部功能：

```bash
# 添加到当前激活的 DSH Profile（如 'web'）
dsh plugin --profile web add @lovedolove/dsh-project-memory
```

该命令将自动：
1. **注入系统原生打包技能（System Bundled Skills）**：通过 `ctx.skills.registerProvider` 注册 `BUNDLED_SKILL_RANK` 级原生技能源，所有 8 项技能直接进入 Harness 核心技能表，无需向用户目录拷贝任何文件。
2. **注册原生斜杠指令**：激活 `/ema` 与 `/project-memory` 对话框交互。
3. **注入 MCP 工具链**：挂载 `ema_recall`、`ema_distill`、`ema_add` 等 6 项标准工具。
4. **激活向量引擎**：离线 384-d 向量与 `sqlite-vec` RRF 混合检索即刻就绪。

安装完成后，在任意 DSH 对话窗口中直接输入：
```text
/ema
```
或
```text
/project-memory
```
代理将自动执行记忆检索、事实核验与经验沉淀编排。

### 支持平台

| 目标 | 主要场景 | 技能位置 | 触发方式 |
|:----:|:--------:|----------|:--------:|
| **DeepSeek Harness (DSH)** | **主推平台** | DSH 技能注册表 / 插件 | `/ema`, `/project-memory` |
| **命令行终端 (CLI)** | **图谱 UI 与自动提炼** | 独立 Node.js 客户端 | `ema ui`, `ema ingest`, `ema recall` |
| **Claude Code** | 兼容支持 | `~/.claude/skills/` | `@project-memory` |
| **OpenCode** | 兼容支持 | `~/.config/opencode/skills/` | `@project-memory` |
| **Codex** | 兼容支持 | `~/.agents/skills/` | `@project-memory` |

---

## DeepSeek Harness（DSH）插件

本项目提供了一个 **DSH bundle 插件**（`@lovedolove/dsh-project-memory`），可通过 Cordis 技能注册表将全部 8 个 Project Memory 技能挂载到任意 DSH 配置文件中。插件还会在 `codebase-memory-mcp` 可用时注册 `cbm_*` 工具，注入首次初始化提示，并注册 `/project-memory` 斜杠命令。

详见 [dsh-plugin/README.md](./dsh-plugin/README.md)。

### 安装

```powershell
# 交互式 —— 显示适用于你配置文件的命令
.\install.ps1 -Target dsh

# 指定目标配置文件
.\install.ps1 -Target dsh -DshProfile web
```

安装脚本会打印插件添加命令，请手动执行：

```powershell
dsh plugin --profile web add @lovedolove/dsh-project-memory
```

### 使用

#### 一键命令（推荐）

安装后，在任何 DSH 会话中可直接使用一键命令：

```
/project-memory
```

自动检测仓库的 Project Memory 状态并执行相应工作流——无需选择 Agent、无需挑选技能、无需指定模式参数。

可选 `--trace` 参数可启用检索追踪，用于调试：

```
/project-memory --trace
```

#### 高级：直接调度编排器代理

如需完全控制，可将编排器作为子代理调度：

```powershell
use_agent(agent: "project-memory", prompt: "compound my last task")
```

**插件内部说明：** npm 包（位于 `dsh-plugin/`）使用单行 Cordis patch 加载运行时胶水（`dsh/plugin.mjs`），由其在运行时相对活跃工作区动态注册技能、注册 `/project-memory` 斜杠命令，并在没有 `AGENTS.md` 时注入首次初始化提示。

---

## 使用方法

### 斜杠命令（仅 DSH）

```
/project-memory
```

详见 [DSH 插件](#deepseek-harnessdsh插件) 章节了解完整安装和使用说明。

### 代理预设（全平台）

在任何支持的代理中直接调用编排器：

```
@project-memory
```

它会发现现有知识、检查仓库、对照真实代码验证声明，并报告哪些内容需要保留、修改、合并或删除——覆盖所有来源工具，而不仅是自身生成的文件。

**典型任务：** *审计本仓库*、*为新仓库构建记忆*、*合并冲突的 AGENTS.md / CLAUDE.md*、*任务完成后提炼经验教训*。

---

## 功能说明

| 能力 | 说明 |
|---|---|
| [D] **发现（Discover）** | 盘点所有已有知识来源及其来源追溯 |
| [V] **验证（Verify）** | 声明与代码、测试、配置、CI、Git 交叉验证，从不假设当前有效 |
| [C] **分类（Classify）** | 每条声明只有一个主要类型；冲突由证据而非文件新旧决定 |
| [Co] **提炼（Compound）** | 沉淀持久化的解决方案和经验教训，而非堆砌更多文档 |
| [Cl] **清理（Clean）** | 删除过期知识，不区分来源 |
| [S] **单一真相（Single Truth）** | 每个概念只有一个主归属，其他引用它 |
| [L] **精简（Lean）** | 积极去重——没有规则出现在两个地方 |
| [A] **自审（Self-Audit）** | 质量基线（Memory Health）+ 自审指令，防止记忆漂移 |

---

## 技能清单

八项专项技能，而非一个庞杂的大提示词：

| 技能 | 职责 |
|---|---|
| `knowledge-discovery` | 盘点所有已有知识来源，含来源追溯 |
| `repository-audit` | 收集仓库证据（代码、测试、CI、Git） |
| `knowledge-classification` | 对声明分类并解决跨来源冲突 |
| `knowledge-compounding` | 将经验提炼为可复用的解决方案与经验教训 |
| `memory-architecture` | 设计层次结构、导航与渐进式加载 |
| `obsolete-knowledge` | 处理过期、废弃或已被替代的知识 |
| `memory-edit` | 应用经审批的文档变更 |
| `memory-verification` | 最终一致性与质量门禁 |

编排器按需渐进加载技能——你极少需要直接调用单个技能。编排器还可委托给 `codebase-memory`（只读代码图）和 `cavecrew-builder`（有界编辑）。每个规则在代理和技能之间只有一个权威归属，技能间相互引用而非重复，确保指导不会出现分歧。

---

## 知识架构

`AGENTS.md` 是唯一的入口点，其余内容均通过引用关联，不做重复。

```
AGENTS.md
   +-- docs/architecture.md      -> 系统设计、DSH 插件内部细节
   +-- docs/solutions/           -> 已诊断的修复模式
   +-- docs/lessons/             -> 可复用的工程原则
   +-- skills/<name>/SKILL.md    -> 详细技能指令
   +-- templates/                -> 文档模板
```

领域（domain）是一种模式，不是强制脚手架——只为存放已验证的知识创建。

### 模板

模板为新知识文档提供起点：

- `templates/TEMPLATE.md` —— 双轨模式的解决方案文档（Bug + Knowledge）
- `templates/CONCEPTS.md` —— 项目词汇表，含积累/播种/变异说明
- `templates/SOLUTIONS.md` —— 解决方案索引模板
- `templates/schema.yaml` —— 统一的元数据前缀规范

### 参考文件

详细指导位于各技能的参考目录中：

- `skills/knowledge-compounding/references/` —— 接地验证、持久性基准、质量约束、会话历史、自动记忆

---

## 测试

```powershell
Invoke-Pester ./install.tests.ps1
```

12 项测试覆盖各安装目标、无重复加载规则，以及确保 8 个技能、其清单与两份代理文件保持一致的防护机制。

---

## 开源协议

MIT —— 详见 [LICENSE](LICENSE)。

---

[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/Project-Memory-Agent.svg
[stars-url]: https://github.com/LoveDoLove/Project-Memory-Agent/stargazers
[license-shield]: https://img.shields.io/github/license/LoveDoLove/Project-Memory-Agent.svg
[license-url]: https://github.com/LoveDoLove/Project-Memory-Agent/blob/main/LICENSE
[platform-shield]: https://img.shields.io/badge/platforms-OpenCode%20%7C%20Codex%20%7C%20Claude%20%7C%20DSH-blue?style=flat-square
[platform-url]: https://github.com/LoveDoLove/Project-Memory-Agent
