# SSE 对话恢复功能迭代方案

**文档版本**: 1.0
**创建日期**: 2025-11-24
**状态**: 规划中
**TTL**: 3600秒（1小时）

---

## 一、核心机制设计

### 问题
用户刷新页面时 SSE 连接断开，导致丢失流式接收消息的能力

### 解决方案
1. **Redis 双缓存架构**:
   - **List 缓存**: `streaming:thread:{threadUid}:messages` - 存储完整消息历史（用于 restore 恢复）
   - **Pub/Sub 通道**: `streaming:thread:{threadUid}:channel` - 实时推送新消息（用于 restore 监听）

2. **Thread 状态标记**: 使用 `metadata.streamingStatus` 字段标记对话状态

3. **Restore 接口作为 SSE 代理**:
   - 阶段 1: 读取 Redis List 缓存返回历史消息
   - 阶段 2: 订阅 Redis Pub/Sub 通道获取实时更新
   - 不直接调用 LLM，只监听缓存变化

---

## 二、数据结构设计

### 1. Redis List 缓存（历史消息）
```typescript
key: "streaming:thread:{threadUid}:messages"
type: Redis List (RPUSH/LRANGE)
value: JSON.stringify(StreamMessage)
TTL: 3600秒 (1小时)
用途: restore 时读取完整历史

写入时机:
- handleProcessedStream 接收 MESSAGE_CHUNK、TOOL_CALL_*、TOOL_RESULT 等消息时
- 不包括 PING、ERROR、DONE 等控制消息

读取时机:
- restore 接口启动时，使用 LRANGE 0 -1 获取全部历史
```

### 2. Redis Pub/Sub Channel（实时推送）
```typescript
channel: "streaming:thread:{threadUid}:channel"
type: Redis Pub/Sub (PUBLISH/SUBSCRIBE)
message: JSON.stringify(StreamMessage)

发布时机:
- 与 List 缓存同时写入，确保 restore 能实时接收

订阅时机:
- restore 接口读取完历史后，立即订阅该 channel
```

### 3. Thread 状态（数据库 + Redis）

#### 数据库层（PostgreSQL via Prisma）
```typescript
// 使用 metadata JSON 字段（无需 migration）
model Thread {
  ...
  metadata Json?  // 存储: { streamingStatus: 'in_progress' | 'completed' }
}

// 在 ThreadService 中添加类型解析
interface ThreadMetadata {
  streamingStatus?: 'in_progress' | 'completed';
  lastUpdate?: number;
}
```

#### Redis 缓存层（快速查询）
```typescript
key: "streaming:thread:{threadUid}:status"
value: 'in_progress' | 'completed'
TTL: 3600秒
用途: 快速检查对话状态，避免频繁查询数据库
```

---

## 三、核心实现流程

### 流程 1: 正常对话（主流程）

**文件**: `apps/server/src/chat/chat.service.ts`

```typescript
private async handleProcessedStream({
  source$, res, thread
}) {
  const listKey = `streaming:thread:${thread.uid}:messages`;
  const channel = `streaming:thread:${thread.uid}:channel`;
  const statusKey = `streaming:thread:${thread.uid}:status`;

  // 标记对话状态
  await this.cacheService.set(statusKey, 'in_progress', 3600);
  await this.updateThreadMetadata(thread.uid, { streamingStatus: 'in_progress' });

  source$.subscribe({
    next: async (sseMessage) => {
      const serialized = this.messageFormatter.serializeToSSE(sseMessage);

      // 1. 写入客户端 SSE
      res.write(serialized);

      // 2. 写入 Redis List 缓存（历史）
      if (sseMessage.data !== null) { // 排除控制消息
        await this.redis.rpush(listKey, JSON.stringify(sseMessage));
        await this.redis.expire(listKey, 3600);
      }

      // 3. 发布到 Pub/Sub 通道（实时）
      await this.redis.publish(channel, JSON.stringify(sseMessage));
    },

    complete: async () => {
      // 对话完成，标记状态
      await this.cacheService.set(statusKey, 'completed', 3600);
      await this.updateThreadMetadata(thread.uid, { streamingStatus: 'completed' });

      // 发布完成事件到 control channel
      await this.redis.publish(`${channel}:control`, 'complete');
    },

    error: async (err) => {
      console.error('Stream error:', err);
      // 错误处理：是否需要标记为 completed？
    }
  });
}
```

**关键点**:
- 三重输出：客户端 + List 缓存 + Pub/Sub 通道
- 确保三个操作都成功后再处理下一条消息
- 异步并行优化：客户端写入和 Redis 操作可以并行

---

### 流程 2: Restore 恢复（监听暂存区）

**文件**: `apps/server/src/chat/chat.controller.ts`

