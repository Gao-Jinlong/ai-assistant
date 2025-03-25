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
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

@Injectable()
export class GeneralAgent {
  private systemPrompt = `你是一个强大的个人发展助理, 你的任务是根据用户的问题给出建议和指导`;
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
    const llm = this.llmService.llm;
    if (!llm) {
      throw new Error('llm is not defined');
    }

    const history = new LocalHistory(conversation);

    const memory = new BufferMemory({
      memoryKey: conversation.uid,
      returnMessages: true,
      chatHistory: history,
    });

    if ((await history.getMessages()).length < 1) {
      await history.addMessages([new SystemMessage(this.systemPrompt)]);
    }

    const chain = new ConversationChain({
      llm,
      memory: memory,
    });

    const userInput = messages.join('\n');
    const response = await chain.call({ input: userInput });

    return response;
  }
}
