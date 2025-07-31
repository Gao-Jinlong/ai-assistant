import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { ModelManagerModule } from '@server/model-manager/model-manager.module';
import { MessageModule } from '@server/message/message.module';

@Module({
  imports: [ModelManagerModule, MessageModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
