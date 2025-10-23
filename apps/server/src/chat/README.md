# 消息格式统一架构

## 概述

本模块实现了统一的 SSE 消息格式体系，支持文本消息、工具调用、思考过程等多种消息类型，并包含完整的元数据和结构化错误处理。

## 架构设计

### 核心组件

1. **MessageFormatterService** - 消息格式化服务
   - 负责将 LangChain 的消息块转换为统一格式
   - 提取和计算元数据
   - 格式化错误信息
   - SSE 序列化

2. **MessageStreamProcessor** - 消息流处理器
   - 从 agent stream 中提取不同类型的消息
   - 识别工具调用、文本内容等
   - 生成消息开始/结束事件
   - 收集统计信息

3. **ChatService** - 对话服务（重构）
   - 使用新的消息流处理器
   - 统一的错误处理
   - 向后兼容

### 消息类型系统

```typescript
enum MESSAGE_TYPE {
  // 内容相关
  MESSAGE_CHUNK = 'message_chunk', // 文本消息块
  MESSAGE_START = 'message_start', // 消息开始(可包含元数据)
  MESSAGE_END = 'message_end', // 消息结束(可包含统计信息)

  // 工具调用相关
  TOOL_CALL_START = 'tool_call_start', // 工具调用开始
  TOOL_CALL_CHUNK = 'tool_call_chunk', // 工具调用参数块
  TOOL_CALL_END = 'tool_call_end', // 工具调用结束
  TOOL_RESULT = 'tool_result', // 工具执行结果

  // 思考过程相关(预留)
  REASONING_START = 'reasoning_start', // 思考开始
  REASONING_CHUNK = 'reasoning_chunk', // 思考过程块
  REASONING_END = 'reasoning_end', // 思考结束

  // 系统消息
  ERROR = 'error', // 错误消息
  DONE = 'done', // 流结束
  PING = 'ping', // 心跳(可选)
}
```

### 统一消息格式

所有 SSE 消息遵循统一的顶层结构：

```typescript
interface SSEMessage<T = unknown> {
  type: MESSAGE_TYPE; // 消息类型
  data: T; // 消息数据(根据type不同而不同)
  metadata?: MessageMetadata; // 元数据(可选)
  error?: StructuredError; // 错误信息(仅type=ERROR时)
}
```

## 使用示例

### 基本用法

```typescript
// 在 ChatService 中使用
const processedStream = this.messageStreamProcessor.processStream(
  stream,
  model,
);
await this.handleProcessedStream(processedStream, res, thread);
```

### 消息格式化

```typescript
// 格式化文本消息
const message = this.messageFormatter.formatMessageChunk(chunk, metadata);

// 格式化工具调用
const toolCall = this.messageFormatter.formatToolCallStart(toolCall, metadata);

// 格式化错误
const error = this.messageFormatter.formatError(error, ErrorCode.STREAM_ERROR);
```

### SSE 序列化

```typescript
// 序列化为 SSE 格式
const sseData = this.messageFormatter.serializeToSSE(message);
res.write(sseData);
```

## 消息流示例

```
// 1. 消息开始
data: {"type":"message_start","data":{"role":"assistant","model":"gpt-4"},"metadata":{"timestamp":1234567890,"groupId":"abc123"}}

// 2. 文本块
data: {"type":"message_chunk","data":{"content":"你好","role":"assistant"},"metadata":{"messageId":"msg1","timestamp":1234567891}}

// 3. 工具调用开始
data: {"type":"tool_call_start","data":{"toolCallId":"tool1","toolName":"search"},"metadata":{"timestamp":1234567892}}

// 4. 工具参数块
data: {"type":"tool_call_chunk","data":{"toolCallId":"tool1","argsChunk":"{\"query\":\"","index":0},"metadata":{"timestamp":1234567893}}

// 5. 工具调用结束
data: {"type":"tool_call_end","data":{"toolCallId":"tool1","toolName":"search","args":{"query":"test"}},"metadata":{"timestamp":1234567894}}

// 6. 工具结果
data: {"type":"tool_result","data":{"toolCallId":"tool1","toolName":"search","result":[...]},"metadata":{"timestamp":1234567895}}

// 7. 更多文本块
data: {"type":"message_chunk","data":{"content":"根据搜索结果...","role":"assistant"},"metadata":{"messageId":"msg2","timestamp":1234567896}}

// 8. 消息结束
data: {"type":"message_end","data":{"role":"assistant","finishReason":"stop","usage":{"promptTokens":100,"completionTokens":50,"totalTokens":150}},"metadata":{"timestamp":1234567897,"latency":500}}

// 9. 流结束
data: {"type":"done","data":{},"metadata":{"timestamp":1234567898}}
```

## 优势

1. **可扩展性**: 清晰的类型系统，易于添加新的消息类型
2. **可维护性**: 职责分离，格式化和业务逻辑解耦
3. **可观测性**: 完整的元数据支持监控和调试
4. **健壮性**: 结构化错误处理，便于错误追踪
5. **向后兼容**: 保留旧接口，逐步迁移

## 文件结构

```
src/chat/
├── chat.service.ts                    # 主服务(重构)
├── chat.interface.ts                  # 消息类型定义(扩展)
├── message-formatter.service.ts       # 消息格式化服务
├── message-stream-processor.ts        # 流处理器
├── dto/
│   ├── sse-message.dto.ts             # SSE消息DTO
│   └── message-metadata.dto.ts        # 元数据DTO
└── README.md                          # 本文档
```

## 迁移指南

### 从旧版本迁移

1. 更新前端类型定义
2. 使用新的 `SSEMessage` 接口替代 `MessageChunkDto`
3. 处理新的消息类型（如 `MESSAGE_START`, `MESSAGE_END` 等）
4. 利用元数据进行监控和调试

### 向后兼容

- 保留 `MessageChunkDto` 接口但标记为 `@deprecated`
- 旧的 `MESSAGE_TYPE` 枚举仍然可用
- 逐步迁移，不强制立即更新所有代码

## 测试

运行测试以验证实现：

```bash
npm run test
npm run build
```

## 贡献

在添加新的消息类型时，请确保：

1. 在 `MESSAGE_TYPE` 枚举中添加新类型
2. 在 `sse-message.dto.ts` 中定义对应的数据接口
3. 在 `MessageFormatterService` 中添加格式化方法
4. 在 `MessageStreamProcessor` 中添加处理逻辑
5. 更新文档和测试
