# 需求进度追踪器 (Requirement Progress Tracker)

需求进度追踪器是一个智能工作流管理系统，能够记住完整的开发阶段和当前需求进度。只需说"继续"，系统就会自动匹配当前进度到工作流阶段，并执行相应的操作。

---

## 1. 概述

需求进度追踪器解决了一个核心问题：**如何在多次会话中持续追踪一个需求的开发进度？**

### 核心能力

- **进度记忆**: 自动记录当前需求处于哪个工作流阶段
- **智能恢复**: 重启后自动识别当前需求并恢复到正确状态
- **混合推进模式**: 简单阶段自动推进，复杂阶段等待确认
- **完整日志**: 记录所有进度历史，便于回顾和调试
- **双存储位置**: 支持项目级（版本控制）和用户级（跨项目）存储

### 双存储位置

| 位置 | 路径 | 用途 |
|------|------|------|
| **project** (默认) | `{cwd}/.requirements/` | 随项目版本控制，团队可见 |
| **user** | `~/.claude/requirements/` | 跨项目共享，个人使用 |

### 工作原理

```
用户说"继续"
    ↓
系统读取需求索引（从 project 和 user 两个位置）
    ↓
匹配当前需求（git branch / localPath / 最近活跃）
    ↓
根据当前阶段模式决定行为：
  - auto: 自动执行 → 自动推进到下一阶段
  - manual: 执行 → 等待用户再次说"继续"
```

---

## 2. 安装

需求进度追踪器随 Everything Claude Code 插件一起安装。

### 前置要求

- Everything Claude Code 插件已安装
- Node.js 12.0 或更高版本

### 安装步骤

```bash
# 1. 克隆或更新插件
git pull origin main

# 2. 运行安装脚本
./install.sh

# 3. 验证安装
ls ~/.claude/requirements/
```

### 目录结构

根据存储位置不同，目录结构也不同：

#### 用户级存储 (default)

```
~/.claude/requirements/
├── index.json                  # 需求索引文件
├── config.json5                # 全局配置
├── requirements/               # 需求文件目录
│   ├── req-20260322-143052.json
│   └── req-20260322-150120.json
└── templates/                  # 需求模板
    ├── index.json5
    ├── micro.json5
    ├── small.json5
    ├── medium.json5
    ├── large.json5
    ├── extra-large.json5
    └── continuous.json5
```

#### 项目级存储 (--location=project)

```
{项目根目录}/
├── .requirements/              # 需求目录（建议加入 .gitignore）
│   ├── index.json             # 需求索引文件
│   └── requirements/          # 需求文件目录
│       ├── req-20260329-120000.json
│       └── req-20260329-130000.json
└── requirements/               # 项目级配置和模板（可选）
    ├── config.json5
    └── templates/
        ├── micro.json5
        └── ...
```

---

## 3. 快速开始

只需 3 步，即可开始使用需求进度追踪器。

### 第 1 步：创建需求

```bash
/requirement-create 实现用户登录功能
```

系统会：
1. 自动分析需求复杂度
2. 选择合适的工作流类型
3. 生成唯一 ID: `req-20260322-143052`
4. 捕获 Git 信息（branch, remote, localPath）
5. 初始化进度追踪

### 第 2 步：开发过程中说"继续"

```bash
/continue
```

系统会：
1. 读取当前需求进度
2. 执行当前阶段的 agent/command
3. 自动推进到下一阶段（或等待确认）

### 第 3 步：查看进度

```bash
# 查看所有需求
node scripts/requirement-manager.js list

# 查看特定需求详情
cat ~/.claude/requirements/requirements/req-20260322-143052.json | jq .progress
```

---

## 4. 命令使用

### /requirement-create

创建新需求并初始化进度追踪。

#### 用法

```
/requirement-create <描述>
/requirement-create --type=<type> <描述>
/requirement-create --location=<location> <描述>
```

#### 选项

| 选项 | 说明 |
|------|------|
| `--type=micro` | 微需求（修复 typo、小改动） |
| `--type=small` | 小需求（单文件功能、TDD 开发） |
| `--type=medium` | 普通需求（标准功能开发） |
| `--type=large` | 大需求（多组件、复杂逻辑） |
| `--type=extra-large` | 超大需求（多模块系统） |
| `--type=continuous` | 持续开发模式 |
| `--location=project` | 项目级存储 `.requirements/` (默认) |
| `--location=user` | 用户级存储 `~/.claude/requirements/` |

#### 存储位置

- **项目级 (默认)**: `.requirements/{id}.json` - 随项目版本控制，适合团队协作
- **用户级**: `~/.claude/requirements/{id}.json` - 跨项目共享，适合个人使用

#### 示例

