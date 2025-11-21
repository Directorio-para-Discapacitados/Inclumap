import { BusinessEntity } from './business.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'business_views' })
export class BusinessViewEntity {
  @PrimaryGeneratedColumn()
  view_id: number;

  @ManyToOne(() => BusinessEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: BusinessEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @CreateDateColumn({ name: 'viewed_at' })
  viewed_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referrer: string;
}
