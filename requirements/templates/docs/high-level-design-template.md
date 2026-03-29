# 概要设计：{{name}}

## 基本信息

- **需求 ID**: {{id}}
- **关联需求文档**: 需求文档.md
- **状态**: Draft → Review → Approved

## 1. 系统架构

### 1.1 整体架构
```
{{architecture}}
```

### 1.2 模块划分

| 模块名称 | 职责 | 依赖模块 |
|----------|------|----------|
{{#each modules}}
| {{name}} | {{responsibility}} | {{dependencies}} |
{{/each}}

## 2. 技术选型

### 2.1 技术栈
{{#each techStack}}
- {{this}}
{{/each}}

### 2.2 关键技术决策
{{techDecisions}}

## 3. 数据模型

### 3.1 核心实体
{{#each entities}}
- **{{name}}**: {{description}}
{{/each}}

### 3.2 实体关系图
```
{{erDiagram}}
```

## 4. API 设计

### 4.1 核心接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
{{#each apis}}
| {{name}} | {{method}} | {{path}} | {{description}} |
{{/each}}

## 5. 系统交互流程

### 5.1 主要流程
{{mainFlow}}

### 5.2 异常处理流程
{{errorFlow}}

## 6. 非功能设计

### 6.1 性能
{{performance}}

### 6.2 安全
{{security}}

### 6.3 扩展性
{{scalability}}

## 7. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
{{#each risks}}
| {{risk}} | {{impact}} | {{mitigation}} |
{{/each}}

## 8. 部署方案

{{deployment}}
