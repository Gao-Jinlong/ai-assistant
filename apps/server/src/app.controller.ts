import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import * as trpc from '@trpc/server';

@Controller()
export class AppController {
  private readonly t = trpc.initTRPC.create();
  public readonly router: any;

  constructor(private readonly appService: AppService) {
    this.router = this.t.router({
      chat: this.t.procedure
        .input((val: unknown) => {
          if (
            Array.isArray(val) &&
            val.every(
              (item) =>
                typeof item === 'object' &&
                item !== null &&
                'role' in item &&
                'content' in item
            )
          ) {
            return val as { role: 'user' | 'assistant'; content: string }[];
          }
          throw new Error('Invalid input');
        })
        .mutation(async ({ input }) => {
          return this.appService.chat(input);
        }),
    });
  }
}
