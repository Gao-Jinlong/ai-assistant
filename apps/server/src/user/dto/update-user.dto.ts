import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z
  .object({
    id: z.number(),
    /** 邮箱 */
    email: z.string().email().optional(),
    /** 密码 */
    password: z.string().min(8).optional(),
    /** 姓名 */
    name: z.string().min(1).max(50).optional(),
    /** 头像URL */
    avatar: z.string().url().optional(),
  })
  .required({ id: true });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
