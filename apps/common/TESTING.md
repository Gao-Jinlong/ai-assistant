# Testing @ai-assistant/common

本项目使用 Vitest 作为测试框架。

## 测试命令

```bash
# 运行测试（监听模式）
pnpm test

# 运行测试一次
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 运行测试 UI
pnpm test:ui
```

## 测试结构

```
src/__tests__/
├── basic.test.ts      # 基础测试，验证 vitest 设置
└── utils.test.ts      # 工具函数测试示例
```

## 编写测试

### 基本测试

```typescript
import { describe, it, expect } from 'vitest'

describe('Basic Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### 工具函数测试

```typescript
import { describe, it, expect } from 'vitest'

describe('Utils Test', () => {
  it('should test string utility', () => {
    const isEmpty = (str?: string): boolean => !str || str.trim().length === 0

    expect(isEmpty('')).toBe(true)
    expect(isEmpty('hello')).toBe(false)
  })
})
```

## 测试配置

测试配置文件：`vitest.config.ts`

- 使用 Node.js 环境
- 支持全局测试函数
- 覆盖率报告：text、json、html
- 覆盖率阈值：80%

## 注意事项

1. 目前由于模块导入问题，测试文件中直接定义测试函数而不是从源文件导入
2. 测试文件放置在 `src/__tests__/` 目录下
3. 测试文件命名模式：`*.test.ts`
4. 可以使用 `describe`、`it`、`expect` 等 Vitest 全局函数

## 根目录测试脚本

在项目根目录可以运行：

```bash
# 运行 common 包测试
pnpm test:common

# 运行所有包的测试
pnpm test

# 生成覆盖率报告
pnpm test:coverage
```