import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAssessmentDto) {
    return this.prisma.db.assessment.create({
      data: {
        uid: '',
        ...data,
      },
    });
  }
}
