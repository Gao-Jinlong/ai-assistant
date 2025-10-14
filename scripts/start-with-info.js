#!/usr/bin/env node

/**
 * 启动项目并显示访问信息的脚本
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import net from 'net';
import { loadEnv, getPortConfig } from './load-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检测端口是否可用
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// 等待服务启动
async function waitForServices() {
  log('⏳ 等待服务启动完成...', 'yellow');

  const ports = getPortConfig();
  const maxAttempts = 30; // 最多等待30秒
  let attempts = 0;

  while (attempts < maxAttempts) {
    const webReady = await checkPort(ports.web);
    const serverReady = await checkPort(ports.server);

    if (webReady && serverReady) {
      log('✅ 所有服务已启动完成！', 'green');
      return true;
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  log('⚠️  服务启动超时，但继续显示信息...', 'yellow');
  return false;
}

function showProjectInfo() {
  // 清屏并显示项目信息
  console.clear();

  const config = loadEnv();
  const ports = getPortConfig();

  log('🎉 AI Assistant 项目启动完成！', 'green');
  log('', 'white');

  log('📱 前端应用 (Next.js):', 'cyan');
  log(`   🌐 本地访问: http://localhost:${ports.web}`, 'white');
  log(`   🌐 网络访问: http://0.0.0.0:${ports.web}`, 'white');
  log('', 'white');

  log('🔧 后端服务 (NestJS):', 'cyan');
  log(`   🌐 API 服务: http://localhost:${ports.server}`, 'white');
  log(`   📚 API 文档: http://localhost:${ports.server}/docs`, 'white');
  log('', 'white');

  log('🗄️  数据库服务:', 'cyan');
  log(
    `   🐘 PostgreSQL: postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${ports.postgres}/${config.POSTGRES_DB}`,
    'white',
  );
  log(`   💾 Redis: redis://${config.REDIS_HOST}:${ports.redis}`, 'white');
  log('', 'white');

  log('🚀 开发命令:', 'yellow');
  log('   pnpm dev          - 启动开发环境', 'white');
  log('   pnpm build        - 构建项目', 'white');
  log('   pnpm start:db     - 启动数据库', 'white');
  log('   pnpm lint         - 代码检查', 'white');
  log('', 'white');

  log('💡 提示: 按 Ctrl+C 停止所有服务', 'magenta');
  log('', 'white');
}

async function main() {
  log('🚀 启动 AI Assistant 项目...', 'green');

  // 启动数据库
  log('📦 启动数据库服务...', 'yellow');
  const dbProcess = spawn('pnpm', ['run', 'start:db'], {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve) => {
    dbProcess.on('close', resolve);
  });

  // 启动开发服务
  log('🔧 启动开发服务...', 'yellow');
  const devProcess = spawn('pnpm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  // 等待服务启动完成后再显示信息
  setTimeout(async () => {
    await waitForServices();
    showProjectInfo();
  }, 3000); // 给服务一些启动时间

  // 处理进程退出
  process.on('SIGINT', () => {
    log('\n🛑 正在停止服务...', 'yellow');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  devProcess.on('close', (code) => {
    log(`\n🔚 开发服务已退出，退出码: ${code}`, 'red');
    process.exit(code);
  });
}

main().catch((error) => {
  log(`❌ 启动失败: ${error.message}`, 'red');
  process.exit(1);
});