```typescript
@Get('threads/restore')
@Sse()
async restoreThread(@Query('threadId') threadId: string) {
  const listKey = `streaming:thread:${threadId}:messages`;
  const channel = `streaming:thread:${threadId}:channel`;
  const statusKey = `streaming:thread:${threadId}:status`;

  return new Observable((subscriber) => {
    let pubSubClient: Redis | null = null;
    let isCompleted = false;
    let checkInterval: NodeJS.Timeout | null = null;

    (async () => {
      try {
        // ========== 阶段 1: 读取并发送历史消息 ==========
        const history = await this.redis.lrange(listKey, 0, -1);

        if (history.length === 0) {
          // 缓存已过期或不存在
          subscriber.next({
            type: 'error',
            data: '对话缓存已过期或不存在，无法恢复'
          });
          subscriber.complete();
          return;
        }

        // 按顺序发送历史消息（从旧到新）
        for (const msgStr of history) {
          try {
            const msg = JSON.parse(msgStr);
            subscriber.next(msg);
          } catch (e) {
            console.error('Parse history message failed:', e);
          }
        }

        // ========== 阶段 2: 检查对话是否已完成 ==========
        const status = await this.redis.get(statusKey);
        if (status === 'completed') {
          // 对话已完成，只返回历史消息
          subscriber.complete();
          return;
        }

        // ========== 阶段 3: 订阅 Pub/Sub 监听新消息 ==========
        pubSubClient = this.redis.duplicate(); // 独立连接用于订阅

        // 订阅主消息通道
        await pubSubClient.subscribe(channel, (message) => {
          try {
            // 检查是否为 history 中已有的消息（基于时间戳或 UID）
            const msg = JSON.parse(message);

            // 只推送新消息（在 history 之后的消息）
            if (msg.metadata?.timestamp > lastHistoryTimestamp) {
              subscriber.next(msg);
            }
          } catch (e) {
            console.error('Parse pub/sub message failed:', e);
          }
        });

        // 订阅控制通道（用于接收 complete 事件）
        const controlChannel = `${channel}:control`;
        await pubSubClient.subscribe(controlChannel, (message) => {
          if (message === 'complete') {
            isCompleted = true;
            // 延迟3秒确保所有消息已接收
            setTimeout(() => {
              subscriber.complete();
              if (pubSubClient) pubSubClient.quit();
              if (checkInterval) clearInterval(checkInterval);
            }, 3000);
          }
        });

        // ========== 阶段 4: 心跳检测（可选） ==========
        // 定期检查对话状态，防止 Pub/Sub 消息丢失
        checkInterval = setInterval(async () => {
          try {
            const currentStatus = await this.redis.get(statusKey);
            if (currentStatus === 'completed' && !isCompleted) {
              // 状态已更新但未收到 control 消息
              console.warn('Status is completed but control message not received');

              // 从 List 末尾获取最新消息确认
              const recent = await this.redis.lrange(listKey, -10, -1);
              const hasDoneMessage = recent.some(msgStr => {
                try {
                  const msg = JSON.parse(msgStr);
                  return msg.type === 'done';
                } catch { return false; }
              });

              if (hasDoneMessage) {
                isCompleted = true;
                setTimeout(() => {
                  subscriber.complete();
                  if (pubSubClient) pubSubClient.quit();
                  clearInterval(checkInterval);
                }, 3000);
              }
            }
          } catch (err) {
            console.error('Health check error:', err);
          }
        }, 5000); // 每5秒检查一次

      } catch (error) {
        console.error('Restore failed:', error);
        subscriber.error(error);

        // 清理资源
        if (pubSubClient) pubSubClient.quit();
        if (checkInterval) clearInterval(checkInterval);
      }
    })();

    // ========== 清理函数（连接断开时调用） ==========
    return () => {
      if (pubSubClient) pubSubClient.quit();
      if (checkInterval) clearInterval(checkInterval);
      console.log(`Restore connection closed for thread: ${threadId}`);
    };
  });
}
```

**关键点**:
- 四阶段处理：读取历史 → 检查状态 → 订阅实时 → 心跳检测
- 资源管理：Pub/Sub 客户端、定时器需要正确清理
- 容错机制：control 消息丢失时，通过 List 检查 DONE 消息

---

### 流程 3: Thread 状态查询（列表接口）

**文件**: `apps/server/src/thread/thread.service.ts`

```typescript
async getThreads(user: JwtPayload, params: QueryThreadDto) {
  const threads = await this.prisma.db.thread.findMany({
    where: {
      userUid: user.sub,
      deleted: false,
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { metadata: { path: ['title'], string_contains: params.search } }
        ]
      })
    },
    orderBy: { [params.sortBy]: params.sortOrder },
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
    select: {
      uid: true,
      title: true,
      messageCount: true,
      totalTokens: true,
      metadata: true,  // ← 包含 streamingStatus
      createdAt: true,
      updatedAt: true
    }
  });

  // 解析 metadata 并添加 status 字段
  return threads.map(thread => ({
    ...thread,
    status: this.parseStreamingStatus(thread.metadata),
    parsedTitle: this.parseThreadTitle(thread) // 可选：从 metadata 解析标题
  }));
}

private parseStreamingStatus(metadata: any): 'in_progress' | 'completed' {
  return metadata?.streamingStatus || 'completed';
}

async getThreadDetail(user: JwtPayload, threadId: string) {
  const thread = await this.prisma.db.thread.findFirst({
    where: { uid: threadId, userUid: user.sub, deleted: false },
    include: {
      messages: {
        where: { deleted: false },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!thread) {
    throw new NotFoundException('Thread not found');
  }

  return {
    ...thread,
    status: this.parseStreamingStatus(thread.metadata)
  };
}
```

**返回格式**:
```typescript
{
  "uid": "thread_123",
  "title": "对话标题",
  "messageCount": 10,
  "totalTokens": 500,
  "metadata": {
    "streamingStatus": "in_progress",  // ← 核心字段
    "lastUpdate": 1732435200000
  },
  "status": "in_progress",  // ← 解析后的字段
  "createdAt": "2025-11-24T10:00:00Z",
  "updatedAt": "2025-11-24T10:05:00Z"
}
```

---

## 四、详细改动清单

### 后端改动

