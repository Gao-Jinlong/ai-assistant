import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';
import {
  KafkaTopic,
  KafkaMessagePayload,
  KAFKA_CONFIG,
  getThreadTopicName,
} from './kafka.constants';

/**
 * 消费者回调函数类型
 */
export type ConsumerCallback = (
  message: KafkaMessagePayload,
) => Promise<void> | void;

/**
 * 消费者配置接口
 */
interface ConsumerConfig {
  topic: KafkaTopic | string;
  groupId: string;
  callback: ConsumerCallback;
  fromBeginning?: boolean;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private consumerCallbacks: Map<string, ConsumerCallback> = new Map();
  private isConnectedFlag = false;

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>(
      'kafka.brokers',
      'localhost:9092',
    );
    const clientId = this.configService.get<string>(
      'kafka.clientId',
      'ai-assistant-server',
    );

    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(',').map((b) => b.trim()),
      connectionTimeout: KAFKA_CONFIG.PRODUCE_TIMEOUT,
      requestTimeout: KAFKA_CONFIG.PRODUCE_TIMEOUT,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      maxInFlightRequests: 1,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnectedFlag = true;
      this.logger.log('Kafka Producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka Producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka...');

    // 断开所有消费者
    for (const [id, consumer] of this.consumers) {
      try {
        await consumer.disconnect();
        this.logger.debug(`Consumer ${id} disconnected`);
      } catch (error) {
        this.logger.error(`Failed to disconnect consumer ${id}`, error);
      }
    }

