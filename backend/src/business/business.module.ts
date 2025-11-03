import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; 
import { BusinessEntity } from './entity/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity]),
    AuthModule,
    CloudinaryModule, 
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}