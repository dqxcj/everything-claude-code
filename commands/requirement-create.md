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

**必须使用 `scripts/requirement-manager.js` 脚本创建需求，不要手动创建文件！**

调用方式：
```javascript
// 在项目目录下执行
const rm = require('./scripts/requirement-manager');
await rm.createRequirement(name, type, description, acceptanceCriteria);
```

或通过 node -e 调用：
```bash
node -e "const rm=require('./scripts/requirement-manager');rm.createRequirement('需求名称','medium','描述',[]).then(r=>console.log(JSON.stringify(r,null,2)))"
```

1. 解析需求描述
2. 检测/分析需求类型：
   - 根据关键词和复杂度自动检测
   - 或使用显式指定的类型
3. 调用 `createRequirement` 函数创建需求（不要手动创建文件！）
4. 脚本会自动：
   - 从模板创建 JSON 格式需求文件（放在 `requirements/requirements/` 目录）
   - 添加 git 信息（remote, branch, baseBranch, localPath）
   - 创建初始 progressLog 条目
   - 更新 index.json

## 示例

```
/requirement-create 实现用户登录功能
/requirement-create --type=large 搭建支付系统
/requirement-create --type=micro 修复登录页面的拼写错误
```

## 注意事项

- **必须使用 `createRequirement` 函数创建需求文件**
- **不要手动使用 Write 工具创建需求文件**
- ID 生成使用时间戳，避免多终端场景下的冲突
- Git 信息自动从当前目录捕获