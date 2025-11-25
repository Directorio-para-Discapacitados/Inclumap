import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entity/review.entity';
import { ReviewLikeEntity } from './entity/review-like.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { SentimentService } from 'src/sentiment/sentiment.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ReviewLikeEntity)
    private readonly reviewLikeRepository: Repository<ReviewLikeEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly sentimentService: SentimentService,
    private readonly notificationService: NotificationService,
  ) {}

  //Crea una nueva reseña.

  async create(
    createReviewDto: CreateReviewDto,
    user: UserEntity,
  ): Promise<ReviewEntity> {
    const { business_id, rating, comment } = createReviewDto;

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

    // 3. Analizar sentimiento y coherencia
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
    });

    const savedReview = await this.reviewRepository.save(newReview);

    // 4. LÓGICA CORREGIDA: Flujo Usuario -> Admin
    // En lugar de avisar al admin directamente, llamamos al manejador inteligente.
    // Si es la primera vez, creará la alerta para el USUARIO (REVIEW_ATTENTION).
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

  async getReviewsForBusiness(business_id: number): Promise<ReviewEntity[]> {
    return this.reviewRepository
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
        'review.owner_reply',
        // Usuario (Solo ID)
        'user.user_id',
      ])
      .where('business.business_id = :business_id', { business_id })
      .orderBy('review.created_at', 'DESC')
      .getMany();
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
        'business.business_id',
        'business.business_name',
        'business.average_rating',
        'user.user_id',
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
      business: review.business,
      user: {
        user_id: review.user.user_id,
        name: review.user.people?.firstName,
        lastname: review.user.people?.firstLastName,
        avatar: review.user.people?.avatar,
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

    if (review.user.user_id !== user.user_id) {
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
}
