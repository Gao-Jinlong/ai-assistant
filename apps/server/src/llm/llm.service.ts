import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class LlmService {
  /**
   * 抽象模型级别，方便后续替换模型和根据任务复杂度选择模型
   */
  private readonly llmPool: Map<number, ChatOpenAI> = new Map();
  constructor(private readonly config: ConfigService) {
    const chatOptions = {
      openAIApiKey: this.config.get('TONGYI_API_KEY'),
      // temperature: 0,
      modelName: 'qwen-plus',
      configuration: {
        baseURL: this.config.get('TONGYI_BASE_URL'),
      },
    };

    this.llmPool.set(1, new ChatOpenAI(chatOptions));
  }

  get llm() {
    return this.llmPool.get(1);
  }
}
