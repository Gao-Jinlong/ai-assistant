#!/usr/bin/env node

/**
 * 跨平台数据库服务启动脚本
 * 支持 Windows、Linux、macOS
 */

import { execSync } from 'child_process';

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ 命令执行失败: ${command}`, 'red');
    return false;
  }
}

// 检查 Docker 是否安装
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Docker 未安装或未启动，请先安装 Docker', 'red');
    return false;
  }
}

// 检查 Docker Compose 是否安装
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Docker Compose 未安装，请先安装 Docker Compose', 'red');
    return false;
  }
}

// 主函数
function main() {
  log('🚀 启动 AI Assistant 数据库服务...', 'green');

  // 检查依赖
  if (!checkDocker()) {
    process.exit(1);
  }
  if (!checkDockerCompose()) {
    process.exit(1);
  }

  // 停止已存在的容器
  log('🛑 停止现有容器...', 'yellow');
  if (!executeCommand('docker-compose -f docker-compose.dev.yml down')) {
    process.exit(1);
  }

  // 启动数据库服务
  log('🔨 启动数据库和缓存服务...', 'cyan');
  if (!executeCommand('docker-compose -f docker-compose.dev.yml up -d')) {
    process.exit(1);
  }

  log('✅ 数据库服务启动完成！', 'green');
  log(
    '🗄️  PostgreSQL: postgresql://postgres:postgres@localhost:5432/ai-assistant-dev',
    'white',
  );
  log('💾 Redis: redis://localhost:6379', 'white');
  log('', 'white');
  log('现在您可以在本地运行开发环境：', 'yellow');
  log('pnpm install && pnpm dev', 'white');
}

// 直接执行主函数
main();
