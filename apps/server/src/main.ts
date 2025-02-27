import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppController } from './app.controller';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from './middleware/zod-validation.pipe';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const isDev = configService.get('isDev');
  const port = configService.get('port');

  if (isDev) {
    // Swagger 配置
    const config = new DocumentBuilder()
      .setTitle('AI Assistant API')
      .setDescription('AI 助手服务 API 文档')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const appController = app.get(AppController);

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appController.router,
    }),
  );

  app.enableCors();
  await app.listen(port);
}
bootstrap();
