import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from '@server/message/message.module';
import { AgentModule } from '@server/agent/agent.module';
import { ThreadModule } from '@server/thread/thread.module';
import { MessageStreamProcessor } from './message-stream-processor';

/**
 * 对话模块
 *
 * 管理整个对话流程
 */
@Module({
  imports: [MessageModule, AgentModule, ThreadModule],
  controllers: [ChatController],
  providers: [ChatService, MessageStreamProcessor],
  exports: [ChatService, MessageStreamProcessor],
})
export class ChatModule {}
