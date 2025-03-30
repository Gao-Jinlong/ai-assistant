import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';

import { ConversationChain } from 'langchain/chains';
import { LocalHistory } from '../history/local-history';
import { BufferMemory } from 'langchain/memory';
import { Conversation } from '@prisma/client';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { TRPCError } from '@trpc/server';
import { ClsService } from 'nestjs-cls';
import { CLS_STORAGE_PROVIDER } from '@server/constant';

@Injectable()
export class GeneralAgent {
  private systemPrompt = `你是一个强大的个人发展助理，你的任务是根据用户的问题给出建议和指导，你可以使用 markdown 格式输出你的回答`;

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

  async invoke({
    conversation,
    messages,
  }: {
    conversation: Conversation;
    messages: BaseMessage[];
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

    if ((await history.getMessages()).length < 1) {
      await history.addMessages([new SystemMessage(this.systemPrompt)]);
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.systemPrompt],
      ...messages.map((msg) => ({
        type: msg._getType(),
        content: msg.content,
      })),
    ]);

    const chain = new ConversationChain({
      llm,
      memory,
      prompt,
    });

    const userInput = messages[messages.length - 1].content;
    const response = await chain.call({ input: userInput });

    return response;
  }
}
