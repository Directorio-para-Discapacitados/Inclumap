import { IsArray, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class UpgradeToBusinessDto {

    @IsNotEmpty()
    business_name: string;
  
    @IsNotEmpty()
    business_address: string;
  
    @IsNotEmpty()
    @IsNumber()
    NIT: number;
  
    @IsNotEmpty()
    description: string;
  
    @IsNotEmpty()
    coordinates: string;
  
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    accessibilityIds?: number[];
  }