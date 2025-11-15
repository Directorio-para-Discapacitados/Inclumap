import { Body, Controller, Post, Delete, UseGuards } from '@nestjs/common';
import { UserRolService } from './user_rol.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

export class AddUserRoleDto {
  user_id: number;
  rol_id: number;
}

export class RemoveUserRoleDto {
  user_id: number;
  rol_id: number;
}

@ApiTags('user-rol')
@Controller('user-rol')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserRolController {
  constructor(private readonly userRolService: UserRolService) {}

  @Post()
  @Roles(1) // Solo administradores pueden añadir roles
  async addUserRole(@Body() addUserRoleDto: AddUserRoleDto): Promise<string> {
    return this.userRolService.addUserRole(
      addUserRoleDto.user_id,
      addUserRoleDto.rol_id,
    );
  }

  @Delete()
  @Roles(1) // Solo administradores pueden quitar roles
  async removeUserRole(
    @Body() removeUserRoleDto: RemoveUserRoleDto,
  ): Promise<string> {
    return this.userRolService.removeUserRole(
      removeUserRoleDto.user_id,
      removeUserRoleDto.rol_id,
    );
  }
}
