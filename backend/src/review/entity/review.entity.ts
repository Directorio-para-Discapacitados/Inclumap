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
