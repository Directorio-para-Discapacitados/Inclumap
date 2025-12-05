import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entity/review.entity';
import { ReviewLikeEntity } from './entity/review-like.entity';
import { ReviewReport, ReportStatus, StrikeAction } from './entity/review-report.entity';
import { ReportHistoryEntity } from './entity/report-history.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { SentimentService } from 'src/sentiment/sentiment.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/entity/notification.entity';
import { OffensiveContentDetector } from './offensive-content.detector';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ReviewLikeEntity)
    private readonly reviewLikeRepository: Repository<ReviewLikeEntity>,
    @InjectRepository(ReviewReport)
    private readonly reportRepository: Repository<ReviewReport>,
    @InjectRepository(ReportHistoryEntity)
    private readonly reportHistoryRepository: Repository<ReportHistoryEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly sentimentService: SentimentService,
    private readonly notificationService: NotificationService,
    private readonly offensiveDetector: OffensiveContentDetector,
  ) {}

  //Crea una nueva reseña.

  async create(
    createReviewDto: CreateReviewDto,
    user: UserEntity,
  ): Promise<ReviewEntity> {
    const { business_id, rating, comment } = createReviewDto;

    // 0. Verificar si el usuario está bloqueado
    if (user.is_banned) {
      throw new ForbiddenException(
        'Tu cuenta ha sido bloqueada por comportamiento ofensivo. No puedes crear reseñas.',
      );
    }

    // 1. Validar que el negocio existe
    const business = await this.businessRepository.findOne({
      where: { business_id },
    });
    if (!business) {
      throw new NotFoundException(
        `Local (Business) con ID ${business_id} no encontrado`,
      );
    }

    // 2. Validar que no haya reseña previa
    const existingReview = await this.reviewRepository.findOne({
      where: {
        business: { business_id: business.business_id },
        user: { user_id: user.user_id },
      },
    });

    if (existingReview) {
      throw new ConflictException('Ya has enviado una reseña para este local.');
    }

    // 3. Detectar contenido ofensivo (solo si hay comentario)
    let isOffensive = false;
    let offensiveWords: string[] = [];
    
    if (comment) {
      isOffensive = this.offensiveDetector.containsOffensiveContent(comment);
      console.log('🔍 Detección de contenido ofensivo:', { comment, isOffensive });
      
      if (isOffensive) {
        offensiveWords = this.offensiveDetector.getOffensiveWords(comment);
        console.log('🚨 Palabras ofensivas detectadas:', offensiveWords);
        
        // Incrementar strikes del usuario
        user.offensive_strikes = (user.offensive_strikes || 0) + 1;
        await this.userRepository.save(user);
        console.log(`📊 Usuario ${user.user_id} ahora tiene ${user.offensive_strikes} strikes`);

        // Si es el tercer strike o más, bloquear la cuenta
        if (user.offensive_strikes >= 3) {
          user.is_banned = true;
          await this.userRepository.save(user);

          // Notificar al usuario sobre el bloqueo
          await this.notificationService.notifyUser(
            user.user_id,
            '🚫 Tu cuenta ha sido bloqueada permanentemente por uso de lenguaje ofensivo repetido (3 strikes).',
          );

          throw new ForbiddenException(
            'Tu cuenta ha sido bloqueada por uso repetido de lenguaje ofensivo. Esta es tu segunda advertencia.',
          );
        }

        // Primera advertencia al usuario (pero permitir que la reseña se guarde)
        await this.notificationService.notifyUser(
          user.user_id,
          `⚠️ ADVERTENCIA: Se detectó lenguaje ofensivo en tu reseña. Este es tu strike ${user.offensive_strikes}/3. Al tercer strike tu cuenta será bloqueada permanentemente.`,
        );
        console.log('✅ Notificación de advertencia enviada al usuario');
      }
    }

    // 4. Analizar sentimiento y coherencia
    const sentimentAnalysis = this.sentimentService.analyzeReview(
      rating,
      comment,
    );

    const newReview = this.reviewRepository.create({
      rating,
      comment,
      business,
      user,
      sentiment_label: sentimentAnalysis.sentiment_label,
      coherence_check: sentimentAnalysis.coherence_check,
      suggested_action: sentimentAnalysis.suggested_action,
      is_offensive: isOffensive,
      is_reviewed_by_admin: false,
    });

    const savedReview = await this.reviewRepository.save(newReview);
    console.log('💾 Reseña guardada:', { review_id: savedReview.review_id, is_offensive: savedReview.is_offensive });

    // Notificar al administrador si hay contenido ofensivo (después de guardar la reseña)
    if (isOffensive && offensiveWords.length > 0) {
      console.log('📧 Notificando al administrador sobre contenido ofensivo...');
      await this.notifyAdminOffensiveContent(user, comment || '', offensiveWords, savedReview.review_id);
      console.log('✅ Notificación enviada a todos los administradores');
    }

    // 4. Verificar incoherencia y enviar notificación al usuario
    if (sentimentAnalysis.coherence_check.startsWith('Incoherente')) {
      await this.notificationService.handleIncoherentReview(savedReview);
    }

    // 5. Recalcular promedio
    const newAverage = await this.updateBusinessAverageRating(business_id);

    // 6. Construir respuesta limpia
    const cleanResponse = await this.findReviewClean(savedReview.review_id);
    cleanResponse.business.average_rating = newAverage;

    return cleanResponse;
  }

  //Actualiza una reseña existente.

  async update(
    review_id: number,
    updateReviewDto: UpdateReviewDto,
    user: UserEntity,
  ): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
      relations: ['user', 'business'],
    });

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada.`);
    }

    // Cargar roles del usuario para verificar si es admin
    const userWithRoles = await this.userRepository.findOne({
      where: { user_id: user.user_id },
      relations: ['userroles', 'userroles.rol'],
    });

    const isAdmin = userWithRoles?.userroles?.some((ur) => ur.rol.rol_id === 1);

    // Permitir actualización si es el dueño de la reseña O es administrador
    if (review.user.user_id !== user.user_id && !isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta reseña.',
      );
    }

    // Si se actualizó rating o comment, re-analizar sentimiento
    if (
      updateReviewDto.rating !== undefined ||
      updateReviewDto.comment !== undefined
    ) {
      const newRating = updateReviewDto.rating ?? review.rating;
      const newComment = updateReviewDto.comment ?? review.comment;

      const sentimentAnalysis = this.sentimentService.analyzeReview(
        newRating,
        newComment,
      );

      updateReviewDto.sentiment_label = sentimentAnalysis.sentiment_label;
      updateReviewDto.coherence_check = sentimentAnalysis.coherence_check;
      updateReviewDto.suggested_action = sentimentAnalysis.suggested_action;
    }

    const updatedReview = this.reviewRepository.merge(review, updateReviewDto);
    await this.reviewRepository.save(updatedReview);

    // CORRECCIÓN AQUÍ: Pasar AMBOS IDs (reseña y negocio)
    // Esto asegura que se borren tanto las alertas de usuario como las de admin
    await this.notificationService.resolveReviewNotifications(
      review.review_id,
      review.business.business_id,
    );

    const newAverage = await this.updateBusinessAverageRating(
      review.business.business_id,
    );

    // Usamos nuestra función privada para construir la respuesta
    const cleanResponse = await this.findReviewClean(review_id);

    // Asignamos el promedio actualizado a la respuesta
    cleanResponse.business.average_rating = newAverage;

    return cleanResponse;
  }

  //Obtiene todas las reseñas de un local (versión minimalista).

  async getReviewsForBusiness(business_id: number, user_id?: number): Promise<any[]> {
    // Obtener IDs de reseñas con reportes pendientes
    const reportedReviewIds = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.review_id')
      .where('report.status = :status', { status: ReportStatus.PENDING })
      .getMany();

    const reportedIds = reportedReviewIds.map(r => r.review_id);

    // Obtener reseñas del negocio excluyendo las reportadas
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.people', 'people')
      .leftJoin('review.business', 'business')
      .select([
        // Reseña
        'review.review_id',
        'review.rating',
        'review.comment',
        'review.created_at',
        'review.sentiment_label',
        'review.coherence_check',
        'review.suggested_action',
        'review.owner_reply',
        // Usuario con sus datos
        'user.user_id',
        'people.firstName',
        'people.firstLastName',
        'people.avatar',
      ])
      .where('business.business_id = :business_id', { business_id })
      .andWhere(reportedIds.length > 0 ? 'review.review_id NOT IN (:...reportedIds)' : '1=1', 
        reportedIds.length > 0 ? { reportedIds } : {})
      .orderBy('review.created_at', 'DESC')
      .getMany();

    // Agregar información de likes a cada reseña
    const reviewsWithLikes = await Promise.all(reviews.map(async (review) => {
      const likesCount = await this.reviewLikeRepository.count({
        where: { review: { review_id: review.review_id } },
      });

      let userHasLiked = false;
      if (user_id) {
        const like = await this.reviewLikeRepository.findOne({
          where: {
            review: { review_id: review.review_id },
            user: { user_id },
          },
        });
        userHasLiked = !!like;
      }

      return {
        ...review,
        likes_count: likesCount,
        user_has_liked: userHasLiked,
      };
    }));

    return reviewsWithLikes;
  }

  async setOwnerReply(
    review_id: number,
    ownerReply: string,
    user: UserEntity,
  ): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
      relations: ['business', 'business.user'],
    });

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada.`);
    }

    const businessOwner = review.business?.user;
    const isOwner = businessOwner && businessOwner.user_id === user.user_id;

    if (!isOwner) {
      throw new ForbiddenException(
        'Solo el propietario del negocio puede responder a esta reseña.',
      );
    }

    review.owner_reply = ownerReply;
    await this.reviewRepository.save(review);

    return this.findReviewClean(review_id);
  }

  //Función privada para recalcular el promedio.

  private async updateBusinessAverageRating(
    business_id: number,
  ): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.business_id = :business_id', { business_id })
      .getRawOne();

    const average_rating = parseFloat(result.avg) || 0.0;
    const rounded_average = Number(average_rating.toFixed(2));

    await this.businessRepository.update(
      { business_id },
      { average_rating: rounded_average },
    );

    return rounded_average;
  }

  //Busca una reseña por ID y devuelve solo los campos seguros.
  private async findReviewClean(review_id: number): Promise<ReviewEntity> {
    const review = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.business', 'business')
      .leftJoin('review.user', 'user')
      .select([
        // Reseña
        'review.review_id',
        'review.rating',
        'review.comment',
        'review.created_at',
        'review.sentiment_label',
        'review.coherence_check',
        'review.suggested_action',
        'review.owner_reply',
        // Local (Business)
        'business.business_id',
        'business.business_name',
        'business.average_rating',
        'business.logo_url',
        'business.verified',
        // Usuario (User)
        'user.user_id',
      ])
      .where('review.review_id = :review_id', { review_id })
      .getOne();

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada.`);
    }

    return review;
  }

  async getAllReviews(): Promise<any[]> {
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.business', 'business')
      .leftJoin('review.user', 'user')
      .leftJoin('user.people', 'people')
      .select([
        'review.review_id',
        'review.rating',
        'review.comment',
        'review.created_at',
        'review.sentiment_label',
        'review.coherence_check',
        'review.suggested_action',
        'review.owner_reply',
        'review.is_offensive',
        'review.is_reviewed_by_admin',
        'business.business_id',
        'business.business_name',
        'business.average_rating',
        'business.logo_url',
        'business.verified',
        'user.user_id',
        'user.offensive_strikes',
        'user.is_banned',
        'people.firstName',
        'people.firstLastName',
        'people.avatar',
      ])
      .orderBy('review.created_at', 'DESC')
      .getMany();

    // Mapear para la estructura de usuario deseada
    return reviews.map((review) => ({
      review_id: review.review_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      sentiment_label: review.sentiment_label,
      coherence_check: review.coherence_check,
      suggested_action: review.suggested_action,
      owner_reply: review.owner_reply,
      is_offensive: review.is_offensive,
      is_reviewed_by_admin: review.is_reviewed_by_admin,
      business: review.business,
      user: {
        user_id: review.user.user_id,
        name: review.user.people?.firstName,
        lastname: review.user.people?.firstLastName,
        avatar: review.user.people?.avatar,
        offensive_strikes: review.user.offensive_strikes || 0,
        is_banned: review.user.is_banned || false,
      },
    }));
  }

  async getMyReviews(userId: number): Promise<ReviewEntity[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.business', 'business')
      .leftJoin('review.user', 'user')
      .leftJoin('user.people', 'people')
      .select([
        // Reseña
        'review.review_id',
        'review.rating',
        'review.comment',
        'review.created_at',
        'review.sentiment_label',
        'review.coherence_check',
        'review.suggested_action',
        // Local (Business) - Campos mínimos
        'business.business_id',
        'business.business_name',
        'business.average_rating',
        // Usuario (User) - Solo ID
        'user.user_id',
        // Persona (People)
        'people.avatar',
        'people.firstName',
        'people.firstLastName',
      ])
      .where('user.user_id = :userId', { userId })
      .orderBy('review.created_at', 'DESC')
      .getMany();
  }

  async delete(
    review_id: number,
    user: UserEntity,
  ): Promise<{ message: string; newAverageRating: number }> {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
      relations: ['user', 'business'],
    });

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada.`);
    }

    // Verificar si el usuario es admin (rol_id = 1)
    const userWithRoles = await this.userRepository.findOne({
      where: { user_id: user.user_id },
      relations: ['userroles', 'userroles.rol'],
    });

    const isAdmin = userWithRoles?.userroles?.some(ur => ur.rol?.rol_id === 1);

    // Permitir eliminación si es el creador O si es admin
    if (review.user.user_id !== user.user_id && !isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta reseña.',
      );
    }

    const business_id = review.business.business_id;
    await this.reviewRepository.delete(review_id);
    const newAverage = await this.updateBusinessAverageRating(business_id);

    return {
      message: `Reseña ${review_id} eliminada exitosamente.`,
      newAverageRating: newAverage,
    };
  }

  async getAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      relations: ['user', 'business'],
      skip: skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const cleanReviews = reviews.map((review) => ({
      review_id: review.review_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      business: {
        business_id: review.business.business_id,
        business_name: review.business.business_name,
      },
      user: {
        user_id: review.user.user_id,
        user_email: review.user.user_email,
      },
    }));

    return {
      data: cleanReviews,
      total_items: total,
      total_pages: Math.ceil(total / limit),
      current_page: page,
    };
  }


  async reanalyzeAllReviews() {
    const reviews = await this.reviewRepository.find({
      relations: ['business', 'user'], 
    });

    let analyzed = 0;
    let incoherent = 0;

    for (const review of reviews) {
      if (review.comment && review.comment.trim().length > 0) {
        // Analizar sentimiento
        const sentimentAnalysis = this.sentimentService.analyzeReview(
          review.rating,
          review.comment,
        );

        // Actualizar la reseña
        review.sentiment_label = sentimentAnalysis.sentiment_label;
        review.coherence_check = sentimentAnalysis.coherence_check;
        review.suggested_action = sentimentAnalysis.suggested_action;

        await this.reviewRepository.save(review);
        analyzed++;

        // Si es incoherente, activar flujo inteligente
        if (sentimentAnalysis.coherence_check.startsWith('Incoherente')) {
          incoherent++;
          
          // CAMBIO: Usamos el manejador inteligente en vez de notificar admin directamente
          await this.notificationService.handleIncoherentReview(review);
        }
      }
    }

    return {
      message: 'Reanálisis completado con flujo escalonado (Usuario -> Admin)',
      total_reviews: reviews.length,
      analyzed: analyzed,
      incoherent_found: incoherent,
    };
  }

  // LIKES SYSTEM

  async toggleLike(review_id: number, user: UserEntity) {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
    });

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada.`);
    }

    const existingLike = await this.reviewLikeRepository.findOne({
      where: {
        review: { review_id },
        user: { user_id: user.user_id },
      },
    });

    if (existingLike) {
      // Si ya dio like, lo quitamos
      await this.reviewLikeRepository.remove(existingLike);
      const count = await this.reviewLikeRepository.count({
        where: { review: { review_id } },
      });
      return { liked: false, count };
    } else {
      // Si no ha dado like, lo agregamos
      const newLike = this.reviewLikeRepository.create({
        review,
        user,
      });
      await this.reviewLikeRepository.save(newLike);
      const count = await this.reviewLikeRepository.count({
        where: { review: { review_id } },
      });
      return { liked: true, count };
    }
  }

  async getLikesCount(review_id: number) {
    const count = await this.reviewLikeRepository.count({
      where: { review: { review_id } },
    });
    return { count };
  }

  async checkUserLiked(review_id: number, user_id: number) {
    const like = await this.reviewLikeRepository.findOne({
      where: {
        review: { review_id },
        user: { user_id },
      },
    });
    return { liked: !!like };
  }

  // MODERACIÓN DE CONTENIDO OFENSIVO

  /**
   * Notifica a todos los administradores sobre contenido ofensivo detectado
   */
  private async notifyAdminOffensiveContent(
    user: UserEntity,
    comment: string,
    offensiveWords: string[],
    reviewId: number,
  ): Promise<void> {
    console.log('🔍 Buscando administradores para notificar...');
    
    // Obtener todos los usuarios con rol de administrador (rol_id = 1)
    const admins = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userroles', 'userroles')
      .innerJoin('userroles.rol', 'rol')
      .where('rol.rol_id = :rolId', { rolId: 1 })
      .getMany();

    console.log(`👥 Administradores encontrados: ${admins.length}`, admins.map(a => ({ id: a.user_id, email: a.user_email })));

    const userName = user.people?.firstName || user.user_email;
    const strikes = user.offensive_strikes || 1;
    const censoredComment = this.offensiveDetector.censorOffensiveContent(comment);

    const message = `🚨 ALERTA: Contenido ofensivo detectado
