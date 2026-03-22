# ECC Architecture Webpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个静态网页，展示 everything-claude-code 项目的详细设计架构、开发理念和工作流程

**Architecture:** 单页静态 HTML 网站，使用现代 CSS 布局（Grid/Flexbox），无外部框架依赖，纯原生实现。分为 hero 区、架构总览、核心组件详解、开发理念、工作流可视化、导航与交互六个主要区域。

**Tech Stack:** HTML5 + CSS3 + Vanilla JavaScript，托管在项目 `website/` 目录

---

## 1. 文件结构设计

```
website/
├── index.html              # 主页面
├── styles/
│   └── main.css            # 所有样式
├── scripts/
│   └── main.js             # 交互逻辑
├── assets/
│   └── diagrams/           # 架构图（如需要）
└── README.md               # 部署说明
```

**关键设计决策:**
- 每个核心组件（agents、skills、commands、hooks、rules）独立章节
- 工作流使用 ASCII/HTML 流程图可视化
- 响应式设计，支持移动端浏览
- 代码高亮使用 Prism.js CDN

---

## 2. 页面结构

### 2.1 Hero Section
- 项目名称 + tagline
- 核心统计数据（16 agents, 65+ skills, 40+ commands, 12 languages）
- 快速导航按钮

### 2.2 架构总览 (Architecture Overview)
- 项目目录结构树形图
- 核心组件关系图
- 技术栈徽章

### 2.3 核心组件详解 (Core Components)

| 组件 | 描述 | 文件位置 |
|------|------|---------|
| **Agents** | 16 个专业子代理 | `agents/*.md` |
| **Skills** | 65+ 工作流技能 | `skills/*/SKILL.md` |
| **Commands** | 40+ 斜杠命令 | `commands/*.md` |
| **Hooks** | 触发式自动化 | `hooks/hooks.json` |
| **Rules** | 12 语言规则 | `rules/{common,typescript,...}/` |
| **Scripts** | 跨平台工具 | `scripts/**/*.js` |
| **Tests** | 测试套件 | `tests/**/*.js` |

### 2.4 开发理念 (Development Philosophy)
- 核心理念列表
- TDD 工作流
- 代码审查流程
- 安全第一原则

### 2.5 工作流可视化 (Workflow Visualization)
- Feature Development Flow
- Multi-Agent Orchestration
- Continuous Learning Loop
- Security Scanning Pipeline

---

## 3. 内容提取策略

### Task 1: 提取 Agents 数据

- [ ] **Step 1: 创建 agents 数据提取脚本**

```javascript
// scripts/extract-agents.js
const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, '../agents');
const agents = fs.readdirSync(agentsDir)
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
    const name = file.replace('.md', '');
    const match = content.match(/^#\s+(.+)/m);
    const descMatch = content.match(/\*\*Description:\*\*\s*(.+)/m) ||
                      content.match(/^>\s*(.+)/m);
    return {
      name,
      title: match ? match[1] : name,
      description: descMatch ? descMatch[1] : ''
    };
  });

console.log(JSON.stringify(agents, null, 2));
```

- [ ] **Step 2: 运行脚本验证输出**

```bash
node scripts/extract-agents.js
```

Expected: JSON array of agent objects

- [ ] **Step 3: 创建数据文件**

`website/data/agents.json` - 提取的 agents 数据

### Task 2: 提取 Skills 数据

- [ ] **Step 1: 创建 skills 数据提取脚本**

```javascript
// scripts/extract-skills.js
const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, '../skills');
const skills = [];

fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .forEach(dir => {
    const skillPath = path.join(skillsDir, dir.name, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const nameMatch = content.match(/^#\s+(.+)/m);
      const whenMatch = content.match(/\*\*When to Use:\*\*\s*([\s\S]+?)(?=\n##|\n#|$)/m);
      const howMatch = content.match(/\*\*How It Works:\*\*\s*([\s\S]+?)(?=\n##|\n#|$)/m);
      skills.push({
        name: dir.name,
        title: nameMatch ? nameMatch[1] : dir.name,
        whenToUse: whenMatch ? whenMatch[1].trim() : '',
        howItWorks: howMatch ? howMatch[1].trim() : ''
      });
    }
  });

console.log(JSON.stringify(skills, null, 2));
```

