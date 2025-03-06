import { TrpcService } from '@server/trpc/trpc.service';
import { AssessmentService } from './assessment.service';
import { createAssessmentSchema } from './dto/assessment.dto';

export class AssessmentRouter {
  public readonly router;

  constructor(
    private readonly trpc: TrpcService,
    private readonly assessmentService: AssessmentService,
  ) {
    this.router = this.trpc.router({
      create: this.trpc.procedure
        .input(createAssessmentSchema)
        .mutation(({ input }) => {
          return this.assessmentService.create(input);
        }),
    });
  }
}
