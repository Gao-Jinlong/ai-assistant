import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { questionTypeSchema } from '../dto/llm.dto';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/dist/output_parsers';

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
      this.modelWithTools(llm),
      new JsonOutputParser(),
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

  async invoke(messages: string) {
    const response = await this.chain.invoke({ input: messages });
    return response;
  }
}
