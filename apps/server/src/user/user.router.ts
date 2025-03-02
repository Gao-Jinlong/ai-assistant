import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { UserService } from './user.service';
import { createUserSchema } from './dto/create-user.dto';
import { z } from 'zod';
import { updateUserSchema } from './dto/update-user.dto';
import { zodToOpenAPI } from 'nestjs-zod';
import { AuthService } from '../auth/auth.service';
import { TRPCError } from '@trpc/server';

const loginSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱'),
  password: z.string().min(1, '请输入密码'),
});

@Injectable()
export class UserRouter {
  public readonly router;

  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    this.router = this.trpc.router({
      create: this.trpc.procedure
        .input(createUserSchema)
        .mutation(({ input }) => {
          return this.userService.create(input);
        }),
      findAll: this.trpc.procedure.query(() => {
        return this.userService.findAll();
      }),
      findOne: this.trpc.procedure.input(z.number()).query(({ input }) => {
        return this.userService.findOne(input);
      }),
      update: this.trpc.procedure
        .input(updateUserSchema)
        .mutation(({ input }) => {
          return this.userService.update(input.id, input);
        }),
      remove: this.trpc.procedure.input(z.number()).mutation(({ input }) => {
        return this.userService.remove(input);
      }),
      login: this.trpc.procedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
          try {
            const result = await this.authService.login(
              input.email,
              input.password,
            );
            return result;
          } catch (error) {
            if (error instanceof UnauthorizedException) {
              throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '邮箱或密码错误',
              });
            }
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: '登录过程中发生错误',
              cause: error,
            });
          }
        }),
    });
  }
}
const openapi = zodToOpenAPI(createUserSchema);
