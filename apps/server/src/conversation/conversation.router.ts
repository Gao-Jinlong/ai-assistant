import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';

@Injectable()
export class ConversationRouter {
  constructor(private readonly trpc: TrpcService) {}
}
