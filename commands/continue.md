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