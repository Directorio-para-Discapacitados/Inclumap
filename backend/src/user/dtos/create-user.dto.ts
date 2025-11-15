import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico no es valido' })
  user_email: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 6 caracteres)' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto o numeros' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password: string;

  @ApiPropertyOptional({ description: 'ID del rol asignado al usuario' })
  @IsOptional({ message: 'No tienes un Rol' })
  @IsNumber({}, { message: 'Rol indefinido' })
  rol_id: number;
}
