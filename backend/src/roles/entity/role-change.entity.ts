import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'role_changes' })
export class RoleChangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  previous_role: string | null;

  @Column({ type: 'varchar', length: 100 })
  new_role: string;

  @Column({ type: 'int', nullable: true })
  changed_by: number | null; // admin user id who made the change

  @CreateDateColumn({ type: 'timestamp' })
  changed_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;
}
