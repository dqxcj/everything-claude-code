# 需求进度追踪器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 实现一个需求进度管理系统，记住 ECC 工作流阶段和当前需求进度，使用户只需说"继续"即可推进需求。

**架构：**
- JSON5 模板文件，含注释说明所有字段取值
- 核心 Node.js 脚本用于需求 CRUD 操作
- Stop hook 自动记录进度
- 通过修改 AGENTS.md 集成到主 agent
- 用户交互命令 (`/requirement-create`, `/continue`)

**技术栈：** Node.js, JSON5, Claude Code hooks 系统

**重要说明：** 所有文件创建在仓库内，使用安装脚本部署到 `~/.claude/`

---

## 文件结构（仓库内）

```
requirements/
├── templates/
│   ├── index.json5         # 索引模板
│   ├── micro.json5        # 微需求模板
│   ├── small.json5        # 小需求模板
│   ├── medium.json5       # 中等需求模板
│   ├── large.json5        # 大需求模板
│   ├── extra-large.json5  # 超大需求模板
│   └── continuous.json5   # 持续开发模板
└── config.json5           # 全局配置

scripts/
├── requirement-manager.js   # 核心 CRUD 脚本
└── hooks/
    └── update-progress-hook.js  # Stop hook 脚本

commands/
├── requirement-create.md    # /requirement-create 命令
└── continue.md             # /continue 命令

hooks/
└── hooks.json              # 修改，添加 progress hook

AGENTS.md                   # 修改主 agent 能力

install.sh                  # 安装脚本（部署到 ~/.claude/）
```

---

## 任务 1: 创建模板文件

**文件：**
- 创建: `requirements/templates/index.json5`
- 创建: `requirements/templates/micro.json5`
- 创建: `requirements/templates/small.json5`
- 创建: `requirements/templates/medium.json5`
- 创建: `requirements/templates/large.json5`
- 创建: `requirements/templates/extra-large.json5`
- 创建: `requirements/templates/continuous.json5`
- 测试: `tests/lib/requirement-templates.test.js`

- [ ] **步骤 1: 创建 `requirements/templates/index.json5`**

```json5
{
  // 版本号，当前为 "1.0"
  version: "1.0",

  // 最后更新时间，ISO 8601 格式
  lastUpdated: "{{lastUpdated}}",

  // 需求列表，按创建时间倒序排列
  requirements: []
}
```

- [ ] **步骤 2: 创建 `requirements/templates/micro.json5`**

```json5
{
  // ========== 基础信息 ==========

  // 需求 ID，格式：req-{年月日時分秒}，如 req-20260322-143052
  id: "{{id}}",

  // 需求名称，简短描述（不超过 50 字符）
  name: "",

  // 需求类型，取值范围：
  // - "micro"：微需求（修复 typo、小改动）
  // - "small"：小需求（单文件功能、TDD 开发）
  // - "medium"：普通需求（标准功能开发）
  // - "large"：大需求（多组件、复杂逻辑）
  // - "extra-large"：超大需求（多模块系统）
  // - "continuous"：持续开发
  type: "micro",

  // 需求状态，取值范围：
  // - "pending"：等待开始
  // - "in_progress"：进行中
  // - "completed"：已完成
  // - "blocked"：被阻塞（等待外部依赖）
  // - "cancelled"：已取消
  status: "pending",

  // 当前阶段名称（如 "implement", "verify" 等）
  currentPhase: null,

  // 创建时间，ISO 8601 格式
  createdAt: "{{createdAt}}",

  // 最后更新时间，ISO 8601 格式
  updatedAt: "{{updatedAt}}",

  // ========== Git 信息 ==========

  git: {
    // Git 远程仓库 URL
    remote: "",
    // 当前分支名
    branch: "",
    // 基础分支名（如 main, master）
    baseBranch: "",
    // 本地项目根目录路径
    localPath: ""
  },

  // ========== 需求内容 ==========

  // 需求详细描述（支持多行）
  description: "",

  // 验收标准列表，每项一个目标
  acceptanceCriteria: [],

  // ========== 进度日志 ==========

  // 进度日志，按时间正序排列
  progressLog: [],

  // ========== 工作流进度 ==========

  // 工作流阶段定义
  // micro 工作流：implement → verify → commit
  progress: {
    phases: [
      { name: "implement", mode: "auto", status: "pending" },
      { name: "verify", mode: "manual", status: "pending" },
      { name: "commit", mode: "auto", status: "pending" }
    ]
  }
}
```