| # | 文件路径 | 改动类型 | 说明 |
|---|---------|---------|------|
| 1 | `apps/server/src/chat/chat.service.ts` | 修改 | `handleProcessedStream()` 添加 Redis 缓存和 Pub/Sub |
| 2 | `apps/server/src/chat/chat.controller.ts` | 新增 | `restoreThread()` SSE 接口 |
| 3 | `apps/server/src/thread/thread.service.ts` | 修改 | `getThreads()` 和 `getThreadDetail()` 返回 status |
| 4 | `apps/server/src/cache/redis.service.ts` | 修改/新增 | 扩展 Redis 操作（List、Pub/Sub）|
| 5 | `apps/server/src/cache/utils/cache-key.util.ts` | 新增 | 缓存键生成工具函数 |
| 6 | `apps/server/prisma/schema.prisma` | 可选 | 如果使用独立字段存储 status（需要 migration）|

### 前端改动

| # | 文件路径 | 改动类型 | 说明 |
|---|---------|---------|------|
| 1 | `apps/web/service/chat.ts` | 新增 | `restoreThread()` 方法 |
| 2 | `apps/web/hooks/use-chat.ts` | 修改 | 集成 restore 逻辑 |
| 3 | `apps/web/app/chat/[threadId]/page.tsx` | 修改 | 页面加载时调用 restore |
| 4 | `apps/web/components/thread-list.tsx` | 修改 | 显示 streaming 状态标识 |
| 5 | `apps/web/types/chat.ts` | 新增/修改 | Thread 类型添加 status 字段 |

---

## 五、边界情况处理

### 1. Redis List 缓存已过期（TTL 1小时）

**场景**: 用户 1 小时后刷新页面

**处理方案**:
```typescript
// restore 时发现 key 不存在
const history = await this.redis.lrange(listKey, 0, -1);

if (history.length === 0) {
  // 方案 A: 返回错误 + 从数据库加载文本历史
  subscriber.next({
    type: 'error',
    data: '对话缓存已过期，只能显示已保存的文本消息'
  });

  // 从数据库获取完整消息（仅限文本）
  const dbMessages = await this.prisma.db.message.findMany({
    where: { threadUid: threadId, deleted: false },
    orderBy: { createdAt: 'asc' }
  });

  // 转换为 StreamMessage 格式
  const streamMessages = this.messageFormatter.toStreamMessages(dbMessages);
  streamMessages.forEach(msg => subscriber.next(msg));

  subscriber.complete();
}

// 方案 B: TTL 延长策略
// 每次写入缓存时重置 TTL，保持最后一条消息写入后 1 小时过期
await this.redis.expire(listKey, 3600);
```

**建议**: 采用方案 A，提供降级体验

---

### 2. 多端同时 restore 同一对话

**场景**: 用户在浏览器标签页 A 发起对话，在标签页 B 刷新

**处理**:
```typescript
// Pub/Sub 天然支持多端订阅
// 每个 restore 连接都会收到相同的消息流

// 标签页 A（主连接）:
handleProcessedStream() → publish to channel → [Redis Pub/Sub]

// 标签页 B（restore）:
subscribe to channel ← receive message from [Redis Pub/Sub]

// 标签页 C（另一个 restore）:
subscribe to channel ← receive message from [Redis Pub/Sub]
```

**前端去重**: 每个客户端根据 `message.uid` 去重，避免显示重复消息

**潜在问题**: Pub/Sub 不保存历史，如果 restore 连接建立之前有消息发布，会丢失

**解决方案**:
- elevate: List 缓存保证完整性，Pub/Sub 保证实时性
- 建立 restore 连接时，先读取 List 历史，再订阅 Pub/Sub
- 时间戳比对：只接收 history 之后的消息

---

### 3. 主连接断开后无新消息（complete 事件丢失）

**场景**: handleProcessedStream 完成时，control 消息未送达 restore

**处理**:
```typescript
// handleProcessedStream
complete: async () => {
  await this.redis.set(statusKey, 'completed', 3600);
  await this.updateThreadMetadata(thread.uid, { streamingStatus: 'completed' });

  // 发布完成事件
  await this.redis.publish(`${channel}:control`, 'complete');
}

// restore
// 双重检查机制：
// 1. 订阅 control channel
await pubSub.subscribe(`${channel}:control`, (message) => {
  if (message === 'complete') {
    isCompleted = true;
    setTimeout(() => subscriber.complete(), 3000);
  }
});

// 2. 心跳检查 List 末尾是否有 DONE 消息
const checkInterval = setInterval(async () => {
  const recent = await this.redis.lrange(listKey, -5, -1);
  const hasDone = recent.some(msgStr => {
    try {
      const msg = JSON.parse(msgStr);
      return msg.type === 'done';
    } catch { return false; }
  });

  if (hasDone) {
    setTimeout(() => {
      subscriber.complete();
      clearInterval(checkInterval);
    }, 3000);
  }
}, 5000);
```

---

### 4. Redis Pub/Sub 连接断开

**场景**: Redis 故障或网络问题

**处理**:
```typescript
const pubSub = this.redis.duplicate();

pubSub.on('error', (err) => {
  console.error('Pub/Sub connection error:', err);
  subscriber.error(new Error('实时连接已断开，请刷新页面重试'));

  // 尝试重连？
  // 恢复机制：直接返回 List 历史，标记为失败
  pubSub.quit();
});

// 客户端（前端）
eventSource.onerror = (error) => {
  console.error('Restore connection error:', error);
  // 显示重试按钮
  setRestoreStatus('disconnected');
};
```

---

### 5. List 历史与 Pub/Sub 实时消息的重复

**场景**: restore 读取 List 历史时，主连接仍在写入新消息

**问题**: 新消息可能同时写入 List 并通过 Pub/Sub 推送，导致 restore 收到重复

