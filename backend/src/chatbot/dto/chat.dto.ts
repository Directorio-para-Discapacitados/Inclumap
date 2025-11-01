import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Mensaje enviado por el usuario',
    example: '¿Qué lugares tienen rampa?',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Respuesta generada por el bot',
    example: '¡Claro! encontré 3 lugares con rampa.',
  })
  response: string;

  @ApiProperty({
    description: 'Sugerencias de lugares (opcional)',
    type: [String],
    example: ['Restaurante El Sol (Calle 5 #2-3)'],
    required: false,
  })
  suggestions?: string[];
}