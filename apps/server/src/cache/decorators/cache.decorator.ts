import { SetMetadata, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { CacheEvictInterceptor } from '../interceptors/cache-evict.interceptor';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export type CacheKey = string | ((request: Request) => string);
export type CacheEvictKeys = string[] | ((request: Request) => string[]);
/**
 * 缓存装饰器，用于方法级别的缓存
 * @param key 缓存键或键生成函数
 * @param ttl 过期时间（秒），可选
 */
export const Cacheable = (key: CacheKey, ttl?: number) => {
  const interceptor = UseInterceptors(CacheInterceptor);
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return interceptor(target, propertyKey, descriptor);
  };
};

/**
 * 缓存失效装饰器，用于方法执行后清除相关缓存
 * @param keys 要清除的缓存键数组
 */
export const CacheEvict = (keys: CacheEvictKeys) => {
  const interceptor = UseInterceptors(CacheEvictInterceptor);
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata('cache:evict', keys)(target, propertyKey, descriptor);
    return interceptor(target, propertyKey, descriptor);
  };
};

/**
 * 缓存更新装饰器，用于方法执行后更新缓存
 * @param key 要更新的缓存键
 * @param ttl 过期时间（秒），可选
 */
export const CachePut = (
  key: string | ((...args: unknown[]) => string),
  ttl?: number,
) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata('cache:put', key)(target, propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};
