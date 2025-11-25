import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewEntity } from './review.entity';
import { UserEntity } from 'src/user/entity/user.entity';

@Entity('review_likes')
export class ReviewLikeEntity {
  @PrimaryGeneratedColumn()
  like_id: number;

  @ManyToOne(() => ReviewEntity, (review) => review.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  created_at: Date;
}
