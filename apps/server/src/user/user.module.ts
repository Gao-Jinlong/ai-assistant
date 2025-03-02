import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRouter } from './user.router';
import { TrpcModule } from '@server/trpc/trpc.module';
import { TrpcService } from '@server/trpc/trpc.service';
import { AuthModule } from '@server/auth/auth.module';

@Module({
  imports: [forwardRef(() => TrpcModule), forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, UserRouter, TrpcService],
  exports: [UserService, UserRouter],
})
export class UserModule {}
