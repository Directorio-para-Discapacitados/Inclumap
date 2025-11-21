import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ description: 'La nueva calificación (rating) del 1 al 5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'El nuevo comentario de la reseña',
    example: 'Actualizo mi opinión, el servicio ha mejorado.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  sentiment_label?: string;

  @IsOptional()
  @IsString()
  coherence_check?: string;

  @IsOptional()
  @IsString()
  suggested_action?: string;

  @IsOptional()
  @IsString()
  owner_reply?: string;
}
