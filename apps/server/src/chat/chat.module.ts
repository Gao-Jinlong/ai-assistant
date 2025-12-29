import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from '@server/message/message.module';
import { AgentModule } from '@server/agent/agent.module';
import { ThreadModule } from '@server/thread/thread.module';
import { MessageStreamProcessor } from './message-stream-processor';
import { RedisModule } from '@server/redis/redis.module';
import { KafkaModule } from '@server/kafka/kafka.module';
import { ChatKafkaService } from './chat-kafka.service';

/**
 * 对话模块
 *
 * 管理整个对话流程，使用 Redis 实现 SSE 流式传输
 * 依赖 RedisModule 进行消息缓存和实时广播
 */
@Module({
  imports: [
    MessageModule,
    AgentModule,
    ThreadModule,
    RedisModule,
    KafkaModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, MessageStreamProcessor, ChatKafkaService],
  exports: [ChatService, MessageStreamProcessor, ChatKafkaService],
})
export class ChatModule {}
