---
name: requirement-workflow
description: 需求工作流 wrapper skill。调用 brainstorming skill 进行头脑风暴，完成后生成需求文档。用于需求创建的 brainstorming 阶段。
tools: ["Read", "Write", "Edit", "Bash", "Glob"]
model: opus
---

# 需求工作流

这是一个 wrapper skill，用于执行需求创建的完整 brainstorming 流程。

## 职责

1. 调用 brainstorming skill 进行交互式头脑风暴
2. 头脑风暴完成后，生成需求文档
3. 更新需求进度

## 工作流程

### 1. 接收需求 ID

从参数或当前上下文获取需求 ID（如 `req-20260329-222104`）

### 2. 执行 brainstorming

使用 `superpowers:brainstorming` skill 进行交互式头脑风暴。

### 3. 生成需求文档

Brainstorming 完成后：

1. 读取需求 JSON 文件，获取 `description`、`acceptanceCriteria` 等信息
2. 创建输出目录 `.requirements/docs/{requirement-id}/`
3. 生成需求文档：
   - 读取模板 `requirements/templates/docs/requirement-doc-template.md`
   - 替换占位符
   - 保存到 `.requirements/docs/{requirement-id}/需求文档.md`
4. 更新需求 JSON 文件的 `progressLog`，记录产出的文档路径

### 4. 文档模板位置

```
requirements/templates/docs/requirement-doc-template.md
```

### 5. 文档输出位置

```
.requirements/docs/{requirement-id}/需求文档.md
```

## 注意事项

1. Brainstorming 是交互式的，需要用户参与确认
2. 生成的文档应包含完整的需求信息
3. 更新 progressLog 时应记录 artifacts 路径

## 输出确认

完成工作流后，请确认：
- [ ] 需求文档已保存到正确位置
- [ ] 需求 JSON 的 progressLog 已更新
- [ ] 用户已确认 brainstorming 结果
