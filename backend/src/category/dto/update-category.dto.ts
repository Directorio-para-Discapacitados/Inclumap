import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Nombre de Accesibilidad' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  name?: string;

  @ApiProperty({ description: 'Descripcion de Accesibilidad' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;
}