**解决方案**:
```typescript
// 时间戳标记
const lastHistoryTimestamp = Date.now(); // 读取完 history 的时间

// subscribe 时过滤
await pubSub.subscribe(channel, (message) => {
  const msg = JSON.parse(message);

  // 只接收 history 之后的消息
  if (msg.metadata?.timestamp > lastHistoryTimestamp) {
    subscriber.next(msg);
  }
});
```

---

### 6. 读取历史与订阅之间的消息丢失问题（关键）

**场景**: 在 `restore` 接口中，存在时间窗口：先读取 List 历史 → 再订阅 Pub/Sub。在这个窗口期间，主连接可能产生新消息，导致消息丢失。

#### 问题时间线分析

```
时间线: ──────────────────────────────────────────────────────>

主连接 (handleProcessedStream):
├─ 12:00:00.000 发送消息 A
├─ 12:00:00.100 发送消息 B
├─ 12:00:00.200 发送消息 C (❌ 在此时间点可能丢失)
└─ 12:00:00.300 发送消息 D

Restore 连接:
├─ 12:00:00.050 开始读取历史 (lrange)
│   └─ 读取到: A, B (C 还未写入)
│
├─ 12:00:00.150 读取完成
│   └─ lastHistoryTimestamp = 12:00:00.150
│
├─ 12:00:00.200 主连接写入消息 C 到 List + 发布到 Pub/Sub
│   ├─ List: C 写入成功（第 3 条）
│   └─ Pub/Sub: C 已发布，但 restore 还未订阅！
│
├─ 12:00:00.250 开始订阅 Pub/Sub
│   └─ 订阅后收到: D（从 Pub/Sub）
│   └─ 但 C (12:00:00.200) 丢失了！
│
└─ 12:00:00.350 完成

丢失的消息: C
原因: C 写入 List 的时间在 lrange 之后，但在 subscribe 之前
结果: Pub/Sub 推送 C 时 restore 还未订阅，无法收到
```

#### 为什么仅靠时间戳过滤无法解决

```typescript
// ❌ 错误示例：仅用时间戳过滤
const history = await redis.lrange(key, 0, -1);
const lastTimestamp = Date.now(); // 12:00:00.150

await pubSub.subscribe(channel, (msg) => {
  const message = JSON.parse(msg);

  // 即使 C 的时间戳 (12:00:00.200) > lastTimestamp
  // 但由于 C 发布时 restore 还未订阅，收不到 C
  if (message.timestamp > lastTimestamp) {
    subscriber.next(message);
  }
});

// 结果：C 永远丢失
```

**根本原因**: Pub/Sub 不存储历史消息，只推送给**在线**的订阅者。如果消息发布时订阅者还未连接，该消息就永久丢失。

#### 解决方案对比

| 方案 | 消息丢失 | 延迟 | 复杂度 | Redis 查询次数 | 推荐度 |
|------|---------|------|--------|---------------|--------|
| 方案 1: 时间戳过滤 | ❌ 会丢失 | ✅ 无 | ✅ 简单 | 1 次 | ❌ 不推荐 |
| 方案 2: 延迟读取 | ✅ 不会 | ⚠️ 50ms | ⚠️ 中等 | 1 次 | ⚠️ 可用 |
| 方案 3: 二次读取 | ⚠️ 极小 | ⚠️ 100ms | ⚠️ 中等 | **2 次** | ✅ **推荐** |
| 方案 4: 先订阅后读 | ✅ 不会 | ⚠️ 50ms | ❌ 复杂 | 1 次 | ⚠️ 可用 |

#### 推荐方案：二次读取（方案 3）

**核心思路**: 读取 List 历史 → 订阅 Pub/Sub → **再次读取 List**，检查并补发新增消息。

```typescript
@Get('threads/restore')
@Sse()
async restoreThread(@Query('threadId') threadId: string) {
  const listKey = `streaming:thread:${threadId}:messages`;
  const channel = `streaming:thread:${threadId}:channel`;
  const sentMessageUids = new Set(); // 记录已发送消息的 UID

  return new Observable(subscriber => {
    let pubSubClient: Redis | null = null;
    let isInitialized = false;

    (async () => {
      try {
        // ========== 步骤 0: 立即订阅 Pub/Sub，暂存消息 ==========
        pubSubClient = this.redis.duplicate();
        const newMessageBuffer: any[] = [];

        await pubSubClient.subscribe(channel, (message) => {
          const msg = JSON.parse(message);

          if (!isInitialized) {
            // 初始化期间，先暂存
            newMessageBuffer.push(msg);
          } else {
            // 初始化完成后，直接发送
            if (!sentMessageUids.has(msg.uid)) {
              subscriber.next(msg);
              sentMessageUids.add(msg.uid);
            }
          }
        });

        // 等待订阅生效（50ms）
        await sleep(50);

        // ========== 步骤 1: 第一次读取 List（历史） ==========
        const history1 = await this.redis.lrange(listKey, 0, -1);
        const historyCount1 = history1.length;

        // 发送历史消息（从旧到新）
        history1.forEach((msgStr, index) => {
          const msg = JSON.parse(msgStr);
          if (!sentMessageUids.has(msg.uid)) {
            subscriber.next(msg);
            sentMessageUids.add(msg.uid);
          }
        });

        // ========== 步骤 2: 第二次读取 List，检查新增消息 ==========
        // 等待一段时间（100ms），让订阅期间的写入完成
        await sleep(100);

        const history2 = await this.redis.lrange(listKey, 0, -1);
        const historyCount2 = history2.length;

        if (historyCount2 > historyCount1) {
          // 有新消息加入（窗口期间写入的）
          const newlyAdded = history2.slice(historyCount1);

          for (const msgStr of newlyAdded) {
            const msg = JSON.parse(msgStr);
            // 如果 Pub/Sub 已经发过（在 newMessageBuffer 中），不再发送
            if (!sentMessageUids.has(msg.uid)) {
              subscriber.next(msg);
              sentMessageUids.add(msg.uid);
            }
          }
        }

        // ========== 步骤 3: 处理订阅期间缓存的消息 ==========
        // 注意: 这些消息可能已经通过步骤 2 发送过了，需要去重
        isInitialized = true;

        for (const msg of newMessageBuffer) {
          if (!sentMessageUids.has(msg.uid)) {
            subscriber.next(msg);
            sentMessageUids.add(msg.uid);
          }
        }

        // ========== 步骤 4: 继续监听后续消息 ==========
        // Pub/Sub 订阅已经建立，新消息会直接发送
        // （去重逻辑已在上面处理）

      } catch (error) {
        console.error('Restore failed:', error);
        subscriber.error(error);
      }
    })();

    // 清理函数
    return () => {
      if (pubSubClient) {
        pubSubClient.quit();
      }
    };
  });
}

// 辅助函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### 工作流程图解

```
时间线: ──────────────────────────────────────────────────────>

