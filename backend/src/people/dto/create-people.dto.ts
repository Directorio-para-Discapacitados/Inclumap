import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePeopleDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    firstName: string;

    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    firstLastName: string;

    @IsNotEmpty({ message: 'El celular es obligatorio' })
    @IsString({ message: 'El celular debe ser una cadena de texto' })
    cellphone: string;

    @IsNotEmpty({ message: 'La dirección es obligatoria' })
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    address: string;

    @IsNotEmpty({ message: 'El genero es obligatorio' })
    @IsString({ message: 'El genero debe ser una cadena de texto' })
    gender: string;

}