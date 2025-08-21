import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

/**
 * 缓存拦截器
 * 自动处理方法级别的缓存逻辑
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string | Function>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const args = [request.params, request.query, request.body];
    
    // 生成实际的缓存键
    const actualKey = typeof cacheKey === 'function' 
      ? cacheKey(...args) 
      : cacheKey;

    // 尝试从缓存获取数据
    const cachedResult = await this.cacheService.get(actualKey);
    if (cachedResult !== undefined) {
      return of(cachedResult);
    }

    // 获取 TTL 配置
    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    // 如果缓存中没有数据，执行原方法并缓存结果
    return next.handle().pipe(
      tap(async (result) => {
        if (result !== undefined) {
          await this.cacheService.set(actualKey, result, ttl);
        }
      }),
    );
  }
}