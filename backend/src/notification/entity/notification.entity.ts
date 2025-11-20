import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from 'src/user/entity/user.entity';

export enum NotificationType {
  SUGGESTION = 'SUGGESTION',
  REVIEW_ALERT = 'REVIEW_ALERT',       
  REVIEW_ATTENTION = 'REVIEW_ATTENTION', 
}

@Entity({ name: 'notification' })
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: 'Tipo de notificación: SUGGESTION o REVIEW_ALERT',
  })
  type: NotificationType;

  @Column({ type: 'text', comment: 'Mensaje de la notificación' })
  message: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'ID relacionado (business_id o review_id)',
  })
  related_id: number;

  @Column({ type: 'boolean', default: false, comment: 'Marca si fue leída' })
  is_read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
