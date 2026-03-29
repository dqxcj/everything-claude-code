# 需求文档：{{name}}

## 基本信息

- **需求 ID**: {{id}}
- **创建时间**: {{createdAt}}
- **状态**: Draft → Review → Approved

## 概述

{{description}}

## 用户故事

{{#each userStories}}
- 作为 {{role}}，我希望 {{action}} 以便于 {{benefit}}
{{/each}}

{{#unless userStories}}
- （暂无用户故事）
{{/unless}}

## 功能需求

### 核心功能

#### 描述
{{description}}

#### 验收标准
{{#each acceptanceCriteria}}
- [ ] {{this}}
{{/each}}

{{#unless acceptanceCriteria}}
- （暂无验收标准）
{{/unless}}

## 非功能需求

### 性能
{{#if performance.target}}
- 响应时间 < {{performance.target}}ms
- 支持 {{performance.concurrency}} 并发
{{else}}
- （暂无性能要求）
{{/if}}

### 安全性
{{#if security.requirements}}
{{security.requirements}}
{{else}}
- （暂无安全要求）
{{/if}}

### 可用性
{{#if availability.requirements}}
{{availability.requirements}}
{{else}}
- （暂无可用性要求）
{{/if}}

## 边界情况

{{#each boundaryCases}}
- {{this}}
{{/each}}

{{#unless boundaryCases}}
- （暂无边界情况）
{{/unless}}

## 依赖项

{{#each dependencies}}
- {{this}}
{{/each}}

{{#unless dependencies}}
- （暂无依赖项）
{{/unless}}

## 风险与假设

{{#if risk.description}}
- **风险**: {{risk.description}}
  - **缓解措施**: {{risk.mitigation}}
{{/if}}

{{#if assumptions}}
- **假设**: {{assumptions}}
{{/if}}

{{#unless risk.description}}
- （暂无风险与假设）
{{/unless}}

## 附录

{{#if appendix}}
{{appendix}}
{{else}}
（暂无附录内容）
{{/if}}
