import { Body, Controller, Post } from '@nestjs/common';
import { ThreadService } from './thread.service';

@Controller('thread')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  async createThread(@Body() body: { userId: string }) {
    console.log('🚀 ~ ThreadController ~ createThread ~ body:', body);
    return this.threadService.createThread(body.userId);
  }
}
