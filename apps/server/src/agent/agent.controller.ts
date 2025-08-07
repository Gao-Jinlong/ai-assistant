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
}
