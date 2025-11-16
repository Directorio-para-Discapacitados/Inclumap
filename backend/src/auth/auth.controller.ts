import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CreateFullUserDto } from './dtos/createFullUser.dto';
import { CreateFullBusinessDto } from './dtos/createFullBusiness.dto';
import { UpgradeToBusinessDto } from './dtos/upgradeToBusiness.dto';
import { User } from './decorators/user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { usuarioEmailResetPasswordDto } from './dtos/usuario-email-resetpassword.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { GoogleAuthDto } from './dtos/google-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { PayloadInterface } from './payload/payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createFullUserDto: CreateFullUserDto,
  ): Promise<{ message: string }> {
    return this.authService.registerFullUser(createFullUserDto);
  }

  @Post('registerBusiness')
  async registerBusiness(
    @Body() createFullBusinessDto: CreateFullBusinessDto,
  ): Promise<{ message: string; token: string }> {
    return this.authService.registerFullBusiness(createFullBusinessDto);
  }

  @Post('upgrade-to-business')
  @UseGuards(JwtAuthGuard)
  async upgradeToBusiness(
    @User() user: PayloadInterface,
    @Body() businessData: UpgradeToBusinessDto,
  ): Promise<any> {
    return this.authService.upgradeToBusiness(user.user_id, businessData);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Post('request-reset-password')
  async solicitarRestablecimientoPassword(
    @Body() user: usuarioEmailResetPasswordDto,
  ): Promise<any> {
    return this.authService.solicitarRestablecimientoPassword(user);
  }

  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: { code: string }): Promise<any> {
    return this.authService.verificarCodigoRestablecimiento(body.code);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { code: string; newPassword: string },
  ): Promise<any> {
    return this.authService.restablecerPassword(body.code, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @User() user: PayloadInterface,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    return this.authService.changePassword(user.user_id, changePasswordDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: PayloadInterface): Promise<any> {
    return this.authService.getProfile(user.user_id);
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<any> {
    return this.authService.googleLoginClient(googleAuthDto);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any): Promise<any> {
    return this.authService.googleLogin(req.user);
  }

  @Get('post-login/status')
  @UseGuards(JwtAuthGuard)
  async postLoginStatus(@User() user: PayloadInterface): Promise<any> {
    return this.authService.getPostLoginStatus(user.user_id);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @User() userPayload: PayloadInterface, 
  ): Promise<{ message: string; token: string }> {
    
    const newToken = this.authService.refreshToken(userPayload); 
    
    return {
      message: 'Token refrescado exitosamente',
      token: newToken,
    };
  }
}
