import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from './entity/rol.entity';


@Module({
  imports: [TypeOrmModule.forFeature([RolEntity])],
  providers: [RolesService],
  controllers: [RolesController], 
  exports: [RolesService],
})
export class RolesModule {}
