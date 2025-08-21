# 缓存模块 (Cache Module)

这是一个基于 NestJS 和 cache-manager 的缓存模块，提供了完整的缓存解决方案。

## 功能特性

- 🚀 基于 NestJS 官方 cache-manager
- 🛠️ 支持多种缓存存储（内存、Redis 等）
- 🎯 提供装饰器支持，简化缓存操作
- 📦 批量操作支持
- 🔧 灵活的配置选项
- 🧪 完整的测试覆盖
- 📝 详细的使用示例

## 安装

依赖已自动安装，包括：
- `@nestjs/cache-manager`
- `cache-manager`
- `cache-manager-memory-store`

## 配置

### 环境变量

在 `.env` 文件中配置缓存相关参数：

```env
# 缓存配置
CACHE_TTL=300                 # 默认过期时间（秒）
CACHE_MAX=1000               # 最大缓存项数
CACHE_TYPE=memory            # 缓存类型：memory | redis

# Redis 配置（当 CACHE_TYPE=redis 时使用）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=ai-assistant:
```

### 配置文件

缓存配置已添加到 `src/config/configuration.ts`：

```typescript
cache: {
  ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  max: parseInt(process.env.CACHE_MAX || '1000', 10),
  type: process.env.CACHE_TYPE || 'memory',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ai-assistant:',
  },
}
```

## 使用方法

### 1. 基础使用

注入 `CacheService` 到你的服务中：

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: CacheService) {}

  async getUser(id: string) {
    // 尝试从缓存获取
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const user = await this.userRepository.findById(id);
    
    // 缓存结果
    await this.cacheService.set(`user:${id}`, user, 300);
    
    return user;
  }
}
```

### 2. 使用 getOrSet 方法

更简洁的缓存模式：

```typescript
async getUser(id: string) {
  return this.cacheService.getOrSet(
    `user:${id}`,
    () => this.userRepository.findById(id),
    300 // TTL: 5分钟
  );
}
```

### 3. 使用缓存键工具类

```typescript
import { CacheKeyUtil } from './cache/utils/cache-key.util';

async getUserProfile(userId: string) {
  const cacheKey = CacheKeyUtil.userKey(userId, 'profile');
  
  return this.cacheService.getOrSet(
    cacheKey,
    () => this.fetchUserProfile(userId),
    600
  );
}
```

### 4. 使用装饰器（需配合拦截器）

```typescript
import { Cacheable, CacheEvict } from './cache/decorators/cache.decorator';

@Injectable()
export class UserService {
  // 自动缓存方法结果
  @Cacheable((userId: string) => `user:${userId}`, 300)
  async getUser(userId: string) {
    return this.userRepository.findById(userId);
  }

  // 方法执行后清除相关缓存
  @CacheEvict((userId: string) => [`user:${userId}`, `user:${userId}:profile`])
  async updateUser(userId: string, data: any) {
    return this.userRepository.update(userId, data);
  }
}
```

### 5. 批量操作

```typescript
// 批量获取
const keys = ['user:1', 'user:2', 'user:3'];
const values = await this.cacheService.mget(keys);

// 批量设置
const items = [
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2 },
];
await this.cacheService.mset(items, 300);

// 批量删除
await this.cacheService.mdel(['user:1', 'user:2']);
```

## API 文档

### CacheService

#### 基本方法

- `get<T>(key: string): Promise<T | undefined>` - 获取缓存值
- `set<T>(key: string, value: T, ttl?: number): Promise<void>` - 设置缓存值
- `del(key: string): Promise<void>` - 删除缓存
- `has(key: string): Promise<boolean>` - 检查缓存是否存在
- `reset(): Promise<void>` - 清空所有缓存

#### 高级方法

- `getOrSet<T>(key: string, factory: () => Promise<T> | T, ttl?: number): Promise<T>` - 获取或设置缓存
- `mget<T>(keys: string[]): Promise<(T | undefined)[]>` - 批量获取
- `mset<T>(items: Array<{ key: string; value: T }>, ttl?: number): Promise<void>` - 批量设置
- `mdel(keys: string[]): Promise<void>` - 批量删除

### CacheKeyUtil

提供标准化的缓存键生成方法：

- `userKey(userId: string, suffix?: string): string`
- `threadKey(threadId: string, suffix?: string): string`
- `messageKey(messageId: string, suffix?: string): string`
- `apiKey(endpoint: string, params?: Record<string, any>): string`
- `listKey(resource: string, query?: Record<string, any>): string`
- `paginationKey(resource: string, page: number, limit: number, filters?: Record<string, any>): string`
- `searchKey(query: string, filters?: Record<string, any>): string`
- `statsKey(type: string, period: string, date?: string): string`

### 装饰器

- `@Cacheable(key, ttl?)` - 缓存方法结果
- `@CacheEvict(keys)` - 方法执行后清除缓存
- `@CachePut(key, ttl?)` - 方法执行后更新缓存

## HTTP API

缓存模块还提供了 HTTP API 用于缓存管理：

### 获取缓存
```
GET /cache/:key
```

### 设置缓存
```
POST /cache
{
  "key": "test-key",
  "value": "test-value",
  "ttl": 300
}
```

### 删除缓存
```
DELETE /cache/:key
```

### 检查缓存是否存在
```
GET /cache/:key/exists
```

### 批量获取
```
GET /cache?keys=key1,key2,key3
```

### 批量设置
```
POST /cache/batch
{
  "items": [
    { "key": "key1", "value": "value1" },
    { "key": "key2", "value": "value2" }
  ],
  "ttl": 300
}
```

### 批量删除
```
DELETE /cache?keys=key1,key2,key3
```

### 清空所有缓存
```
DELETE /cache/reset/all
```

## 最佳实践

### 1. 缓存键命名规范

使用 `CacheKeyUtil` 生成标准化的缓存键：

```typescript
// 好的做法
const key = CacheKeyUtil.userKey(userId, 'profile');

