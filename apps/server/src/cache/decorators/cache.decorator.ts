import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * 缓存装饰器，用于方法级别的缓存
 * @param key 缓存键或键生成函数
 * @param ttl 过期时间（秒），可选
 */
export const Cacheable = (
  key: string | ((...args: any[]) => string),
  ttl?: number,
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

/**
 * 缓存失效装饰器，用于方法执行后清除相关缓存
 * @param keys 要清除的缓存键数组
 */
export const CacheEvict = (keys: string[] | ((...args: any[]) => string[])) => {
  return SetMetadata('cache:evict', keys);
};

/**
 * 缓存更新装饰器，用于方法执行后更新缓存
 * @param key 要更新的缓存键
 * @param ttl 过期时间（秒），可选
 */
export const CachePut = (
  key: string | ((...args: any[]) => string),
  ttl?: number,
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache:put', key)(target, propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};