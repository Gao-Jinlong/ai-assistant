import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import configuration from './config/configuration';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块
      load: [configuration],
      envFilePath: ['.env.local', '.env'], // 环境变量文件路径
    }),
    TrpcModule,
    ChatModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
