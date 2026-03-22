# ECC Architecture Website

静态网页，展示 Everything Claude Code 的架构和理念。

## 本地开发

```bash
cd website
npx serve .
# 或
python -m http.server 8080
```

## 数据更新

```bash
npm run extract-data
```

## 部署

推送到 GitHub Pages 或任何静态托管服务。

## 页面结构

- **Hero**: 项目简介和统计数据
- **架构总览**: 目录结构树形图
- **Agents**: 16 个专业子代理卡片
- **Skills**: 65+ 工作流技能展示
- **Commands**: 40+ 斜杠命令列表
- **Hooks**: 自动化钩子系统
- **Rules**: 12 语言编码规范
- **开发理念**: 安全、TDD、审查、持续学习
- **工作流**: 流程图可视化
