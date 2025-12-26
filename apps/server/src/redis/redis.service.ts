import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 服务
 * 注意：此服务仅用于缓存功能，Pub/Sub 功能已迁移至 Kafka
 */
@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('redis.url');
      if (!redisUrl) {
        throw new Error('Redis URL is not configured');
      }

      // 主客户端（用于常规缓存操作）
      this.client = new Redis(redisUrl);

      // 等待客户端准备就绪
      await new Promise<void>((resolve, reject) => {
        this.client!.once('ready', () => {
          this.logger.log('Redis cache client ready');
          resolve();
        });
        this.client!.once('error', (error) => {
          this.logger.error('Redis cache client connection error', error);
          reject(error);
        });
      });

      this.logger.log('Redis cache service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis cache service', error);
      throw error;
    }
  }

  /**
   * 获取 Redis 客户端（用于缓存操作）
   */
  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client;
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
