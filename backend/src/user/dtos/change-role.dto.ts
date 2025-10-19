import { IsIn, IsOptional, IsString } from 'class-validator';

export class ChangeRoleDto {
  @IsString()
  @IsIn(['usuario', 'administrador'])
  role: 'usuario' | 'administrador';

  @IsOptional()
  @IsString()
  reason?: string;
}
