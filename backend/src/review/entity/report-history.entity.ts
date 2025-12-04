import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ReviewEntity } from './review.entity';
import { UserEntity } from '../../user/entity/user.entity';

@Entity('report_history')
export class ReportHistoryEntity {
  @PrimaryGeneratedColumn({ name: 'history_id' })
  history_id: number;

  @Column({ name: 'review_id' })
  review_id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment:
      'Tipo de reporte: owner_reply_reported, review_reported_by_owner, offensive_content, incoherent_content',
  })
  report_type: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Decisión del admin: accepted, rejected',
  })
  decision: string;

  @Column({
    name: 'admin_id',
    nullable: true,
    comment: 'ID del administrador que tomó la decisión',
  })
  admin_id: number | null;

  @Column({
    name: 'reported_user_id',
    nullable: true,
    comment: 'ID del usuario que fue reportado o cuya reseña fue reportada',
  })
  reported_user_id: number | null;

  @Column({
    name: 'reporter_user_id',
    nullable: true,
    comment: 'ID del usuario que hizo el reporte (si aplica)',
  })
  reporter_user_id: number | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Contenido de la reseña o respuesta al momento del reporte',
  })
  content_snapshot: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Razón del reporte',
  })
  report_reason: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales del administrador',
  })
  admin_notes: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment:
      'Acción tomada: deleted, warning_sent, strike_added, ban_applied, no_action',
  })
  action_taken: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ReviewEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'admin_id' })
  admin: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reporter_user_id' })
  reporterUser: UserEntity;
}
