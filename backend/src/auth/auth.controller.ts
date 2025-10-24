import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CreateFullUserDto } from './dtos/createFullUser.dto';
import { CreateFullBusinessDto } from './dtos/createFullBusiness.dto';
import { UpgradeToBusinessDto } from './dtos/upgradeToBusiness.dto';
import { User } from './decorators/user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { usuarioEmailResetPasswordDto } from './dtos/usuario-email-resetpassword.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';


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

  @Post('upgrade-to-business')
  @UseGuards(JwtAuthGuard)
  upgradeToBusiness(@User() user: any, @Body() businessData: UpgradeToBusinessDto) {
    return this.authService.upgradeToBusiness(user.user_id, businessData);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('request-reset-password')
  async solicitarRestablecimientoPassword(@Body() user: usuarioEmailResetPasswordDto) {
    return this.authService.solicitarRestablecimientoPassword(user);
  }

  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: { code: string }) {
    return this.authService.verificarCodigoRestablecimiento(body.code);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { code: string; newPassword: string }) {
    return this.authService.restablecerPassword(body.code, body.newPassword);
  }

  @Post('change-password')
@UseGuards(JwtAuthGuard)

async changePassword(
  @User() user: any, 
  @Body() changePasswordDto: ChangePasswordDto
) {
  return this.authService.changePassword(user.user_id, changePasswordDto);
}
}