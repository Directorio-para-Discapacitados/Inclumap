import { IsEmail, IsNotEmpty, IsString, MinLength, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateFullUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  user_email: string;

  
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password: string;


  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName: string;


  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  firstLastName: string;


  @IsNotEmpty({ message: 'El celular es obligatorio' })
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  cellphone: string;


  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address: string;

  @IsNotEmpty({ message: 'El genero es obligatoria' })
  @IsString({ message: 'El genero debe ser una cadena de texto' })
  gender: string;

  
  @IsOptional()
  @IsArray({ message: 'rolId debe ser un arreglo de números' })
  @IsNumber({}, { each: true, message: 'Cada rol debe ser un número' })
  rolIds: number[];
}