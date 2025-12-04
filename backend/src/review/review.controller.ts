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
import { CreateReviewReportDto } from './dto/create-review-report.dto';
import { ReviewReportDecisionDto } from './dto/review-report-decision.dto';
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id', ParseIntPipe) review_id: number,
    @User() user: UserEntity,
  ) {
    return this.reviewService.toggleLike(review_id, user);
  }

  @Get(':id/likes-count')
  getLikesCount(@Param('id', ParseIntPipe) review_id: number) {
    return this.reviewService.getLikesCount(review_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/user-liked')
  checkUserLiked(
    @Param('id', ParseIntPipe) review_id: number,
    @User() user: UserEntity,
  ) {
    return this.reviewService.checkUserLiked(review_id, user.user_id);
  }

  // MODERACIÓN DE CONTENIDO OFENSIVO

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Get('moderation/offensive')
  getOffensiveReviews() {
    return this.reviewService.getOffensiveReviews();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Patch('moderation/:id/reviewed')
  @HttpCode(HttpStatus.OK)
  markAsReviewed(@Param('id', ParseIntPipe) review_id: number) {
    return this.reviewService.markOffensiveReviewAsReviewed(review_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Get('moderation/user/:userId/strikes')
  getUserStrikes(@Param('userId', ParseIntPipe) userId: number) {
    return this.reviewService.getUserStrikes(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Post('moderation/user/:userId/report')
  @HttpCode(HttpStatus.OK)
  reportUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.reviewService.reportUser(userId);
  }

  // Rechazar reporte / Marcar como revisado sin tomar acción
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Patch('moderation/:id/reviewed')
  @HttpCode(HttpStatus.OK)
  rejectReport(
    @Param('id', ParseIntPipe) review_id: number,
    @User() admin: UserEntity,
  ) {
    return this.reviewService.rejectReport(review_id, admin);
  }

  // HISTORIAL DE REPORTES

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Get('moderation/statistics')
  getReportStatistics() {
    return this.reviewService.getReportStatistics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Get('moderation/history')
  getReportHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getReportHistoryList(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Get('moderation/history/:decision')
  getReportHistoryByDecision(
    @Param('decision') decision: 'accepted' | 'rejected',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getReportHistoryByDecision(decision, page, limit);
  }

  // GESTIÓN DE RESEÑAS EN REVISIÓN

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  getUserReviews(@Param('userId', ParseIntPipe) userId: number) {
    return this.reviewService.getUserReviews(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Post('moderation/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveReview(
    @Param('id', ParseIntPipe) review_id: number,
    @User() admin: UserEntity,
  ) {
    return this.reviewService.approveReview(review_id, admin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Admin
  @Post('moderation/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectReview(
    @Param('id', ParseIntPipe) review_id: number,
    @User() admin: UserEntity,
  ) {
    return this.reviewService.rejectReview(review_id, admin);
  }

  // ===== NUEVO SISTEMA DE REPORTES DE RESEÑAS =====

  /**
   * Crear reporte de una reseña (cualquier usuario autenticado)
   * POST /reviews/reports
   */
  @UseGuards(JwtAuthGuard)
  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  createReviewReport(
    @Body() createReportDto: CreateReviewReportDto,
    @User() user: UserEntity,
  ) {
    return this.reviewService.createReviewReport(
      createReportDto.review_id,
      createReportDto.reason,
      user,
    );
  }

  /**
   * Obtener reportes pendientes de revisión (solo admin)
   * GET /reviews/reports/pending
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('reports/pending')
  getPendingReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getPendingReports(page, limit);
  }

  /**
   * Obtener historial de reportes revisados (solo admin)
   * GET /reviews/reports/history
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('reports/history')
  getReportHistoryList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getReportHistoryList(page, limit);
  }

  /**
   * Obtener reportes de una reseña específica (solo admin)
   * GET /reviews/:id/reports
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('reports/review/:reviewId')
  getReviewReports(
    @Param('reviewId', ParseIntPipe) review_id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 100) limit = 100;
    return this.reviewService.getReviewReports(review_id, page, limit);
  }

  /**
   * Resolver un reporte (aceptar o rechazar)
   * POST /reviews/reports/:id/resolve
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveReport(
    @Param('id', ParseIntPipe) report_id: number,
    @Body() decisionDto: ReviewReportDecisionDto,
    @User() admin: UserEntity,
  ) {
    return this.reviewService.resolveReportDecision(
      report_id,
      decisionDto.decision,
      decisionDto.strike_action,
      decisionDto.admin_notes,
      admin,
    );
  }
}

