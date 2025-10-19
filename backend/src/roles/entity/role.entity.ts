import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'roles' })
export class RoleEntity {
  @PrimaryGeneratedColumn()
  role_id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  role_name: string;
}
