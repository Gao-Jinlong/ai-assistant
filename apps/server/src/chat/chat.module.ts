import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from '@server/message/message.module';
import { AgentModule } from '@server/agent/agent.module';
import { ThreadModule } from '@server/thread/thread.module';
import { MessageStreamProcessor } from './message-stream-processor';
import { RedisModule } from '@server/redis/redis.module';

/**
 * 对话模块
 *
 * 管理整个对话流程，使用 PostgreSQL + RxJS Subject 实现消息暂存和实时推送
 * 依赖 ThreadModule 进行消息暂存管理
 */
@Module({
  imports: [
    MessageModule,
    AgentModule,
    ThreadModule,
    RedisModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, MessageStreamProcessor],
  exports: [ChatService, MessageStreamProcessor],
})
export class ChatModule {}
