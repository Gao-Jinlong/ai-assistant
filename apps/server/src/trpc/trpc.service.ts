import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { initTRPC } from '@trpc/server';
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
  private trpc = initTRPC.context<{ user: JwtPayload | null }>().create();

  /**
   * 需要登录的路由
   */
  public procedure = this.trpc.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      // throw new UnauthorizedException();
    }

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
    this.trpc.middleware(async ({ ctx, next }) => {
      return next({ ctx });
    });
  }

  async createContext(opts: trpcExpress.CreateExpressContextOptions) {
    const authorization = opts.req.headers.authorization;
    if (!authorization) {
      return {
        user: null,
      };
    }
    const token = authorization.split(' ')[1];
    const decoded = await this.auth.validateToken(token);

    this.cls.set('user', decoded);

    return {
      user: decoded,
    };
  }
}
