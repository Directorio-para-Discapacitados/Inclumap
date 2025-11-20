import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class SuggestionScheduler {
  private readonly logger = new Logger(SuggestionScheduler.name);

  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    private readonly notificationService: NotificationService,
  ) {}


  @Cron('*/10 * * * *', {
    name: 'every-10-minutes-top-business-suggestion',
    timeZone: 'America/Bogota',
  })
  async suggestTopBusiness() {
    this.logger.log('🔄 Ejecutando análisis de sugerencias...');

    try {
      // Buscar el local con mayor calificación (> 4.0)
      const topBusiness = await this.businessRepository
        .createQueryBuilder('business')
        .where('business.average_rating >= :minRating', { minRating: 4.0 }) 
        .orderBy('business.average_rating', 'DESC')
        .addOrderBy('business.business_id', 'DESC') 
        .getOne();

      if (!topBusiness) {
        this.logger.warn('⚠️ No se encontraron locales aptos para sugerir (> 4.0).');
        return;
      }

      // Parsear average_rating a número seguro
      const rating = Number(topBusiness.average_rating);

      // Crear mensaje atractivo
      const message = `🌟 ¡Recomendación de la semana! "${topBusiness.business_name}" destaca con ${rating.toFixed(1)} estrellas.`;

      // Llamar al servicio (que ahora filtra duplicados internamente)
      await this.notificationService.notifyAllUsers(
        message,
        topBusiness.business_id,
      );

      this.logger.log(
        `✅ Proceso completado. Local top actual: ${topBusiness.business_name} (${rating.toFixed(1)} ⭐)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en scheduler de sugerencias: ${error.message}`,
        error.stack,
      );
    }
  }
  
  async executeSuggestionManually() {
    await this.suggestTopBusiness();
  }
}
