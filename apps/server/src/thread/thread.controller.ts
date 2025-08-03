import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Request, Response } from 'express';
import { interval, map, takeUntil, Subject } from 'rxjs';
import { nanoid } from 'nanoid';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ClsService } from 'nestjs-cls';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateChatDto } from '@server/chat/dto/create-chat.dto';

@Controller('thread')
@ApiTags('thread')
export class ThreadController {
  constructor(
    private readonly threadService: ThreadService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cls: ClsService,
  ) {}

  @Post()
  async createThread(@Req() req: Request) {
    const user = req['jwt'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.createThread(user.id);
  }

  @Get()
  async getThreads(@Req() req: Request) {
    const user = req['jwt'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.getThreads(user.id);
  }

  @Delete(':id')
  async deleteThread(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req['jwt'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.deleteThread(user.id, id);
  }

  // mock SSE 消息推送接口
  // @ApiOperation({
  //   summary: 'SSE 消息推送接口',
  // })
  // @Sse('messages')
  // async sseMessages(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Body() body: CreateChatDto,
  // ) {
  //   const user = req['user'];

  //   const traceId = this.cls.getId();

  //   // 创建一个 Subject 用于控制流的结束
  //   const disconnectSubject = new Subject<void>();

  //   // 监听客户端断开连接事件
  //   res.on('close', () => {
  //     this.logger.info(
  //       `客户端断开连接 - 用户ID: ${user.id}, 时间: ${new Date().toISOString()}`,
  //       {
  //         traceId,
  //       },
  //     );
  //     // 执行清理工作
  //     this.handleClientDisconnect(user.id);
  //     // 结束 Observable 流
  //     disconnectSubject.next();
  //     disconnectSubject.complete();
  //   });
  //   // 监听连接错误
  //   res.on('error', (error) => {
  //     this.logger.error(`SSE 连接错误 - 用户ID: ${user.id}, 错误:`, error, {
  //       traceId,
  //     });
  //     this.handleClientDisconnect(user.id);
  //     disconnectSubject.next();
  //     disconnectSubject.complete();
  //   });
  //   // 监听请求中止
  //   req.on('aborted', () => {
  //     this.logger.info(
  //       `请求被中止 - 用户ID: ${user.id}, 时间: ${new Date().toISOString()}`,
  //       {
  //         traceId,
  //       },
  //     );
  //     this.handleClientDisconnect(user.id);
  //     disconnectSubject.next();
  //     disconnectSubject.complete();
  //   });

  //   this.logger.info(
  //     `客户端连接建立 - 用户ID: ${user.id}, 时间: ${new Date().toISOString()}`,
  //     {
  //       traceId,
  //     },
  //   );

  //   // return interval(1000).pipe(
  //   //   map((_) => ({
  //   //     id: nanoid(),
  //   //     content: nanoid(),
  //   //     createdAt: new Date().toISOString(),
  //   //     role: 'ai',
  //   //   })),
  //   //   // 当客户端断开连接时停止发送消息
  //   //   takeUntil(disconnectSubject),
  //   // );
  // }

  // 处理客户端断开连接的逻辑
  private handleClientDisconnect(userId: string) {
    // 在这里执行清理工作，比如：
    // 1. 清理用户相关的缓存
    // 2. 停止正在进行的任务
    // 3. 记录断开连接的日志
    // 4. 通知其他服务用户已断开连接

    console.log(`正在为用户 ${userId} 执行断开连接清理工作...`);

    // 示例：调用服务层的清理方法
    // this.threadService.cleanupUserSession(userId);
  }

  @Get(':id/messages')
  async getThreadMessages(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req['jwt'];
    if (!user) {
      throw new BadRequestException('user is required');
    }
    return this.threadService.getThreadMessages(user, id);
  }
}
