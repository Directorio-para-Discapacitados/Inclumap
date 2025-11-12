import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SERVER_PORT } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Directorio Inclumap') 
    .setDescription('La API para gestionar APP Inclumap') 
    .setVersion('1.0') 
    .addTag('users') 
    .addTag('auth') 
    .addTag('people') 
    .addTag('business')
    .addTag('reviews')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const port = +(configService.get<number>(SERVER_PORT) ?? 3000);

  await app.listen(port);
  //console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();