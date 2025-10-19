import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";
import { RoleEntity } from '../../roles/entity/role.entity';


@Entity({ name: 'users'})
export class UserEntity {
        @PrimaryGeneratedColumn()
        user_id : number;

        @Column({ type: 'varchar', length: 255,  unique: true })
        user_email: string;

        @Column({ type: 'varchar', length: 255 })
        user_password: string;

    @Column({
      type: 'enum',
      enum: ['usuario', 'administrador'],
      default: 'usuario',
    })
    user_role: 'usuario' | 'administrador';

        @ManyToMany(() => RoleEntity)
        @JoinTable({
            name: 'users_roles',
            joinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
            inverseJoinColumn: { name: 'role_id', referencedColumnName: 'role_id' },
        })
        roles?: RoleEntity[];

}