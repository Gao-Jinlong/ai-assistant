import { Injectable, Logger } from '@nestjs/common';
import { Consumer } from 'kafkajs';
import { KafkaService } from '@server/kafka/kafka.service';
import { KafkaMessagePayload } from '@server/kafka/kafka.constants';
import {
  getThreadTopicName,
  CHAT_KAFKA_CONFIG,
} from './chat-kafka.constants';

/**
 * Chat/Thread 模块专用的 Kafka 服务
 * 负责 Thread 专用 Topic 的创建、消息发送和消费
 */
@Injectable()
export class ChatKafkaService {
  private readonly logger = new Logger(ChatKafkaService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * 为 Thread 创建专用的 Topic
   * Topic 名称：chat-messages-{threadUid}
   * 配置：单分区、副本数 1、保留时间 1 小时
   */
  async createThreadTopic(threadUid: string): Promise<void> {
    const topicName = getThreadTopicName(threadUid);

    try {
      const admin = this.kafkaService['kafka'].admin();
      await admin.connect();

      await admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: CHAT_KAFKA_CONFIG.THREAD_TOPIC_PARTITION_COUNT,
            replicationFactor:
              CHAT_KAFKA_CONFIG.THREAD_TOPIC_REPLICATION_FACTOR,
            // 设置 topic 级别的 retention.ms
            configEntries: [
              {
                name: 'retention.ms',
                value: String(CHAT_KAFKA_CONFIG.THREAD_TOPIC_RETENTION_MS),
              },
            ],
          },
        ],
        waitForLeaders: true,
      });

      await admin.disconnect();

      this.logger.log(
        `Thread topic ${topicName} created successfully (retention: ${CHAT_KAFKA_CONFIG.THREAD_TOPIC_RETENTION_MS}ms)`,
      );
    } catch (error: unknown) {
      // 如果 topic 已存在，忽略错误
      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === 'TOPIC_ALREADY_EXISTS'
      ) {
        this.logger.debug(`Thread topic ${topicName} already exists`);
        return;
      }
      this.logger.error(`Failed to create thread topic ${topicName}`, error);
      throw error;
    }
  }

  /**
   * 发送消息到 Thread 专用 Topic
   * @param threadUid - Thread UID
   * @param payload - 消息载荷
   */
  async produceToThreadTopic<T = unknown>(
    threadUid: string,
    payload: KafkaMessagePayload<T>,
  ): Promise<void> {
    const topicName = getThreadTopicName(threadUid);

    const isConnected = await this.kafkaService.isConnected();
    if (!isConnected) {
      throw new Error('Kafka Producer is not connected');
    }

    try {
      const value = JSON.stringify(payload);
      const producer = this.kafkaService['producer'];

      await producer.send({
        topic: topicName,
        messages: [
          {
            value: Buffer.from(value),
            // 不需要 key，因为每个 thread topic 只有单分区
          },
        ],
      });

      this.logger.debug(
        `Message sent to thread topic ${topicName} for thread ${threadUid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to thread topic ${topicName}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 为 Thread 创建消费者（从起始位置开始消费）
   * 用于 restore 场景，需要读取 thread 的所有历史消息
   *
   * @param threadUid - Thread UID
   * @param consumerGroupId - 消费者组 ID
   * @returns Consumer 实例，调用者需要负责断开连接
   */
  async createConsumerForThread(
    threadUid: string,
    consumerGroupId: string,
  ): Promise<Consumer> {
    const topicName = getThreadTopicName(threadUid);
    const kafka = this.kafkaService['kafka'];
    const consumer = kafka.consumer({
      groupId: consumerGroupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    try {
      await consumer.connect();

      // 订阅 topic 并从起始位置开始消费
      await consumer.subscribe({
        topic: topicName,
        fromBeginning: true,
      });

      this.logger.debug(
        `Consumer created for thread ${threadUid}, topic ${topicName}, from beginning`,
      );

      return consumer;
    } catch (error) {
      this.logger.error(
        `Failed to create consumer for thread ${threadUid}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 删除 Thread 专用 Topic
   * 用于对话结束后清理临时 topic
   *
   * @param threadUid - Thread UID
   */
  async deleteThreadTopic(threadUid: string): Promise<void> {
    const topicName = getThreadTopicName(threadUid);

    try {
      const admin = this.kafkaService['kafka'].admin();
      await admin.connect();

      await admin.deleteTopics({
        topics: [topicName],
      });

      await admin.disconnect();

      this.logger.log(`Thread topic ${topicName} deleted successfully`);
    } catch (error: unknown) {
      // 如果 topic 不存在，记录但不抛出错误
      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === 'UNKNOWN_TOPIC_OR_PARTITION'
      ) {
        this.logger.debug(`Thread topic ${topicName} does not exist, skipping deletion`);
        return;
      }
      this.logger.error(`Failed to delete thread topic ${topicName}`, error);
      throw error;
    }
  }
}