    // 断开生产者
    try {
      await this.producer.disconnect();
      this.isConnectedFlag = false;
      this.logger.log('Kafka Producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka Producer', error);
    }
  }

  /**
   * 计算给定 key 应该路由到的分区号
   * 使用与 Kafka 默认分区器相同的 hash 算法
   */
  private calculatePartition(
    key: string,
    numPartitions: number,
  ): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % numPartitions;
  }

  /**
   * 获取给定 key 应该路由到的分区号
   * @param key - 消息 key（如 threadUid）
   * @param numPartitions - 分区数量，默认使用配置值
   * @returns 分区号（0 到 numPartitions-1）
   */
  getPartitionForKey(key: string, numPartitions?: number): number {
    const partitions = numPartitions || KAFKA_CONFIG.DEFAULT_PARTITION_COUNT;
    return this.calculatePartition(key, partitions);
  }

  /**
   * 发送消息到指定主题
   */
  async produceToTopic<T = unknown>(
    topic: KafkaTopic | string,
    payload: KafkaMessagePayload<T>,
    key?: string,
  ): Promise<void> {
    if (!this.isConnectedFlag) {
      throw new Error('Kafka Producer is not connected');
    }

    try {
      const value = JSON.stringify(payload);
      const message: { key?: Buffer | string; value: Buffer } = {
        value: Buffer.from(value),
      };

      if (key) {
        message.key = Buffer.from(key);
      }

      await this.producer.send({
        topic: topic.toString(),
        messages: [message],
      });

      this.logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * 批量发送消息
   */
  async produceBatch<T = unknown>(
    topic: KafkaTopic | string,
    payloads: Array<{ payload: KafkaMessagePayload<T>; key?: string }>,
  ): Promise<void> {
    if (!this.isConnectedFlag) {
      throw new Error('Kafka Producer is not connected');
    }

    try {
      const messages = payloads.map(({ payload, key }) => ({
        key: key ? Buffer.from(key) : undefined,
        value: Buffer.from(JSON.stringify(payload)),
      }));

      await this.producer.send({
        topic: topic.toString(),
        messages,
      });

      this.logger.debug(
        `Batch sent ${messages.length} messages to topic ${topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send batch to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * 订阅主题并消费消息
   */
  async subscribeToTopic(config: ConsumerConfig): Promise<void> {
    const { topic, groupId, callback, fromBeginning = false } = config;
    const consumerId = `${groupId}-${topic}`;

    if (this.consumers.has(consumerId)) {
      this.logger.warn(`Consumer ${consumerId} already exists`);
      return;
    }

    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: KAFKA_CONFIG.CONSUMER_SESSION_TIMEOUT,
        heartbeatInterval: KAFKA_CONFIG.CONSUMER_HEARTBEAT_INTERVAL,
      });

      await consumer.connect();
      await consumer.subscribe({ topic: topic.toString(), fromBeginning });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const payload: KafkaMessagePayload = JSON.parse(
              message.value?.toString() || '{}',
            );

            this.logger.debug(
              `Processing message from topic ${topic}, partition ${partition}`,
            );

            await callback(payload);
          } catch (error) {
            this.logger.error(
              `Failed to process message from topic ${topic}`,
              error,
            );
          }
        },
      });

      this.consumers.set(consumerId, consumer);
      this.consumerCallbacks.set(consumerId, callback);

      this.logger.log(`Consumer ${consumerId} started successfully`);
    } catch (error) {
      this.logger.error(`Failed to start consumer ${consumerId}`, error);
      throw error;
    }
  }

  /**
   * 取消订阅主题
   */
  async unsubscribeFromTopic(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);

    if (!consumer) {
      this.logger.warn(`Consumer ${consumerId} not found`);
      return;
    }

    try {
      await consumer.disconnect();
      this.consumers.delete(consumerId);
      this.consumerCallbacks.delete(consumerId);
      this.logger.log(`Consumer ${consumerId} stopped`);
    } catch (error) {
      this.logger.error(`Failed to stop consumer ${consumerId}`, error);
      throw error;
    }
  }

  /**
   * 获取所有主题列表
   */
  async getTopics(): Promise<string[]> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const topics = await admin.listTopics();
      await admin.disconnect();

      return topics;
    } catch (error) {
      this.logger.error('Failed to list topics', error);
      throw error;
    }
  }

  /**
   * 创建主题
   */
  async createTopic(
    topic: string,
    numPartitions = KAFKA_CONFIG.DEFAULT_PARTITION_COUNT,
    replicationFactor = KAFKA_CONFIG.DEFAULT_REPLICATION_FACTOR,
  ): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions,
            replicationFactor,
          },
        ],
        waitForLeaders: true,
      });

      await admin.disconnect();

      this.logger.log(`Topic ${topic} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * 删除主题
   */
  async deleteTopic(topic: string): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      await admin.deleteTopics({
        topics: [topic],
      });

      await admin.disconnect();

      this.logger.log(`Topic ${topic} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  async isConnected(): Promise<boolean> {
    return this.isConnectedFlag;
  }

  /**
   * 获取消费者状态
   */
  async getConsumerStatus(): Promise<Record<string, string>> {
    const status: Record<string, string> = {};

    for (const [id] of this.consumers) {
      status[id] = 'active';
    }

    return status;
  }

  /**
   * 获取消费者统计信息
   */
  getConsumerStats() {
    return {
      totalConsumers: this.consumers.size,
      consumers: Array.from(this.consumers.keys()),
    };
  }

  /**
   * 创建临时消费者（不在内部 consumers 列表中管理）
   * 用于一次性读取消息的场景，调用者需要负责断开连接
   */
  async createTemporaryConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: KAFKA_CONFIG.CONSUMER_SESSION_TIMEOUT,
      heartbeatInterval: KAFKA_CONFIG.CONSUMER_HEARTBEAT_INTERVAL,
    });

    await consumer.connect();

    this.logger.debug(`Temporary consumer created with groupId: ${groupId}`);
    return consumer;
  }

  /**
   * 为 Thread 创建专用的 Topic
   * Topic 名称：chat-messages-{threadUid}
   * 配置：单分区、副本数 1、保留时间 1 小时
   */
  async createThreadTopic(threadUid: string): Promise<void> {
    const topicName = getThreadTopicName(threadUid);

    try {
      const admin = this.kafka.admin();
      await admin.connect();

      await admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: KAFKA_CONFIG.THREAD_TOPIC_PARTITION_COUNT,
            replicationFactor: KAFKA_CONFIG.THREAD_TOPIC_REPLICATION_FACTOR,
            // 设置 topic 级别的 retention.ms
            configEntries: [
              {
                name: 'retention.ms',
                value: String(KAFKA_CONFIG.THREAD_TOPIC_RETENTION_MS),
              },
            ],
          },
        ],
        waitForLeaders: true,
      });

      await admin.disconnect();

      this.logger.log(
        `Thread topic ${topicName} created successfully (retention: ${KAFKA_CONFIG.THREAD_TOPIC_RETENTION_MS}ms)`,
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

    if (!this.isConnectedFlag) {
      throw new Error('Kafka Producer is not connected');
    }

    try {
      const value = JSON.stringify(payload);

      await this.producer.send({
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
    const consumer = this.kafka.consumer({
      groupId: consumerGroupId,
      sessionTimeout: KAFKA_CONFIG.CONSUMER_SESSION_TIMEOUT,
      heartbeatInterval: KAFKA_CONFIG.CONSUMER_HEARTBEAT_INTERVAL,
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
}
