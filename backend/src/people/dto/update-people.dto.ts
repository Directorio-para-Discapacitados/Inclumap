import { IsOptional, IsString } from 'class-validator';

export class UpdatePeopleDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  firstLastName?: string;

  @IsOptional()
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  cellphone?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El genero debe ser una cadena de texto' })
  gender?: string;
}