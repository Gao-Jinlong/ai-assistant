import { Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  FileInfo,
  StorageS3Options,
} from '../interfaces/storage.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  constructor(private readonly options: StorageS3Options) {}

  write(
    path: string,
    content: string | Buffer,
    metadata?: Record<string, string>,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  append(path: string, content: string | Buffer): Promise<void> {
    throw new Error('Method not implemented.');
  }
  read(path: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  delete(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  stat(path: string): Promise<FileInfo> {
    throw new Error('Method not implemented.');
  }
  exists(path: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
