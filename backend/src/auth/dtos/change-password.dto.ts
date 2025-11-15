import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  @IsString({ message: 'La contraseña actual debe ser texto' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario (mínimo 6 caracteres)',
  })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @IsString({ message: 'La nueva contraseña debe ser texto' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;
}