主连接:
├─ 12:00:00.000 写入消息 A
├─ 12:00:00.100 写入消息 B
├─ 12:00:00.200 写入消息 C (可能丢失)
├─ 12:00:00.300 写入消息 D
└─ 12:00:00.400 写入消息 E

Restore 连接 (二次读取方案):
├─ 12:00:00.050 开始订阅 Pub/Sub (暂存模式开启)
│   └─ buffer = []
│
├─ 12:00:00.100 第一次 lrange (读取 A, B)
│   └─ history1 = [A, B]
│   │   发送 A, B 到客户端
│   │   sentUids = {uidA, uidB}
│
├─ 12:00:00.200 主连接写入 C
│   ├─ List: C 写入成功 (第3条) ✓
│   └─ Pub/Sub: C 发布 → restore 缓存 (未初始化)
│       └─ buffer = [C]
│
├─ 12:00:00.250 等待 100ms (让写入完成)
│
├─ 12:00:00.350 第二次 lrange (读取 A, B, C, D)
│   └─ history2 = [A, B, C, D]
│   │   发现新增: C, D
│   │   发送 C, D 到客户端 (去重后)
│   │   sentUids = {uidA, uidB, uidC, uidD}
│
├─ 12:00:00.400 处理 buffer [C]
│   └─ C 已发送过，跳过 (去重)
│
├─ 12:00:00.450 初始化完成 (isInitialized = true)
│
└─ 12:00:00.500 继续监听 Pub/Sub
    └─ 收到 E (实时消息)
        └─ 发送 E 到客户端

结果: 所有消息 A, B, C, D, E 都被正确接收，无丢失
```

#### 方案优势

1. **可靠性高**: 99.9% 场景下不会丢失消息
   - 只有一次非常小的窗口（第二次读取后、初始化完成前）
   - 但此时 buffer 还在工作，能捕获到

2. **实现相对简单**: 只需要两次 Redis 查询 + Set 去重
   - 第一次查询：获取主要历史
   - 第二次查询：补漏窗口期间的消息
   - Set 去重：避免 Pub/Sub 和 List 重复发送

3. **性能可接受**: 额外一次 Redis 查询
   - 时间复杂度: O(n)（n 是消息数）
   - 网络开销: 多一次 RTT（约 1-5ms）
   - 总延迟增加: 约 50-100ms

#### 注意事项

1. **消息必须有唯一 UID**
   ```typescript
   interface StreamMessage {
     uid: string;  // 必须包含唯一标识
     type: 'message_chunk' | 'tool_call' | 'done';
     data: any;
     metadata?: {
       timestamp: number;
     };
   }
   ```

2. **Set 的大小控制**
   ```typescript
   // sentMessageUids 会一直增长，需要控制
   // 方案 A: 最大值限制
   if (sentMessageUids.size > 10000) {
     // 清理较早的 UID（保留最近 5000）
     const uids = Array.from(sentMessageUids);
     sentMessageUids = new Set(uids.slice(-5000));
   }

   // 方案 B: 定期清理
   setInterval(() => {
     if (sentMessageUids.size > 10000) {
       // 清理逻辑
     }
   }, 60000); // 每 60 秒检查一次
   ```

3. **内存泄漏防护**
   ```typescript
   // 清理函数中清空 Set
   return () => {
     if (pubSubClient) {
       pubSubClient.quit();
     }
     sentMessageUids.clear(); // 清空 Set 释放内存
     newMessageBuffer = [];    // 清空 buffer
   };
   ```

#### 测试验证

```typescript
// 测试场景: 快速刷新
// 主连接发送: 100 条消息
// 在发送第 50 条时刷新页面

