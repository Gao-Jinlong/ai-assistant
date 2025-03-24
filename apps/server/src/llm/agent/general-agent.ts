import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { questionTypeSchema } from '../dto/llm.dto';
import { ChatOpenAI } from '@langchain/openai';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { ConversationChain } from 'langchain/chains';
import { LocalHistory } from '../history/local-history';
import { BufferMemory, ConversationSummaryMemory } from 'langchain/memory';
import { Conversation } from '@prisma/client';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class GeneralAgent {
  private systemPrompt =
    PromptTemplate.fromTemplate(`The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

    Current conversation:
    {chat_history}
    Human: {input}
    AI:`);
  constructor(private readonly llmService: LlmService) {
    const llm = this.llmService.llm;
    if (!llm) {
      throw new Error('llm is not defined');
    }

    // this.chain = RunnableSequence.from([
    //   prompt,
    //   new RunnablePassthrough({
    //     func: (input: string) => {
    //       console.log(input);
    //       return input;
    //     },
    //   }),
    //   this.modelWithTools(llm),
    //   new RunnablePassthrough({
    //     func: (input: string) => {
    //       console.log('output', input);
    //       return input;
    //     },
    //   }),
    //   (input) => {
    //     const type = input[0]?.args?.type;
    //     return type ? type : '一般问题';
    //   },
    // ]);
  }

  modelWithTools(model: ChatOpenAI) {
    const modelWithTools = model.bind({
      tools: [
        {
          type: 'function',
          function: {
            name: 'classifyQuestion',
            description: '根据用户的问题进行分类',
            parameters: zodToJsonSchema(questionTypeSchema),
          },
        },
      ],
      tool_choice: {
        type: 'function',
        function: {
          name: 'classifyQuestion',
        },
      },
    });

    return modelWithTools;
  }

  // TODO 梳理 chain 流程，添加 prompt 模板
  async invoke({
    conversation,
    messages,
  }: {
    conversation: Conversation;
    messages: string[];
  }) {
    const history = new LocalHistory(conversation);

    const memory = new BufferMemory({
      memoryKey: 'chat_history',
      returnMessages: true,
      chatHistory: history,
    });

    const llm = this.llmService.llm;
    if (!llm) {
      throw new Error('llm is not defined');
    }

    const chain = new ConversationChain({
      llm,
      prompt: this.systemPrompt, //FIXME prompt 未生效
      memory: memory,
    });

    const userInput = messages.join('\n');
    const response = await chain.call({
      input: userInput,
    });

    return response;
  }
}
