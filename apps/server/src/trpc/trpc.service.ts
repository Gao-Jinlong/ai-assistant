import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '@server/auth/auth.service';
import { ClsService } from 'nestjs-cls';

declare module 'nestjs-cls' {
  interface ClsStore {
    user: JwtPayload | null;
  }
}
@Injectable()
export class TrpcService implements OnModuleInit {
  private trpc = initTRPC.context<{ token: string | null }>().create({
    errorFormatter({ shape, error }) {
      let httpCode: number;
      switch (error.code) {
        case 'UNAUTHORIZED':
          httpCode = 401;
          break;
        case 'FORBIDDEN':
          httpCode = 403;
          break;
        case 'NOT_FOUND':
          httpCode = 404;
          break;
        case 'TIMEOUT':
          httpCode = 408;
          break;
        case 'CONFLICT':
          httpCode = 409;
          break;
        case 'BAD_REQUEST':
          httpCode = 400;
          break;
        default:
          httpCode = 500;
      }
      return {
        code: httpCode,
        data: {},
        message: error.message,
      };
    },
  });

  /**
   * 需要登录的路由
   */
  public procedure = this.trpc.procedure.use(async ({ ctx, next }) => {
    if (!ctx.token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
    }
    const decoded = await this.auth.validateToken(ctx.token);

    this.cls.set('user', decoded);
    return next({ ctx });
  });

  /**
   * 公共路由
   */
  public publicProcedure = this.trpc.procedure;
  public router = this.trpc.router;
  public mergeRouters = this.trpc.mergeRouters;

  constructor(
    private config: ConfigService,
    private auth: AuthService,
    private cls: ClsService,
  ) {}

  onModuleInit() {
    // 添加全局中间件，确保错误格式化正确应用
    this.trpc.middleware(async ({ ctx, next }) => {
      try {
        return await next({ ctx });
      } catch (error) {
        // 确保身份验证错误被正确转换为UNAUTHORIZED
        if (error instanceof UnauthorizedException) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Unauthorized Access',
          });
        }
        throw error;
      }
    });
  }

  async createContext(opts: trpcExpress.CreateExpressContextOptions) {
    const authorization = opts.req.headers.authorization;
    if (!authorization) {
      return {
        token: null,
      };
    }
    const token = authorization.split(' ')[1];

    return {
      token,
    };
  }
}
