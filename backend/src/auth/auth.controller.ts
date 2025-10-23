import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CreateFullUserDto } from './dtos/createFullUser.dto';
import { CreateFullBusinessDto } from './dtos/createFullBusiness.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() createFullUserDto: CreateFullUserDto): Promise<{ message: string }> {
    return this.authService.registerFullUser(createFullUserDto);
  }
  
  @Post('registerBusiness')
  async registerBusiness(@Body() createFullBusinessDto: CreateFullBusinessDto): Promise<{ message: string; token: string }> {
    return this.authService.registerFullBusiness(createFullBusinessDto);
  }


  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}