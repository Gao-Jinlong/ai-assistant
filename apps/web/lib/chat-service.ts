// 消息接口
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

// 对话接口
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// API 响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

class ChatService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // 获取所有对话
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: 添加认证 token
        },
      });

      if (!response.ok) {
        throw new Error('获取对话列表失败');
      }

      const result: ApiResponse<Conversation[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取对话失败:', error);
      // 返回模拟数据作为降级
      return [];
    }
  }

  // 创建新对话
  async createConversation(title?: string): Promise<Conversation> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || `新对话 ${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('创建对话失败');
      }

      const result: ApiResponse<Conversation> = await response.json();
      return result.data;
    } catch (error) {
      console.error('创建对话失败:', error);
      // 返回模拟数据作为降级
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: title || `新对话 ${Date.now()}`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newConversation;
    }
  }

  // 发送消息
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            role: 'user',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      const result: ApiResponse<Message> = await response.json();
      return result.data;
    } catch (error) {
      console.error('发送消息失败:', error);
      // 返回模拟数据作为降级
      const userMessage: Message = {
        id: `${Date.now()}-user`,
        content,
        role: 'user',
        timestamp: Date.now(),
      };
      return userMessage;
    }
  }

  // 获取 AI 回复
  async getAIResponse(
    conversationId: string,
    message: string,
  ): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${conversationId}/ai-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('获取 AI 回复失败');
      }

      const result: ApiResponse<Message> = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取 AI 回复失败:', error);
      // 返回模拟数据作为降级
      const aiMessage: Message = {
        id: `${Date.now()}-assistant`,
        content: `这是对"${message}"的模拟回复。在真实场景中，这里会是 AI 的实际回复。`,
        role: 'assistant',
        timestamp: Date.now(),
      };
      return aiMessage;
    }
  }

  // 删除对话
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('删除对话失败');
      }
    } catch (error) {
      console.error('删除对话失败:', error);
      // 在实际场景中，这里可能需要显示错误提示
    }
  }

  // 更新对话标题
  async updateConversationTitle(
    conversationId: string,
    title: string,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${conversationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('更新对话标题失败');
      }
    } catch (error) {
      console.error('更新对话标题失败:', error);
    }
  }
}

// 导出单例实例
export const chatService = new ChatService();
export default chatService;
