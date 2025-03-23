import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
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
  private chain: RunnableSequence;
  constructor(private readonly llmService: LlmService) {
    const llm = this.llmService.llm;
    if (!llm) {
      throw new Error('llm is not defined');
    }
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `仔细思考，你有充足的时间进行严谨的思考，然后对用户的问题进行分类，
        当你无法分类到特定分类时，可以分类到 "一般问题"`,
      ],
      ['user', '{input}'],
    ]);

    this.chain = RunnableSequence.from([
      prompt,
      new RunnablePassthrough({
        func: (input: string) => {
          console.log(input);
          return input;
        },
      }),
      this.modelWithTools(llm),
      new RunnablePassthrough({
        func: (input: string) => {
          console.log('output', input);
          return input;
        },
      }),
      (input) => {
        const type = input[0]?.args?.type;
        return type ? type : '一般问题';
      },
    ]);
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

  // TODO 使用接口抽象 history
  async invoke({
    conversation,
    messages,
  }: {
    conversation: Conversation;
    messages: string[];
  }) {
    const history = new LocalHistory({
      sessionId: conversation.uid,
      dir: conversation.storagePath,
    });

    // TODO 梳理对话流程，新建对话，新建记忆，模型调用，返回内容
    await history.addMessages([
      new HumanMessage('Hi, 我叫小明'),
      new AIMessage('你好'),
    ]);

    const memory = new BufferMemory({
      chatHistory: history,
    });
    const conversationChain = new ConversationChain({
      llm: this.llmService.llm!,
      memory: memory,
    });
    const response = await conversationChain.invoke({ input: '你好' });
    console.log('response', response);
    return response;
  }
}
