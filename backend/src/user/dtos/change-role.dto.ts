import { IsIn, IsOptional, IsString } from 'class-validator';
import { ALLOWED_ROLES, AllowedRole } from '../../config/roles.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeRoleDto {
  @IsString()
  @IsIn(ALLOWED_ROLES as readonly string[])
  @ApiProperty({ enum: ALLOWED_ROLES, description: 'Nuevo rol a asignar' })
  role: AllowedRole;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Razón por la cual se realiza el cambio (opcional)' })
  reason?: string;
}
