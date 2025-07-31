import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { AgentService } from './agent.service';
import { BaseMessage } from '@langchain/core/messages';
import { Response } from 'express';
import { ChatRequestDto } from './dto/chat-request.dto';

interface ChatRequest {
  message: string;
  history?: BaseMessage[];
}

interface ChatResponse {
  response: string;
  messages: BaseMessage[];
}

interface ChatWithGraphResponse extends ChatResponse {
  metadata: {
    modelUsed: string;
    processingSteps: string[];
  };
}

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('health')
  health() {
    return { status: 'ok', message: 'Agent service is running' };
  }

  @Get('test')
  async test() {
    const result = await this.agentService.runBlock('你好');
    return { result };
  }

  @Post('chat/block')
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponse> {
    const { message } = request;

    if (!message || message.trim() === '') {
      throw new Error('消息内容不能为空');
    }

    const result = await this.agentService.runBlock(message);
    return result;
  }

  @Post('chat/stream')
  async chatStream(@Body() request: ChatRequest, @Res() res: Response) {
    const { message } = request;

    if (!message || message.trim() === '') {
      res.status(400).json({ error: '消息内容不能为空' });
      return;
    }

    try {
      // 设置 SSE 头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      const stream = await this.agentService.runStream(message);

      stream.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(`data: ${chunk}\n\n`);
          },
        }),
      );

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }

  @Post('chat/graph')
  async chatWithGraph(
    @Body() request: ChatRequest,
  ): Promise<ChatWithGraphResponse> {
    const { message, history = [] } = request;

    if (!message || message.trim() === '') {
      throw new Error('消息内容不能为空');
    }

    const result = await this.agentService.chatWithGraph(message, history);
    return result;
  }
}
