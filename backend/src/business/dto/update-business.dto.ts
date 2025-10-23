import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  business_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  NIT?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coordinates?: string;
}
