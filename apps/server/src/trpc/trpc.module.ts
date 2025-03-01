import { forwardRef, Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { UserModule } from '@server/user/user.module';

@Global()
@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
