import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config.service';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useLogger(app.get(Logger));
  setupApp(app);

  const config = app.get(AppConfig);
  if (!config.isProduction) {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Muhasabah Daily API')
        .setVersion('1.1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, cleanupOpenApiDoc(doc));
  }

  await app.listen(config.get('PORT'));
}

void bootstrap();
