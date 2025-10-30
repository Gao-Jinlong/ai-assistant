import { Test, TestingModule } from '@nestjs/testing';
import { ThreadService } from './thread.service';
import { MessageService } from '@server/message/message.service';

describe('ThreadService', () => {
  let service: ThreadService;
  let messageService: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreadService, MessageService],
    }).compile();

    service = module.get<ThreadService>(ThreadService);
    messageService = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
