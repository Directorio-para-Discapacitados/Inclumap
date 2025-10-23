import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    user_email: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    user_password: string;
}