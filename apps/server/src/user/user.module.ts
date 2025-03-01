import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRouter } from './user.router';
import { TrpcModule } from '@server/trpc/trpc.module';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
  imports: [forwardRef(() => TrpcModule)],
  controllers: [UserController],
  providers: [UserService, UserRouter, TrpcService],
  exports: [UserService, UserRouter],
})
export class UserModule {}
