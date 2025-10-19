import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RoleEntity } from './entity/role.entity';
import { RoleChangeEntity } from './entity/role-change.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, RoleChangeEntity])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService, TypeOrmModule.forFeature([RoleEntity, RoleChangeEntity])],
})
export class RolesModule {}
