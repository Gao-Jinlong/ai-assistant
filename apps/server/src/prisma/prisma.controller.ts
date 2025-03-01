import { Controller } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class PrismaController {
  constructor(private readonly prismaService: PrismaService) {}
}
