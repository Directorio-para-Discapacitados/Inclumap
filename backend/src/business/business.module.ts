import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessPublicController } from './business.public.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; 
import { MapsModule } from '../maps/maps.module';
import { BusinessEntity } from './entity/business.entity';
import { UserEntity } from '../user/entity/user.entity';
import { UserRolesEntity } from '../user_rol/entity/user_rol.entity';
import { RolEntity } from '../roles/entity/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity, UserEntity, UserRolesEntity, RolEntity]),
    AuthModule,
    CloudinaryModule, 
    MapsModule,
  ],
  controllers: [BusinessController, BusinessPublicController],
  providers: [BusinessService],
})
export class BusinessModule {}