- [ ] **Step 2: 运行脚本验证输出**

```bash
node scripts/extract-skills.js
```

Expected: JSON array of skill objects

- [ ] **Step 3: 创建数据文件**

`website/data/skills.json`

### Task 3: 提取 Commands 数据

- [ ] **Step 1: 创建 commands 数据提取脚本**

```javascript
// scripts/extract-commands.js
const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, '../commands');
const commands = fs.readdirSync(commandsDir)
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
    const name = file.replace('.md', '');
    const titleMatch = content.match(/^#\s+\/(.+)/m);
    const descMatch = content.match(/^描述[：:]\s*(.+)/m) ||
                      content.match(/\*\*Description:\*\*\s*(.+)/m) ||
                      content.match(/^>\s*(.+)/m);
    return {
      name: `/${name}`,
      title: titleMatch ? titleMatch[1] : name,
      description: descMatch ? descMatch[1] : ''
    };
  });

console.log(JSON.stringify(commands, null, 2));
```

- [ ] **Step 2: 运行脚本验证输出**

```bash
node scripts/extract-commands.js
```

Expected: JSON array of command objects

- [ ] **Step 3: 创建数据文件**

`website/data/commands.json`

---

## 4. HTML 结构实现

### Task 4: 创建 index.html

- [ ] **Step 1: 创建 HTML 基础结构**

