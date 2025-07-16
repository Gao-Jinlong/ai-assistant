import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';
import { SKIP_RESPONSE_FORMAT_KEY } from '../decorators/skip-response-format.decorator';
import { ResponseUtil } from '../utils/response.util';

/**
 * 响应格式化拦截器
 * 统一包装所有 API 响应的格式
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // 检查是否需要跳过响应格式化
    const skipFormat = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_FORMAT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipFormat) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是 ApiResponse 格式，直接返回
        if (ResponseUtil.isApiResponse(data)) {
          return data;
        }

        // 否则包装成统一格式
        return ResponseUtil.success(data, '请求成功');
      }),
    );
  }
}
