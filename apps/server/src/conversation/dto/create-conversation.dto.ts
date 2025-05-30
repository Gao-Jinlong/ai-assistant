import { $Enums } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const conversationSchema = z.object({
  userUid: z.string(),
  /** 存储类型 */
  storageType: z.enum([$Enums.StorageType.LOCAL, $Enums.StorageType.S3]),
  /** 存储路径 */
  storagePath: z.string(),
  /** 标题 */
  title: z.string().optional(),
  /** 消息数量 */
  messageCount: z.number().optional(),
  /** 最后一条消息预览 */
  lastMessage: z.string().optional(),
  /** 状态 */
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']),
  /** 总 token 数 */
  totalTokens: z.number().optional(),
  /** 总延迟(ms) */
  totalLatency: z.number().optional(),
});
export const messageSchema = z.object({
  role: z.enum(['user', 'ai', 'system']),
  content: z.string(),
});

export class MessageDto extends createZodDto(messageSchema) {}

export const createConversationSchema = conversationSchema
  .pick({
    title: true,
  })
  .extend({
    messages: z.array(messageSchema).optional(),
  });

export class CreateConversationDto extends createZodDto(
  createConversationSchema,
) {}
