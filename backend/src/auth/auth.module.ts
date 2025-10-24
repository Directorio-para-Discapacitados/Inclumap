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
import { BusinessEntity } from 'src/business/entity/business.entity';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MailsService } from 'src/mails/mails.service';


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
    TypeOrmModule.forFeature([
      UserEntity, 
      RolEntity, 
      UserRolesEntity, 
      PeopleEntity, 
      BusinessEntity, 
      BusinessAccessibilityEntity, 
      AccessibilityEntity]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,  
    RolesGuard, 
    MailsService
  ],
  controllers: [AuthController],
  exports: [
    JwtAuthGuard,  
    RolesGuard,    
  ],
})
export class AuthModule { }
