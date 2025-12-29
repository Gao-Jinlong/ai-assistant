/**
 * Chat/Thread 模块专用的 Kafka 常量
 * 这些常量和函数专门用于 Thread 专用 Topic 的管理
 */

/**
 * Thread Topic 配置常量
 */
export const CHAT_KAFKA_CONFIG = {
  THREAD_TOPIC_PARTITION_COUNT: 1, // 每个 thread topic 单分区
  THREAD_TOPIC_REPLICATION_FACTOR: 1,
  THREAD_TOPIC_RETENTION_MS: 60 * 60 * 1000, // 1小时保留期
} as const;

/**
 * Thread Topic 命名模板
 */
export const THREAD_TOPIC_PREFIX = 'chat-messages-';

/**
 * 获取 Thread 专用 Topic 名称
 * @param threadUid Thread UID
 * @returns Topic 名称，格式：chat-messages-{threadUid}
 */
export function getThreadTopicName(threadUid: string): string {
  return `${THREAD_TOPIC_PREFIX}${threadUid}`;
}

/**
 * 环境变量配置说明：
 *
 * kafka.autoDeleteThreadTopic:
 *   - 类型：boolean
 *   - 默认值：true
 *   - 说明：对话结束后是否自动删除 Thread 专用 Topic
 *   - 用法：在 .env 文件中设置 `KAFKA_AUTO_DELETE_THREAD_TOPIC=true` 或 `false`
 *
 * 注意：即使 topic 被删除，消息仍会保留在数据库中，不会丢失
 */
