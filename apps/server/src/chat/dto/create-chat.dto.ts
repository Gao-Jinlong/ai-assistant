import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createChatSchema = z.object({
  threadUid: z.string().describe('thread uid'),
  message: z.string().describe('user message'),
});

export class CreateChatDto extends createZodDto(createChatSchema) {}
