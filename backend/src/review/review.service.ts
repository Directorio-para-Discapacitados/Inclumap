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
import { UpdateReviewDto } from './dto/update-review.dto';
import { SentimentService } from 'src/sentiment/sentiment.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    private readonly sentimentService: SentimentService,
    private readonly notificationService: NotificationService,
  ) {}

  //Crea una nueva reseña.

  async create(
    createReviewDto: CreateReviewDto,
    user: UserEntity,
  ): Promise<ReviewEntity> {
    const { business_id, rating, comment } = createReviewDto;

    const business = await this.businessRepository.findOne({
      where: { business_id },
    });
    if (!business) {
      throw new NotFoundException(
        `Local (Business) con ID ${business_id} no encontrado`,
      );
    }

    const existingReview = await this.reviewRepository.findOne({
      where: {
        business: { business_id: business.business_id },
        user: { user_id: user.user_id },
      },
    });

    if (existingReview) {
      throw new ConflictException('Ya has enviado una reseña para este local.');
    }

    // Analizar sentimiento y coherencia
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

    // Si requiere revisión manual, notificar a todos los admins
    if (sentimentAnalysis.suggested_action === 'Revisar manualmente') {
      await this.notificationService.notifyAllAdmins(
        `Reseña incoherente detectada: ${sentimentAnalysis.coherence_check} - "${comment?.substring(0, 50)}..."`,
        savedReview.review_id,
      );
    }

    // Recalculamos el promedio
    const newAverage = await this.updateBusinessAverageRating(business_id);

    // Usamos nuestra función privada para construir la respuesta
    const cleanResponse = await this.findReviewClean(savedReview.review_id);

    // Asignamos el promedio actualizado a la respuesta
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

    if (review.user.user_id !== user.user_id) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta reseña.',
      );
    }

    // Si se actualizó rating o comment, re-analizar sentimiento
    if (updateReviewDto.rating !== undefined || updateReviewDto.comment !== undefined) {
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
        // Usuario (Solo ID)
        'user.user_id',
      ])
      .where('business.business_id = :business_id', { business_id })
      .orderBy('review.created_at', 'DESC')
      .getMany();
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
        'review.review_id', 'review.rating', 'review.comment', 'review.created_at',
        'review.sentiment_label', 'review.coherence_check', 'review.suggested_action',
        'business.business_id', 'business.business_name', 'business.average_rating',
        'user.user_id',
        'people.firstName', 
        'people.firstLastName', 
      ])
      .orderBy('review.created_at', 'DESC')
      .getMany();

    // Mapear para la estructura de usuario deseada
    return reviews.map(review => ({
      review_id: review.review_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      sentiment_label: review.sentiment_label,
      coherence_check: review.coherence_check,
      suggested_action: review.suggested_action,
      business: review.business, 
      user: {
        user_id: review.user.user_id,
        name: review.user.people?.firstName,
        lastname: review.user.people?.firstLastName,
      }
    }));
  }

  async getMyReviews(userId: number): Promise<ReviewEntity[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.business', 'business')
      .leftJoin('review.user', 'user')
      .select([
        // Reseña
        'review.review_id', 'review.rating', 'review.comment', 'review.created_at',
        'review.sentiment_label', 'review.coherence_check', 'review.suggested_action',
        // Local (Business) - Campos mínimos
        'business.business_id', 'business.business_name', 'business.average_rating',
        // Usuario (User) - Solo ID
        'user.user_id',
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


}
