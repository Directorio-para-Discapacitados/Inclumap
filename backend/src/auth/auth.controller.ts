import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    // body should contain { email, password }
    // For now, this is a stub that requires full implementation
    const user = { user_email: body.email, user_id: 1, user_role: 'administrador' };
    return this._authService.login(user);
  }
}
