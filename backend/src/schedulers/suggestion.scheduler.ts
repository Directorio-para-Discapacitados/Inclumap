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

  /**
   * Cron Job que se ejecuta cada 10 minutos
   * Busca el local con mayor calificación (> 4.0) y lo sugiere a todos los usuarios
   */
  @Cron('*/10 * * * *', {
    name: 'every-10-minutes-top-business-suggestion',
    timeZone: 'America/Bogota',
  })
  async suggestTopBusiness() {
    this.logger.log('🔄 Ejecutando tarea cada 10 minutos: Sugerir local top...');

    try {
      // Buscar el local con mayor average_rating que sea mayor a 4.0
      const topBusiness = await this.businessRepository
        .createQueryBuilder('business')
        .where('business.average_rating > :minRating', { minRating: 4.0 })
        .orderBy('business.average_rating', 'DESC')
        .addOrderBy('business.business_id', 'DESC') // En caso de empate, el más reciente
        .getOne();

      if (!topBusiness) {
        this.logger.warn(
          '⚠️  No se encontraron locales con calificación mayor a 4.0',
        );
        return;
      }

      // Parsear average_rating a número
      const rating = parseFloat(topBusiness.average_rating.toString());

      // Crear mensaje de sugerencia
      const message = `🌟 ¡Nuevo local recomendado! "${topBusiness.business_name}" tiene una calificación de ${rating.toFixed(1)} estrellas. ¡Visítalo!`;

      // Notificar a todos los usuarios
      await this.notificationService.notifyAllUsers(
        message,
        topBusiness.business_id,
      );

      this.logger.log(
        `✅ Sugerencia enviada: ${topBusiness.business_name} (${rating.toFixed(1)} ⭐)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al ejecutar sugerencia semanal: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Método manual para testing (opcional)
   * Puedes llamarlo desde un endpoint temporal para probar sin esperar la semana
   */
  async executeSuggestionManually() {
    await this.suggestTopBusiness();
  }
}
