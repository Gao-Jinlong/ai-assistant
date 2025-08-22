import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CacheEvictKeys } from '../decorators/cache.decorator';
import { Request } from 'express';

/**
 * 缓存失效拦截器
 * 在方法执行后自动清除指定的缓存
 */
@Injectable()
export class CacheEvictInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept<T = unknown>(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> {
    const evictKeys = this.reflector.get<CacheEvictKeys>(
      'cache:evict',
      context.getHandler(),
    );

    if (!evictKeys) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const request = context.switchToHttp().getRequest<Request>();

        // 生成实际的缓存键数组
        const actualKeys =
          typeof evictKeys === 'function' ? evictKeys(request) : evictKeys;

        // 批量删除缓存
        await this.cacheService.mdel(actualKeys);
      }),
    );
  }
}
