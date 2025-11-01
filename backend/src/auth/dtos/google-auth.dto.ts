import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Token de ID de Google OAuth' })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ description: 'Token de acceso de Google OAuth (Opcional)' })
  @IsOptional() // <-- Añade esto
  @IsString()   // <-- Añade esto
  accessToken?: string; // <-- Añade el '?' para hacerlo opcional
}