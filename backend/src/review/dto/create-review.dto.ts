import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'La calificación (rating) del 1 al 5' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'El comentario de la reseña (opcional)' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Categoría de la reseña: access, service, comfort, food',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'El ID del local (business) al que pertenece la reseña',
  })
  @IsNotEmpty()
  @IsNumber()
  business_id: number;
}
