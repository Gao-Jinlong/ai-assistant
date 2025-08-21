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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const evictKeys = this.reflector.get<string[] | Function>(
      'cache:evict',
      context.getHandler(),
    );

    if (!evictKeys) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const request = context.switchToHttp().getRequest();
        const args = [request.params, request.query, request.body];
        
        // 生成实际的缓存键数组
        const actualKeys = typeof evictKeys === 'function' 
          ? evictKeys(...args) 
          : evictKeys;

        // 批量删除缓存
        await this.cacheService.mdel(actualKeys);
      }),
    );
  }
}