import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private pubSubClient: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('redis.url');
      if (!redisUrl) {
        throw new Error('Redis URL is not configured');
      }

      // 主客户端（用于常规操作）
      this.client = new Redis(redisUrl);

      // 订阅客户端（专门用于 Pub/Sub）
      this.pubSubClient = new Redis(redisUrl);

      // 等待两个客户端都准备就绪
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          this.client!.once('ready', () => {
            this.logger.log('Redis client ready');
            resolve();
          });
          this.client!.once('error', (error) => {
            this.logger.error('Redis client connection error', error);
            reject(error);
          });
        }),
        new Promise<void>((resolve, reject) => {
          this.pubSubClient!.once('ready', () => {
            this.logger.log('Redis pub/sub client ready');
            resolve();
          });
          this.pubSubClient!.once('error', (error) => {
            this.logger.error('Redis pub/sub client connection error', error);
            reject(error);
          });
        }),
      ]);

      this.logger.log('Redis service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis service', error);
      throw error;
    }
  }

  /**
   * 获取主 Redis 客户端
   */
  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client;
  }

  /**
   * 获取 Pub/Sub 专用的 Redis 客户端
   */
  getPubSubClient(): Redis {
    if (!this.pubSubClient) {
      throw new Error('Redis pub/sub client is not initialized');
    }
    return this.pubSubClient;
  }

  /**
   * 检查 Redis 是否可用
   */
  get isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * 向 List 右侧推入元素（Redis RPUSH）
   * @param key List 键名
   * @param values 要推入的值（可多个）
   * @returns List 的新长度
   */
  async pushToList(key: string, ...values: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      this.logger.error(`Failed to push to list ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取 List 范围的元素（Redis LRANGE）
   * @param key List 键名
   * @param start 起始索引（默认 0）
   * @param end 结束索引（默认 -1，表示到最后）
   * @returns 元素数组
   */
  async getListRange(key: string, start = 0, end = -1): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.lrange(key, start, end);
    } catch (error) {
      this.logger.error(`Failed to get list range ${key}`, error);
      throw error;
    }
  }

  /**
   * 发布消息到频道（Redis PUBLISH）
   * @param channel 频道名
   * @param message 消息内容
   * @returns 接收到消息的订阅者数量
   */
  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.publish(channel, message);
    } catch (error) {
      this.logger.error(`Failed to publish to channel ${channel}`, error);
      throw error;
    }
  }

  /**
   * 设置键值并设置过期时间（Redis SETEX）
   * @param key 键名
   * @param ttl 过期时间（秒）
   * @param value 值
   * @returns 操作结果
   */
  async setWithTTL(key: string, ttl: number, value: string): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.setex(key, ttl, value);
    } catch (error) {
      this.logger.error(`Failed to set key ${key} with TTL`, error);
      throw error;
    }
  }

  /**
   * 订阅频道（Redis SUBSCRIBE）
   * @param channel 频道名
   * @param handler 消息处理函数，接收 (channel, message) 参数
   */
  subscribe(
    channel: string,
    handler: (channel: string, message: string) => void,
  ): void {
    if (!this.pubSubClient) {
      throw new Error('Redis pub/sub client is not available');
    }

    // 监听 message 事件（所有频道）
    this.pubSubClient.on('message', handler);
  }

  /**
   * 订阅一个或多个频道
   * @param channels 频道名数组
   * @returns Promise
   */
  async subscribeToChannels(...channels: string[]): Promise<void> {
    if (!this.pubSubClient) {
      throw new Error('Redis pub/sub client is not available');
    }
    try {
      await this.pubSubClient.subscribe(...channels);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to channels ${channels.join(', ')}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 取消订阅频道
   * @param channels 频道名数组
   * @returns Promise
   */
  async unsubscribeFromChannels(...channels: string[]): Promise<void> {
    if (!this.pubSubClient) {
      throw new Error('Redis pub/sub client is not available');
    }
    try {
      await this.pubSubClient.unsubscribe(...channels);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from channels ${channels.join(', ')}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 删除键（Redis DEL）
   * @param key 键名
   * @returns 删除的键数量
   */
  async del(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}`, error);
      throw error;
    }
  }

  /**
   * 设置键的过期时间（Redis EXPIRE）
   * @param key 键名
   * @param seconds 过期时间（秒）
   * @returns 是否设置成功
   */
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Failed to set expire for key ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取键的剩余过期时间（Redis TTL）
   * @param key 键名
   * @returns 剩余秒数，-1 表示永不过期，-2 表示键不存在
   */
  async ttl(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis client is not available');
    }
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}`, error);
      throw error;
    }
  }
}
