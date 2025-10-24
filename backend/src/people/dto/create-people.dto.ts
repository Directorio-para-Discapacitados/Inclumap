import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeopleDto {
    @ApiProperty({ description: 'Nombre de la persona' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    firstName: string;

    @ApiProperty({ description: 'Apellido de la persona' })
    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    firstLastName: string;

    @ApiProperty({ description: 'Número de celular de la persona' })
    @IsNotEmpty({ message: 'El celular es obligatorio' })
    @IsString({ message: 'El celular debe ser una cadena de texto' })
    cellphone: string;

    @ApiProperty({ description: 'Dirección de residencia de la persona' })
    @IsNotEmpty({ message: 'La dirección es obligatoria' })
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    address: string;

    @ApiProperty({ description: 'Género de la persona' })
    @IsNotEmpty({ message: 'El genero es obligatorio' })
    @IsString({ message: 'El genero debe ser una cadena de texto' })
    gender: string;
}