Usuario: ${userName} (ID: ${user.user_id})
Strikes: ${strikes}/3
Palabras detectadas: ${offensiveWords.join(', ')}
Comentario: "${censoredComment}"
${strikes >= 3 ? '⛔ Usuario bloqueado automáticamente' : strikes === 2 ? '⚠️ Segunda advertencia - próximo strike bloqueará la cuenta' : '⚠️ Primera advertencia enviada'}`;

    // Notificar a cada administrador con el ID de la reseña
    for (const admin of admins) {
      console.log(`📨 Enviando notificación a admin ${admin.user_id}...`);
      await this.notificationService.createNotification(
        admin.user_id,
        NotificationType.REVIEW_ALERT,
        message,
        reviewId,
      );
      console.log(`✅ Notificación enviada a admin ${admin.user_id}`);
    }
  }

  /**
   * Obtiene reseñas ofensivas e incoherentes pendientes de revisión (solo admins)
   */
  async getOffensiveReviews(): Promise<any[]> {
    // Obtener reseñas ofensivas
    const offensiveReviews = await this.reviewRepository.find({
      where: { is_offensive: true, is_reviewed_by_admin: false },
      relations: ['user', 'user.people', 'business'],
      order: { created_at: 'DESC' },
    });

    console.log(`🔍 Reseñas ofensivas encontradas: ${offensiveReviews.length}`);
    offensiveReviews.forEach(r => {
      console.log(`  - ID: ${r.review_id}, Comment: "${r.comment}", is_offensive: ${r.is_offensive}, is_reviewed: ${r.is_reviewed_by_admin}`);
    });

    // Obtener reseñas incoherentes NO revisadas
    const incoherentReviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.people', 'people')
      .leftJoinAndSelect('review.business', 'business')
      .where('review.coherence_check LIKE :pattern', { pattern: 'Incoherente%' })
      .andWhere('review.is_reviewed_by_admin = :reviewed', { reviewed: false })
      .orderBy('review.created_at', 'DESC')
      .getMany();

    console.log(`🔍 Reseñas incoherentes encontradas: ${incoherentReviews.length}`);

    // Mapear y agregar campo 'reason' para distinguir el tipo
    const mappedOffensive = offensiveReviews.map(review => ({
      ...review,
      reason: 'offensive',
      user: {
        user_id: review.user.user_id,
        name: review.user.people?.firstName || 'Usuario',
        lastname: review.user.people?.firstLastName || '',
        avatar: review.user.people?.avatar || review.user.avatar_url || null,
        offensive_strikes: review.user.offensive_strikes || 0,
        is_banned: review.user.is_banned || false,
      },
    }));

    const mappedIncoherent = incoherentReviews.map(review => ({
      ...review,
      reason: 'incoherent',
      user: {
        user_id: review.user.user_id,
        name: review.user.people?.firstName || 'Usuario',
        lastname: review.user.people?.firstLastName || '',
        avatar: review.user.people?.avatar || review.user.avatar_url || null,
        offensive_strikes: review.user.offensive_strikes || 0,
        is_banned: review.user.is_banned || false,
      },
    }));

    // Combinar ambas listas y ordenar por fecha
    const allReviews = [...mappedOffensive, ...mappedIncoherent];
    allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`📋 Total reseñas para moderación: ${allReviews.length} (${mappedOffensive.length} ofensivas, ${mappedIncoherent.length} incoherentes)`);
    
    return allReviews;
  }

  /**
   * Marca una reseña (ofensiva o incoherente) como revisada por el admin
   */
  async markOffensiveReviewAsReviewed(review_id: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
    });

    if (!review) {
      throw new NotFoundException(`Reseña con ID ${review_id} no encontrada`);
    }

    await this.reviewRepository.update(
      { review_id },
      { is_reviewed_by_admin: true },
    );

    console.log(`✅ Reseña ${review_id} marcada como revisada`);
  }

  /**
   * Obtiene el historial de strikes de un usuario
   */
  async getUserStrikes(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { user_id },
      select: ['user_id', 'offensive_strikes', 'is_banned'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      user_id: user.user_id,
      strikes: user.offensive_strikes || 0,
      is_banned: user.is_banned,
      status: user.is_banned ? 'Bloqueado' : user.offensive_strikes >= 1 ? 'Advertido' : 'Normal',
    };
  }

  /**
   * Reportar usuario - incrementa strikes y envía notificación
   */
  async reportUser(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { user_id },
      relations: ['people'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Incrementar strikes
    user.offensive_strikes = (user.offensive_strikes || 0) + 1;

    // Si alcanza 3 strikes, bloquear automáticamente
    if (user.offensive_strikes >= 3) {
      user.is_banned = true;

      // Enviar notificación de bloqueo
      await this.notificationService.createNotification(
        user.user_id,
        NotificationType.REVIEW_ATTENTION,
        `⛔ Tu cuenta ha sido bloqueada permanentemente debido a múltiples violaciones de nuestras normas de comunidad. Has acumulado ${user.offensive_strikes} strikes por contenido inapropiado.`,
      );
    } else {
      // Enviar notificación de advertencia
      await this.notificationService.createNotification(
        user.user_id,
        NotificationType.REVIEW_ATTENTION,
        `⚠️ Has recibido un strike por contenido inapropiado. Actualmente tienes ${user.offensive_strikes} strike(s). Si acumulas 3 strikes, tu cuenta será bloqueada permanentemente.`,
      );
    }

    await this.userRepository.save(user);

    return {
      message: user.is_banned 
        ? 'Usuario bloqueado por acumular 3 strikes' 
        : 'Strike agregado y notificación enviada',
      user_id: user.user_id,
      strikes: user.offensive_strikes,
      is_banned: user.is_banned,
    };
  }

  /**
   * Crear un reporte de reseña (nuevo sistema)
   */
  async createReviewReport(
    review_id: number,
    reason: string,
    reporter: UserEntity,
  ) {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
      relations: ['user', 'user.people', 'business'],
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (review.user.user_id === reporter.user_id) {
      throw new ForbiddenException('No puedes reportar tu propia reseña');
    }

    // Cargar datos completos del reportero para la notificación
    const reporterFullData = await this.userRepository.findOne({
      where: { user_id: reporter.user_id },
      relations: ['people'],
    });

    // Crear registro de reporte
    const reportRecord = this.reportRepository.create({
      review_id,
      user_id: reporter.user_id,
      reason,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(reportRecord);

    // Construir nombre del reportero
    const reporterName = reporterFullData?.people
      ? `${reporterFullData.people.firstName} ${reporterFullData.people.firstLastName || ''}`.trim()
      : 'Usuario';

    // Notificar a admins sobre el nuevo reporte
    const admins = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userroles', 'userroles')
      .where('userroles.rol_id = :rolId', { rolId: 1 })
      .select(['user.user_id'])
      .getMany();

    console.log(`📢 Notificando a ${admins.length} admin(s) sobre nuevo reporte de reseña #${review_id}`);

    for (const admin of admins) {
      try {
        await this.notificationService.createNotification(
          admin.user_id,
          NotificationType.REVIEW_ATTENTION,
          `Nueva reseña reportada en "${review.business.business_name}" por ${reporterName}. Razón: ${reason.substring(0, 50)}...`,
          review_id,
        );
        console.log(`✓ Notificación enviada al admin ${admin.user_id}`);
      } catch (error) {
        console.error(`✗ Error notificando al admin ${admin.user_id}:`, error);
      }
    }

    // Notificar al autor de la reseña sobre el reporte
    try {
      await this.notificationService.createNotification(
        review.user.user_id,
        NotificationType.REVIEW_ATTENTION,
        `Tu reseña en "${review.business.business_name}" ha sido reportada y está siendo revisada por un administrador.`,
        review.business.business_id,
      );
      console.log(`✓ Notificación enviada al autor de la reseña ${review.user.user_id}`);
    } catch (error) {
      console.error(`✗ Error notificando al autor:`, error);
    }

    return {
      message: 'Reporte creado exitosamente',
      report_id: savedReport.report_id,
      review_id,
    };
  }

  /**
   * Obtener reportes pendientes (admin)
   */
  async getPendingReports(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.reportRepository
        .createQueryBuilder('report')
        .leftJoinAndSelect('report.review', 'review')
        .leftJoinAndSelect('review.user', 'review_author')
        .leftJoinAndSelect('review_author.people', 'review_author_people')
        .leftJoinAndSelect('review.business', 'business')
        .leftJoinAndSelect('report.user', 'reporter')
        .leftJoinAndSelect('reporter.people', 'reporter_people')
        .where('report.status = :status', { status: ReportStatus.PENDING })
        .orderBy('report.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany(),
      this.reportRepository.countBy({ status: ReportStatus.PENDING }),
    ]);

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener historial de reportes (admin)
   */
  async getReportHistoryList(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.reportRepository
        .createQueryBuilder('report')
        .leftJoinAndSelect('report.review', 'review')
        .leftJoinAndSelect('review.user', 'review_author')
        .leftJoinAndSelect('review_author.people', 'review_author_people')
        .leftJoinAndSelect('review.business', 'business')
        .leftJoinAndSelect('report.user', 'reporter')
        .leftJoinAndSelect('reporter.people', 'reporter_people')
        .leftJoinAndSelect('report.admin', 'admin')
        .leftJoinAndSelect('admin.people', 'admin_people')
        .where('report.status IN (:...statuses)', { statuses: [ReportStatus.ACCEPTED, ReportStatus.REJECTED] })
        .orderBy('report.updated_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany(),
      this.reportRepository
        .createQueryBuilder('report')
        .where('report.status IN (:...statuses)', { statuses: [ReportStatus.ACCEPTED, ReportStatus.REJECTED] })
        .getCount(),
    ]);

    // Mapear la respuesta al formato esperado por el frontend
    const mappedReports = reports.map((report) => ({
      history_id: report.report_id,
      review_id: report.review_id,
      report_type: 'review_reported',
      decision: report.status === ReportStatus.ACCEPTED ? 'accepted' : 'rejected',
      action_taken: report.strike_action || 'no_action',
      created_at: report.updated_at,
      business_name: report.review?.business?.business_name || 'Negocio desconocido',
      content_snapshot: report.review?.comment || '',
      report_reason: report.reason || '',
      admin_notes: report.admin_notes || null,
      admin: report.admin ? {
        user_id: report.admin.user_id,
        name: report.admin.people?.firstName || 'Admin',
        lastname: report.admin.people?.firstLastName || '',
        avatar: report.admin.people?.avatar || null,
      } : null,
      reported_user: report.review?.user ? {
        user_id: report.review.user.user_id,
        name: report.review.user.people?.firstName || 'Usuario',
        lastname: report.review.user.people?.firstLastName || '',
        avatar: report.review.user.people?.avatar || null,
      } : null,
      reporter_user: report.user ? {
        user_id: report.user.user_id,
        name: report.user.people?.firstName || 'Usuario',
        lastname: report.user.people?.firstLastName || '',
        avatar: report.user.people?.avatar || null,
      } : null,
    }));

    return {
      data: mappedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener reportes de una reseña
   */
  async getReviewReports(review_id: number, page: number = 1, limit: number = 10) {
    return {
      data: [],
      total: 0,
    };
  }

  /**
   * Resolver decisión de reporte
   */
  async resolveReportDecision(
    report_id: number,
    decision: 'accepted' | 'rejected',
    strike_action?: 'add_strike' | 'no_strike' | 'with_strike' | 'without_strike',
    admin_notes?: string,
    admin?: UserEntity,
  ) {
    const report = await this.reportRepository.findOne({
      where: { report_id },
      relations: ['review', 'review.user', 'review.user.people', 'review.business'],
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (decision === 'accepted') {
      // Si se acepta, eliminar la reseña
      return this.deleteReportedReview(report_id, strike_action as any, admin_notes, admin);
    } else {
      // Si se rechaza, restaurar visibilidad de la reseña
      return this.rejectReport(report_id, admin, admin_notes);
    }
  }

  /**
   * Rechazar reporte - La reseña vuelve a ser visible
   */
  async rejectReport(report_id: number, admin?: UserEntity, admin_notes?: string) {
    const report = await this.reportRepository.findOne({
      where: { report_id },
      relations: ['review', 'review.user', 'review.user.people', 'review.business', 'user', 'user.people'],
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    // Actualizar el reporte a rechazado
    report.status = ReportStatus.REJECTED;
    report.admin_id = admin?.user_id || null;
    report.admin_notes = admin_notes || null;
    await this.reportRepository.save(report);

    // Guardar en el historial
    const history = this.reportHistoryRepository.create({
      review_id: report.review.review_id,
      report_type: 'review_report',
      decision: 'rejected',
      admin_id: admin?.user_id || null,
      reported_user_id: report.review.user.user_id,
      reporter_user_id: report.user_id,
      content_snapshot: report.review.comment || '',
      report_reason: report.reason,
      admin_notes: admin_notes || null,
      action_taken: 'report_rejected',
    });

    await this.reportHistoryRepository.save(history);

    // Notificar al usuario que reportó que su reporte fue rechazado
    try {
      await this.notificationService.createNotification(
        report.user_id,
        NotificationType.REVIEW_ATTENTION,
        `Tu reporte sobre la reseña en "${report.review.business?.business_name || 'este negocio'}" ha sido revisado y rechazado por el administrador.`,
        report.review_id,
      );
    } catch (error) {
      console.error('Error notificando al reportero:', error);
    }

    // Notificar al autor de la reseña que su reseña vuelve a estar visible
    try {
      await this.notificationService.createNotification(
        report.review.user.user_id,
        NotificationType.REVIEW_ATTENTION,
        `Tu reseña en "${report.review.business?.business_name || 'este negocio'}" está nuevamente visible en la plataforma.`,
        report.review_id,
      );
    } catch (error) {
      console.error('Error notificando al autor:', error);
    }

    return {
      message: 'Reporte rechazado. Reseña restaurada a su visibilidad anterior.',
      report: report,
    };
  }

  /**
   * Aceptar reporte - Eliminar reseña reportada y opcionalmente agregar strike
   */
  async deleteReportedReview(
    report_id: number,
    strike_action?: 'add_strike' | 'no_strike' | 'with_strike' | 'without_strike',
    admin_notes?: string,
    admin?: UserEntity,
  ) {
    const report = await this.reportRepository.findOne({
      where: { report_id },
      relations: ['review', 'review.user', 'review.user.people', 'user', 'user.people', 'review.business'],
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    // Normalizar strike_action
    const normalizedStrike = strike_action === 'with_strike' || strike_action === 'add_strike' ? 'add_strike' : 'no_strike';

    // Actualizar el reporte a aceptado
    report.status = ReportStatus.ACCEPTED;
    report.strike_action = normalizedStrike === 'add_strike' ? StrikeAction.WITH_STRIKE : StrikeAction.WITHOUT_STRIKE;
    report.admin_id = admin?.user_id || null;
    report.admin_notes = admin_notes || null;
    await this.reportRepository.save(report);

    // Cargar el usuario (autor de la reseña) con datos completos
    const reviewAuthor = await this.userRepository.findOne({
      where: { user_id: report.review.user.user_id },
    });

    if (!reviewAuthor) {
      throw new NotFoundException('Usuario autor de la reseña no encontrado');
    }

    // Si se agrega strike, actualizar el contador
    let strikeData = {
      current_strikes: reviewAuthor.offensive_strikes,
      max_strikes: 3,
      is_banned: reviewAuthor.is_banned,
      banned_after_this_strike: false,
    };

    if (normalizedStrike === 'add_strike' && !reviewAuthor.is_banned) {
      reviewAuthor.offensive_strikes += 1;
      strikeData.current_strikes = reviewAuthor.offensive_strikes;
      
      // Si alcanza 3 strikes, banear la cuenta
      if (reviewAuthor.offensive_strikes >= 3) {
        reviewAuthor.is_banned = true;
        strikeData.is_banned = true;
        strikeData.banned_after_this_strike = true;
      }
    }

    await this.userRepository.save(reviewAuthor);

    // Eliminar la reseña
    await this.reviewRepository.delete({ review_id: report.review.review_id });

    // Guardar en el historial
    const history = this.reportHistoryRepository.create({
      review_id: report.review.review_id,
      report_type: 'review_report',
      decision: 'accepted',
      admin_id: admin?.user_id || null,
      reported_user_id: reviewAuthor.user_id,
      reporter_user_id: report.user_id,
      content_snapshot: report.review.comment || '',
      report_reason: report.reason,
      admin_notes: admin_notes || null,
      action_taken: normalizedStrike === 'add_strike' ? `strike_added_${strikeData.current_strikes}_of_3` : 'review_deleted',
    });

    await this.reportHistoryRepository.save(history);

    // Notificar al autor de la reseña
    try {
      await this.notificationService.createNotification(
        reviewAuthor.user_id,
        NotificationType.REVIEW_ATTENTION,
        `Tu reseña ha sido eliminada tras ser reportada. ${normalizedStrike === 'add_strike' ? `Strike ${strikeData.current_strikes}/3. ${strikeData.banned_after_this_strike ? 'Tu cuenta ha sido bloqueada.' : ''}` : ''}`,
        report.review.review_id,
      );
    } catch (error) {
      console.error('Error notificando al usuario:', error);
    }

    return {
      message: 'Reporte aceptado. Reseña eliminada.',
      report: report,
      strike_info: strikeData,
    };
  }

  /**
   * Obtener estadísticas de reportes
   */
  async getReportStatistics() {
    const total = await this.reportRepository.countBy({ status: ReportStatus.ACCEPTED }) + 
                  await this.reportRepository.countBy({ status: ReportStatus.REJECTED });
    const accepted = await this.reportRepository.countBy({ status: ReportStatus.ACCEPTED });
    const rejected = await this.reportRepository.countBy({ status: ReportStatus.REJECTED });
    
    const acceptanceRate = total > 0 ? `${((accepted / total) * 100).toFixed(2)}%` : '0%';

    return {
      total,
      accepted,
      rejected,
      acceptanceRate,
    };
  }

  /**
   * Obtener historial con filtro por decisión
   */
  async getReportHistoryByDecision(decision: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const statusMap = {
      'accepted': ReportStatus.ACCEPTED,
      'rejected': ReportStatus.REJECTED,
    };

    const status = statusMap[decision] || ReportStatus.ACCEPTED;

    const [reports, total] = await Promise.all([
      this.reportRepository
        .createQueryBuilder('report')
        .leftJoinAndSelect('report.review', 'review')
        .leftJoinAndSelect('review.user', 'review_author')
        .leftJoinAndSelect('review_author.people', 'review_author_people')
        .leftJoinAndSelect('review.business', 'business')
        .leftJoinAndSelect('report.user', 'reporter')
        .leftJoinAndSelect('reporter.people', 'reporter_people')
        .leftJoinAndSelect('report.admin', 'admin')
        .leftJoinAndSelect('admin.people', 'admin_people')
        .where('report.status = :status', { status })
        .orderBy('report.updated_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany(),
      this.reportRepository.countBy({ status }),
    ]);

    // Mapear la respuesta al formato esperado por el frontend
    const mappedReports = reports.map((report) => ({
      history_id: report.report_id,
      review_id: report.review_id,
      report_type: 'review_reported',
      decision: report.status === ReportStatus.ACCEPTED ? 'accepted' : 'rejected',
      action_taken: report.strike_action || 'no_action',
      created_at: report.updated_at,
      business_name: report.review?.business?.business_name || 'Negocio desconocido',
      content_snapshot: report.review?.comment || '',
      report_reason: report.reason || '',
      admin_notes: report.admin_notes || null,
      admin: report.admin ? {
        user_id: report.admin.user_id,
        name: report.admin.people?.firstName || 'Admin',
        lastname: report.admin.people?.firstLastName || '',
        avatar: report.admin.people?.avatar || null,
      } : null,
      reported_user: report.review?.user ? {
        user_id: report.review.user.user_id,
        name: report.review.user.people?.firstName || 'Usuario',
        lastname: report.review.user.people?.firstLastName || '',
        avatar: report.review.user.people?.avatar || null,
      } : null,
      reporter_user: report.user ? {
        user_id: report.user.user_id,
        name: report.user.people?.firstName || 'Usuario',
        lastname: report.user.people?.firstLastName || '',
        avatar: report.user.people?.avatar || null,
      } : null,
    }));

    return {
      data: mappedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener reseñas del usuario
   */
  async getUserReviews(userId: number) {
    return this.reviewRepository.find({
      where: { user: { user_id: userId } },
      relations: ['business'],
    });
  }

  /**
   * Aprobar reseña
   */
  async approveReview(review_id: number, admin?: UserEntity) {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    review.status = 'approved';
    await this.reviewRepository.save(review);

    return { message: 'Reseña aprobada' };
  }

  /**
   * Rechazar reseña
   */
  async rejectReview(review_id: number, admin?: UserEntity) {
    const review = await this.reviewRepository.findOne({
      where: { review_id },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    review.status = 'rejected';
    await this.reviewRepository.save(review);

    return { message: 'Reseña rechazada' };
  }
}

