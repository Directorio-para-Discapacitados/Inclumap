import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { RolEntity } from 'src/roles/entity/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserRolesEntity, RolEntity])],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