- [ ] **步骤 3: 创建 `requirements/templates/small.json5`**

结构相同，type: "small"，阶段: plan → test-first → implement → review → commit

- [ ] **步骤 4: 创建 `requirements/templates/medium.json5`**

结构相同，type: "medium"，阶段: plan → design → implement → test → review → verify → commit

- [ ] **步骤 5: 创建 `requirements/templates/large.json5`**

结构相同，type: "large"，阶段: plan → design → implement → test → review → security → e2e → verify → commit

- [ ] **步骤 6: 创建 `requirements/templates/extra-large.json5`**

结构相同，type: "extra-large"，阶段: research → ideation → plan → design → implement → test → review → security → e2e → optimize → verify → commit

- [ ] **步骤 7: 创建 `requirements/templates/continuous.json5`**

结构相同，type: "continuous"，阶段: loop（持续模式）

- [ ] **步骤 8: 创建测试文件 `tests/lib/requirement-templates.test.js`**

```javascript
const fs = require('fs');
const path = require('path');

describe('Requirement Templates', () => {
  const templatesDir = path.join(__dirname, '../../requirements/templates');

  const expectedTypes = ['micro', 'small', 'medium', 'large', 'extra-large', 'continuous'];

  expectedTypes.forEach(type => {
    test(`${type}.json5 模板存在`, () => {
      const templatePath = path.join(templatesDir, `${type}.json5`);
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test(`${type}.json5 结构有效`, () => {
      const templatePath = path.join(templatesDir, `${type}.json5`);
      const content = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON5.parse(content);
      expect(template.id).toBe("{{id}}");
      expect(template.type).toBe(type);
      expect(template.status).toBe("pending");
      expect(template.progress).toBeDefined();
      expect(template.progress.phases).toBeInstanceOf(Array);
    });
  });
});
```

- [ ] **步骤 9: 运行测试验证模板**

运行: `npm test tests/lib/requirement-templates.test.js`
预期: 所有模板测试通过

- [ ] **步骤 10: 提交**

```bash
git add requirements/templates/
git commit -m "feat: 添加需求进度追踪器模板"
```

---

## 任务 2: 创建配置文件

**文件：**
- 创建: `requirements/config.json5`
- 测试: `tests/lib/requirement-config.test.js`

- [ ] **步骤 1: 创建 `requirements/config.json5`**

```json5
{
  // Requirement Progress Tracker 配置

  // 版本
  version: "1.0",

  // 需求存储根目录
  requirementsRoot: "~/.claude/requirements",

  // 工作流定义
  workflows: {
    micro: {
      phases: ["implement", "verify", "commit"]
    },
    small: {
      phases: ["plan", "test-first", "implement", "review", "commit"]
    },
    medium: {
      phases: ["plan", "design", "implement", "test", "review", "verify", "commit"]
    },
    large: {
      phases: ["plan", "design", "implement", "test", "review", "security", "e2e", "verify", "commit"]
    },
    "extra-large": {
      phases: ["research", "ideation", "plan", "design", "implement", "test", "review", "security", "e2e", "optimize", "verify", "commit"]
    },
    continuous: {
      phases: ["loop"]
    }
  },

  // 自动推进的阶段（mode: auto）
  autoPhases: {
    micro: ["implement", "commit"],
    small: ["test-first", "implement", "commit"],
    medium: ["design", "implement", "test", "verify", "commit"],
    large: ["design", "implement", "test", "e2e", "verify", "commit"],
    "extra-large": ["design", "implement", "test", "e2e", "optimize", "verify", "commit"],
    continuous: ["loop"]
  },

  // 需要手动确认的阶段（mode: manual）
  manualPhases: {
    micro: ["verify"],
    small: ["plan", "review"],
    medium: ["plan", "review"],
    large: ["plan", "review", "security"],
    "extra-large": ["research", "ideation", "plan", "review", "security"],
    continuous: []
  },

  // 进度日志事件类型
  logEventTypes: [
    "created",
    "phase_entered",
    "phase_completed",
    "phase_blocked",
    "user_confirmed",
    "auto_advanced",
    "note"
  ],

  // 需求状态
  statuses: ["pending", "in_progress", "completed", "blocked", "cancelled"],

  // 阶段状态
  phaseStatuses: ["pending", "in_progress", "completed", "blocked"]
}
```