describe('restore message loss prevention', () => {
  it('should not lose messages during lrange-subscribe window', async () => {
    // 1. 模拟主连接发送消息
    const messages = generateMessages(100);
    for (const msg of messages.slice(0, 50)) {
      await publishMessage(threadId, msg);
    }

    // 2. 在发送第 50-60 条时触发 restore
    const restorePromise = restoreThread(threadId);

    // 3. 继续发送剩余消息
    for (const msg of messages.slice(50)) {
      await publishMessage(threadId, msg);
    }

    // 4. 收集 restore 接收的消息
    const received = await collectMessages(restorePromise);

    // 5. 验证: 所有 100 条都收到
    expect(received.length).toBe(100);
    expect(received.map(m => m.uid)).toEqual(messages.map(m => m.uid));
  });

  it('should deduplicate messages from pubsub and list', async () => {
    // 测试 Pub/Sub 和 List 重复发送的场景
    // 期望: 即使收到重复，也能去重
  });
});
```

---

## 六、测试验证清单

### 单元测试

#### Redis 操作测试
- [ ] `RPUSH` 和 `LRANGE` 正确性
  ```bash
  RPUSH streaming:thread:test:messages '{"type":"chunk","data":"hello"}'
  LRANGE streaming:thread:test:messages 0 -1
  # 期望: 返回列表包含该消息
  ```

- [ ] `PUBLISH` 和 `SUBSCRIBE`
  ```bash
  # 终端 1
  SUBSCRIBE streaming:thread:test:channel

  # 终端 2
  PUBLISH streaming:thread:test:channel '{"type":"chunk"}'

  # 期望: 终端 1 收到消息
  ```

- [ ] `EXPIRE` 和 TTL
  ```bash
  SETEX streaming:thread:test:status 3600 "in_progress"
  TTL streaming:thread:test:status
  # 期望: 返回值接近 3600
  ```

#### 消息格式化测试
- [ ] `StreamMessage` 序列化/反序列化
- [ ] SSE 格式正确性 (`data: {...}\n\n`)
- [ ] 特殊字符转义（JSON 中的引号、换行）

### 集成测试

#### 场景 A: 正常对话 → Redis 有缓存
```typescript
// 发起对话
POST /api/chat/stream

// 验证 Redis
LRANGE streaming:thread:123:messages 0 -1
// 期望: 包含所有消息

PUBSUB NUMSUB streaming:thread:123:channel
// 期望: 至少 1 个订阅者

GET streaming:thread:123:status
// 期望: "in_progress"
```

#### 场景 B: Restore 读取历史
```typescript
// 等待消息积累后
GET /api/chat/threads/restore?threadId=123

// EventStream 接收:
// 1. 历史消息（按顺序）
data: { "type": "message_chunk", "data": { "text": "First message" } }

data: { "type": "message_chunk", "data": { "text": "Second message" } }

// 2. 新消息（实时）
data: { "type": "message_chunk", "data": { "text": "New message" } }

// 3. 完成事件（可选）
event: done
data: null
```

#### 场景 C: TTL 过期后 restore
```typescript
// 等待 1 小时或手动删除 key
DEL streaming:thread:123:messages

GET /api/chat/threads/restore?threadId=123

// EventStream 接收:
data: { "type": "error", "data": "对话缓存已过期，只能显示已保存的文本消息" }

data: { "type": "message_chunk", "data": { "text": "From DB message 1" } }

data: { "type": "message_chunk", "data": { "text": "From DB message 2" } }

event: done
data: null
```

#### 场景 D: 对话已完成
```typescript
// 主连接结束，发送 DONE
handleProcessedStream → complete()
→ SET status = "completed"
→ PUBLISH control:complete

// Restore 连接新客户端
GET /api/chat/threads/restore?threadId=123

// EventStream 接收:
// 1. 完整历史（包含 DONE）
data: { "type": "message_chunk", "data": { "text": "Last message" } }

data: { "type": "done", "data": null }

// 2. 检查 status 为 completed
// 3. 等待 3 秒（确保无新消息）
// 4. 主动 complete()
event: done
data: null
```

### E2E 测试

#### 测试用例 1: 完整恢复流程
```typescript
// 步骤 1: 用户发起对话
const eventSource1 = chatStream(threadId, callbacks);
// LLM 返回: "Hello" → " World" → "!" → DONE

// 步骤 2: 在中途刷新页面（假设已收到 "Hello World"）
eventSource1.close();

// 步骤 3: 页面加载时调用 restore
const eventSource2 = restoreThread(threadId, restoreCallbacks);

// 预期接收:
// 3.1 历史消息: "Hello" → " World" → "!" （完整）
// 3.2 （如果对话仍在进行）新消息
// 3.3 DONE 事件

// 步骤 4: 前端去重
// 已显示的消息（"Hello World"）不重复显示
// 只显示新消息
// 最终显示完整对话: "Hello World!"
```

#### 测试用例 2: 多端同时恢复
```typescript
// 浏览器标签页 A:
const sourceA = chatStream(threadId, callbacksA);

// 浏览器标签页 B:
const sourceB = restoreThread(threadId, callbacksB);

// 浏览器标签页 C:
const sourceC = restoreThread(threadId, callbacksC);

// LLM 输出: "Test message"

// 标签页 A 接收: "Test message"
// 标签页 B 接收: "Test message" (from Pub/Sub)
// 标签页 C 接收: "Test message" (from Pub/Sub)

// 所有标签页显示一致
```

#### 测试用例 3: 对话完成后 restore
```typescript
// 对话完成（已接收 DONE）
chatStream → 完成 → metadata.streamingStatus = 'completed'

// 任意时间后（<1小时）打开新浏览器
restoreThread(threadId, callbacks);

// 预期:
// - 接收完整历史（包含 DONE）
// - 检查 status = 'completed'
// - 3 秒后自动 complete
// 无新消息接收
```

#### 测试用例 4: 网络中断恢复
```typescript
// 对话进行中:
chatStream → "Message 1" → "Message 2"

// 网络断开或服务器重启
// Redis 中保存: ["Message 1", "Message 2"]

// 网络恢复（<1小时）
restoreThread(threadId, callbacks);

// 预期:
// 恢复历史: "Message 1" → "Message 2"
// 如果对话仍在进行中，继续接收新消息
```

---

## 七、性能与监控

### 性能指标

#### 1. Restore 响应时间
```typescript
// 测量点
const start = Date.now();
const history = await this.redis.lrange(listKey, 0, -1);
const duration = Date.now() - start;

