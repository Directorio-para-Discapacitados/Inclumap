import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ReviewEntity } from './review.entity';
import { UserEntity } from '../../user/entity/user.entity';

export enum ReportStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum StrikeAction {
  WITH_STRIKE = 'with_strike',
  WITHOUT_STRIKE = 'without_strike',
  NONE = 'none',
}

@Entity('review_reports')
export class ReviewReport {
  @PrimaryGeneratedColumn({ name: 'report_id' })
  report_id: number;

  @Column({ name: 'review_id' })
  review_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'text', nullable: true, comment: 'Razón del reporte' })
  reason: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReportStatus.PENDING,
    comment: 'Estado del reporte: pending, accepted, rejected',
  })
  status: ReportStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: StrikeAction.NONE,
    nullable: true,
    comment: 'Acción tomada: with_strike, without_strike, none',
  })
  strike_action: StrikeAction | null;

  @Column({
    name: 'admin_id',
    type: 'int',
    nullable: true,
    comment: 'ID del administrador que revisó el reporte',
  })
  admin_id: number | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas del administrador',
  })
  admin_notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => ReviewEntity, review => review.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: UserEntity;
}
