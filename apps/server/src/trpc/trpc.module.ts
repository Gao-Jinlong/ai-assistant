import { forwardRef, Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { UserModule } from '@server/user/user.module';
import { AuthModule } from '@server/auth/auth.module';
import { AssessmentModule } from '@server/assessment/assessment.module';
import { DiscoveryModule } from '@nestjs/core';
import { ConversationModule } from '@server/conversation/conversation.module';

@Global()
@Module({
  imports: [
    forwardRef(() => UserModule),
    // forwardRef(() => AssessmentModule),
    AuthModule,
    ConversationModule,
    DiscoveryModule,
  ],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
