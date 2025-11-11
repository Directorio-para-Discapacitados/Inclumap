import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
    Patch, 
  } from '@nestjs/common';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { User } from 'src/auth/decorators/user.decorator';
  import { UserEntity } from 'src/user/entity/user.entity';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { ReviewService } from './review.service';
  import { UpdateReviewDto } from './dto/update-review.dto'; 
import { ApiTags } from '@nestjs/swagger';
  
  @ApiTags('reviews')
  @Controller('reviews')
  export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}
  

    @UseGuards(JwtAuthGuard)
    @Post()
    create(
      @Body() createReviewDto: CreateReviewDto,
      @User() user: UserEntity,
    ) {
      return this.reviewService.create(createReviewDto, user);
    }
  

    @Get('business/:id')
    getForBusiness(@Param('id', ParseIntPipe) id: number) {
      return this.reviewService.getReviewsForBusiness(id);
    }
  

    @UseGuards(JwtAuthGuard)
    @Patch(':id') 
    update(
      @Param('id', ParseIntPipe) review_id: number,
      @Body() updateReviewDto: UpdateReviewDto,
      @User() user: UserEntity,
    ) {
      return this.reviewService.update(review_id, updateReviewDto, user);
    }

    
  }