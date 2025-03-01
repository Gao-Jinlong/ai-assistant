import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { UserRouter } from '@server/user/user.router';

@Injectable()
export class TrpcRouter {
  public readonly appRouter;
  constructor(
    private readonly trpc: TrpcService,
    private readonly userRouter: UserRouter,
  ) {
    this.appRouter = this.trpc.router({
      user: this.userRouter.router,
    });
  }

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/api`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
