import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from '@server/message/message.module';
import { AgentModule } from '@server/agent/agent.module';
import { MessageFormatterService } from './message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';

/**
 * 对话模块
 *
 * 管理整个对话流程
 */
@Module({
  imports: [MessageModule, AgentModule],
  controllers: [ChatController],
  providers: [ChatService, MessageFormatterService, MessageStreamProcessor],
  exports: [ChatService, MessageFormatterService, MessageStreamProcessor],
})
export class ChatModule {}
