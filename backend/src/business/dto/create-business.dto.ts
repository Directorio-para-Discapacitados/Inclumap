import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({ description: 'Nombre comercial del negocio' })
  @IsNotEmpty()
  @IsString()
  business_name: string;

  @ApiProperty({ description: 'Dirección física del negocio' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Número de identificación tributaria (NIT)' })
  @IsNotEmpty()
  @IsString()
  NIT: number;

  @ApiProperty({ description: 'Descripción del negocio y sus servicios' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Coordenadas geográficas del negocio' })
  @IsNotEmpty()
  @IsString()
  coordinates: string;
}