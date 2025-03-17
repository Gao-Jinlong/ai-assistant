import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { UserRouter } from '@server/user/user.router';
import { AssessmentRouter } from '@server/assessment/assessment.router';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClsMiddleware } from 'nestjs-cls';
import { DiscoveryService } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ConversationRouter } from '@server/conversation/conversation.router';

const TRPC_ROUTER = Symbol('trpc_router')
export const TRPCRouter = (): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(TRPC_ROUTER, true, target)
  }
}

@Injectable()
export class TrpcRouter {
  public readonly appRouter;
  constructor(
    private readonly trpc: TrpcService,
    private readonly userRouter: UserRouter,
    private readonly conversationRouter: ConversationRouter,
    // private readonly assessmentRouter: AssessmentRouter,
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector
  ) {
    this.appRouter = this.trpc.router({
      user: this.userRouter.router,
      conversation: this.conversationRouter.router,
      // assessment: this.assessmentRouter.router,
    });
  }
  // TODO: 自动注册路由
  // private createAppRouter() {
  //   const p = this.discovery.getProviders()
  //   const routers = p
  //     .filter((provider) => {
  //       try {
  //         return this.reflector.get(TRPC_ROUTER, provider.metatype)
  //       } catch {
  //         return false
  //       }
  //     })
  //     .map(({ instance }) => instance.router)
  //     .filter((router) => {
  //       if (!router) {
  //         // this.logger.warn('missing router.')
  //       }

  //       return !!router
  //     })

  //   const appRouter = this.trpc.mergeRouters(...(routers as any as Routers))

  //   return appRouter
  // }


  async applyMiddleware(app: NestExpressApplication) {
    // 使用 cls 中间件
    app.use(new ClsMiddleware({}).use);

    app.use(
      `/api`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) => this.trpc.createContext(opts),
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
