import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { type $Enums } from '@prisma/client';

export type StorageOptions = StorageLocalOptions | StorageS3Options;

export interface StorageLocalOptions {
  type: typeof $Enums.StorageType.LOCAL;
  path?: string;
}

export interface StorageS3Options {
  type: typeof $Enums.StorageType.S3;
  bucket: string;
  region: string;
  path: string;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface IStorageProvider extends BaseListChatMessageHistory {
  /**
   * 删除文件
   * @param path 文件路径
   */
  delete(): Promise<void>;
  /**
   * 获取文件信息
   * @param path 文件路径
   */
  stat(): Promise<FileInfo>;
}