- [ ] **步骤 2: 创建测试文件 `tests/lib/requirement-config.test.js`**

```javascript
const fs = require('fs');
const path = require('path');

describe('Requirement Config', () => {
  const configPath = path.join(__dirname, '../../requirements/config.json5');

  test('config.json5 存在', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('config 包含所有工作流定义', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    expect(config.workflows).toHaveProperty('micro');
    expect(config.workflows).toHaveProperty('small');
    expect(config.workflows).toHaveProperty('medium');
    expect(config.workflows).toHaveProperty('large');
    expect(config.workflows).toHaveProperty('extra-large');
    expect(config.workflows).toHaveProperty('continuous');
  });

  test('extra-large 工作流包含 optimize 阶段', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON5.parse(content);
    expect(config.workflows['extra-large'].phases).toContain('optimize');
  });
});
```

- [ ] **步骤 3: 运行测试**

运行: `npm test tests/lib/requirement-config.test.js`
预期: PASS

- [ ] **步骤 4: 提交**

```bash
git add requirements/config.json5 tests/lib/requirement-config.test.js
git commit -m "feat: 添加需求进度追踪器配置"
```

---

## 任务 3: 创建核心需求管理脚本

**文件：**
- 创建: `scripts/requirement-manager.js`
- 测试: `tests/lib/requirement-manager.test.js`

- [ ] **步骤 1: 创建 `scripts/requirement-manager.js`**

核心函数：
- `createRequirement(name, type, description, acceptanceCriteria)` - 创建新需求
- `getRequirement(id)` - 根据 ID 获取需求
- `listRequirements(filter)` - 列出需求，支持过滤
- `updateRequirementProgress(id, phase, event, details)` - 更新进度
- `advancePhase(id)` - 推进到下一阶段
- `guessCurrentRequirement()` - 根据 git/pwd 猜测当前需求
- `updateIndex()` - 从所有需求文件重建索引
- `initRequirementsDir()` - 初始化目录结构

- [ ] **步骤 2: 创建测试文件 `tests/lib/requirement-manager.test.js`**

```javascript
// Mock fs for testing
jest.mock('fs');
jest.mock('fs/promises');

describe('RequirementManager', () => {
  let rm;
  const mockFs = require('fs');

  beforeEach(() => {
    jest.resetModules();
    // Setup mock responses
    mockFs.existsSync.mockReturnValue(true);
    rm = require('../../scripts/requirement-manager');
  });

  describe('createRequirement', () => {
    test('创建需求使用时间戳 ID', () => {
      const req = rm.createRequirement('Test', 'micro', 'Test desc', []);
      expect(req.id).toMatch(/^req-\d{8}-\d{6}$/);
      expect(req.type).toBe('micro');
      expect(req.status).toBe('pending');
    });
  });

  describe('guessCurrentRequirement', () => {
    const mockGitBranch = 'feature/user-auth';
    const mockLocalPath = '/home/user/projects/myapp';

    test('按 git branch 匹配', () => {
      // Mock execSync to return git branch
    });
  });
});
```

- [ ] **步骤 3: 运行测试**

运行: `npm test tests/lib/requirement-manager.test.js`
预期: PASS (with mocked fs)

- [ ] **步骤 4: 提交**

```bash
git add scripts/requirement-manager.js tests/lib/requirement-manager.test.js
git commit -m "feat: 添加需求管理器核心脚本"
```

---

## 任务 4: 创建 Stop Hook 脚本

**文件：**
- 创建: `scripts/hooks/update-progress-hook.js`
- 修改: `hooks/hooks.json`（注册 hook）
- 测试: `tests/hooks/update-progress-hook.test.js`

