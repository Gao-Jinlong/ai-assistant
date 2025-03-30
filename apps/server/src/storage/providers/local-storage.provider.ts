import { Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  FileInfo,
  StorageLocalOptions,
} from '../interfaces/storage.interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BaseMessage } from '@langchain/core/messages';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { TRPCError } from '@trpc/server';

@Injectable()
export class LocalStorageProvider
  extends BaseListChatMessageHistory
  implements IStorageProvider
{
  lc_namespace = ['langchain', 'stores', 'message', 'local'];
  private messages: BaseMessage[] = [];
  private path: string;

  constructor(options?: StorageLocalOptions) {
    super();
    this.path = options?.path || 'storage';
    this.loadFromFile();
  }

  async getMessages(): Promise<BaseMessage[]> {
    return this.messages;
  }

  async addMessage(message: BaseMessage): Promise<void> {
    this.messages.push(message);
    await this.saveToFile();
  }

  async clear(): Promise<void> {
    this.messages = [];
  }

  async delete(): Promise<void> {
    const filePath = path.join(this.path);
    await fs.unlink(filePath);
  }

  async stat(): Promise<FileInfo> {
    const filePath = path.join(this.path);
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
    };
  }

  async saveToFile(): Promise<void> {
    const filePath = this.path;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(this.messages), 'utf-8');
  }

  async loadFromFile(): Promise<void> {
    const filePath = this.path;
    if (!fs.existsSync(filePath)) {
      this.messages = [];
      return;
    }
    try {
      console.log('🚀 ~ loadFromFile ~ filePath:', filePath);

      const data = await fs.readFile(filePath, 'utf-8');
      this.messages = JSON.parse(data);
    } catch (error) {
      this.messages = [];
      console.log('🚀 ~ loadFromFile ~ error:', error);
    }
  }
}
