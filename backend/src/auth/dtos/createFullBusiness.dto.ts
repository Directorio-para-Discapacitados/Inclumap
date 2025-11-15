// auth/dtos/createFullBusiness.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFullBusinessDto {
  // Datos de usuario
  @ApiProperty({
    description: 'Correo electrónico del usuario dueño del negocio',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  user_email: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 6 caracteres)' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  user_password: string;

  // Datos de persona
  @ApiProperty({ description: 'Nombre del dueño del negocio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del dueño del negocio' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  firstLastName: string;

  @ApiProperty({ description: 'Número de celular del dueño' })
  @IsNotEmpty({ message: 'El celular es obligatorio' })
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  cellphone: string;

  @ApiProperty({ description: 'Dirección de residencia del dueño' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address: string;

  @ApiProperty({ description: 'Género del dueño del negocio' })
  @IsNotEmpty({ message: 'El género es obligatorio' })
  @IsString({ message: 'El género debe ser una cadena de texto' })
  gender: string;

  // Datos de negocio
  @ApiProperty({ description: 'Nombre comercial del negocio' })
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  @IsString({ message: 'El nombre del negocio debe ser una cadena de texto' })
  business_name: string;

  @ApiProperty({ description: 'Dirección física del negocio' })
  @IsNotEmpty({ message: 'La dirección del negocio es obligatoria' })
  @IsString({
    message: 'La dirección del negocio debe ser una cadena de texto',
  })
  business_address: string;

  @ApiProperty({ description: 'Número de identificación tributaria (NIT)' })
  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  @IsNumber({}, { message: 'El NIT debe ser un número' })
  NIT: number;

  @ApiProperty({ description: 'Descripción del negocio y sus servicios' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

  @ApiProperty({
    description: 'Coordenadas geográficas del negocio (latitud, longitud)',
  })
  @IsNotEmpty({ message: 'Las coordenadas son obligatorias' })
  @IsString({ message: 'Las coordenadas deben ser una cadena de texto' })
  coordinates: string;

  // Roles y accesibilidades
  @ApiPropertyOptional({
    description: 'IDs de roles asignados al usuario dueño',
  })
  @IsOptional()
  @IsArray({ message: 'rolIds debe ser un arreglo de números' })
  @IsNumber({}, { each: true, message: 'Cada rol debe ser un número' })
  rolIds?: number[];

  @ApiPropertyOptional({
    description: 'IDs de accesibilidades disponibles en el negocio',
  })
  @IsOptional()
  @IsArray({ message: 'accessibilityIds debe ser un arreglo' })
  @IsNumber(
    {},
    { each: true, message: 'Cada accesibilidad debe ser un número' },
  )
  accessibilityIds?: number[];
}
