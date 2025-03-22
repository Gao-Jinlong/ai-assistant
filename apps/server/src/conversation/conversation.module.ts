import { Module, forwardRef } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TrpcModule } from '@server/trpc/trpc.module';
import { ConversationRouter } from './conversation.router';
import { PrismaModule } from '@server/prisma/prisma.module';
import { StorageModule } from '@server/storage/storage.module';
import { MessageService } from './message.service';
import { LlmModule } from '@server/llm/llm.module';

@Module({
  imports: [forwardRef(() => TrpcModule), StorageModule, LlmModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationRouter, MessageService],
  exports: [ConversationService, ConversationRouter, MessageService],
})
export class ConversationModule {}
