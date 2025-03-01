import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    /** 邮箱 */
    email: z.string().email(),
    /** 用户名 */
    name: z.string().optional(),
    /** 密码 */
    password: z.string().min(8),
    /** 头像 */
    avatar: z.string().optional(),
  })
  .required();

export class CreateUserDto extends createZodDto(createUserSchema) {}
