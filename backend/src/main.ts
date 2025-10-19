import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SERVER_PORT } from './config/constants';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = +(configService.get<number>(SERVER_PORT) ?? 3000);

  // Habilitar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,      // elimina propiedades no declaradas en DTO
    forbidNonWhitelisted: true, // lanza error cuando viene campo extra
    transform: true,      // transforma payloads a instancias de DTO (útil para types)
  }));

  // Setup de Swagger (documentación OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('Inclumap API')
    .setDescription('API backend para Inclumap — documentación de endpoints')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}
bootstrap();