```bash
# 自动检测类型，项目级存储
/requirement-create 实现用户登录功能

# 明确指定大需求
/requirement-create --type=large 搭建支付系统

# 快速修复
/requirement-create --type=micro 修复登录页面的拼写错误

# 用户级存储（跨项目共享）
/requirement-create --location=user 实现用户登录功能
```

#### 内部流程

1. 解析需求描述
2. 检测/分析需求类型（自动或显式指定 `--type`）
3. 检测存储位置（默认 `project`，或 `--location=user`）
4. 生成基于时间戳的 ID: `req-{YYYYMMDD}-{HHMMSS}`
5. 从模板创建需求文件到对应存储位置
6. 捕获 Git 信息（remote, branch, baseBranch, localPath）
7. 创建初始 progressLog 条目（包含存储位置）
8. 更新对应位置的 index.json

---

### /continue

继续当前需求的开发，推进到下一个工作流阶段。

#### 用法

```
/continue                    # 继续猜测的需求
/continue <requirement-id>   # 继续指定需求
```

#### 示例

```bash
# 自动识别当前需求并继续
/continue

# 继续指定需求
/continue req-20260322-143052
```

#### 内部流程

1. **识别需求**（如果未提供 ID）
   - 按 git branch 匹配
   - 按 localPath 匹配
   - 按最近活动时间匹配

2. **读取进度**
   - 加载需求文件
   - 获取当前阶段和模式

3. **执行阶段**
   - 调用相应的 agent/command/skill
   - 例如：plan 阶段调用 planner agent

4. **推进阶段**
   - auto 模式：自动推进到下一阶段
   - manual 模式：等待用户再次说"继续"

5. **更新记录**
   - 追加 progressLog 条目
   - 更新需求文件

---

## 5. 工作流类型

需求进度追踪器提供 6 种工作流类型，适用于不同规模和复杂度的需求。

### 工作流类型对比

| 类型 | 阶段数 | 适用场景 | 手动确认点 |
|------|--------|----------|------------|
| **micro** | 3 | 修复、小改动 | 1 |
| **small** | 5 | 单文件功能 | 2 |
| **medium** | 7 | 标准功能 | 2 |
| **large** | 9 | 多组件功能 | 3 |
| **extra-large** | 12 | 多模块系统 | 5 |
| **continuous** | 1 | 持续开发 | 0 |

---

### micro - 微需求

**适用场景**: 修复 typo、小改动、简单配置更新

**阶段序列**: `implement → verify → commit`

| 阶段 | 模式 | 说明 |
|------|------|------|
| implement | auto | 直接实现 |
| verify | manual | 需要用户确认验证结果 |
| commit | auto | 自动提交 |

**示例**:
```bash
/requirement-create --type=micro 修复文档中的链接错误
```

---

### small - 小需求

**适用场景**: 单文件功能、TDD 开发

**阶段序列**: `plan → test-first → implement → review → commit`

| 阶段 | 模式 | 说明 |
|------|------|------|
| plan | manual | 需要用户确认计划 |
| test-first | auto | 编写测试 |
| implement | auto | 实现功能 |
| review | manual | 需要用户确认代码审查 |
| commit | auto | 自动提交 |

**示例**:
```bash
/requirement-create --type=small 添加用户头像上传功能
```

---

### medium - 中等需求

**适用场景**: 标准功能开发

**阶段序列**: `plan → design → implement → test → review → verify → commit`

| 阶段 | 模式 | 说明 |
|------|------|------|
| plan | manual | 需要用户确认计划 |
| design | auto | 设计阶段 |
| implement | auto | 实现功能 |
| test | auto | 测试阶段 |
| review | manual | 需要用户确认代码审查 |
| verify | manual | 需要用户确认验证结果 |
| commit | auto | 自动提交 |

**示例**:
```bash
/requirement-create --type=medium 实现用户认证系统
```

---

### large - 大需求

**适用场景**: 多组件功能、复杂业务逻辑

**阶段序列**: `plan → design → implement → test → review → security → e2e → verify → commit`

| 阶段 | 模式 | 说明 |
|------|------|------|
| plan | manual | 需要用户确认计划 |
| design | auto | 设计阶段 |
| implement | auto | 实现功能 |
| test | auto | 测试阶段 |
| review | manual | 需要用户确认代码审查 |
| security | manual | 需要用户确认安全审查 |
| e2e | auto | 端到端测试 |
| verify | manual | 需要用户确认验证结果 |
| commit | auto | 自动提交 |

**示例**:
```bash
/requirement-create --type=large 搭建电商支付系统
```

---

### extra-large - 超大需求

**适用场景**: 多模块系统、大型架构变更

**阶段序列**: `research → ideation → plan → design → implement → test → review → security → e2e → optimize → verify → commit`

