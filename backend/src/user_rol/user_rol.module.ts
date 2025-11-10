import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRolService } from './user_rol.service';
import { UserRolController } from './user_rol.controller';
import { UserRolesEntity } from './entity/user_rol.entity';
import { UserEntity } from '../user/entity/user.entity';
import { RolEntity } from '../roles/entity/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRolesEntity, UserEntity, RolEntity])
  ],
  providers: [UserRolService],
  controllers: [UserRolController],
  exports: [UserRolService]
})
export class UserRolModule {}
