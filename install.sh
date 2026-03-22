#!/bin/bash
set -e

REQUIREMENTS_DIR="$HOME/.claude/requirements"

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
cp commands/requirement-create.md "$HOME/.claude/commands/"
cp commands/continue.md "$HOME/.claude/commands/"

# 复制安装脚本到 ~/.claude/scripts/
cp install.sh "$HOME/.claude/scripts/rpt-install.sh"

echo "Requirement Progress Tracker installed!"
echo ""
echo "Please add the following to hooks/hooks.json to enable progress tracking:"
echo '{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/update-progress-hook.js\""
  }]
}'
