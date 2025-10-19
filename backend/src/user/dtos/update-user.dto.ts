import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  user_email?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto o numeros' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password?: string;

}
