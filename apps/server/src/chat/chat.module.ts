import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from '@server/message/message.module';
import { AgentModule } from '@server/agent/agent.module';

/**
 * 对话模块
 *
 * 管理整个对话流程
 */
@Module({
  imports: [MessageModule, AgentModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
