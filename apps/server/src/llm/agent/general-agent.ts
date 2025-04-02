import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';

import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { Conversation } from '@prisma/client';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { TRPCError } from '@trpc/server';
import { ClsService } from 'nestjs-cls';
import { CLS_STORAGE_PROVIDER } from '@server/constant';

@Injectable()
export class GeneralAgent {
  private systemPrompt = `你是一个强大的个人发展助理，你的任务是根据用户的问题给出建议和指导
  你可以使用 markdown 格式输出你的回答
  `;
  private historyPrompt = `以下是用户的对话历史，你可以使用其中的信息来给出回答，是否使用历史信息由你决定：
  <history>
  {history}
  </history>
  `;
  private humanPrompt = `以下是用户的输入：
  <input>
  {input}
  </input>
  `;

  constructor(
    private readonly llmService: LlmService,
    private readonly cls: ClsService,
  ) {}

  private modelWithTools(model: ChatOpenAI | undefined): ChatOpenAI {
    if (!model) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'LLM is not initialized',
      });
    }
    return model;
  }

  // TODO: 重写调用方式，实现连续对话的能力
  async invoke({
    conversation,
    message,
  }: {
    conversation: Conversation;
    message: BaseMessage;
  }) {
    const llm = this.modelWithTools(this.llmService.llm);
    const history = this.cls.get(CLS_STORAGE_PROVIDER);

    if (!history) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Storage provider is not initialized',
      });
    }

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: conversation.uid,
      chatHistory: history,
    });

    // 创建提示模板
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.systemPrompt],
      ['human', this.historyPrompt],
      ['human', '{input}'],
    ]);

    const chain = new ConversationChain({
      llm,
      memory,
      prompt,
    });

    const response = await chain.call({
      input: message.content,
    });

    return response;
  }
}
