// backend/src/localRecognition/local-recognition.module.ts
import { Module } from '@nestjs/common';
import { LocalRecognitionController } from './local-recognition.controller';
import { LocalRecognitionService } from './local-recognition.service';
import { googleVisionProvider } from './google-vision.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module'; // Para usar JwtAuthGuard
import { BusinessEntity } from 'src/business/entity/business.entity';

@Module({
  imports: [
    // Importamos la entidad Business para que el servicio pueda consultarla
    TypeOrmModule.forFeature([BusinessEntity]),
    // Importamos AuthModule para poder usar los Guards de autenticación
    AuthModule,
  ],
  controllers: [LocalRecognitionController],
  providers: [
    LocalRecognitionService,
    googleVisionProvider, // Proveemos el cliente de Google Vision
  ],
})
export class LocalRecognitionModule {}