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
    const treeContainer = document.getElementById('directory-tree');
    if (!treeContainer) return;

    const tree = `
everything-claude-code/
├── agents/              # 16 专业子代理
│   ├── architect.md
│   ├── planner.md
│   ├── tdd-guide.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── build-error-resolver.md
│   └── ...
├── skills/              # 65+ 工作流技能
│   ├── tdd-workflow/
│   ├── continuous-learning/
│   ├── coding-standards/
│   └── ...
├── commands/            # 40+ 斜杠命令
│   ├── tdd.md
│   ├── plan.md
│   ├── e2e.md
│   └── ...
├── hooks/               # 触发式自动化
│   └── hooks.json
├── rules/               # 12 语言规则
│   ├── common/
│   ├── typescript/
│   ├── python/
│   ├── golang/
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
        if (!response.ok) throw new Error('Data not available');
        const agents = await response.json();

        grid.innerHTML = agents.map(agent => `
            <div class="card">
                <h3>${agent.name}</h3>
                <p>${agent.description || '专业子代理'}</p>
            </div>
        `).join('');
    } catch (e) {
        // Fallback: static content if JSON not available
        grid.innerHTML = generateAgentsFallback();
    }
}

function generateAgentsFallback() {
    const agents = [
        { name: 'architect', description: '系统架构设计' },
        { name: 'planner', description: '实施计划制定' },
        { name: 'tdd-guide', description: 'TDD 测试驱动开发' },
        { name: 'code-reviewer', description: '代码质量审查' },
        { name: 'security-reviewer', description: '安全漏洞检测' },
        { name: 'build-error-resolver', description: '构建错误修复' },
        { name: 'e2e-runner', description: '端到端测试' },
        { name: 'refactor-cleaner', description: '死代码清理' }
    ];

    return agents.map(agent => `
        <div class="card">
            <h3>${agent.name}</h3>
            <p>${agent.description}</p>
        </div>
    `).join('');
}

// Load skills from JSON
async function loadSkills() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    try {
        const response = await fetch('data/skills.json');
        if (!response.ok) throw new Error('Data not available');
        const skills = await response.json();

        grid.innerHTML = skills.slice(0, 12).map(skill => `
            <div class="card">
                <h3>${skill.name}</h3>
                <p>${skill.whenToUse ? skill.whenToUse.substring(0, 100) + '...' : '工作流技能'}</p>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = generateSkillsFallback();
    }
}

function generateSkillsFallback() {
    const skills = [
        { name: 'tdd-workflow', whenToUse: '测试驱动开发流程' },
        { name: 'continuous-learning', whenToUse: '持续学习和技能进化' },
        { name: 'coding-standards', whenToUse: '编码规范和最佳实践' },
        { name: 'security-review', whenToUse: '安全审查和漏洞检测' },
        { name: 'api-design', whenToUse: 'API 设计和架构' },
        { name: 'database-migrations', whenToUse: '数据库迁移管理' },
        { name: 'docker-patterns', whenToUse: 'Docker 容器化' },
        { name: 'frontend-patterns', whenToUse: '前端开发模式' },
        { name: 'backend-patterns', whenToUse: '后端开发模式' },
        { name: 'testing', whenToUse: '测试策略和实践' },
        { name: 'performance', whenToUse: '性能优化' },
        { name: 'deployment', whenToUse: '部署策略' }
    ];

    return skills.map(skill => `
        <div class="card">
            <h3>${skill.name}</h3>
            <p>${skill.whenToUse}</p>
        </div>
    `).join('');
}

// Load commands from JSON
async function loadCommands() {
    const list = document.getElementById('commands-list');
    if (!list) return;

    try {
        const response = await fetch('data/commands.json');
        if (!response.ok) throw new Error('Data not available');
        const commands = await response.json();

        list.innerHTML = commands.map(cmd => `
            <div class="command-item">
                <code>${cmd.name}</code>
                <span>${cmd.description || '命令'}</span>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = generateCommandsFallback();
    }
}

function generateCommandsFallback() {
    const commands = [
        { name: '/tdd', description: '启动 TDD 工作流' },
        { name: '/plan', description: '创建实施计划' },
        { name: '/e2e', description: '运行端到端测试' },
        { name: '/code-review', description: '发起代码审查' },
        { name: '/build-fix', description: '修复构建错误' },
        { name: '/learn', description: '从会话中学习' },
        { name: '/skill-create', description: '创建新技能' },
        { name: '/sessions', description: '查看会话历史' },
        { name: '/evolve', description: '技能进化' },
        { name: '/orchestrate', description: '多代理编排' }
    ];

    return commands.map(cmd => `
        <div class="command-item">
            <code>${cmd.name}</code>
            <span>${cmd.description}</span>
        </div>
    `).join('');
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