- [ ] **步骤 1: 创建 `scripts/hooks/update-progress-hook.js`**

```javascript
#!/usr/bin/env node

const { updateRequirementProgress } = require('../requirement-manager');

async function main() {
  // 从环境变量获取当前需求 ID
  const requirementId = process.env.CLAUDE_CURRENT_REQUIREMENT_ID;
  if (!requirementId) {
    console.log('[Progress] No active requirement, skipping update');
    return;
  }

  // 从环境变量获取当前阶段
  const currentPhase = process.env.CLAUDE_CURRENT_PHASE || 'unknown';

  // 从 stdin 获取会话摘要（由 hook 传入）
  let sessionSummary = '';
  if (!process.stdin.isTTY) {
    sessionSummary = await new Promise(resolve => {
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
  }

  await updateRequirementProgress(requirementId, currentPhase, 'note', sessionSummary.slice(0, 500));
  console.log(`[Progress] Updated requirement ${requirementId}`);
}

main().catch(console.error);
```

- [ ] **步骤 2: 注册 Hook 到 `hooks/hooks.json`**

在 Stop hook 部分添加：

```json
{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/update-progress-hook.js\""
  }],
  "description": "Update requirement progress on session end"
}
```

- [ ] **步骤 3: 创建测试文件**

```javascript
describe('Update Progress Hook', () => {
  test('skips when no requirement ID', async () => {
    const originalEnv = { ...process.env };
    delete process.env.CLAUDE_CURRENT_REQUIREMENT_ID;
    // Test that it returns early
    process.env = originalEnv;
  });
});
```

- [ ] **步骤 4: 运行测试**

运行: `npm test tests/hooks/update-progress-hook.test.js`
预期: PASS

- [ ] **步骤 5: 提交**

```bash
git add scripts/hooks/update-progress-hook.js hooks/hooks.json
git commit -m "feat: 添加会话结束时更新进度的 hook"
```

---

## 任务 5: 创建命令文件

**文件：**
- 创建: `commands/requirement-create.md`
- 创建: `commands/continue.md`

- [ ] **步骤 1: 创建 `commands/requirement-create.md`**

```markdown
---
name: requirement-create
description: 创建新需求，自动检测类型并匹配工作流
---

# /requirement-create

创建新需求并初始化其进度追踪。

## 用法

```
/requirement-create <描述>
/requirement-create --type=medium <描述>
```

## 选项

- `--type=<type>`: 强制指定工作流类型 (micro/small/medium/large/extra-large/continuous)
- 如果未指定，系统会分析描述并猜测合适的类型。

## 功能

1. 解析需求描述
2. 检测/分析需求类型：
   - 根据关键词和复杂度自动检测
   - 或使用显式指定的类型
3. 生成基于时间戳的 ID: `req-{YYYYMMDD}-{HHMMSS}`
4. 从模板创建需求文件
5. 添加 git 信息（remote, branch, baseBranch, localPath）
6. 创建初始 progressLog 条目
7. 更新 index.json

## 示例

```
/requirement-create 实现用户登录功能
/requirement-create --type=large 搭建支付系统
/requirement-create --type=micro 修复登录页面的拼写错误
```

## 注意事项

- ID 生成使用时间戳，避免多终端场景下的冲突
- Git 信息自动从当前目录捕获
```

- [ ] **步骤 2: 创建 `commands/continue.md`**

```markdown
---
name: continue
description: 通过推进到下一阶段继续当前需求开发
---

# /continue

通过推进到下一个工作流阶段来继续当前需求的开发。

## 用法

```
/continue
/continue <requirement-id>
```

## 功能

1. 如果未提供 requirement-id，猜测当前需求：
   - 按 git branch 匹配
   - 按 localPath 匹配
   - 按最近活动时间匹配
2. 读取当前需求进度
3. 确定下一阶段：
   - 如果当前阶段模式是 "auto"：自动推进
   - 如果当前阶段模式是 "manual"：等待用户确认
4. 执行阶段（调用相应的 agent/command/skill）
5. 更新 progressLog
6. 更新需求文件

## 示例

```
/continue                    # 继续猜测的需求
/continue req-20260322-143052  # 继续指定需求
```

## 工作流匹配

| 阶段模式 | 行为 |
|----------|------|
| auto | 执行阶段 → 自动推进到下一阶段 → 重复直到 manual 或完成 |
| manual | 执行阶段 → 等待用户"继续" → 然后推进 |
```

