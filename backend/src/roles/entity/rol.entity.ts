import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'rol' })
export class RolEntity {
  @PrimaryGeneratedColumn()
  rol_id: number;

  @Column({ unique: true })
  rol_name: string;

  @OneToMany(() => UserRolesEntity, (userroles) => userroles.rol)
  userroles: UserRolesEntity[];
}