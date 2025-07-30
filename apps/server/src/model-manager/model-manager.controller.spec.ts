import { Test, TestingModule } from '@nestjs/testing';
import { ModelManagerController } from './model-manager.controller';
import { ModelManagerService } from './model-manager.service';

describe('ModelManagerController', () => {
  let controller: ModelManagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelManagerController],
      providers: [ModelManagerService],
    }).compile();

    controller = module.get<ModelManagerController>(ModelManagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
