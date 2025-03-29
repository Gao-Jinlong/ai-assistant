import { Injectable } from '@nestjs/common';
import {
  FileInfo,
  IStorageProvider,
  StorageS3Options,
} from '../interfaces/storage.interface';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { BaseMessage } from '@langchain/core/messages';

@Injectable()
export class S3StorageProvider
  extends BaseListChatMessageHistory
  implements IStorageProvider
{
  lc_namespace = ['langchain', 'stores', 'message', 's3'];
  private messages: BaseMessage[] = [];
  private s3Client: S3Client;
  private bucket: string;
  private path: string;
  constructor(options: StorageS3Options) {
    super();
    this.bucket = options.bucket;
    this.s3Client = new S3Client({ region: options.region });
    this.path = `chat-history/${options.path}`;
  }
  async delete(): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.path,
    });
    await this.s3Client.send(command);
  }
  async stat(): Promise<FileInfo> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: this.path,
    });
    const response = await this.s3Client.send(command);
    return {
      path: this.path,
      size: response.ContentLength ?? 0,
      lastModified: response.LastModified ?? new Date(),
    };
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

  async saveToFile(): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.path,
      Body: JSON.stringify(this.messages),
    });
    await this.s3Client.send(command);
  }

  async loadFromFile(): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.path,
      });
      const response = await this.s3Client.send(command);
      const data = await response.Body?.transformToString();
      this.messages = data ? JSON.parse(data) : [];
    } catch (error) {
      this.messages = [];
    }
  }
}
