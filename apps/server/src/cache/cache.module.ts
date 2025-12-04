import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import Keyv from 'keyv';
import { CacheableMemory } from 'cacheable';
import { createKeyv } from '@keyv/redis';
import { UserCacheExample } from './examples/user-cache.example';

/**
 * Cache Module
 *
 * 提供通用缓存服务，使用内存作为存储后端
 * 适用于需要高速缓存但不需要持久化的场景
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CacheModule],
 *   providers: [MyService]
 * })
 * export class MyModule {}
 * ```
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('cache.ttl', 300), // 默认 5 分钟
        max: configService.get('cache.max', 1000), // 最大缓存项数
        isGlobal: true,
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
          }),
          createKeyv({
            url: configService.get('redis.url'),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CacheController, UserCacheExample],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
