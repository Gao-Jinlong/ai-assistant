import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Request } from 'express';

@Controller('thread')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  async createThread(@Body() body: { userId: string }) {
    return this.threadService.createThread(body.userId);
  }

  @Get()
  async getThreads(@Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.getThreads(user.id);
  }
}
