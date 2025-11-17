import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEntity } from './entity/notification.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { BusinessEntity } from 'src/business/entity/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserEntity, BusinessEntity]),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService, TypeOrmModule],
})
export class NotificationModule {}
