import { Test, TestingModule } from '@nestjs/testing';
import { ModelManagerService } from './model-manager.service';

describe('ModelManagerService', () => {
  let service: ModelManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModelManagerService],
    }).compile();

    service = module.get<ModelManagerService>(ModelManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
