#!/bin/bash
set -e

REQUIREMENTS_DIR="$HOME/.claude/requirements"
HOOKS_JSON="$HOME/.claude/hooks/hooks.json"

echo "Installing Requirement Progress Tracker..."

# 创建目录结构
mkdir -p "$REQUIREMENTS_DIR/templates"

# 复制模板文件
cp requirements/templates/*.json5 "$REQUIREMENTS_DIR/templates/"

# 复制配置文件
cp requirements/config.json5 "$REQUIREMENTS_DIR/"

# 复制核心脚本
mkdir -p "$HOME/.claude/scripts"
cp scripts/requirement-manager.js "$HOME/.claude/scripts/"
mkdir -p "$HOME/.claude/scripts/hooks"
cp scripts/hooks/update-progress-hook.js "$HOME/.claude/scripts/hooks/"

# 复制命令文件
mkdir -p "$HOME/.claude/commands"
cp commands/continue.md "$HOME/.claude/commands/"

# 复制安装脚本到 ~/.claude/scripts/
cp install.sh "$HOME/.claude/scripts/rpt-install.sh"

# 自动注册 Stop hook
if [ -f "$HOOKS_JSON" ]; then
    # 检查是否已经添加过
    if grep -q "update-progress-hook.js" "$HOOKS_JSON"; then
        echo "Hook already registered, skipping..."
    else
        # 使用 jq 添加 hook（如果可用）
        if command -v jq &> /dev/null; then
            TMP_FILE=$(mktemp)
            jq '.hooks.Stop[0].hooks += [{
                "type": "command",
                "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/update-progress-hook.js\"",
                "async": true,
                "timeout": 10
            }]' "$HOOKS_JSON" > "$TMP_FILE" && mv "$TMP_FILE" "$HOOKS_JSON"
            echo "Added progress tracking hook to hooks.json"
        else
            echo "jq not found, please manually add the hook to hooks/hooks.json"
        fi
    fi
else
    echo "hooks.json not found at $HOOKS_JSON"
fi

echo ""
echo "Requirement Progress Tracker installed!"
