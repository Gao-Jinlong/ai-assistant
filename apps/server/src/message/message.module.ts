import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageFormatterService } from './message-formatter.service';

@Module({
  controllers: [MessageController],
  providers: [MessageService, MessageFormatterService],
  exports: [MessageService, MessageFormatterService],
})
export class MessageModule {}
