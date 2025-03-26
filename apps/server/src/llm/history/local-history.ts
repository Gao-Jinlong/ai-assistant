import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import {
  BaseMessage,
  StoredMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from '@langchain/core/messages';
import { Conversation } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

export interface LocalChatHistoryInput {
  sessionId: string;
  dir: string;
}

export class LocalHistory extends BaseListChatMessageHistory {
  lc_namespace = ['langchain', 'stores', 'message'];
  path: string;
  private messages: BaseMessage[] = [];

  constructor(conversation: Conversation) {
    super(conversation);
    this.path = path.join(process.cwd(), conversation.storagePath);
  }

  async getMessages(): Promise<BaseMessage[]> {
    if (this.messages.length === 0) {
      const filePath = this.path;
      try {
        if (!fs.existsSync(filePath)) {
          this.saveMessagesToFile([]);
          return [];
        }

        const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
        const storedMessages = JSON.parse(data) as StoredMessage[];
        this.messages = mapStoredMessagesToChatMessages(storedMessages);
        return this.messages;
      } catch (e) {
        console.log(`Failed to read chat history from ${filePath}:`, e);
        return [];
      }
    }
    return this.messages;
  }

  async addMessage(message: BaseMessage): Promise<void> {
    this.messages.push(message);
    await this.saveMessagesToFile(this.messages);
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    this.messages = this.messages.concat(messages);
    await this.saveMessagesToFile(this.messages);
  }

  async clear(): Promise<void> {
    this.messages = [];
    const filePath = this.path;
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to clear chat history from ${filePath}`, error);
    }
  }

  private async saveMessagesToFile(messages: BaseMessage[]): Promise<void> {
    const filePath = this.path;
    const serializedMessages = mapChatMessagesToStoredMessages(messages);
    try {
      fs.writeFileSync(filePath, JSON.stringify(serializedMessages, null, 2), {
        encoding: 'utf-8',
      });
    } catch (error) {
      console.error(`Failed to save chat history to ${filePath}`, error);
    }
  }
}
