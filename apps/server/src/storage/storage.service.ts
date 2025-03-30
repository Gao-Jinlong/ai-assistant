import { Injectable } from '@nestjs/common';
import { StorageOptions } from './interfaces/storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { $Enums } from '@prisma/client';
@Injectable()
export class StorageService {
  constructor() {}

  async createProvider(options: StorageOptions) {
    if (options.type === $Enums.StorageType.S3) {
      return new S3StorageProvider(options);
    } else {
      return new LocalStorageProvider(options);
    }
  }
}
