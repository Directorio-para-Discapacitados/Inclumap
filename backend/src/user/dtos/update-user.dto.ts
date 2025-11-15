import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Correo electrónico del usuario' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  user_email?: string;

  @ApiPropertyOptional({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto o numeros' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password?: string;

  @ApiPropertyOptional({ description: 'ID del rol asignado al usuario' })
  @IsOptional()
  @IsNumber({}, { message: 'Rol indefinido' })
  rol_id?: number;
}
