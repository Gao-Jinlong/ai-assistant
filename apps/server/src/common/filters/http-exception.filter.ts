import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';
import { ResponseUtil } from '../utils/response.util';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';

/**
 * 全局 HTTP 异常过滤器
 * 统一处理错误响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly cls: ClsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let code: number;

    const traceId = this.cls.getId();

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as { message?: string }).message || '请求失败';
      } else {
        message = '请求失败';
      }

      code = status;

      this.logger.error(`HTTP 异常: ${code} ${message}`, {
        traceId,
      });
    } else {
      // 处理非 HTTP 异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      code = status;

      // 记录未知错误
      this.logger.error(`未知错误: ${exception}`, {
        traceId,
      });
    }

    const errorResponse = ResponseUtil.error(code, message);

    response.status(status).json(errorResponse);
  }
}
