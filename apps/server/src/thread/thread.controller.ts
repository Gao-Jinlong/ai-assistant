import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
    return this.threadService.getThreads(query.userId);
  }
}
