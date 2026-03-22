# 数据文件

此目录包含从项目源码自动提取的数据。

## 生成脚本

运行以下命令生成数据文件：

```bash
node scripts/extract-agents.js > data/agents.json
node scripts/extract-skills.js > data/skills.json
node scripts/extract-commands.js > data/commands.json
```

## 或使用 npm 脚本

```bash
npm run extract-data
```

## 当前状态

数据文件目前不存在，页面会使用 fallback 静态数据。
运行提取脚本后可获得最新数据。
