import { IsNotEmpty } from "class-validator";

export class GoogleAuthDto {
    @IsNotEmpty()
    accessToken: string;
  
    @IsNotEmpty()
    idToken: string;
  }
