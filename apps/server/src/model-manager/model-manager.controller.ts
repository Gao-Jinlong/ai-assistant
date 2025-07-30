import { Controller } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';

@Controller('model-manager')
export class ModelManagerController {
  constructor(private readonly modelManagerService: ModelManagerService) {}
}
