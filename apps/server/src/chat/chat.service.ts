import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ChatService {
  private model: ChatAlibabaTongyi;

  constructor(private configService: ConfigService) {
    this.model = new ChatAlibabaTongyi({
      alibabaApiKey: this.configService.get<string>('TONGYI_API_KEY'),
      temperature: 0.7,
      model: 'qwen-max-latest',
    });
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const formattedMessages = messages.map((msg) =>
      msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

    const response = await this.model.invoke(formattedMessages);
    return response.content;
  }
}
