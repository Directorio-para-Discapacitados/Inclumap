import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpgradeToBusinessDto {
  @ApiProperty({ description: 'Nombre comercial del negocio' })
  @IsNotEmpty()
  business_name: string;

  @ApiProperty({ description: 'Dirección física del negocio' })
  @IsNotEmpty()
  business_address: string;

  @ApiProperty({ description: 'Número de identificación tributaria (NIT)' })
  @IsNotEmpty()
  @IsNumber()
  NIT: number;

  @ApiProperty({ description: 'Descripción del negocio y sus servicios' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Coordenadas geográficas del negocio' })
  @IsNotEmpty()
  coordinates: string;

  @ApiPropertyOptional({
    description: 'IDs de accesibilidades disponibles en el negocio',
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  accessibilityIds?: number[];
}