`website/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Everything Claude Code - Architecture</title>
    <link rel="stylesheet" href="styles/main.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
</head>
<body>
    <!-- Hero Section -->
    <header id="hero">
        <div class="container">
            <h1>Everything Claude Code</h1>
            <p class="tagline">AI Agent Harness 的性能优化系统</p>
            <div class="stats">
                <div class="stat"><span class="number">16</span><span class="label">Agents</span></div>
                <div class="stat"><span class="number">65+</span><span class="label">Skills</span></div>
                <div class="stat"><span class="number">40+</span><span class="label">Commands</span></div>
                <div class="stat"><span class="number">12</span><span class="label">Languages</span></div>
            </div>
        </div>
    </header>

    <!-- Navigation -->
    <nav id="toc">
        <div class="container">
            <ul>
                <li><a href="#architecture">架构总览</a></li>
                <li><a href="#agents">Agents</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#commands">Commands</a></li>
                <li><a href="#hooks">Hooks</a></li>
                <li><a href="#rules">Rules</a></li>
                <li><a href="#philosophy">开发理念</a></li>
                <li><a href="#workflows">工作流</a></li>
            </ul>
        </div>
    </nav>

    <!-- Architecture Overview -->
    <section id="architecture">
        <div class="container">
            <h2>架构总览</h2>
            <div class="tree">
                <!-- Directory tree will be generated by JS -->
            </div>
        </div>
    </section>

    <!-- Agents Section -->
    <section id="agents">
        <div class="container">
            <h2>Agents</h2>
            <p class="section-desc">16 个专业子代理，用于委托复杂任务</p>
            <div class="grid" id="agents-grid">
                <!-- Agents will be loaded from JSON -->
            </div>
        </div>
    </section>

    <!-- Skills Section -->
    <section id="skills">
        <div class="container">
            <h2>Skills</h2>
            <p class="section-desc">65+ 工作流技能和领域知识</p>
            <div class="grid" id="skills-grid">
                <!-- Skills will be loaded from JSON -->
            </div>
        </div>
    </section>

    <!-- Commands Section -->
    <section id="commands">
        <div class="container">
            <h2>Commands</h2>
            <p class="section-desc">40+ 斜杠命令，用于触发工作流</p>
            <div class="commands-list" id="commands-list">
                <!-- Commands will be loaded from JSON -->
            </div>
        </div>
    </section>

    <!-- Hooks Section -->
    <section id="hooks">
        <div class="container">
            <h2>Hooks System</h2>
            <div class="hook-types">
                <div class="hook-type">
                    <h3>PreToolUse</h3>
                    <p>工具执行前的验证和参数修改</p>
                </div>
                <div class="hook-type">
                    <h3>PostToolUse</h3>
                    <p>工具执行后的自动格式化、检查</p>
                </div>
                <div class="hook-type">
                    <h3>Stop</h3>
                    <p>会话结束时的最终验证</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Rules Section -->
    <section id="rules">
        <div class="container">
            <h2>Rules</h2>
            <p class="section-desc">12 种语言的编码规范和最佳实践</p>
            <div class="rules-grid">
                <div class="rule-lang">Common</div>
                <div class="rule-lang">TypeScript</div>
                <div class="rule-lang">Python</div>
                <div class="rule-lang">Go</div>
                <div class="rule-lang">Rust</div>
                <div class="rule-lang">Java</div>
                <div class="rule-lang">C++</div>
                <div class="rule-lang">Swift</div>
                <div class="rule-lang">Kotlin</div>
                <div class="rule-lang">PHP</div>
                <div class="rule-lang">Perl</div>
                <div class="rule-lang">C#</div>
            </div>
        </div>
    </section>

    <!-- Philosophy Section -->
    <section id="philosophy">
        <div class="container">
            <h2>开发理念</h2>
            <div class="principles">
                <div class="principle">
                    <h3>安全第一</h3>
                    <p>所有提交前必须通过安全检查，无硬编码密钥，输入验证</p>
                </div>
                <div class="principle">
                    <h3>TDD 驱动</h3>
                    <p>先写测试（RED），再实现（GREEN），最后重构（IMPROVE）</p>
                </div>
                <div class="principle">
                    <h3>代码审查</h3>
                    <p>每次代码修改后必须经过专业审查员审核</p>
                </div>
                <div class="principle">
                    <h3>持续学习</h3>
                    <p>从会话中自动提取模式到可复用技能</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Workflows Section -->
    <section id="workflows">
        <div class="container">
            <h2>工作流</h2>

            <!-- Feature Development Flow -->
            <div class="workflow">
                <h3>Feature Development Workflow</h3>
                <pre><code class="language-text">
Research → Plan → TDD → Code Review → Commit → Push
   ↓         ↓       ↓         ↓           ↓       ↓
 GitHub   Planner  tdd-guide  code-reviewer   git   gh pr
                </code></pre>
            </div>

            <!-- Multi-Agent Orchestration -->
            <div class="workflow">
                <h3>Multi-Agent Orchestration</h3>
                <pre><code class="language-text">
User Request → Chief of Staff → [Planner | TDD-Guide | Code-Reviewer | ...]
                    ↓
              Subagent Dispatch (parallel)
                    ↓
              Results Aggregation
                    ↓
              User Response
                </code></pre>
            </div>

            <!-- Continuous Learning Loop -->
            <div class="workflow">
                <h3>Continuous Learning Loop</h3>
                <pre><code class="language-text">
Session → Extract Patterns → Skill Evolution → Reuse in Future Sessions
                                   ↓
                            Confidence Scoring
                                   ↓
                            Skill Stocktake
                </code></pre>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p>Everything Claude Code © 2026 | <a href="https://github.com/affaan-m/everything-claude-code">GitHub</a></p>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
    <script src="scripts/main.js"></script>
</body>
</html>
```

---

## 5. CSS 样式实现

### Task 5: 创建 main.css

- [ ] **Step 1: 创建样式文件**

