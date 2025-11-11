import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { ReviewEntity } from './entity/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, BusinessEntity]), 
    AuthModule, 
  ],
  providers: [ReviewService],
  controllers: [ReviewController]
})
export class ReviewModule {}
