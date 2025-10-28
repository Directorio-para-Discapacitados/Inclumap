import { IsOptional, IsString } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Número de identificación tributaria (NIT)' })
  @IsOptional()
  @IsString()
  NIT?: number;

  @ApiPropertyOptional({ description: 'Descripción del negocio y sus servicios' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Coordenadas geográficas del negocio' })
  @IsOptional()
  @IsString()
  coordinates?: string;
}