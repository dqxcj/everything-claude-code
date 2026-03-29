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
/requirement-create --location=user <描述>
```

## 选项

- `--type=<type>`: 强制指定工作流类型 (micro/small/medium/large/extra-large/continuous)
- `--location=<location>`: 存储位置，`project`（默认）或 `user`
  - `project`: 存储在项目目录 `.requirements/` 下，随项目版本控制
  - `user`: 存储在用户目录 `~/.claude/requirements/` 下，跨项目共享
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
/requirement-create --location=user 实现用户登录功能
```

## 存储位置

- **项目级 (默认)**: `.requirements/{id}.json` - 随项目版本控制，适合团队协作
- **用户级**: `~/.claude/requirements/{id}.json` - 跨项目共享，适合个人使用

## 注意事项

- ID 生成使用时间戳，避免多终端场景下的冲突
- Git 信息自动从当前目录捕获