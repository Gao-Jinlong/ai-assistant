import { Injectable } from '@nestjs/common';
import { ModelManagerService } from '@server/model-manager/model-manager.service';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

@Injectable()
export class AgentService {
  constructor(private modelManagerService: ModelManagerService) {}

  // 主要的对话接口
  async chat(userInput: string, conversationHistory: BaseMessage[] = []) {
    try {
      // 获取模型实例
      const modelInstance =
        await this.modelManagerService.getModel('qwen-plus');

      if (!modelInstance) {
        throw new Error('模型不存在');
      }

      // 构建消息历史
      const messages = [...conversationHistory, new HumanMessage(userInput)];

      // 调用模型
      const response = await modelInstance.model.invoke(messages);

      // 构建响应 - 处理不同的响应类型
      let responseContent: string;
      if (typeof response === 'string') {
        responseContent = response;
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        // 使用 any 类型来避免 TypeScript 严格检查
        responseContent = String((response as any).content);
      } else {
        responseContent = String(response);
      }

      const aiMessage = new AIMessage(responseContent);
      const allMessages = [...messages, aiMessage];

      return {
        response: responseContent,
        messages: allMessages,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`对话处理失败: ${errorMessage}`);
    }
  }

  // 流式对话接口 - 基础版本
  async chatStream(userInput: string, conversationHistory: BaseMessage[] = []) {
    try {
      // 获取模型实例
      const modelInstance = await this.modelManagerService.getModel(
        'qwen-plus-2025-01-25',
      );

      if (!modelInstance) {
        throw new Error('模型不存在');
      }

      // 构建消息历史
      const messages = [...conversationHistory, new HumanMessage(userInput)];

      // 流式调用模型
      const stream = await modelInstance.model.stream(messages);

      return stream;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`流式对话处理失败: ${errorMessage}`);
    }
  }

  // 使用 LangGraph 的高级对话接口（当需要复杂流程时使用）
  async chatWithGraph(
    userInput: string,
    conversationHistory: BaseMessage[] = [],
  ) {
    try {
      // 这里可以实现更复杂的 LangGraph 逻辑
      // 比如添加工具调用、记忆管理、内容审核等

      // 目前使用简单的模型调用
      const result = await this.chat(userInput, conversationHistory);

      return {
        response: result.response,
        messages: result.messages,
        // 可以添加额外的元数据
        metadata: {
          modelUsed: 'qwen-plus-2025-01-25',
          processingSteps: [
            'input_processing',
            'model_call',
            'output_formatting',
          ],
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`图对话处理失败: ${errorMessage}`);
    }
  }

  // 兼容原有的 run 方法
  async run() {
    const result = await this.chat('你好');
    return result.response;
  }
}