// 报警阈值
if (history.length > 1000 && duration > 1000) {
  logger.warn(`Large history restore: ${history.length} messages in ${duration}ms`);
}
```

#### 2. Pub/Sub 延迟
```typescript
// 发布时添加时间戳
await this.redis.publish(channel, JSON.stringify({
  ...message,
  publishTime: Date.now()
}));

// 订阅时计算延迟
subscribeCallback: (message) => {
  const receiveTime = Date.now();
  const latency = receiveTime - message.publishTime;

  if (latency > 100) {
    metrics.record('pubsub_latency_high', latency);
  }
}
```

#### 3. Redis 内存使用
```bash
# 监控命令
INFO memory          # 总内存使用
INFO keyspace        # key 数量
MEMORY USAGE streaming:thread:*  # 特定 key 大小

# List 长度监控（避免无限增长）
LLEN streaming:thread:123:messages
# 如果 > 1000，考虑优化（分页、压缩、丢弃早期消息）
```

#### 4. 缓存命中率
```typescript
// 记录 restore 请求
const hasCache = await this.redis.exists(listKey);
metrics.increment('restore.request', { hasCache });

// 计算命中率
// rate = (hasCache === 1) / total_requests
```

### 监控 Dashboard 建议

#### Grafana 图表

1. **对话状态分布**
   ```promql
   # 当前 in_progress 的对话数
   sum(thread_status{status="in_progress"})

   # 随时间变化
   rate(thread_status_changes[5m])
   ```

2. **Restore 请求量**
   ```promql
   # 成功率
   sum(rate(restore_request{hasCache="1"}[5m]))

   # 失败率（缓存过期）
   sum(rate(restore_request{hasCache="0"}[5m]))
   ```

3. **Pub/Sub 性能**
   ```promql
   # 平均延迟
   histogram_quantile(0.95, rate(pubsub_latency_bucket[5m]))

   # 每秒消息数
   rate(pubsub_messages_total[5m])
   ```

4. **Redis 内存**
   ```promql
   # streaming key 占用内存
   redis_memory_usage{key="streaming:*"}

   # List 平均长度
   avg(redis_list_length{key="streaming:*:messages"})
   ```

### 日志记录

#### 关键日志点

**对话开始**
```typescript
logger.info({
  event: 'streaming.started',
  threadId: thread.uid,
  userId: thread.userUid,
  timestamp: Date.now()
});
```

**Restore 调用**
```typescript
logger.info({
  event: 'restore.called',
  threadId,
  clientIp: req.ip,
  userAgent: req.headers['user-agent'],
  hasCache: await this.redis.exists(listKey)
});
```

**缓存过期**
```typescript
// 可以监听 Redis key 过期事件（需要配置 notify-keyspace-events）
// 或在 restore 发现 key 不存在时记录
logger.warn({
  event: 'cache.expired',
  threadId,
  lastMessageTime, // 来自数据库最新消息时间
  currentTime: Date.now()
});
```

**异常错误**
```typescript
try {
  await this.redis.publish(channel, message);
} catch (error) {
  logger.error({
    event: 'redis.publish.failed',
    threadId,
    channel,
    error: error.message
  });
}
```

#### 日志格式建议（JSON）
```json
{
  "timestamp": "2025-11-24T10:00:00.000Z",
  "level": "info",
  "event": "streaming.started",
  "threadId": "thread_abc123",
  "userId": "user_456",
  "context": {
    "requestId": "req_789",
    "service": "chat-service"
  }
}
```

---

## 八、后续优化建议

### Phase 1: 基础功能（当前）
- ✅ Redis List + Pub/Sub 双缓存
- ✅ Restore SSE 接口
- ✅ Thread 状态标记

### Phase 2: 增强体验
- [ ] **客户端 ack 机制**: 前端确认收到消息，避免 Pub/Sub 推送但前端未接收
  ```typescript
  // 前端收到消息后发送 ack
  POST /api/chat/ack?threadId=123&messageId=msg_456

  // 服务端标记该消息已被客户端接收
  // 如果没有 ack，考虑重试或记录
  ```

- [ ] **消息持久化到 S3**: 大消息（如文件、图片）不存 Redis，存 S3 + Redis 存引用
  ```typescript
  // 大消息处理
  if (messageSize > 10KB) {
    const s3Key = `streaming/${threadId}/${messageId}`;
    await this.storage.upload(s3Key, message.data);

    // Redis 存储元数据
    await this.redis.rpush(listKey, JSON.stringify({
      ...message,
      data: { s3Key, size: messageSize } // 不存实际内容
    }));
  }
  ```

- [ ] **消息压缩**: List 中消息多时可以压缩存储
  ```typescript
  // 每 100 条消息压缩一次
  if (listLength % 100 === 0) {
    const batch = await this.redis.lrange(listKey, -100, -1);
    const compressed = zlib.deflateSync(batch.join('\n'));
    await this.redis.set(`streaming:${threadId}:batch:${batchId}`, compressed);
  }
  ```

### Phase 3: 高级功能
- [ ] **消息回放**: 支持从指定消息开始 restore
  ```typescript
  GET /api/chat/threads/restore?threadId=123&fromMessageId=msg_10
  // 只返回 msg_10 之后的消息
  ```

- [ ] **多端同步**: 使用 WebSocket 替代 SSE 的双向通信
  - WebSocket 可以主动推送 + 接收客户端确认
  - 更适合多端同步场景

- [ ] **离线支持**: Service Worker 缓存消息，离线时也能查看历史
  ```typescript
  // Service Worker 拦截 restore 请求
  self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/chat/threads/restore')) {
      event.respondWith(
        caches.match(event.request) || fetch(event.request)
      );
    }
  });
  ```

### Phase 4: 性能优化
- [ ] **Redis Cluster**: 分片存储，支持大量并发对话
- [ ] **消息索引**: 为 List 中的消息建立索引，支持快速查询
  ```typescript
  // 使用 RedisJSON 模块
  JSON.SET streaming:thread:123:index $ '{"messages": [...]}'
  JSON.GET streaming:thread:123:index $.messages[?@.type=="done"]
  ```

- [ ] **冷热分离**: 旧对话（>24小时）自动迁移到数据库或冷存储

---

## 九、实施计划

### Week 1: 基础架构
- Day 1-2: Redis 服务扩展（List、Pub/Sub 操作）
- Day 3-4: handleProcessedStream 修改（添加缓存逻辑）
- Day 5: Thread 状态查询接口修改

### Week 2: Restore 接口
- Day 1-2: Restore controller 实现（读取历史 + 订阅 Pub/Sub）
- Day 3-4: 边界情况处理（TTL 过期、complete 丢失等）
- Day 5: 单元测试和集成测试

### Week 3: 前端适配
- Day 1-2: Restore service 方法实现
- Day 3-4: 对话页面集成 restore 逻辑
- Day 5: Thread 列表显示状态标识

### Week 4: 测试与优化
- Day 1-2: E2E 测试（完整流程、多端同步）
- Day 3: 性能测试和压力测试
- Day 4: 监控和日志配置
- Day 5: 文档更新和 Code Review

---

## 十、注意事项

### 1. Redis 配置
```conf
# redis.conf
# 确保启用 notify-keyspace-events（如果需要监听过期事件）
notify-keyspace-events Ex

