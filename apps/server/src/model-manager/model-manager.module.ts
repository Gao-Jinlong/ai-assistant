import { Module } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';
import { ModelManagerController } from './model-manager.controller';

@Module({
  controllers: [ModelManagerController],
  providers: [ModelManagerService],
  exports: [ModelManagerService],
})
export class ModelManagerModule {}
