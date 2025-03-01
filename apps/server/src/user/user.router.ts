import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { UserService } from './user.service';
import { createUserSchema } from './dto/create-user.dto';
import { z } from 'zod';
import { updateUserSchema } from './dto/update-user.dto';
import { zodToOpenAPI } from 'nestjs-zod';
@Injectable()
export class UserRouter {
  public readonly router;

  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UserService,
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
    });
  }
}
const openapi = zodToOpenAPI(createUserSchema);
