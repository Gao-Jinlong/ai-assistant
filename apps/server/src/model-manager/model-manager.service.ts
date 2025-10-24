import { Injectable } from '@nestjs/common';
import { MODEL_TYPE } from './interface';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class ModelManagerService {
  private modelMap: Map<MODEL_TYPE, BaseChatModel>;

  constructor(private readonly configService: ConfigService) {
    this.modelMap = new Map();
  }

  getModel(type: MODEL_TYPE) {
    let modelInstance: BaseChatModel;
    if (!this.modelMap.has(type)) {
      modelInstance = this.createModel(type);
      this.modelMap.set(type, modelInstance);
    } else {
      modelInstance = this.modelMap.get(type)!;
    }
    return modelInstance;
  }
  createModel(type: MODEL_TYPE) {
    switch (type) {
      case MODEL_TYPE.LLM:
        return new ChatOpenAI({
          model: 'deepseek-v3.2-exp',
          apiKey: this.configService.get('TONGYI_API_KEY')!,
          configuration: {
            baseURL: this.configService.get('TONGYI_BASE_URL')!,
          },
        });
      default:
        throw new Error('Invalid model type');
    }
  }
}
