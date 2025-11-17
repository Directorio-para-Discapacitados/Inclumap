import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Mensaje enviado por el usuario',
    example: '¿Qué lugares tienen rampa?',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Latitud de la ubicación del usuario',
    example: 4.60971,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del usuario',
    example: -74.08175,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class BusinessLocationDto {
  @ApiProperty({
    description: 'ID del negocio',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Restaurante El Sol',
  })
  name: string;

  @ApiProperty({
    description: 'Dirección del negocio',
    example: 'Calle 5 #2-3',
  })
  address: string;

  @ApiProperty({
    description: 'Latitud del negocio',
    example: 4.60971,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitud del negocio',
    example: -74.08175,
  })
  longitude: number;

  @ApiProperty({
    description: 'Distancia en kilómetros desde la ubicación del usuario',
    example: 2.5,
  })
  distance: number;
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

  @ApiProperty({
    description: 'Array de negocios con ubicación y distancia (opcional)',
    type: [BusinessLocationDto],
    required: false,
  })
  businesses?: BusinessLocationDto[];
}
