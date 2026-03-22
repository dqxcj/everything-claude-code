# 需求进度追踪器 (Requirement Progress Tracker) 设计文档

**项目:** 需求进度追踪器
**日期:** 2026-03-22
**状态:** 已批准

## 概述

一个需求进度管理系统，能够记住完整的 ECC 工作流阶段和当前需求进度。当用户说"继续"时，系统匹配当前进度到工作流阶段，并执行相应的 agent/command/skill。

## 核心概念

- **需求文件:** 每个需求是一个 JSON 文件，包含描述、验收标准、工作流类型、当前阶段和进度日志
- **索引文件:** `index.json` 作为入口，按状态和类型索引所有需求
- **工作流引擎:** 根据需求类型自动匹配工作流阶段，自动推进或暂停等待用户确认
- **进度日志:** 完整的进度历史记录，用于重启后快速了解状态

## 文件结构

```
~/.claude/requirements/
├── index.json              # 索引文件（渐进式披露入口）
├── config.json5            # 全局配置（工作流定义）
└── templates/
    ├── index.json5         # 索引模板（含注释）
    ├── micro.json5         # 微需求模板
    ├── small.json5         # 小需求模板
    ├── medium.json5        # 中等需求模板
    ├── large.json5         # 大需求模板
    ├── extra-large.json5   # 超大需求模板
    └── continuous.json5   # 持续开发模板
```

## 工作流类型

| 类型 | 阶段序列 | 用户确认点 |
|------|----------|-----------|
| **micro** | implement → verify → commit | verify |
| **small** | plan → test-first → implement → review → commit | plan, review |
| **medium** | plan → design → implement → test → review → verify → commit | plan, review |
| **large** | plan → design → implement → test → review → security → e2e → verify → commit | plan, review, security |
| **extra-large** | research → ideation → plan → design → implement → test → review → security → e2e → optimize → verify → commit | research, ideation, plan, review, security |
| **continuous** | loop（持续执行） | 无 |

## 数据结构

### 索引文件 (`index.json`)

```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-22T16:00:00Z",
  "requirements": [
    {
      "id": "req-20260322-143052",
      "name": "用户认证功能",
      "type": "medium",
      "status": "in_progress",
      "currentPhase": "implement",
      "path": "medium/req-20260322-143052.json",
      "createdAt": "2026-03-22T14:30:52Z",
      "updatedAt": "2026-03-22T15:45:00Z",
      "git": {
        "remote": "https://github.com/user/project.git",
        "branch": "feature/user-auth",
        "baseBranch": "main",
        "localPath": "/home/user/projects/myapp"
      }
    }
  ]
}
```

### 需求文件

```json
{
  "id": "req-20260322-143052",
  "name": "用户认证功能",
  "type": "medium",
  "status": "in_progress",
  "currentPhase": "implement",
  "createdAt": "2026-03-22T14:30:52Z",
  "updatedAt": "2026-03-22T15:45:00Z",

  "git": {
    "remote": "https://github.com/user/project.git",
    "branch": "feature/user-auth",
    "baseBranch": "main",
    "localPath": "/home/user/projects/myapp"
  },

  "description": "实现用户注册、登录、登出功能，支持邮箱和第三方OAuth。",
  "acceptanceCriteria": [
    "用户可以使用邮箱注册账号",
    "用户可以登录和登出"
  ],

  "progressLog": [
    {
      "timestamp": "2026-03-22T14:30:52Z",
      "phase": "created",
      "event": "用户创建了需求",
      "details": "实现用户认证功能"
    },
    {
      "timestamp": "2026-03-22T14:35:00Z",
      "phase": "plan",
      "event": "进入 plan 阶段",
      "details": "调用 planner agent 进行需求分析和规划"
    }
  ],

  "progress": {
    "phases": [
      { "name": "plan", "mode": "manual", "status": "completed" },
      { "name": "design", "mode": "auto", "status": "completed" },
      { "name": "implement", "mode": "auto", "status": "in_progress" },
      { "name": "test", "mode": "auto", "status": "pending" },
      { "name": "review", "mode": "manual", "status": "pending" },
      { "name": "verify", "mode": "auto", "status": "pending" },
      { "name": "commit", "mode": "auto", "status": "pending" }
    ]
  }
}
```

