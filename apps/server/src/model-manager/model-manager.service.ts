import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModelInstance, MODEL_TYPE } from './interface';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ModelManagerService implements OnModuleInit {
  private modelMap: Map<string, ModelInstance>;

  constructor(private configService: ConfigService) {
    this.modelMap = new Map();
  }
  onModuleInit() {
    this.modelMap.set('qwen-plus', {
      name: 'qwen-plus',
      type: MODEL_TYPE.LLM,
      model: new ChatOpenAI({
        model: 'qwen-plus',
        apiKey: this.configService.get('TONGYI_API_KEY'),
        configuration: {
          baseURL: this.configService.get('TONGYI_BASE_URL'),
        },
      }),
    });
  }

  async getModel(name: string): Promise<ModelInstance | undefined> {
    if (!this.modelMap.has(name)) {
      this.modelMap.set(name, this.createModel(name, MODEL_TYPE.LLM));
    }

    return this.modelMap.get(name);
  }

  createModel(name: string, type: MODEL_TYPE) {
    const config = {
      model: 'qwen-plus-2025-01-25',
      apiKey: this.configService.get('TONGYI_API_KEY'),
      configuration: {
        baseURL: this.configService.get('TONGYI_BASE_URL'),
      },
    };

    return {
      name,
      type,
      model: new ChatOpenAI(config),
    };
  }
}