`website/styles/main.css`:
```css
:root {
    --primary: #3178C6;
    --secondary: #00ADD8;
    --accent: #4EAA25;
    --bg-dark: #1a1a2e;
    --bg-light: #16213e;
    --text: #e4e4e4;
    --text-muted: #a0a0a0;
    --border: #2a2a4a;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-dark);
    color: var(--text);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Hero Section */
#hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-light) 100%);
    padding: 4rem 0;
}

#hero h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.tagline {
    font-size: 1.25rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
}

.stats {
    display: flex;
    gap: 3rem;
    justify-content: center;
    flex-wrap: wrap;
}

.stat {
    display: flex;
    flex-direction: column;
}

.stat .number {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--accent);
}

.stat .label {
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Navigation */
#toc {
    position: sticky;
    top: 0;
    background: var(--bg-light);
    border-bottom: 1px solid var(--border);
    z-index: 100;
}

#toc ul {
    display: flex;
    gap: 1rem;
    list-style: none;
    padding: 1rem 0;
    overflow-x: auto;
    justify-content: center;
    flex-wrap: wrap;
}

#toc a {
    color: var(--text-muted);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.2s;
}

#toc a:hover {
    color: var(--primary);
    background: rgba(49, 120, 198, 0.1);
}

/* Sections */
section {
    padding: 4rem 0;
    border-bottom: 1px solid var(--border);
}

section h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--primary);
}

.section-desc {
    color: var(--text-muted);
    margin-bottom: 2rem;
}

/* Grid Layouts */
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.card {
    background: var(--bg-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.2s;
}

.card:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
}

.card h3 {
    color: var(--secondary);
    margin-bottom: 0.5rem;
}

.card p {
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Tree Diagram */
.tree {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.85rem;
    background: var(--bg-light);
    padding: 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
}

/* Hook Types */
.hook-types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.hook-type {
    background: var(--bg-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
}

.hook-type h3 {
    color: var(--accent);
    margin-bottom: 0.5rem;
}

/* Rules Grid */
.rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
}

.rule-lang {
    background: var(--bg-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
}

/* Principles */
.principles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.principle {
    background: var(--bg-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
}

.principle h3 {
    color: var(--accent);
    margin-bottom: 0.5rem;
}

/* Workflows */
.workflow {
    background: var(--bg-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.workflow h3 {
    color: var(--primary);
    margin-bottom: 1rem;
}

.workflow pre {
    background: var(--bg-dark);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
}

/* Footer */
footer {
    text-align: center;
    padding: 2rem 0;
    color: var(--text-muted);
}

footer a {
    color: var(--primary);
}

/* Responsive */
@media (max-width: 768px) {
    #hero h1 {
        font-size: 2rem;
    }

    .stats {
        gap: 1.5rem;
    }

    .stat .number {
        font-size: 1.75rem;
    }

    #toc ul {
        justify-content: flex-start;
    }
}
```

---

## 6. JavaScript 交互实现

### Task 6: 创建 main.js

- [ ] **Step 1: 创建交互脚本**

`website/scripts/main.js`:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    loadDirectoryTree();
    loadAgents();
    loadSkills();
    loadCommands();
    initSmoothScroll();
    initSyntaxHighlighting();
});

// Load directory tree
function loadDirectoryTree() {
    const treeContainer = document.querySelector('.tree');
    if (!treeContainer) return;

    const tree = `
everything-claude-code/
├── agents/              # 16 专业子代理
│   ├── architect.md
│   ├── planner.md
│   ├── tdd-guide.md
│   ├── code-reviewer.md
│   └── ...
├── skills/              # 65+ 工作流技能
│   ├── tdd-workflow/
│   ├── continuous-learning/
│   └── ...
├── commands/           # 40+ 斜杠命令
│   ├── tdd.md
│   ├── plan.md
│   └── ...
├── hooks/               # 触发式自动化
│   └── hooks.json
├── rules/               # 12 语言规则
│   ├── common/
│   ├── typescript/
│   ├── python/
│   └── ...
├── scripts/             # 跨平台工具
├── tests/               # 测试套件
└── docs/                # 文档
    `;
    treeContainer.innerHTML = `<pre>${tree}</pre>`;
}

// Load agents from JSON
async function loadAgents() {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;

    try {
        const response = await fetch('data/agents.json');
        const agents = await response.json();

        grid.innerHTML = agents.map(agent => `
            <div class="card">
                <h3>/${agent.name}</h3>
                <p>${agent.description || '专业子代理'}</p>
            </div>
        `).join('');
    } catch (e) {
        // Fallback: static content if JSON not available
        grid.innerHTML = '<p class="text-muted">运行 scripts/extract-agents.js 生成数据</p>';
    }
}

