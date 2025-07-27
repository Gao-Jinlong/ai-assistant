import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cls: ClsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const traceId = this.cls.getId();
    const startTime = Date.now();

    // 记录请求开始
    this.logger.info('Request started', {
      traceId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.body,
      headers: req.headers,
      query: req.query,
      params: req.params,
    });

    // 监听响应结束事件，记录请求完成信息
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.info('Request completed', {
        traceId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  }
}
