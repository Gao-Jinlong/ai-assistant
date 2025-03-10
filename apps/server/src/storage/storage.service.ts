import { Inject, Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  StorageOptions,
} from './interfaces/storage.interface';
import { STORAGE_OPTIONS } from './storage.constants';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';

@Injectable()
export class StorageService {
  private provider: IStorageProvider;

  constructor(@Inject(STORAGE_OPTIONS) options: StorageOptions) {
    // 根据配置选择存储提供者
    if (options.type === 's3') {
      this.provider = new S3StorageProvider(options);
    } else {
      this.provider = new LocalStorageProvider(options);
    }
  }

  // 代理所有方法到具体的存储提供者
  write(
    path: string,
    content: string | Buffer,
    metadata?: Record<string, string>,
  ) {
    return this.provider.write(path, content, metadata);
  }

  append(path: string, content: string | Buffer) {
    return this.provider.append(path, content);
  }

  read(path: string) {
    return this.provider.read(path);
  }

  delete(path: string) {
    return this.provider.delete(path);
  }

  stat(path: string) {
    return this.provider.stat(path);
  }

  exists(path: string) {
    return this.provider.exists(path);
  }
}
