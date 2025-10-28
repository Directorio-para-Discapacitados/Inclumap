import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entity/user.entity';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usuarioRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any): Promise<any> {
    
    
  
    let rolIds: number[] = [];
    
    if (payload.rolIds && Array.isArray(payload.rolIds)) {
        // Si ya viene como array, usarlo directamente
        rolIds = payload.rolIds;
        
    } else if (payload.rol_id !== undefined) {
        // Si viene como rol_id individual, convertirlo a array
        rolIds = [Number(payload.rol_id)]; 
        
    } else {
        
    }
    
      const { user_email } = payload;

    const usuario = await this.usuarioRepository.findOne({
      where: { user_email },
    });

    if (!usuario) {
      throw new UnauthorizedException('No se ha encontrado el usuario');
    }

    const userToReturn = {
      user_id: payload.user_id,
      user_email: payload.user_email,
      firstName: payload.firstName,
      firstLastName: payload.firstLastName,
      cellphone: payload.cellphone,
      address: payload.address,
      rolIds: rolIds, 
      business_id: payload.business_id,
      business_name: payload.business_name,
    };
    
 
    
    return userToReturn;
}
}