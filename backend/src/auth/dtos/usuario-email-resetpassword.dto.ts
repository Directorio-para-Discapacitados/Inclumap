import { ApiProperty } from '@nestjs/swagger';

export class usuarioEmailResetPasswordDto {
    @ApiProperty({ description: 'Correo electrónico del usuario para restablecer contraseña' })
    user_email: string;

    @ApiProperty({ description: 'Nombre del usuario' })
    firstName: string;
}