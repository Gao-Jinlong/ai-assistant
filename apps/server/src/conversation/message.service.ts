import { Injectable } from '@nestjs/common';
import { StorageService } from '@server/storage/storage.service';
import { messageSchema } from './dto/create-conversation.dto';
import { z } from 'zod';

@Injectable()
export class MessageService {
  constructor(private readonly storageService: StorageService) {}

  async encodeMessage(message: z.infer<typeof messageSchema>) {}

  async decodeMessage(message: string) {}
}
