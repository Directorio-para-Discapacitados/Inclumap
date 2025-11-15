import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccesibilityDto {
  @ApiProperty({ description: 'Nombre de Accesibilidad' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  accessibility_name?: string;

  @ApiProperty({ description: 'Descripcion de Accesibilidad' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;
}
