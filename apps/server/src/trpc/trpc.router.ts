import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { UserRouter } from '@server/user/user.router';
import { AssessmentRouter } from '@server/assessment/assessment.router';
import { NestExpressApplication } from '@nestjs/platform-express';

@Injectable()
export class TrpcRouter {
  public readonly appRouter;
  constructor(
    private readonly trpc: TrpcService,
    private readonly userRouter: UserRouter,
    // private readonly assessmentRouter: AssessmentRouter,
  ) {
    this.appRouter = this.trpc.router({
      user: this.userRouter.router,
      // assessment: this.assessmentRouter.router,
    });
  }

  async applyMiddleware(app: NestExpressApplication) {
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
