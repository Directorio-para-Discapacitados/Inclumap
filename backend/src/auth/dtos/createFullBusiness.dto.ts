// auth/dtos/createFullBusiness.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateFullBusinessDto {
  // Datos de usuario
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  user_email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password: string;

  // Datos de persona
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

  @IsNotEmpty({ message: 'El género es obligatorio' })
  @IsString({ message: 'El género debe ser una cadena de texto' })
  gender: string;

  // Datos de negocio
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  @IsString({ message: 'El nombre del negocio debe ser una cadena de texto' })
  business_name: string;

  @IsNotEmpty({ message: 'La dirección del negocio es obligatoria' })
  @IsString({ message: 'La dirección del negocio debe ser una cadena de texto' })
  business_address: string;

  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  @IsNumber({}, { message: 'El NIT debe ser un número' })
  NIT: number;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

  @IsNotEmpty({ message: 'Las coordenadas son obligatorias' })
  @IsString({ message: 'Las coordenadas deben ser una cadena de texto' })
  coordinates: string;

  // Roles y accesibilidades
  @IsOptional()
  @IsArray({ message: 'rolIds debe ser un arreglo de números' })
  @IsNumber({}, { each: true, message: 'Cada rol debe ser un número' })
  rolIds?: number[];

  @IsOptional()
  @IsArray({ message: 'accessibilityIds debe ser un arreglo' })
  @IsNumber({}, { each: true, message: 'Cada accesibilidad debe ser un número' })
  accessibilityIds?: number[];
}