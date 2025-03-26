import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';

import { ConversationChain } from 'langchain/chains';
import { LocalHistory } from '../history/local-history';
import { BufferMemory } from 'langchain/memory';
import { Conversation } from '@prisma/client';
import { SystemMessage } from '@langchain/core/messages';

@Injectable()
export class GeneralAgent {
  private systemPrompt = `你是一个强大的个人发展助理，你的任务是根据用户的问题给出建议和指导，你可以使用 markdown 格式输出你的回答`;

  constructor(private readonly llmService: LlmService) {}

  private modelWithTools(model: ChatOpenAI | undefined): ChatOpenAI {
    if (!model) {
      throw new Error('LLM is not initialized');
    }
    return model;
  }

  async invoke({
    conversation,
    messages,
  }: {
    conversation: Conversation;
    messages: string[];
  }) {
    const llm = this.modelWithTools(this.llmService.llm);

    const history = new LocalHistory(conversation);

    if ((await history.getMessages()).length < 1) {
      await history.addMessages([new SystemMessage(this.systemPrompt)]);
    }

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: conversation.uid,
      chatHistory: history,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.systemPrompt],
      ['human', '{input}'],
    ]);

    const chain = new ConversationChain({
      llm,
      memory,
      prompt,
    });

    const userInput = messages.join('\n');
    const response = await chain.call({ input: userInput });

    return response;
  }
}