### 进度日志事件类型

| 事件类型 | 说明 |
|------------|-------------|
| `created` | 需求创建 |
| `phase_entered` | 进入新阶段 |
| `phase_completed` | 阶段完成 |
| `phase_blocked` | 阶段被阻塞 |
| `user_confirmed` | 用户确认 |
| `auto_advanced` | 自动推进 |
| `note` | 备注/中间状态 |

### 字段枚举

**type:**
- `micro`: 微需求（修复 typo、小改动）
- `small`: 小需求（单文件功能、TDD）
- `medium`: 中等需求（标准功能）
- `large`: 大需求（多组件）
- `extra-large`: 超大需求（多模块系统）
- `continuous`: 持续开发

**status:**
- `pending`: 等待开始
- `in_progress`: 进行中
- `completed`: 已完成
- `blocked`: 被阻塞（等待外部依赖）
- `cancelled`: 已取消

**phase mode:**
- `auto`: 自动推进（阶段完成后自动进入下一阶段）
- `manual`: 手动确认（阶段完成后等待用户确认"继续"）

## 交互方式

| 触发方式 | 实现 |
|---------|------|
| **对话触发** | 用户说"继续" |
| **命令触发** | `/continue`、`/requirement-create` |
| **钩子自动触发** | Stop hook 更新 progressLog |

## 会话恢复流程

```
Session Start / 重启
    ↓
读取 ~/.claude/requirements/index.json
    ↓
获取所有活跃需求（status: in_progress）
    ↓
┌─────────────────────────────────────────┐
│  自动猜测当前需求：                        │
│  1. 用 git branch 匹配                   │
│  2. 用 remote URL 匹配                   │
│  3. 用 localPath 前缀匹配                 │
│  4. 按 updatedAt 倒序，取最新             │
└─────────────────────────────────────────┘
    ↓
询问用户："检测到你在开发 [需求名]，继续？"
    ↓
是 → 加载该需求的进度
    ↓
否 → 列出所有需求让用户选择
```

### 匹配优先级

| 优先级 | 匹配方式 | 说明 |
|----------|--------------|-------------|
| 1 | git branch | 精确匹配 branch 字段 |
| 2 | remote URL | 匹配远程仓库 |
| 3 | localPath 前缀 | 当前目录是项目子目录 |
| 4 | 最近活跃 | 按 updatedAt 倒序 |

## 组件设计

| 组件 | 职责 |
|-----------|----------------|
| **模板文件** | JSON5 格式，含注释说明所有字段取值 |
| **工作流引擎** | 读取需求进度，执行当前阶段，更新状态 |
| **索引管理器** | 维护 index.json，支持查询和过滤 |
| **进度记录器** | 记录进度日志，带时间戳和事件 |
| **自动推进器** | 混合模式下自动推进简单阶段 |

## 实现计划

### 需要创建的文件

1. `~/.claude/requirements/templates/*.json5` — 所有模板文件
2. `~/.claude/requirements/config.json5` — 全局配置
3. `scripts/requirement-manager.js` — 核心需求管理脚本
4. `scripts/hooks/update-progress-hook.js` — Stop hook 脚本
5. 修改 `AGENTS.md` — 主 agent 增加需求管理能力
6. 新增命令文件：`commands/requirement-create.md`、`commands/continue.md`

### Stop Hook 行为

Stop Hook 使用以下环境变量：
- `CLAUDE_CURRENT_REQUIREMENT_ID`: 当前正在处理的需求 ID
- `CLAUDE_CURRENT_PHASE`: 当前阶段名称

Hook 执行流程：
1. 读取 `CLAUDE_CURRENT_REQUIREMENT_ID` 环境变量
2. 读取对应需求文件
3. 在 progressLog 中追加新条目
4. 更新 index.json 的 lastUpdated
5. 写入需求文件

## 设计原则

1. **渐进式披露:** 先读 index，再读需求文件
2. **JSON5 格式:** 模板带注释说明字段文档
3. **多终端支持:** 目录隔离，时间戳 ID 避免冲突
4. **混合模式:** 自动推进简单阶段，复杂阶段需用户确认
5. **快速恢复:** 完整进度日志，重启后快速了解状态
