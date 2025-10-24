import { IsNotEmpty } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @ApiProperty({ description: 'Token de acceso de Google OAuth' })
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty({ description: 'Token de ID de Google OAuth' })
    @IsNotEmpty()
    idToken: string;
}