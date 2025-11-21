import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ description: 'Nombre comercial del negocio' })
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiPropertyOptional({ description: 'Dirección física del negocio' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Número de identificación tributaria (NIT)',
  })
  @IsOptional()
  @IsNumber()
  NIT?: number;

  @ApiPropertyOptional({
    description: 'Descripción del negocio y sus servicios',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Coordenadas geográficas del negocio' })
  @IsOptional()
  @IsString()
  coordinates?: string;

  @ApiPropertyOptional({ description: 'Estado de verificación del logo' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'ID del usuario propietario (null para remover propietario)',
  })
  @IsOptional()
  user_id?: number | null;

  @ApiPropertyOptional({
    description: 'Lista de IDs de categorías para actualizar',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Lista de IDs de accesibilidades para actualizar',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  accessibilityIds?: number[];
}
