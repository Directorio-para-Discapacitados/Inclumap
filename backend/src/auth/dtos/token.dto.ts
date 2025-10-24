import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
    @ApiProperty({ description: 'Token de autenticación JWT' })
    token: string;
}