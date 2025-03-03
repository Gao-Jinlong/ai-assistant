import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱'),
  password: z.string().min(1, '请输入密码'),
});

export class LoginDto extends createZodDto(loginSchema) {}
