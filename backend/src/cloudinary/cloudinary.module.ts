import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config'; // Necesario para leer .env

@Module({
  imports: [ConfigModule], // Importa ConfigModule para que el servicio pueda usarlo
  providers: [CloudinaryService],
  exports: [CloudinaryService], // Exporta el servicio para que otros módulos lo usen
})
export class CloudinaryModule {}