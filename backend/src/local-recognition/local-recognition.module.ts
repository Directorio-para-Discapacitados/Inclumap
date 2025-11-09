import { Module } from '@nestjs/common';
import { LocalRecognitionController } from './local-recognition.controller';
import { LocalRecognitionService } from './local-recognition.service';
import { googleVisionProvider } from './google-vision.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module'; 
import { BusinessEntity } from 'src/business/entity/business.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity]),
    AuthModule,
    CloudinaryModule
  ],
  controllers: [LocalRecognitionController],
  providers: [
    LocalRecognitionService,
    googleVisionProvider, 
  ],
})
export class LocalRecognitionModule {}