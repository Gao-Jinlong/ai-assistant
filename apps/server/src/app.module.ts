import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import configuration from './config/configuration';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { AssessmentModule } from './assessment/assessment.module';
import { PrismaService } from './prisma/prisma.service';
import { ConversationModule } from './conversation/conversation.module';
import { StorageModule } from './storage/storage.module';
import { ClsModule } from 'nestjs-cls';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块
      load: [configuration],
      envFilePath: ['.env.local', '.env'], // 环境变量文件路径
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false },
    }),
    TrpcModule,
    ChatModule,
    UserModule,
    PrismaModule,
    AuthModule,
    ConversationModule,
    // AssessmentModule,
    StorageModule,
    LlmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    PrismaService,
  ],
  exports: [PrismaService],
})
export class AppModule {}
