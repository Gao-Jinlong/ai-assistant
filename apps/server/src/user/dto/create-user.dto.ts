import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().optional(),
    password: z.string().min(8),
    avatar: z.string().optional(),
  })
  .required();

export class CreateUserDto extends createZodDto(createUserSchema) {}
