import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import {
  createConversationSchema,
  messageSchema,
} from './dto/create-conversation.dto';
import { ConversationService } from './conversation.service';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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
      findAll: this.trpc.procedure.mutation(async () => {
        return this.conversationService.findAll();
      }),
      findOne: this.trpc.procedure
        .input(z.string())
        .mutation(async ({ input }) => {
          return this.conversationService.findOne(input);
        }),
      getMessages: this.trpc.procedure
        .input(z.string())
        .mutation(async ({ input }) => {
          const conversation = await this.conversationService.findOne(input);
          if (!conversation) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conversation not found',
            });
          }
          return this.conversationService.getMessages(input);
        }),

      appendMessage: this.trpc.procedure
        .input(
          z.object({
            conversationUid: z.string(),
            message: messageSchema,
          }),
        )
        .mutation(async ({ input }) => {
          return this.conversationService.appendMessage(
            input.conversationUid,
            input.message,
          );
        }),
    });
  }
}
