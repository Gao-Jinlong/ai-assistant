import { Module } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { ThreadController } from './thread.controller';
import { MessageModule } from '@server/message/message.module';
import { ThreadMessageBufferService } from './thread-message-buffer.service';

@Module({
  imports: [MessageModule],
  controllers: [ThreadController],
  providers: [ThreadService, ThreadMessageBufferService],
  exports: [ThreadService, ThreadMessageBufferService],
})
export class ThreadModule {}
