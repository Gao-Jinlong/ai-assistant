import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { GeneralAgent } from './agent/general-agent';

@Module({
  controllers: [LlmController],
  providers: [LlmService, GeneralAgent],
  exports: [LlmService, GeneralAgent],
})
export class LlmModule {}