// Load skills from JSON
async function loadSkills() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    try {
        const response = await fetch('data/skills.json');
        const skills = await response.json();

        grid.innerHTML = skills.slice(0, 12).map(skill => `
            <div class="card">
                <h3>${skill.name}</h3>
                <p>${skill.whenToUse ? skill.whenToUse.substring(0, 100) + '...' : '工作流技能'}</p>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p class="text-muted">运行 scripts/extract-skills.js 生成数据</p>';
    }
}

// Load commands from JSON
async function loadCommands() {
    const list = document.getElementById('commands-list');
    if (!list) return;

    try {
        const response = await fetch('data/commands.json');
        const commands = await response.json();

        list.innerHTML = commands.map(cmd => `
            <div class="command-item">
                <code>${cmd.name}</code>
                <span>${cmd.description || '命令'}</span>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p class="text-muted">运行 scripts/extract-commands.js 生成数据</p>';
    }
}

// Smooth scroll for navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Initialize syntax highlighting
function initSyntaxHighlighting() {
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}
```

---

## 7. 数据文件创建

### Task 7: 创建数据目录和 README

- [ ] **Step 1: 创建 website/data 目录和占位符**

`website/data/README.md`:
```markdown
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
```

- [ ] **Step 2: 添加 npm 脚本到 package.json**

```json
{
  "scripts": {
    "extract-data": "node scripts/extract-agents.js > website/data/agents.json && node scripts/extract-skills.js > website/data/skills.json && node scripts/extract-commands.js > website/data/commands.json"
  }
}
```

---

## 8. 验证与测试

### Task 8: 本地测试

- [ ] **Step 1: 启动本地服务器**

```bash
cd website
npx serve .
# 或
python -m http.server 8080
```

- [ ] **Step 2: 验证页面加载**

访问 `http://localhost:8080` 或 `http://localhost:3000`

检查项:
- [ ] Hero section 显示正确
- [ ] 导航链接工作正常
- [ ] 目录树正确渲染
- [ ] Agents/Skills/Commands 卡片显示（如数据已生成）
- [ ] 工作流图表正确显示
- [ ] 响应式布局正常

- [ ] **Step 3: 验证响应式设计**

```bash
# 使用 Chrome DevTools 或以下方法
# 调整浏览器窗口大小，检查布局是否自适应
```

---

## 9. 部署准备

### Task 9: 添加 GitHub Pages 配置

- [ ] **Step 1: 创建 CNAME 或配置**

如需自定义域名，创建 `website/CNAME`:
```
docs.example.com
```

- [ ] **Step 2: 更新 .gitignore**

确保忽略不必要的文件

- [ ] **Step 3: 添加部署说明到 README**

`website/README.md`:
```markdown
# ECC Architecture Website

静态网页，展示 Everything Claude Code 的架构和理念。

## 本地开发

```bash
cd website
npx serve .
```

## 数据更新

```bash
npm run extract-data
```

## 部署

推送到 GitHub Pages 或任何静态托管服务。
```

---

## 10. 任务清单总结

| Task | 描述 | 状态 |
|------|------|------|
| 1 | 创建数据提取脚本 (agents) | ☐ |
| 2 | 创建数据提取脚本 (skills) | ☐ |
| 3 | 创建数据提取脚本 (commands) | ☐ |
| 4 | 创建 index.html | ☐ |
| 5 | 创建 main.css | ☐ |
| 6 | 创建 main.js | ☐ |
| 7 | 创建数据目录结构 | ☐ |
| 8 | 本地测试验证 | ☐ |
| 9 | 部署准备 | ☐ |

---

## 依赖关系

```
Task 1-3 (数据提取) → Task 4-6 (页面实现) → Task 7 (数据文件) → Task 8 (测试) → Task 9 (部署)
```

---

## 验收标准

1. 页面在现代浏览器中正常显示
2. 所有导航链接工作正常
3. 目录树清晰展示项目结构
4. Agents/Skills/Commands 以卡片网格展示
5. 工作流图表清晰可读
6. 移动端布局正常
7. 页面加载时间 < 2s
