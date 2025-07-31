import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

export enum MODEL_TYPE {
  LLM = 'llm',
  EMBEDDING = 'embedding',
}

export interface ModelInstance {
  name: string;
  type: MODEL_TYPE;
  model: ChatOpenAI;
}
