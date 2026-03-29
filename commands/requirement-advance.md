---
name: requirement-advance
description: 推进需求到下一个阶段，支持手动确认
---

# /requirement-advance

推进需求到下一个工作流阶段。

## 用法

```
/requirement-advance <需求ID>
/requirement-advance <需求ID> --force
/requirement-advance --current
```

## 选项

- `<需求ID>`: 要推进的需求 ID（如 `req-20260329-211628`）
- `--current`: 使用当前检测到的需求（基于 git branch 或最近活动）
- `--force`: 强制推进，跳过手动确认（仅用于 manual 模式的阶段）

## 功能

1. 获取需求当前状态和阶段信息
2. 检查当前阶段是否为 `manual` 模式
3. 如果是 `manual` 模式且未使用 `--force`：
   - 显示待确认信息
   - 提示用户手动确认
   - 返回 `needsManualConfirmation: true`
4. 如果是 `auto` 模式或使用了 `--force`：
   - 生成阶段交接文档（handoff）
   - 标记当前阶段为 `completed`
   - 推进到下一阶段
   - 如果下一阶段有对应的 Agent，返回 Agent 调用建议

## 阶段模式

| 模式 | 行为 |
|------|------|
| `auto` | 自动推进到下一阶段 |
| `manual` | 需要用户手动确认才能推进 |

## Handoff 文档

每次阶段推进会自动生成 `.requirements/handoffs/{id}/{from}_to_{to}.md` 交接文档，包含：

- 阶段总结
- 关键决策
- 产物列表
- 指标（代码行数、测试数、覆盖率）
- 开放问题
- 下一步建议

## 示例

```
/requirement-advance req-20260329-211628
/requirement-advance req-20260329-211628 --force
/requirement-advance --current
```

## 返回信息

```javascript
{
  requirement: { /* 更新后的需求对象 */ },
  needsManualConfirmation: true/false,
  nextPhase: "design" / null,
  handoffPath: ".requirements/handoffs/req-xxx/plan_to_design.md" // 如果生成了
}
```
