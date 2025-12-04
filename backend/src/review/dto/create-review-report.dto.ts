import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateReviewReportDto {
  @IsNotEmpty({ message: 'El ID de la reseña es requerido' })
  review_id: number;

  @IsNotEmpty({ message: 'La razón del reporte es requerida' })
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  @MinLength(10, { message: 'La razón debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  reason: string;
}
