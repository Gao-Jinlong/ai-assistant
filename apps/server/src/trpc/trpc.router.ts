import { INestApplication, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';

@Injectable()
export class TrpcRouter {
  public readonly appRouter;
  constructor(private readonly trpc: TrpcService) {
    this.appRouter = this.trpc.router({
      hello: this.trpc.procedure
        .input(
          z.object({
            name: z.string().optional(),
          }),
        )
        .query(({ input }) => {
          const { name } = input;
          return {
            greeting: `Hello ${name ? name : `Bilbo`}`,
          };
        }),
    });
  }

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
