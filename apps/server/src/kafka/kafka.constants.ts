/**
 * Kafka Topics 定义
 */
export enum KafkaTopic {
  // 聊天消息相关
  CHAT_MESSAGES = 'chat.messages',
  CHAT_EVENTS = 'chat.events',

  // 系统日志和事件
  SYSTEM_LOGS = 'system.logs',
  SYSTEM_EVENTS = 'system.events',

  // 异步任务
  ASYNC_TASKS = 'async.tasks',

  // 用户活动
  USER_EVENTS = 'user.events',

  // AI 代理事件
  AGENT_EVENTS = 'agent.events',
}

/**
 * Kafka Consumer Groups
 */
export const KAFKA_CONSUMER_GROUPS = {
  CHAT_SERVICE: 'chat-service-group',
  LOG_SERVICE: 'log-service-group',
  TASK_SERVICE: 'task-service-group',
  NOTIFICATION_SERVICE: 'notification-service-group',
} as const;

/**
 * Kafka 事件类型
 */
export enum KafkaEventType {
  // 聊天事件
  MESSAGE_CREATED = 'message.created',
  MESSAGE_UPDATED = 'message.updated',
  MESSAGE_DELETED = 'message.deleted',
  CHAT_STARTED = 'chat.started',
  CHAT_ENDED = 'chat.ended',

  // 用户事件
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTERED = 'user.registered',

  // 系统事件
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info',

  // Agent 事件
  AGENT_STARTED = 'agent.started',
  AGENT_COMPLETED = 'agent.completed',
  AGENT_FAILED = 'agent.failed',

  // 任务事件
  TASK_CREATED = 'task.created',
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
}

/**
 * Kafka 消息结构接口
 */
export interface KafkaMessagePayload<T = unknown> {
  eventType: KafkaEventType;
  timestamp: number;
  data: T;
  metadata?: {
    userId?: string;
    chatId?: string;
    messageId?: string;
    [key: string]: unknown;
  };
}

/**
 * Kafka 配置常量
 */
export const KAFKA_CONFIG = {
  DEFAULT_PARTITION_COUNT: 10,
  DEFAULT_REPLICATION_FACTOR: 1,
  PRODUCE_TIMEOUT: 30000,
  CONSUMER_SESSION_TIMEOUT: 30000,
  CONSUMER_HEARTBEAT_INTERVAL: 3000,
} as const;
