import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { RoleChangeEntity } from '../roles/entity/role-change.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleChangeEntity])],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
