import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReviewService } from 'src/review/review.service';

@Injectable()
export class ReviewScheduler {
  private readonly logger = new Logger(ReviewScheduler.name);

  constructor(private readonly reviewService: ReviewService) {}


  @Cron('*/10 * * * *')
  async handleCron() {
    this.logger.log('🕵️ Ejecutando re-análisis periódico de reseñas (10 min)...');
    
    try {

      const result = await this.reviewService.reanalyzeAllReviews();
      
      if (result.incoherent_found > 0) {
        this.logger.warn(`⚠️ Se encontraron ${result.incoherent_found} reseñas incoherentes en el escaneo.`);
      } else {
        this.logger.log('✅ Escaneo completado. Sin novedades.');
      }
    } catch (error) {
      this.logger.error('❌ Error en el scheduler de reseñas:', error);
    }
  }
}