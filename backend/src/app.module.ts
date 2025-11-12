import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from './config/constants';
import { PeopleModule } from './people/people.module';
import { BusinessModule } from './business/business.module';
import { BusinessAccessibilityModule } from './business_accessibility/business_accessibility.module';
import { AccessibilityModule } from './accessibility/accessibility.module';
import { AuthModule } from './auth/auth.module';
import { MailsModule } from './mails/mails.module';
import { GoogleStrategy } from './auth/strategies/google.strategy';
import { ChatbotModule } from './chatbot/chatbot.module';
import { RolesModule } from './roles/roles.module';
import { LocalRecognitionModule } from './local-recognition/local-recognition.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UserRolModule } from './user_rol/user_rol.module';
import { ReviewModule } from './review/review.module';
import { MapsModule } from './maps/maps.module';




@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', 
        host: configService.get<string>(DB_HOST),
        port: configService.get<number>(DB_PORT) ?? 5432, 
        username: configService.get<string>(DB_USER),
        password: configService.get<string>(DB_PASSWORD),
        database: configService.get<string>(DB_DATABASE),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, 
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    RolesModule,
    UserRolModule,
    PeopleModule,
    BusinessModule,
    BusinessAccessibilityModule,
    AccessibilityModule,
    AuthModule,
    MailsModule,
    ChatbotModule,
    LocalRecognitionModule,
    CloudinaryModule,
    ReviewModule,
    MapsModule,
  ],
  controllers: [AppController],
  providers: [AppService, GoogleStrategy],
})
export class AppModule {}
