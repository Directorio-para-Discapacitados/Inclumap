import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePeopleDto {
  @ApiPropertyOptional({ description: 'Nombre de la persona' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido de la persona' })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  firstLastName?: string;

  @ApiPropertyOptional({ description: 'Número de celular de la persona' })
  @IsOptional()
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  cellphone?: string;

  @ApiPropertyOptional({ description: 'Dirección de residencia de la persona' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @ApiPropertyOptional({ description: 'Género de la persona' })
  @IsOptional()
  @IsString({ message: 'El genero debe ser una cadena de texto' })
  gender?: string;
}