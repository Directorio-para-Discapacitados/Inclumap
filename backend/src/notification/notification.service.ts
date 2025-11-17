import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from './entity/notification.entity';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Crea una notificación para un usuario específico
   * @param userId - ID del usuario
   * @param type - Tipo de notificación (SUGGESTION o REVIEW_ALERT)
   * @param message - Mensaje de la notificación
   * @param relatedId - ID relacionado (business_id o review_id)
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    message: string,
    relatedId?: number,
  ): Promise<NotificationEntity> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const notification = this.notificationRepository.create({
      user,
      type,
      message,
      related_id: relatedId,
      is_read: false,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Obtiene todas las notificaciones de un usuario, ordenadas por fecha (más reciente primero)
   * Filtra por tipo según el rol del usuario:
   * - Administradores: solo ven REVIEW_ALERT
   * - Usuarios regulares: solo ven SUGGESTION
   * @param userId - ID del usuario
   */
  async getUserNotifications(userId: number): Promise<NotificationEntity[]> {
    // Obtener el usuario con su rol
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userroles', 'userroles')
      .leftJoinAndSelect('userroles.rol', 'rol')
      .where('user.user_id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar si el usuario es admin
    const isAdmin = user.userroles?.some(
      (userRole) => userRole.rol?.rol_name === 'Admin',
    );

    // Query base
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoin('notification.user', 'user')
      .select([
        'notification.notification_id',
        'notification.type',
        'notification.message',
        'notification.related_id',
        'notification.is_read',
        'notification.created_at',
        'user.user_id',
      ])
      .where('user.user_id = :userId', { userId });

    // Filtrar por tipo según el rol
    if (isAdmin) {
      // Admin solo ve alertas de reseñas
      query.andWhere('notification.type = :type', {
        type: NotificationType.REVIEW_ALERT,
      });
    } else {
      // Usuarios regulares solo ven sugerencias
      query.andWhere('notification.type = :type', {
        type: NotificationType.SUGGESTION,
      });
    }

    // Ordenar por fecha (más reciente primero)
    return await query.orderBy('notification.created_at', 'DESC').getMany();
  }

  /**
   * Marca una notificación como leída
   * @param notificationId - ID de la notificación
   */
  async markAsRead(notificationId: number): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${notificationId} no encontrada`,
      );
    }

    notification.is_read = true;
    return await this.notificationRepository.save(notification);
  }

  /**
   * Elimina una notificación
   * @param notificationId - ID de la notificación
   * @param userId - ID del usuario que solicita eliminar
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: notificationId },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(
        `Notificación con ID ${notificationId} no encontrada`,
      );
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.user.user_id !== userId) {
      throw new NotFoundException(
        `No tienes permiso para eliminar esta notificación`,
      );
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Notifica a todos los administradores sobre una reseña incoherente
   * @param message - Mensaje de la alerta
   * @param reviewId - ID de la reseña
   */
  async notifyAllAdmins(message: string, reviewId: number): Promise<void> {
    // Buscar todos los usuarios con rol 'Admin'
    const admins = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.userroles', 'userroles')
      .leftJoin('userroles.rol', 'rol')
      .where('rol.rol_name = :roleName', { roleName: 'Admin' })
      .getMany();
    
    if (admins.length === 0) {
      return;
    }

    // Crear una notificación para cada admin
    const notifications = admins.map((admin) =>
      this.notificationRepository.create({
        user: admin,
        type: NotificationType.REVIEW_ALERT,
        message,
        related_id: reviewId,
        is_read: false,
      }),
    );

    await this.notificationRepository.save(notifications);
  }

  /**
   * Crea notificaciones de sugerencia para todos los usuarios registrados
   * @param message - Mensaje de la sugerencia
   * @param businessId - ID del negocio sugerido
   */
  async notifyAllUsers(message: string, businessId: number): Promise<void> {
    const users = await this.userRepository.find();

    const notifications = users.map((user) =>
      this.notificationRepository.create({
        user,
        type: NotificationType.SUGGESTION,
        message,
        related_id: businessId,
        is_read: false,
      }),
    );

    await this.notificationRepository.save(notifications);
  }
}
