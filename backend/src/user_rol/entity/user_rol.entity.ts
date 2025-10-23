import { RolEntity } from 'src/roles/entity/rol.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'userroles' })
export class UserRolesEntity {
    
    @PrimaryGeneratedColumn()
    userroles_id: number;

    @ManyToOne(() => UserEntity, (user) => user.userroles, { onDelete: 'CASCADE' })
    user: UserEntity;

    @ManyToOne(() => RolEntity, (rol) => rol.userroles)
    rol: RolEntity;
}