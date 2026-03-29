---
name: requirement-status
description: 显示需求的详细状态，包括进度、验收标准和下一步建议
---

# /requirement-status

显示需求的详细状态信息。

## 用法

```
/requirement-status <需求ID>
/requirement-status --current
/requirement-status --list
```

## 选项

- `<需求ID>`: 要查看的需求 ID（如 `req-20260329-211628`）
- `--current`: 显示当前检测到的需求（基于 git branch 或最近活动）
- `--list`: 列出所有需求（带过滤选项）

## 显示内容

### 1. 基本信息
- 需求 ID、名称、类型
- 当前阶段和状态
- 创建时间和最后更新时间
- Git 分支信息

### 2. 工作流进度
```
✅ plan (completed)
🔄 design (in_progress)
⏳ implement
⏳ test
⏳ review (manual)
⏳ verify (manual)
⏳ commit
```

### 3. 验收标准检查表
```
[ ] AC-1: 每个阶段完成后生成结构化handoff文档
[x] AC-2: 根据阶段类型自动调用对应Agent
[ ] AC-3: manual模式阶段实现确认等待机制
[ ] AC-4: acceptanceCriteria结构化为可检查项
[ ] AC-5: 阶段完成时生成标准化摘要
```

### 4. 下一步建议
- 推荐的下一个 Agent（如需要）
- 当前阶段的下一步操作

### 5. 最近活动
显示最近的 progressLog 条目

## 示例

```
/requirement-status req-20260329-211628
/requirement-status --current
/requirement-status --list
```

## 输出格式

```
# 需求状态: ECC工作流整合到需求进度追踪器

**ID**: req-20260329-211628
**类型**: medium
**状态**: in_progress

## 工作流进度
✅ plan → 🔄 design → ⏳ implement → ⏳ test → ⏳ review → ⏳ verify → ⏳ commit

## 当前阶段
**阶段**: design (auto)
**需要确认**: 否

## 验收标准
[ ] AC-1: 每个阶段完成后生成结构化handoff文档
[x] AC-2: 根据阶段类型自动调用对应Agent
...

## 下一步
**推荐Agent**: tdd-guide
**原因**: 下一阶段 'implement' 映射到 tdd-guide agent
```
