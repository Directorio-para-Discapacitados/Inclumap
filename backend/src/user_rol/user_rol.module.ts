import { Module } from '@nestjs/common';
import { UserRolService } from './user_rol.service';
import { UserRolController } from './user_rol.controller';

@Module({
  providers: [UserRolService],
  controllers: [UserRolController]
})
export class UserRolModule {}
