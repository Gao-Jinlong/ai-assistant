# @ai-assistant/common

前后端共享的通用工具和类型定义包。

## 功能特性

- 🔧 **通用工具函数** - 字符串、数字、日期、对象、数组等常用工具函数
- 📝 **类型定义** - 用户、消息、线程、聊天等核心业务类型
- 🎯 **常量定义** - API 状态码、分页配置、正则表达式等常量
- 📦 **TypeScript 支持** - 完整的类型支持和声明文件
- 🚀 **模块化导出** - 支持按需导入，减少打包体积

## 安装

```bash
pnpm add @ai-assistant/common
```

## 使用示例

### 类型定义

```typescript
import { User, Message, ApiResponse } from '@ai-assistant/common/types'

interface UserResponse extends ApiResponse<User> {}
```

### 工具函数

```typescript
import { stringUtils, dateUtils, idUtils } from '@ai-assistant/common/utils'

// 字符串工具
const isValid = stringUtils.isValidEmail('user@example.com')
const slug = stringUtils.slugify('Hello World')

// 日期工具
const formatted = dateUtils.format(new Date(), 'YYYY-MM-DD')
const nextWeek = dateUtils.addDays(new Date(), 7)

// ID 生成
const uniqueId = idUtils.nanoid()
```

### 常量使用

```typescript
import { HTTP_STATUS, PAGINATION, ERROR_CODES } from '@ai-assistant/common/constants'

// HTTP 状态码
if (response.status === HTTP_STATUS.OK) {
  // 处理成功响应
}

// 分页配置
const page = PAGINATION.DEFAULT_PAGE
const limit = PAGINATION.DEFAULT_LIMIT
```

## 构建和开发

```bash
# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查和修复
pnpm lint
```

## 包结构

```
src/
├── types/          # 类型定义
│   └── index.ts
├── constants/      # 常量定义
│   └── index.ts
├── utils/          # 工具函数
│   └── index.ts
└── index.ts        # 主入口文件
```

## 导出路径

- `/` - 主入口，导出所有内容
- `/types` - 仅导出类型定义
- `/utils` - 仅导出工具函数
- `/constants` - 仅导出常量定义

按需导入示例：

```typescript
// 仅导入类型
import { User, Message } from '@ai-assistant/common/types'

// 仅导入工具函数
import { stringUtils, dateUtils } from '@ai-assistant/common/utils'

// 仅导入常量
import { HTTP_STATUS, PAGINATION } from '@ai-assistant/common/constants'
```

## 测试

本项目使用 Vitest 进行测试。

### 运行测试

```bash
# 开发模式（监听文件变化）
pnpm test

# 运行测试一次
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 运行测试 UI 界面
pnpm test:ui
```

### 测试覆盖率

测试覆盖率报告会生成在 `coverage/` 目录下，支持多种格式：
- Terminal 输出
- JSON 格式
- HTML 报告（可在浏览器中查看）

### 测试配置

- 测试框架：Vitest
- 环境：Node.js
- 覆盖率工具：v8
- 覆盖率阈值：80%
- 测试文件位置：`src/__tests__/**/*.test.ts`

详细的测试指南请参考 [TESTING.md](./TESTING.md)