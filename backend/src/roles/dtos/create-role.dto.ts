import { IsIn, IsString } from 'class-validator';
import { ALLOWED_ROLES } from '../../config/roles.constants';

export class CreateRoleDto {
  @IsString()
  @IsIn(ALLOWED_ROLES as readonly string[])
  role_name: string;
}
