import { Test, TestingModule } from '@nestjs/testing';
import { PrismaController } from './prisma.controller';
import { PrismaService } from './prisma.service';

describe('PrismaController', () => {
  let controller: PrismaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrismaController],
      providers: [PrismaService],
    }).compile();

    controller = module.get<PrismaController>(PrismaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
