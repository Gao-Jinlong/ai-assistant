import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ClsService } from 'nestjs-cls';
import { ApiTags } from '@nestjs/swagger';

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
    return this.threadService.createThread(user.uid);
  }

  @Get()
  async getThreads(@Req() req: Request) {
    const user = req['jwt'];
    return this.threadService.getThreads(user.uid);
  }

  @Delete(':id')
  async deleteThread(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req['jwt'];
    return this.threadService.deleteThread(user.uid, id);
  }

  @Get(':id/messages')
  async getThreadMessages(@Req() req: Request, @Param('id') id: string) {
    const user = req['jwt'];
    return this.threadService.getThreadMessages(user, id);
  }

  @Get(':id/detail')
  async getThreadDetail(@Req() req: Request, @Param('id') id: string) {
    const user = req['jwt'];
    return this.threadService.getThreadDetail(user.uid, id);
  }
}
