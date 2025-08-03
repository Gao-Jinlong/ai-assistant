import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AuthGuard } from '@server/auth/auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodValidationExceptionFilter } from './filters/zod-validation-exception.filter';

/**
 * 公共模块
 * 提供全局的拦截器、过滤器等
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationExceptionFilter,
    },
  ],
})
export class CommonModule {}
