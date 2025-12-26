# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

Claude Code 文档: https://docs.claude.com/en/docs/claude-code/

## 开发命令

### 数据库设置

```bash
# 启动 PostgreSQL、Redis、Kafka 和 ZooKeeper 服务
pnpm start:db

# 停止数据库服务
docker-compose -f docker-compose.dev.yml down

# 数据库迁移
pnpm -F="@ai-assistant/server" prisma:migrate:dev
pnpm -F="@ai-assistant/server" prisma:studio
pnpm -F="@ai-assistant/server" prisma:generate  # 生成 Prisma 客户端
```

### Kafka 相关

```bash
# 访问 Kafka UI (Kafdrop)
# 浏览器访问: http://localhost:9000

# 查看 Kafka 健康状态
curl http://localhost:4000/kafka/health

# 查看 Kafka Topics
curl http://localhost:4000/kafka/topics

# 测试 Kafka 连接
curl -X POST http://localhost:4000/kafka/test
```

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动数据库服务和开发服务器
pnpm start

# 仅启动开发服务器（需要数据库已运行）
pnpm dev

# 分别启动各个服务
pnpm -F="@ai-assistant/server" dev  # 后端 (端口 4000，可通过 SERVER_PORT 修改)
pnpm -F="@ai-assistant/web" dev    # 前端 (端口 3000，可通过 NEXT_PORT 修改)
```

### 构建和生产环境

```bash
# 构建应用
pnpm build:server
pnpm build:web

# 启动生产服务器
pnpm start:server
pnpm start:web
```

### 代码质量

```bash
# 检查所有项目代码规范
pnpm lint

# 格式化后端代码
pnpm -F="@ai-assistant/server" format

# 前端 lint
pnpm -F="@ai-assistant/web" lint
```

### 测试

```bash
# 运行后端测试
pnpm -F="@ai-assistant/server" test
pnpm -F="@ai-assistant/server" test:watch
pnpm -F="@ai-assistant/server" test:cov
pnpm -F="@ai-assistant/server" test:e2e
```

## 项目架构

### Monorepo 结构

- **工具链**: pnpm workspace，使用 fnm 进行 Node 版本管理
- **后端**: NestJS 服务器，位于 `apps/server/` (端口 4000，可通过 SERVER_PORT 修改)
- **前端**: Next.js 15 网页应用，位于 `apps/web/` (端口 3000，可通过 NEXT_PORT 修改)
- **数据库**: PostgreSQL 配合 Prisma ORM
- **缓存**: Redis 配合 cache-manager 集成
- **消息队列**: Kafka 用于事件流、日志收集和异步任务处理
- **存储**: AWS S3 兼容存储

### 核心后端模块

- **Auth**: 基于 JWT 的身份认证，使用 bcrypt 加密
- **User**: 用户管理，支持 CRUD 操作
- **Chat/Message**: 对话管理，支持软删除功能，使用 Kafka 进行消息事件流处理
- **Agent**: AI 代理集成，使用 LangGraph
- **Model Manager**: 大语言模型管理
- **Cache**: Redis 缓存，支持装饰器和拦截器
- **Kafka**: 消息队列服务，用于聊天消息事件流、系统日志收集和异步任务处理
- **Thread**: 对话线程管理
- **Storage**: AWS S3 兼容文件存储
- **LLM**: 大语言模型集成模块

### 前端架构

- **框架**: Next.js 15 使用 App Router，React 19
- **状态管理**: Zustand 管理客户端状态，React Query 管理服务端状态
- **UI**: shadcn-ui 组件库配合 TailwindCSS
- **编辑器**: Lexical 富文本编辑器，支持 KaTeX 数学公式
- **样式**: TailwindCSS 配合 CSS 变量实现主题切换
- **国际化**: next-intl 提供多语言支持
- **表单**: React Hook Form 配合 Zod 验证
- **组件库**: Radix UI 基础组件

### 数据库架构

- **User**: 用户账户和身份认证
- **Message**: 聊天消息，包含软删除字段 (`deleted` 列)
- **Thread**: 对话线程
- **Chat**: 聊天会话
- **Model**: AI 模型配置

### Kafka Topics

- **chat.messages**: 聊天消息事件流，实时传输聊天消息
- **chat.events**: 聊天会话事件（开始、结束等）
- **system.logs**: 系统日志收集
- **system.events**: 系统事件通知
- **async.tasks**: 异步任务队列
- **user.events**: 用户活动事件
- **agent.events**: AI 代理状态变化事件

### 开发模式

- 全栈使用 Zod 进行数据验证
- 实现自定义异常过滤器进行错误处理
- 遵循 NestJS 模块结构组织后端代码
- 前端使用 React Query hooks 进行数据获取
- 严格模式下的 TypeScript 类型定义
- 使用 Prisma 迁移管理数据库架构变更
- 混合开发模式：Docker 运行数据库服务，本地运行应用代码

### 环境配置

- 数据库: `postgresql://postgres:postgres@localhost:5432/ai-assistant-dev`
- Redis: `redis://localhost:6379`
- Kafka: `localhost:9092`（通过 Docker Compose 运行）
- Kafka UI (Kafdrop): http://localhost:9000
- 使用 `.env` 文件管理环境变量
- 数据库服务通过 Docker Compose 运行

**Kafka 环境变量**:
- `KAFKA_BROKERS`: Kafka 代理地址 (默认: `localhost:9092`)
- `KAFKA_CLIENT_ID`: Kafka 客户端标识 (默认: `ai-assistant-server`)
- `KAFKA_CONSUMER_GROUP_ID`: 消费者组 ID (默认: `ai-assistant-group`)

### 代码规范指南

- 保持组件在 300 行以内（超过则拆分）
- 使用规范的 TypeScript 类型和接口
- 遵循现有的命名约定
- 在 React 组件中实现适当的错误边界
- 使用既定的请求模式进行 API 调用

### 添加 UI 组件

```bash
# 使用 shadcn-ui 添加新组件
pnpm dlx shadcn@latest add <component-name>
```

### 项目文件引用约定

- 使用相对路径进行文件引用，格式：`[filename.ts](src/filename.ts)`
- 特定行引用：`[filename.ts:42](src/filename.ts#L42)`
- 文件夹引用：`[src/utils/](src/utils/)`
