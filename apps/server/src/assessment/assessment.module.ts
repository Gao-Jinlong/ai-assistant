import { forwardRef, Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { TrpcModule } from '@server/trpc/trpc.module';
import { AssessmentRouter } from './assessment.router';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
  imports: [forwardRef(() => TrpcModule)],
  controllers: [AssessmentController],
  providers: [AssessmentService, AssessmentRouter],
  exports: [AssessmentService, AssessmentRouter],
})
export class AssessmentModule {}