- [ ] **步骤 3: 提交**

```bash
git add commands/requirement-create.md commands/continue.md
git commit -m "feat: 添加 requirement-create 和 continue 命令"
```

---

## 任务 6: 修改 AGENTS.md

**文件：**
- 修改: `AGENTS.md`

- [ ] **步骤 1: 阅读当前 AGENTS.md**

- [ ] **步骤 2: 在主 agent 能力中添加需求管理能力**

在主 agent 能力部分添加：

```markdown
## 需求进度管理

主 agent 还管理需求进度：

### 自动进度追踪
- 记住当前需求和工作流阶段
- 会话结束时记录进度到 `~/.claude/requirements/`
- 重启时从 index.json 恢复状态

### 工作流执行
- 将当前阶段匹配到相应的 agent/command/skill
- 对 "auto" 模式的阶段自动推进
- 对 "manual" 模式的阶段等待用户"继续"

### 会话恢复
- 读取 index.json 查找活跃需求
- 按 git branch/localPath 匹配需求
- 询问用户确认继续哪个需求
```

- [ ] **步骤 3: 提交**

```bash
git add AGENTS.md
git commit -m "feat: 为主 agent 添加需求进度管理能力"
```

---

## 任务 7: 创建安装脚本

**文件：**
- 创建: `install.sh`

- [ ] **步骤 1: 创建 `install.sh`**

```bash
#!/bin/bash
set -e

REQUIREMENTS_DIR="$HOME/.claude/requirements"

echo "Installing Requirement Progress Tracker..."

# 创建目录结构
mkdir -p "$REQUIREMENTS_DIR/templates"

# 复制模板文件
cp requirements/templates/*.json5 "$REQUIREMENTS_DIR/templates/"

# 复制配置文件
cp requirements/config.json5 "$REQUIREMENTS_DIR/"

# 复制核心脚本
mkdir -p "$HOME/.claude/scripts"
cp scripts/requirement-manager.js "$HOME/.claude/scripts/"
mkdir -p "$HOME/.claude/scripts/hooks"
cp scripts/hooks/update-progress-hook.js "$HOME/.claude/scripts/hooks/"

# 更新 hooks.json
# 注意：需要手动合并到现有 hooks.json

echo "Requirement Progress Tracker installed!"
echo "Please manually add the stop hook to hooks/hooks.json"
```

- [ ] **步骤 2: 提交**

```bash
git add install.sh
git commit -m "feat: 添加需求进度追踪器安装脚本"
```

---

## 任务 8: 集成测试

**文件：**
- 测试: 手动集成测试

- [ ] **步骤 1: 运行安装脚本**

```bash
./install.sh
```

- [ ] **步骤 2: 验证文件部署**

```bash
ls ~/.claude/requirements/templates/
cat ~/.claude/requirements/config.json5
```

- [ ] **步骤 3: 测试创建需求**

```bash
/requirement-create --type=micro 测试需求
```

- [ ] **步骤 4: 验证文件创建**

```bash
cat ~/.claude/requirements/index.json
ls ~/.claude/requirements/micro/
```

- [ ] **步骤 5: 测试 continue 流程**

```bash
/continue
```

- [ ] **步骤 6: 验证进度更新**

```bash
cat ~/.claude/requirements/micro/req-*.json | jq .progressLog
```

---

## 总结

| 任务 | 文件数 | 状态 |
|------|--------|------|
| 1 | 模板文件 (7) + 测试 | 待开始 |
| 2 | 配置文件 + 测试 | 待开始 |
| 3 | 核心脚本 + 测试 | 待开始 |
| 4 | Hook 脚本 + 注册 + 测试 | 待开始 |
| 5 | 命令文件 (2) | 待开始 |
| 6 | AGENTS.md | 待开始 |
| 7 | 安装脚本 | 待开始 |
| 8 | 集成测试 | 待开始 |
