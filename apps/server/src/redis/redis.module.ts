import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

/**
 * Redis Module
 *
 * 提供 Redis 连接和操作服务，支持原生 Redis 数据结构操作
 * 包括：List、Pub/Sub、String、Hash、Set 等
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [RedisModule],
 *   providers: [MyService]
 * })
 * export class MyModule {}
 *
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly redisService: RedisService) {}
 * }
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