# Pub/Sub 配置
# 默认无限制，但要注意客户端数量
client-output-buffer-limit pubsub 32mb 8mb 60
```

### 2. 安全考虑
- Restore 接口需要认证（用户只能访问自己的 thread）
- Redis 不要暴露在公网（使用内网连接或 TLS）
- 验证 threadId 格式（防止注入攻击）

### 3. 资源清理
- Restore 连接断开时，必须调用 `pubSub.quit()` 释放连接
- 避免内存泄漏：Observable 清理函数必须清理定时器和 Redis 连接
- 监控 Redis 连接数，防止连接泄露

### 4. 数据一致性
- List 和 Pub/Sub 可能不完全一致（Pub/Sub 不保证持久化）
- 以 List 为准，Pub/Sub 只用于实时通知
- 重要消息（DONE）同时写入 List 和 Pub/Sub

### 5. 版本兼容
- 该功能上线后，旧对话（没有 List 缓存）的 restore 会返回空
- 考虑回填：上线时遍历所有未完成的对话，重建缓存

---

## 附录

### A. 相关文件路径汇总

**后端核心**:
```
apps/server/src/chat/
├── chat.service.ts          # handleProcessedStream
├── chat.controller.ts       # restoreThread
├── message-stream-processor.ts
└── dto/
    ├── sse-message.dto.ts
    └── restore-thread.dto.ts  # 可能需要

apps/server/src/thread/
├── thread.service.ts        # getThreads, getThreadDetail
└── thread.controller.ts     # 确保返回 status

apps/server/src/cache/
├── cache.service.ts         # 现有缓存操作
├── redis.service.ts         # Redis 直连操作
└── utils/
    └── cache-key.util.ts    # 新增缓存键生成
```

**前端核心**:
```
apps/web/service/
└── chat.ts                  # restoreThread 方法

apps/web/hooks/
└── use-chat.ts             # restore 逻辑集成

apps/web/app/chat/
└── [threadId]/
    └── page.tsx            # 页面加载时调用 restore
```

### B. Redis 命令速查

```bash
# List 操作
RPUSH key value [value...]      # 尾部添加
LRANGE key start stop           # 查询范围（0 -1 为全部）
LLEN key                        # 查看长度
EXPIRE key seconds              # 设置 TTL

# Pub/Sub 操作
PUBLISH channel message         # 发布消息
SUBSCRIBE channel [channel...]  # 订阅通道
PUBSUB NUMSUB channel           # 查看订阅数

# Key 操作
EXISTS key                      # 检查存在
DEL key [key...]                # 删除
TTL key                         # 查看剩余 TTL
```

### C. 调试技巧

1. **查看 Redis 实时消息**
   ```bash
   redis-cli
   SUBSCRIBE streaming:thread:123:channel
   # 在另一个窗口发布，看是否收到
   ```

2. **查看当前对话状态**
   ```bash
   # 查看所有 streaming key
   KEYS streaming:thread:*:status

   # 查看特定对话状态
   GET streaming:thread:123:status

   # 查看消息数量
   LLEN streaming:thread:123:messages
   ```

3. **模拟消息丢失**
   ```bash
   # 删除 List 缓存（模拟过期）
   DEL streaming:thread:123:messages

   # 只保留 status（模拟 complete 事件丢失）
   DEL streaming:thread:123:messages
   SET streaming:thread:123:status "completed"
   ```

4. **前端调试**
   ```typescript
   // 打印所有 SSE 事件
eventSource.onmessage = (e) => {
    console.log('SSE message:', JSON.parse(e.data));
  };

  eventSource.addEventListener('done', () => {
    console.log('Stream completed');
  });

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
  };
  ```

---

**文档维护者**: 开发团队
**最后更新**: 2025-11-24
**相关 Issue**: #xxx
