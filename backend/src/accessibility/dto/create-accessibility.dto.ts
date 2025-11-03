import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccesibilityDto {
  @ApiProperty({ description: 'Accesibilidad' })
  @IsNotEmpty({ message: 'La Accesibilidad es obligatorio' })
  @IsString({ message: 'La Accesibilidad debe ser una cadena de texto' })
  accessibility_name: string;

  @ApiProperty({ description: 'Accesibilidad del Local' })
  @IsNotEmpty({ message: 'La Accesibilidad es obligatoria' })
  @IsString({ message: 'La Accesibilidad debe ser una cadena de texto' })
  description: string;
}