import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { PeopleEntity } from 'src/people/entity/people.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from 'src/user/entity/user.entity';
import { RolEntity } from 'src/roles/entity/rol.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';


@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30m' }
      })
    }),
    TypeOrmModule.forFeature([UserEntity, RolEntity, UserRolesEntity, PeopleEntity]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule { }
