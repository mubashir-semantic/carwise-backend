import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/middleware/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix (http://localhost:5000/api)
  app.setGlobalPrefix('api');

  // 2. API Versioning (http://localhost:5000/api/v1)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 3. CORS Enable karein (Frontend se connect karne ke liye)
  app.enableCors();

  // 4. Error Handler Apply karein
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 5. Global Validation Pipe (NEW: DTOs validate karne ke liye)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 6. Swagger API Documentation (NEW: APIs test karne ke liye)
  const config = new DocumentBuilder()
    .setTitle('CarWise API')
    .setDescription('Authentication & User Management APIs for CarWise')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);

  console.log(
    `🚀 CarWise Backend is running on: http://localhost:${PORT}/api/v1`,
  );
  console.log(
    `📖 Swagger API Docs available at: http://localhost:${PORT}/api/docs`,
  );
}
bootstrap();
