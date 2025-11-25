import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { ReviewEntity } from './entity/review.entity';
import { ReviewLikeEntity } from './entity/review-like.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { SentimentModule } from 'src/sentiment/sentiment.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, ReviewLikeEntity, BusinessEntity, UserEntity]),
    AuthModule,
    SentimentModule,
    NotificationModule,
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