// 不推荐
const key = `user_${userId}_profile`;
```

### 2. 设置合适的 TTL

根据数据的更新频率设置合适的过期时间：

```typescript
// 用户基本信息 - 较少变化，较长TTL
await cacheService.set(userKey, user, 3600); // 1小时

// 实时数据 - 频繁变化，较短TTL
await cacheService.set(statsKey, stats, 60); // 1分钟
```

### 3. 缓存失效策略

在数据更新时及时清除相关缓存：

```typescript
async updateUser(userId: string, data: any) {
  // 更新数据
  const user = await this.userRepository.update(userId, data);
  
  // 清除相关缓存
  await this.cacheService.mdel([
    CacheKeyUtil.userKey(userId),
    CacheKeyUtil.userKey(userId, 'profile'),
    CacheKeyUtil.listKey('users'), // 如果有用户列表缓存
  ]);
  
  return user;
}
```

### 4. 错误处理

缓存操作不应影响主要业务逻辑：

```typescript
async getUser(userId: string) {
  try {
    const cached = await this.cacheService.get(userKey);
    if (cached) return cached;
  } catch (error) {
    // 记录错误但不抛出
    this.logger.warn('Cache get failed', error);
  }
  
  // 继续执行主要逻辑
  const user = await this.userRepository.findById(userId);
  
  try {
    await this.cacheService.set(userKey, user, 300);
  } catch (error) {
    this.logger.warn('Cache set failed', error);
  }
  
  return user;
}
```

## 扩展 Redis 支持

如需使用 Redis 作为缓存存储，需要安装额外依赖：

```bash
pnpm add cache-manager-redis-store redis
pnpm add -D @types/redis
```

然后修改缓存模块配置：

```typescript
// 在 cache.module.ts 中
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const cacheType = configService.get('cache.type');
        
        if (cacheType === 'redis') {
          return {
            store: redisStore,
            host: configService.get('cache.redis.host'),
            port: configService.get('cache.redis.port'),
            password: configService.get('cache.redis.password'),
            db: configService.get('cache.redis.db'),
            keyPrefix: configService.get('cache.redis.keyPrefix'),
            ttl: configService.get('cache.ttl'),
          };
        }
        
        // 默认内存存储
        return {
          ttl: configService.get('cache.ttl'),
          max: configService.get('cache.max'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  // ...
})
```

## 测试

运行测试：

```bash
# 运行缓存模块测试
npm test -- --testPathPattern=cache

# 运行特定测试文件
npm test cache.service.spec.ts
npm test cache.controller.spec.ts
```

## 监控和调试

### 1. 日志记录

缓存服务会自动记录操作失败的日志，帮助调试问题。

### 2. 缓存命中率监控

可以扩展 `CacheService` 添加指标收集：

```typescript
// 在 CacheService 中添加计数器
private hitCount = 0;
private missCount = 0;

async get<T>(key: string): Promise<T | undefined> {
  const value = await this.cacheManager.get<T>(key);
  
  if (value !== undefined) {
    this.hitCount++;
  } else {
    this.missCount++;
  }
  
  return value;
}

getHitRate(): number {
  const total = this.hitCount + this.missCount;
  return total === 0 ? 0 : this.hitCount / total;
}
```

## 常见问题

### Q: 缓存没有生效？
A: 检查 TTL 设置是否正确，确认缓存键没有冲突。

### Q: 内存使用过高？
A: 调整 `CACHE_MAX` 参数限制缓存项数量，或考虑切换到 Redis。

### Q: 如何调试缓存问题？
A: 使用 HTTP API 手动检查缓存状态，查看应用日志了解缓存操作情况。

### Q: 如何在测试中禁用缓存？
A: 可以在测试环境中设置 `CACHE_TTL=0` 或使用 mock CacheService。

## 更新日志

- v1.0.0: 初始版本，支持基础缓存操作
- 包含完整的装饰器、拦截器和工具类
- 提供 HTTP API 和详细的使用示例
- 完整的测试覆盖和文档

---

欢迎提出建议和改进意见！