| 阶段 | 模式 | 说明 |
|------|------|------|
| research | manual | 研究阶段 |
| ideation | manual | 构思阶段 |
| plan | manual | 需要用户确认计划 |
| design | auto | 设计阶段 |
| implement | auto | 实现功能 |
| test | auto | 测试阶段 |
| review | manual | 需要用户确认代码审查 |
| security | manual | 需要用户确认安全审查 |
| e2e | auto | 端到端测试 |
| optimize | auto | 优化阶段 |
| verify | manual | 需要用户确认验证结果 |
| commit | auto | 自动提交 |

**示例**:
```bash
/requirement-create --type=extra-large 建立微服务架构
```

---

### continuous - 持续开发

**适用场景**: 长期项目、持续迭代

**阶段序列**: `loop`（持续循环执行）

| 阶段 | 模式 | 说明 |
|------|------|------|
| loop | auto | 持续执行，无手动确认点 |

**特点**:
- 无需用户确认
- 自动循环执行
- 适合长期维护项目

**示例**:
```bash
/requirement-create --type=continuous 日常项目维护
```

---

## 6. 进度追踪原理

### 自动推进 vs 手动确认

需求进度追踪器采用**混合模式**管理进度推进：

#### 自动推进 (auto)

- 阶段完成后**自动**进入下一阶段
- 适用于：简单、确定性高的任务
- 例如：implement, test, commit 等

#### 手动确认 (manual)

- 阶段完成后**暂停**，等待用户说"继续"
- 适用于：需要人工判断的关键节点
- 例如：plan（计划审查）、review（代码审查）、security（安全审查）

#### 阶段模式示例

```
当前阶段: implement (auto)
    ↓
implement 完成
    ↓
自动进入 verify (manual)
    ↓
verify 暂停，等待用户确认
    ↓
用户说 "继续"
    ↓
进入 commit (auto)
    ↓
自动提交，需求完成
```

### 阶段模式说明

每个阶段都有 `mode` 属性：

```json
{
  "name": "review",
  "mode": "manual",
  "status": "pending"
}
```

| 模式 | 阶段完成后 | 等待时间 |
|------|----------|----------|
| `auto` | 自动推进 | 无 |
| `manual` | 暂停等待 | 直到用户说"继续" |

---

## 7. 会话恢复

需求进度追踪器能够在会话重启后快速恢复工作状态。

### 恢复流程

```
会话启动 / 重启
    ↓
读取两个位置的 index.json
  - 项目级: {cwd}/.requirements/index.json
  - 用户级: ~/.claude/requirements/index.json
    ↓
合并所有活跃需求（status: in_progress）
    ↓
自动猜测当前需求：
  1. 用 git branch 匹配
  2. 用 remote URL 匹配
  3. 用 localPath 前缀匹配
  4. 按 updatedAt 倒序，取最新
    ↓
询问用户："检测到你在开发 [需求名]，继续？"
    ↓
是 → 加载该需求的进度
    ↓
否 → 列出所有需求让用户选择
```

### 匹配优先级

| 优先级 | 匹配方式 | 说明 |
|--------|----------|------|
| 1 | git branch | 精确匹配当前 git 分支 |
| 2 | remote URL | 匹配远程仓库地址 |
| 3 | localPath | 当前目录是项目的子目录 |
| 4 | 最近活跃 | 按 updatedAt 倒序排列 |

### 手动选择需求

如果自动猜测不准确，可以手动指定：

```bash
# 列出所有需求
node scripts/requirement-manager.js list

# 继续指定需求
/continue req-20260322-143052
```

### 按位置筛选

可以使用 `--location` 参数筛选特定位置的需求：

```bash
# 只查看项目级需求
node scripts/requirement-manager.js list --location=project

# 只查看用户级需求
node scripts/requirement-manager.js list --location=user
```

---

## 8. 目录结构

### 需求文件位置

需求文件根据创建时的 `--location` 参数存储在不同位置：

#### 用户级存储 (`--location=user`)

```
~/.claude/requirements/
├── index.json                  # 索引文件
├── requirements/               # 需求文件目录
│   ├── req-20260322-143052.json   # 需求 A
│   └── req-20260322-150120.json   # 需求 B
└── templates/                  # 模板目录（安装时复制）
```

#### 项目级存储 (`--location=project`)

```
{项目根目录}/
└── .requirements/
    ├── index.json                  # 索引文件
    └── requirements/               # 需求文件目录
        ├── req-20260329-120000.json   # 需求 C
        └── req-20260329-130000.json   # 需求 D
```

**需求文件名格式**: `{requirement-id}.json`

例如：`req-20260322-143052.json`

**重要**: 项目级存储 `.requirements/` 建议加入 `.gitignore`，除非你希望团队共享需求进度。

---

