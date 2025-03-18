import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { createConversationSchema } from './dto/create-conversation.dto';
import { ConversationService } from './conversation.service';
import { z } from 'zod';

@Injectable()
export class ConversationRouter {
  public readonly router;
  constructor(
    private readonly trpc: TrpcService,
    private readonly conversationService: ConversationService,
  ) {
    this.router = this.trpc.router({
      create: this.trpc.procedure
        .input(createConversationSchema)
        .mutation(async ({ input }) => {
          return this.conversationService.create(input);
        }),
      remove: this.trpc.procedure
        .input(z.string())
        .mutation(async ({ input }) => {
          return this.conversationService.remove(input);
        }),
      findAll: this.trpc.procedure.query(async () => {
        return this.conversationService.findAll();
      }),
      findOne: this.trpc.procedure
        .input(z.string())
        .query(async ({ input }) => {
          return this.conversationService.findOne(input);
        }),
    });
  }
}
