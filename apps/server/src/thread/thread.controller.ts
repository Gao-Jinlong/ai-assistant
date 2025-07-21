import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ThreadService } from './thread.service';

@Controller('thread')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  async createThread(@Body() body: { userId: string }) {
    return this.threadService.createThread(body.userId);
  }

  @Get()
  async getThreads(@Query() query: { userId: string }) {
    // TODO: 获取用户信息，登入校验
    if (!query.userId) {
      throw new BadRequestException('userId is required');
    }
    return this.threadService.getThreads(query.userId);
  }
}
