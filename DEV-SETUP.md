# AI Assistant 开发环境设置

## 概述

本项目采用混合开发模式：

- **数据库服务**: 使用 Docker 运行 PostgreSQL 和 Redis
- **应用代码**: 在本地开发环境中运行

## 快速开始

通过 docker-compose 快速启动开发环境

```bash
pnpm start
```

## 单独启动

### 1. 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis
pnpm start:db
```

或者手动启动：

```powershell
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 启动开发服务器

#### 方式一：分别启动前后端

```powershell
# 启动后端 (端口 4000，可通过 SERVER_PORT 环境变量修改)
cd apps/server
pnpm -F="@ai-assistant/server" dev

# 新开一个终端，启动前端 (端口 3000，可通过 NEXT_PORT 环境变量修改)
cd apps/web
pnpm -F="@ai-assistant/web" dev
```

#### 方式二：同时启动前后端

```powershell
# 在项目根目录
pnpm dev
```

## 数据库管理

### 查看数据库状态

```powershell
# 查看容器状态
docker-compose -f docker-compose.dev.yml ps

# 进入 PostgreSQL 容器
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d ai_assistant_dev

# 查看数据库列表
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -l
```

### 数据库迁移

```powershell
pnpm -F="@ai-assistant/server" prisma:migrate:dev
```

## 停止服务

```powershell
# 停止数据库服务
docker-compose -f docker-compose.dev.yml down

# 停止所有服务（包括数据卷）
docker-compose -f docker-compose.dev.yml down -v
```

## 故障排除

### 1. 数据库连接失败

```powershell
# 检查数据库容器状态
docker-compose -f docker-compose.dev.yml ps

# 查看数据库日志
docker-compose -f docker-compose.dev.yml logs postgres
```

### 2. 端口被占用

```powershell
# 检查端口占用
netstat -ano | findstr :5432
netstat -ano | findstr :16379
netstat -ano | findstr :3000  # 前端端口 (可通过 NEXT_PORT 修改)
netstat -ano | findstr :4000  # 后端端口 (可通过 SERVER_PORT 修改)
```

### 3. 依赖安装问题

```powershell
# 清理并重新安装依赖
pnpm clean
pnpm install
```

## 开发建议

1. **使用 VS Code**: 推荐使用 VS Code 进行开发，支持 TypeScript 和调试
2. **热重载**: 前后端都支持热重载，代码修改会自动重启
3. **数据库工具**: 推荐使用 Prisma Studio 或 pgAdmin 管理数据库
4. **日志查看**: 使用 `docker-compose logs` 查看服务日志
