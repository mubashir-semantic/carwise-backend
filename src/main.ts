import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/middleware/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { createCorsOptions } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Base64 Avatar image upload ke liye payload limit
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 2. Global Prefix (http://localhost:5000/api/...)
  app.setGlobalPrefix('api');

  // 3. CORS enable taake Next.js frontend connect ho sake
  app.enableCors(createCorsOptions());

  // 4. Global Error Handler
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 5. Global Validation Pipe (DTOs ke liye)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 6. Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('CarWise API')
    .setDescription('Authentication & User Management APIs for CarWise')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = Number(process.env.PORT || 5000);
  const HOST = process.env.HOST || '0.0.0.0';
  await app.listen(PORT, HOST);

  const publicApiUrl =
    process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;
  console.log(`🚀 CarWise Backend is running on: ${publicApiUrl}/api`);
  console.log(
    `📖 Swagger API Docs available at: ${publicApiUrl}/api/docs`,
  );
}
bootstrap();
