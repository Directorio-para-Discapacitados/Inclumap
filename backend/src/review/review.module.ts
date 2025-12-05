import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { ReviewEntity } from './entity/review.entity';
import { ReviewLikeEntity } from './entity/review-like.entity';
import { ReviewReport } from './entity/review-report.entity';
import { ReportHistoryEntity } from './entity/report-history.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { SentimentModule } from 'src/sentiment/sentiment.module';
import { NotificationModule } from 'src/notification/notification.module';
import { OffensiveContentDetector } from './offensive-content.detector';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEntity,
      ReviewLikeEntity,
      ReviewReport,
      ReportHistoryEntity,
      BusinessEntity,
      UserEntity,
    ]),
    AuthModule,
    SentimentModule,
    NotificationModule,
  ],
  providers: [ReviewService, OffensiveContentDetector],
  controllers: [ReviewController],
})
export class ReviewModule {}
