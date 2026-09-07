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

```powershell
# 安装到所有支持平台（OpenCode、Codex、Claude、DSH、Global）
irm https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.ps1 | iex
```

安装脚本会将编排代理及 8 个技能下载并安装到你选择的工具的全局配置目录中。在交互式菜单中选择目标（`1` OpenCode · `2` Codex · `3` Claude · `4` DSH · `5` Global · `6` All）。通过 `irm | iex` 非交互式运行则默认为 `all`。

### 支持平台

| 目标 | 技能位置 | 代理文件 |
|:----:|----------|----------|
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/agents/project-memory.md` |
| Codex | `~/.agents/skills/` | `~/.codex/agents/project-memory.toml` |
| Claude | `~/.claude/skills/` | `~/.claude/agents/project-memory.md` |
| DSH | 命令行：`dsh plugin add …` | `~/.dsh/.agent-presets/project-memory/` |
| Global | `~/.agents/skills/` | `~/.agents/agents/project-memory.md` |

> `all` 将技能写入 `~/.claude/skills` 和 `~/.agents/skills`（避免 OpenCode 双重加载），并为所有平台生成代理文件，同时打印 DSH 插件安装命令。

**本地参数：** `-Target all`、`-Verify`（预演模式）、`-Branch dev`、`-Target dsh`。
**Codex 注意：** 需要在 `~/.codex/config.toml` 中设置 `[features] multi_agent = true`（安装脚本会打印提示，不会修改你的配置文件）。

---

## DeepSeek Harness（DSH）插件

本项目提供了一个 **DSH bundle 插件**（`@lovedolove/dsh-project-memory`），可通过 Cordis 技能注册表将全部 8 个 Project Memory 技能挂载到任意 DSH 配置文件中。插件还会在 `codebase-memory-mcp` 可用时注册 `cbm_*` 工具，并在未找到 `AGENTS.md` 时注入首次初始化提示。

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

安装完成后，作为子代理调度编排器：
```powershell
use_agent(agent: "project-memory", prompt: "compound my last task")
```

**DSH 插件内部说明：** npm 包（位于 `dsh-plugin/`）使用两行 Cordis patch——第一行将工作区的 `skills/` 目录注册为自定义技能根路径，第二行加载运行时胶水（`dsh/plugin.mjs`），动态重新注册技能并在任务完成后注入记忆提炼提示。

---

## 使用方法

在任何支持的代理中调用编排器：

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

- `skills/knowledge-compounding/references/` —— 接地验证、持久性基准、质量约束
- `skills/memory-edit/references/` —— 编辑操作、迁移流程
- `skills/memory-verification/references/` —— 声明验证、证据置信度

---

## 测试

```powershell
Invoke-Pester ./install.tests.ps1
```

10 项测试覆盖各安装目标、无重复加载规则，以及确保 8 个技能、其清单与两份代理文件保持一致的防护机制。

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