### 索引文件

`index.json` 是需求追踪系统的入口点，采用**渐进式披露**设计：

#### 结构

```json
{
  "version": "1.0",
  "updatedAt": "2026-03-22T16:00:00Z",
  "requirements": [
    {
      "id": "req-20260322-143052",
      "name": "用户认证功能",
      "type": "medium",
      "status": "in_progress",
      "currentPhase": "implement",
      "path": "requirements/req-20260322-143052.json",
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

#### 索引文件用途

1. **快速概览**: 无需读取所有需求文件即可查看所有需求状态
2. **需求选择**: 帮助用户选择要继续的需求
3. **自动匹配**: 根据 git 信息自动识别当前需求

---

### 需求文件结构

每个需求文件包含完整的进度信息：

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

  "storageLocation": "project",

  "description": "实现用户注册、登录、登出功能，支持邮箱和第三方OAuth。",

  "acceptanceCriteria": [
    "用户可以使用邮箱注册账号",
    "用户可以登录和登出",
    "第三方OAuth登录正常工作"
  ],

  "progressLog": [
    {
      "timestamp": "2026-03-22T14:30:52Z",
      "event": "created",
      "details": { "name": "用户认证功能", "type": "medium" }
    },
    {
      "timestamp": "2026-03-22T14:35:00Z",
      "event": "phase_entered",
      "details": { "phase": "plan" }
    },
    {
      "timestamp": "2026-03-22T14:40:00Z",
      "event": "phase_completed",
      "details": { "phase": "plan" }
    },
    {
      "timestamp": "2026-03-22T14:40:01Z",
      "event": "phase_entered",
      "details": { "phase": "design" }
    }
  ],

  "progress": {
    "phases": [
      { "name": "plan", "mode": "manual", "status": "completed" },
      { "name": "design", "mode": "auto", "status": "completed" },
      { "name": "implement", "mode": "auto", "status": "in_progress" },
      { "name": "test", "mode": "auto", "status": "pending" },
      { "name": "review", "mode": "manual", "status": "pending" },
      { "name": "verify", "mode": "manual", "status": "pending" },
      { "name": "commit", "mode": "auto", "status": "pending" }
    ]
  }
}
```

---

### 进度日志事件类型

| 事件类型 | 说明 | 使用场景 |
|----------|------|----------|
| `created` | 需求创建 | 创建新需求时 |
| `phase_entered` | 进入阶段 | 开始执行新阶段 |
| `phase_completed` | 阶段完成 | 阶段任务完成 |
| `phase_blocked` | 阶段阻塞 | 等待外部依赖 |
| `user_confirmed` | 用户确认 | 手动确认阶段 |
| `auto_advanced` | 自动推进 | 自动进入下一阶段 |
| `note` | 备注 | 会话结束记录 |

---

## 附录

### 相关文件

| 文件路径 | 说明 |
|----------|------|
| `scripts/requirement-manager.js` | 核心需求管理脚本 |
| `~/.claude/scripts/requirement-manager.js` | 用户级部署的脚本副本 |
| `commands/requirement-create.md` | 创建需求命令定义 |
| `~/.claude/commands/requirement-create.md` | 用户级部署的命令定义副本 |
| `requirements/config.json5` | 全局配置 |
| `requirements/templates/*.json5` | 需求模板 |
| `.requirements/` | 项目级需求目录（默认） |
| `~/.claude/requirements/` | 用户级需求目录 |

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `CLAUDE_CURRENT_REQUIREMENT_ID` | 当前需求 ID |
| `CLAUDE_CURRENT_PHASE` | 当前阶段名称 |

### 常见问题

**Q: 如何取消一个需求？**

A: 手动编辑需求文件，将 `status` 改为 `cancelled`。

**Q: 如何查看完整进度日志？**

A: `cat ~/.claude/requirements/requirements/{id}.json | jq .progressLog`

**Q: 可以同时开发多个需求吗？**

A: 可以，但建议一次专注于一个需求。其他需求会保留在 `in_progress` 状态。

**Q: 两种存储位置如何选择？**

| 场景 | 推荐位置 |
|------|----------|
| 团队协作项目，需求进度需要共享 | **project** |
| 个人项目，跨项目使用同一套需求 | **user** |
| 需要将需求提交到 git | **project** |
| 多项目咨询类工作 | **user** |

**Q: 如何迁移需求到不同位置？**

A: 目前需要手动迁移：
1. 将需求 JSON 文件复制到目标位置的 `requirements/` 目录
2. 更新 `storageLocation` 字段
3. 重新构建目标位置的 `index.json`

**Q: 项目级需求目录应该加入 .gitignore 吗？**

A: 建议加入，除非你需要团队共享需求进度。大多数情况下需求进度是个人隐私信息。
