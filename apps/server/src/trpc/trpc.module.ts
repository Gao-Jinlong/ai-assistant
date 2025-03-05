import { forwardRef, Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { UserModule } from '@server/user/user.module';
import { AuthModule } from '@server/auth/auth.module';

@Global()
@Module({
  imports: [forwardRef(() => UserModule), AuthModule],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
