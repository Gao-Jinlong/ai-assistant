import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    /** 邮箱 */
    email: z.string().email(),
    /** 密码 */
    password: z.string().min(8),
  })
  .required();

export class CreateUserDto extends createZodDto(createUserSchema) {}
