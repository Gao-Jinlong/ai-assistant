import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [KafkaController],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {
  static register() {
    return {
      module: KafkaModule,
      imports: [ConfigModule],
      controllers: [KafkaController],
      providers: [
        {
          provide: KafkaService,
          useFactory: (configService: ConfigService) => {
            return new KafkaService(configService);
          },
          inject: [ConfigService],
        },
      ],
      exports: [KafkaService],
    };
  }
}
