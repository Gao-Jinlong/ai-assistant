import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppController } from './app.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  const appController = app.get(AppController);

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appController.router,
    }),
  );

  app.enableCors();
  await app.listen(3001);
}
bootstrap();
