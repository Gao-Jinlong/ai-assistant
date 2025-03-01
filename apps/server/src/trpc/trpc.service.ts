import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import { mergeRouters } from '@trpc/server';
import { ZodError } from 'zod';

@Injectable()
export class TrpcService {
  private trpc = initTRPC.create({
    errorFormatter({ shape, error }) {
      // 自定义错误格式
      if (error.cause instanceof ZodError) {
        return {
          ...shape,
          data: {
            ...shape.data,
            statusCode: 400,
            timestamp: new Date().toISOString(),
            zodErrors: error.cause.format(),
            message: '数据验证失败',
          },
        };
      }
      return shape;
    },
  });

  public procedure = this.trpc.procedure;
  public router = this.trpc.router;
  public mergeRouters = this.trpc.mergeRouters;
}
