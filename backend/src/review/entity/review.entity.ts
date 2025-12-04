import { BusinessEntity } from 'src/business/entity/business.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { ReviewLikeEntity } from './review-like.entity';
import { ReviewReport } from './review-report.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'review' })
export class ReviewEntity {
  @PrimaryGeneratedColumn()
  review_id: number;

  @Column({ type: 'int', comment: 'Rating del 1 al 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Sentimiento: Positivo, Negativo, Neutral',
  })
  sentiment_label: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Verificación de coherencia entre estrellas y texto',
  })
  coherence_check: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Acción sugerida: Validación automática o Revisar manualmente',
  })
  suggested_action: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Respuesta del propietario del negocio a la reseña',
  })
  owner_reply: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Categoría de la reseña: access, service, comfort, food',
  })
  category: string;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_offensive',
    comment: 'Marca si la reseña contiene contenido ofensivo',
  })
  is_offensive: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_reviewed_by_admin',
    comment: 'Indica si el admin ya revisó esta reseña ofensiva',
  })
  is_reviewed_by_admin: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'approved',
    comment: 'Estado de la reseña: approved, in_review, rejected',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => BusinessEntity, (business) => business.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: BusinessEntity;

  @ManyToOne(() => UserEntity, (user) => user.reviews, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => ReviewLikeEntity, (like) => like.review)
  likes: ReviewLikeEntity[];

  @OneToMany(() => ReviewReport, (report) => report.review)
  reports: ReviewReport[];
}
