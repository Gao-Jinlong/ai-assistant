import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { patchNestJsSwagger } from 'nestjs-zod';
import { NestExpressApplication } from '@nestjs/platform-express';

patchNestJsSwagger();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const isDev = configService.get('isDev');
  const port = configService.get('port');

  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('AI Assistant API')
      .setDescription('AI 助手服务 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: '/docs-json',
    });
  }

  app.enableCors();

  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
  if (isDev) {
    console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  }
}
bootstrap();
