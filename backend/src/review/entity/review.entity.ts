import { BusinessEntity } from 'src/business/entity/business.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'review' })
export class ReviewEntity {
  @PrimaryGeneratedColumn()
  review_id: number;

  @Column({ type: 'int', comment: 'Rating del 1 al 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Sentimiento: Positivo, Negativo, Neutral' })
  sentiment_label: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Verificación de coherencia entre estrellas y texto' })
  coherence_check: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Acción sugerida: Validación automática o Revisar manualmente' })
  suggested_action: string;

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
}
