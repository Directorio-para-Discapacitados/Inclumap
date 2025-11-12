// backend/src/maps/maps.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MapsService } from './maps.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  providers: [MapsService],
  exports: [MapsService], // Exportamos para usar en otros módulos
})
export class MapsModule {}