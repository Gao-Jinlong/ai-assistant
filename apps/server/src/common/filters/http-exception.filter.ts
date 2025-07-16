import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';
import { ResponseUtil } from '../utils/response.util';

/**
 * 全局 HTTP 异常过滤器
 * 统一处理错误响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let code: number;

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
    } else {
      // 处理非 HTTP 异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      code = status;

      // 记录未知错误
      this.logger.error('未知错误:', exception);
    }

    const errorResponse = ResponseUtil.error(code, message);

    response.status(status).json(errorResponse);
  }
}
