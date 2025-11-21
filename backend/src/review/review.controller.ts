import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Patch,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { UserEntity } from 'src/user/entity/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @User() user: UserEntity) {
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id/owner-reply')
  setOwnerReply(
    @Param('id', ParseIntPipe) review_id: number,
    @Body('owner_reply') owner_reply: string,
    @User() user: UserEntity,
  ) {
    return this.reviewService.setOwnerReply(review_id, owner_reply, user);
  }

  @Get()
  getAllReviews() {
    return this.reviewService.getAllReviews();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyReviews(@User() user: UserEntity) {
    return this.reviewService.getMyReviews(user.user_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('all')
  getPaginatedReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getAllPaginated(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(
    @Param('id', ParseIntPipe) review_id: number,
    @User() user: UserEntity,
  ) {
    return this.reviewService.delete(review_id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Post('reanalyze-all')
  @HttpCode(HttpStatus.OK)
  async reanalyzeAll() {
    return this.reviewService.reanalyzeAllReviews();
  }
}
