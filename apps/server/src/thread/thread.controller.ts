import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Request, Response } from 'express';

@Controller('thread')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  async createThread(@Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.createThread(user.id);
  }

  @Get()
  async getThreads(@Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.getThreads(user.id);
  }

  // mock SSE 消息推送接口
  @Get('messages')
  async sseMessages(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // 简单推送 2 条 mock 消息
    let count = 0;
    const send = () => {
      if (count === 0) {
        res.write(
          `data: ${JSON.stringify({ id: '1', content: 'AI 回复内容1', role: 'ai', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}\n\n`,
        );
        count++;
        setTimeout(send, 1000);
      } else if (count === 1) {
        res.write(
          `data: ${JSON.stringify({ id: '2', content: 'AI 回复内容2', role: 'ai', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}\n\n`,
        );
        count++;
        setTimeout(() => res.end(), 1000);
      }
    };
    send();
  }
}
