import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { STORAGE_OPTIONS } from './storage.constants';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  providers: [
    {
      provide: STORAGE_OPTIONS,
      useFactory: (config: ConfigService) => config.get('storage'),
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
