import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewReportDecisionDto {
  @IsNotEmpty({ message: 'La decisión es requerida' })
  @IsEnum(['accepted', 'rejected'], { message: 'La decisión debe ser accepted o rejected' })
  decision: 'accepted' | 'rejected';

  @IsOptional()
  @IsEnum(['add_strike', 'no_strike'], { message: 'La acción de strike debe ser add_strike o no_strike' })
  strike_action?: 'add_strike' | 'no_strike';

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  admin_notes?: string;
}
