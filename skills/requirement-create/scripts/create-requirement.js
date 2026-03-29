#!/usr/bin/env node
/**
 * 创建需求脚本
 *
 * 创建带有进度追踪的新需求。
 * 用法: node create-requirement.js <名称> [类型] [描述] [选项]
 *
 * 选项:
 *   --location=<位置>  存储位置: 'project'（默认）或 'user'
 */

const path = require('path');

// 加载需求管理器
const rm = require('../../../scripts/requirement-manager.js');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node create-requirement.js <名称> [类型] [描述] [--location=<project|user>]');
    console.error('');
    console.error('示例:');
    console.error('  node create-requirement.js "用户登录功能" medium "实现OAuth登录" --location=project');
    process.exit(1);
  }

  // 解析参数
  let name = '';
  let type = 'medium';
  let description = '';
  let location = 'project';

  for (const arg of args) {
    if (arg.startsWith('--location=')) {
      location = arg.replace('--location=', '');
    } else if (!name) {
      name = arg;
    } else if (!type || ['micro', 'small', 'medium', 'large', 'extra-large', 'continuous'].includes(arg)) {
      type = arg;
    } else {
      description = arg;
    }
  }

  if (!name) {
    console.error('错误: 需求名称是必需的');
    process.exit(1);
  }

  try {
    const requirement = await rm.createRequirement(name, type, description, [], location);

    console.log('\n✅ 需求创建成功！\n');
    console.log(`   ID: ${requirement.id}`);
    console.log(`   名称: ${requirement.name}`);
    console.log(`   类型: ${requirement.type}`);
    console.log(`   位置: ${requirement.storageLocation}`);
    console.log(`   状态: ${requirement.status}`);
    if (requirement.currentPhase) {
      console.log(`   当前阶段: ${requirement.currentPhase}`);
    }
    console.log('');

    return requirement;
  } catch (error) {
    console.error(`❌ 创建需求时出错: ${error.message}`);
    process.exit(1);
  }
}

main();
