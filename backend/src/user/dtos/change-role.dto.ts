import { IsIn, IsOptional, IsString } from 'class-validator';
import { ALLOWED_ROLES, AllowedRole } from '../../config/roles.constants';

export class ChangeRoleDto {
  @IsString()
  @IsIn(ALLOWED_ROLES as readonly string[])
  role: AllowedRole;

  @IsOptional()
  @IsString()
  reason?: string;
}
