import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createThreadSchema = z.object({});

export class CreateThreadDto extends createZodDto(createThreadSchema) {}
