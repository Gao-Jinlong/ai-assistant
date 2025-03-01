import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from './create-user.dto';
import { z } from 'zod';
export const updateUserSchema = createUserSchema.partial().extend({
  id: z.number(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
