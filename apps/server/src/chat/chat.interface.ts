export enum MESSAGE_ROLE {
  ASSISTANT = 'assistant',
  USER = 'user',
}

export enum MESSAGE_TYPE {
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
