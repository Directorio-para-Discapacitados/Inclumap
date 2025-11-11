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
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
  
    @IsOptional()
    @IsString()
    comment?: string;
  
    @IsNotEmpty()
    @IsNumber()
    business_id: number;
  }