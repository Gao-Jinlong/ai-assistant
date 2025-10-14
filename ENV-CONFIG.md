# 环境变量配置说明

本项目使用统一的环境变量管理系统，所有端口和配置都可以通过环境变量进行修改。

## 快速开始

1. 复制环境变量示例文件：

   ```bash
   cp env.example .env
   ```

2. 根据需要修改 `.env` 文件中的配置

3. 启动项目：
   ```bash
   pnpm start
   ```

## 环境变量说明

### 服务端口配置

| 变量名        | 默认值 | 说明                   |
| ------------- | ------ | ---------------------- |
| `NEXT_PORT`   | 3000   | 前端服务端口 (Next.js) |
| `SERVER_PORT` | 4000   | 后端服务端口 (NestJS)  |

### 数据库配置

| 变量名              | 默认值                                                         | 说明                 |
| ------------------- | -------------------------------------------------------------- | -------------------- |
| `POSTGRES_HOST`     | localhost                                                      | PostgreSQL 主机地址  |
| `POSTGRES_PORT`     | 5432                                                           | PostgreSQL 端口      |
| `POSTGRES_DB`       | ai-assistant-dev                                               | 数据库名称           |
| `POSTGRES_USER`     | postgres                                                       | 数据库用户名         |
| `POSTGRES_PASSWORD` | postgres                                                       | 数据库密码           |
| `DATABASE_URL`      | postgresql://postgres:postgres@localhost:5432/ai-assistant-dev | 完整数据库连接字符串 |

### Redis 配置

| 变量名       | 默认值                  | 说明             |
| ------------ | ----------------------- | ---------------- |
| `REDIS_HOST` | localhost               | Redis 主机地址   |
| `REDIS_PORT` | 16379                   | Redis 端口       |
| `REDIS_URL`  | redis://localhost:16379 | Redis 连接字符串 |

### API 配置

| 变量名                | 默认值                | 说明                    |
| --------------------- | --------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | http://localhost:4000 | 前端访问后端 API 的地址 |

### 认证配置

| 变量名           | 默认值 | 说明         |
| ---------------- | ------ | ------------ |
| `JWT_SECRET`     | secret | JWT 密钥     |
| `JWT_EXPIRES_IN` | 6h     | JWT 过期时间 |

## 修改端口示例

### 修改前端端口为 3000

```bash
# 在 .env 文件中设置
NEXT_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 修改后端端口为 5000

```bash
# 在 .env 文件中设置
SERVER_PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 同时修改前后端端口

```bash
# 在 .env 文件中设置
NEXT_PORT=3000
SERVER_PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 环境变量加载顺序

环境变量按以下顺序加载，后面的会覆盖前面的：

1. 默认配置 (在 `scripts/load-env.js` 中定义)
2. `.env` 文件
3. `.env.local` 文件
4. `.env.development` 文件
5. 系统环境变量

## 验证配置

运行以下命令查看当前配置：

```bash
node scripts/load-env.js
```

这将显示所有服务的端口配置和 API URL。

## 注意事项

1. **端口冲突**: 确保修改的端口没有被其他服务占用
2. **API URL**: 修改后端端口时，记得同时更新 `NEXT_PUBLIC_API_URL`
3. **数据库端口**: 修改数据库端口时，需要同时更新 Docker Compose 配置
4. **环境变量文件**: `.env` 文件包含敏感信息，不要提交到版本控制系统

## 故障排除

### 端口被占用

```bash
# 检查端口占用情况
lsof -i :3000  # 检查前端端口
lsof -i :4000  # 检查后端端口
lsof -i :5432  # 检查数据库端口
lsof -i :16379 # 检查 Redis 端口
```

### 环境变量未生效

1. 确认 `.env` 文件在项目根目录
2. 重启开发服务器
3. 检查环境变量文件格式是否正确
4. 运行 `node scripts/load-env.js` 验证配置
