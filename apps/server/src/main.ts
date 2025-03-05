import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { patchNestJsSwagger } from 'nestjs-zod';
import { TrpcRouter } from './trpc/trpc.router';
import { NestExpressApplication } from '@nestjs/platform-express';
patchNestJsSwagger();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const isDev = configService.get('isDev');
  const port = configService.get('port');

  if (isDev) {
    // Swagger 配置
    const config = new DocumentBuilder()
      .setTitle('AI Assistant API')
      .setDescription('AI 助手服务 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.enableCors();

  const trpcRouter = app.get(TrpcRouter);
  trpcRouter.applyMiddleware(app);

  await app.listen(port);
}
bootstrap();
