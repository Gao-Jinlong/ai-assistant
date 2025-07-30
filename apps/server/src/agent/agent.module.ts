import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { ModelManagerModule } from '@server/model-manager/model-manager.module';

@Module({
  imports: [ModelManagerModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
