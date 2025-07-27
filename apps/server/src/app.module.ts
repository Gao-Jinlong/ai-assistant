import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import configuration from './config/configuration';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { StorageModule } from './storage/storage.module';
import { ClsModule, ClsMiddleware } from 'nestjs-cls';
import { CommonModule } from './common/common.module';
import { ThreadModule } from './thread/thread.module';
import { WinstonModule } from 'nest-winston';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { Request } from 'express';
import { nanoid } from 'nanoid';
import { createWinstonLogger } from './common/factories/createWinstonLogger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块
      load: [configuration],
      envFilePath: ['.env.local', '.env'], // 环境变量文件路径
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false, // 禁用自动挂载
        generateId: true,
        idGenerator: (req: Request) => {
          const id = (req.headers['X-Request-Id'] as string) ?? nanoid();
          return id;
        },
      },
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        createWinstonLogger(configService),
      inject: [ConfigService],
    }),
    CommonModule, // 添加公共模块
    UserModule,
    PrismaModule,
    AuthModule,
    StorageModule,
    ThreadModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 首先挂载 ClsMiddleware，确保它在 LoggerMiddleware 之前执行
    consumer.apply(ClsMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });

    // 然后挂载 LoggerMiddleware
    consumer.apply(LoggerMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
