# AI-ASSISTANT

一个基于 Next.js 和 NestJS 的 AI 助手项目，采用 Monorepo 架构。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量（可选）

```bash
# 复制环境变量示例文件
cp env.example .env

# 根据需要修改 .env 文件中的配置
# 主要配置项：
# - NEXT_PORT: 前端端口 (默认 3000)
# - SERVER_PORT: 后端端口 (默认 4000)
# - 数据库和 Redis 配置
```

### 3. 启动项目

```bash
# 启动数据库和开发服务
pnpm start

# 或者分别启动
pnpm start:db  # 启动数据库
pnpm dev       # 启动开发服务
```

## 项目结构

- **前端**: Next.js 15 应用 (`apps/web/`)
- **后端**: NestJS 服务器 (`apps/server/`)
- **数据库**: PostgreSQL + Redis (Docker)
- **配置**: 统一环境变量管理

## 文档

- [开发环境设置](./DEV-SETUP.md)
- [环境变量配置](./ENV-CONFIG.md)
- [Claude 开发指南](./CLAUDE.md)

## 主要特性

- 🚀 统一的启动脚本，自动显示服务访问信息
- 🔧 灵活的环境变量配置系统
- 📱 响应式前端界面
- 🔐 JWT 身份认证
- 💾 数据库和缓存支持
- 🌐 国际化支持
