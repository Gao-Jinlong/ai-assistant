import { Module, forwardRef } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TrpcModule } from '@server/trpc/trpc.module';
import { ConversationRouter } from './conversation.router';
import { PrismaModule } from '@server/prisma/prisma.module';
import { StorageModule } from '@server/storage/storage.module';

@Module({
  imports: [forwardRef(() => TrpcModule), StorageModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationRouter],
  exports: [ConversationService, ConversationRouter],
})
export class ConversationModule {}
