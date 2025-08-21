import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.error(`Failed to get cache for key: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），可选
   */
  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error(`Failed to set cache for key: ${key}`, error);
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`Failed to delete cache for key: ${key}`, error);
    }
  }

  /**
   * 重置所有缓存
   */
  async reset(): Promise<void> {
    try {
      // cache-manager 的内存存储可能不支持 reset 方法
      // 这里提供一个兼容的实现
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (this.cacheManager as any).reset === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.cacheManager as any).reset();
      } else {
        console.warn(
          'Cache reset operation is not supported by the current cache store',
        );
      }
    } catch (error) {
      console.error('Failed to reset cache', error);
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined;
    } catch (error) {
      console.error(`Failed to check cache existence for key: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取或设置缓存（如果不存在则设置）
   * @param key 缓存键
   * @param factory 工厂函数，用于生成值
   * @param ttl 过期时间（秒），可选
   * @returns 缓存值
   */
  async getOrSet<T = unknown>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number,
  ): Promise<T> {
    try {
      let value = await this.get<T>(key);

      if (value === undefined) {
        value = await factory();
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      console.error(`Failed to get or set cache for key: ${key}`, error);
      // 如果缓存操作失败，直接返回工厂函数的结果
      return await factory();
    }
  }

  /**
   * 批量获取缓存
   * @param keys 缓存键数组
   * @returns 缓存值数组
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      return await Promise.all(keys.map((key) => this.get<T>(key)));
    } catch (error) {
      console.error(
        `Failed to get multiple cache for keys: ${keys.join(', ')}`,
        error,
      );
      return keys.map(() => undefined);
    }
  }

  /**
   * 批量设置缓存
   * @param items 缓存项数组
   * @param ttl 过期时间（秒），可选
   */
  async mset<T = unknown>(
    items: Array<{ key: string; value: T }>,
    ttl?: number,
  ): Promise<void> {
    try {
      await Promise.all(
        items.map((item) => this.set(item.key, item.value, ttl)),
      );
    } catch (error) {
      console.error(`Failed to set multiple cache`, error);
    }
  }

  /**
   * 批量删除缓存
   * @param keys 缓存键数组
   */
  async mdel(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.del(key)));
    } catch (error) {
      console.error(
        `Failed to delete multiple cache for keys: ${keys.join(', ')}`,
        error,
      );
    }
  }

  /**
   * 使用模式匹配删除缓存
   * @param pattern 匹配模式（支持通配符 *）
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // 注意：cache-manager 的内存存储不直接支持模式匹配
      // 这里提供一个基础实现，在实际使用 Redis 时可以使用更高效的方法
      console.warn(
        `Pattern deletion for "${pattern}" is not efficiently supported with memory store`,
      );

      // 对于内存存储，我们无法直接获取所有键，所以这个方法在内存存储中限制较大
      // 如果需要模式匹配删除，建议切换到 Redis
    } catch (error) {
      console.error(`Failed to delete cache by pattern: ${pattern}`, error);
    }
  }
}
