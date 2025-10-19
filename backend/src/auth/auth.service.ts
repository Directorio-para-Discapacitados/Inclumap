import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly _userService: UserService, private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this._userService.obtenerUsuarioPorId(1).catch(() => null);
    // Implementa validación real: buscar por email y comparar password (hash)
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async login(user: any) {
    const payload = { username: user.user_email, sub: user.user_id, role: user.user_role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
