# 详细设计：{{name}}

## 基本信息

- **需求 ID**: {{id}}
- **关联概要设计**: 概要设计.md
- **状态**: Draft → Review → Approved

## 1. 模块设计

{{#each modules}}
### {{name}}

#### 职责
{{responsibility}}

#### 公开接口
{{interface}}

#### 内部结构
{{internalStructure}}

#### 实现逻辑
{{implementation}}

{{/each}}

## 2. 数据结构

### 核心类型定义
{{typeDefinitions}}

## 3. 算法设计

{{#each algorithms}}
### {{name}}

{{description}}

```
输入: {{input}}
输出: {{output}}
步骤:
{{steps}}
```

{{/each}}

## 4. 错误处理

| 错误场景 | 错误码 | 处理方式 |
|----------|--------|----------|
{{#each errorHandling}}
| {{scenario}} | {{code}} | {{handling}} |
{{/each}}

## 5. 配置文件

{{config}}

## 6. 测试策略

### 单元测试
{{#each unitTests}}
- {{this}}
{{/each}}

### 集成测试
{{integrationTests}}

## 7. 实现 checklist

{{#each checklist}}
- [ ] {{this}}
{{/each}}
