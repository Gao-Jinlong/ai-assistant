#!/usr/bin/env node

/**
 * 环境变量加载工具
 * 统一管理项目中的环境变量配置
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 默认配置
const defaultConfig = {
  // 服务端口
  NEXT_PORT: 3000,
  SERVER_PORT: 4000,

  // 数据库
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: 5432,
  POSTGRES_DB: 'ai-assistant-dev',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  DATABASE_URL:
    'postgresql://postgres:postgres@localhost:5432/ai-assistant-dev',

  // Redis
  REDIS_HOST: 'localhost',
  REDIS_PORT: 16379,
  REDIS_URL: 'redis://localhost:16379',

  // API
  NEXT_PUBLIC_API_URL: 'http://localhost:4000',

  // 认证
  JWT_SECRET: 'secret',
  JWT_EXPIRES_IN: '6h',

  // 环境
  NODE_ENV: 'development',

  // 日志
  LOG_LEVEL: 'debug',
  LOG_DIR: './logs',
  LOG_MAX_SIZE: 20971520,
  LOG_MAX_FILES: 7,
  LOG_CONSOLE: 'true',
  LOG_FILE: 'true',

  // 缓存
  CACHE_TTL: 300,
  CACHE_MAX: 1000,
  CACHE_TYPE: 'memory',

  // 存储
  STORAGE_TYPE: 'local',
  STORAGE_BASE_PATH: './data/storage',

  // Mock
  MOCK_ENABLE: 'true',
  MOCK_PATH: './mock',
};

/**
 * 加载环境变量
 * @param {string} envPath - 环境变量文件路径
 * @returns {Object} 配置对象
 */
export function loadEnv(envPath = null) {
  const config = { ...defaultConfig };

  // 尝试加载环境变量文件
  const envFiles = [
    envPath,
    join(projectRoot, '.env'),
    join(projectRoot, '.env.local'),
    join(projectRoot, '.env.development'),
  ].filter(Boolean);

  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      try {
        const envContent = readFileSync(envFile, 'utf8');
        const envVars = parseEnvFile(envContent);
        Object.assign(config, envVars);
        break; // 使用第一个找到的文件
      } catch (error) {
        console.warn(`警告: 无法读取环境变量文件 ${envFile}:`, error.message);
      }
    }
  }

  // 覆盖系统环境变量
  for (const key in config) {
    if (process.env[key] !== undefined) {
      config[key] = process.env[key];
    }
  }

  return config;
}

/**
 * 解析环境变量文件内容
 * @param {string} content - 文件内容
 * @returns {Object} 环境变量对象
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过空行和注释
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // 解析 KEY=VALUE 格式
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();
    let value = trimmedLine.substring(equalIndex + 1).trim();

    // 移除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/**
 * 获取服务端口配置
 * @returns {Object} 端口配置
 */
export function getPortConfig() {
  const config = loadEnv();
  return {
    web: parseInt(config.NEXT_PORT, 10),
    server: parseInt(config.SERVER_PORT, 10),
    postgres: parseInt(config.POSTGRES_PORT, 10),
    redis: parseInt(config.REDIS_PORT, 10),
  };
}

/**
 * 获取数据库配置
 * @returns {Object} 数据库配置
 */
export function getDatabaseConfig() {
  const config = loadEnv();
  return {
    host: config.POSTGRES_HOST,
    port: parseInt(config.POSTGRES_PORT, 10),
    database: config.POSTGRES_DB,
    username: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    url: config.DATABASE_URL,
  };
}

/**
 * 获取 Redis 配置
 * @returns {Object} Redis 配置
 */
export function getRedisConfig() {
  const config = loadEnv();
  return {
    host: config.REDIS_HOST,
    port: parseInt(config.REDIS_PORT, 10),
    url: config.REDIS_URL,
  };
}

// 如果直接运行此脚本，输出配置信息
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadEnv();
  const ports = getPortConfig();

  console.log('🔧 环境变量配置:');
  console.log('📱 前端端口:', ports.web);
  console.log('🔧 后端端口:', ports.server);
  console.log('🗄️  PostgreSQL 端口:', ports.postgres);
  console.log('💾 Redis 端口:', ports.redis);
  console.log('🌐 API URL:', config.NEXT_PUBLIC_API_URL);
}
