import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({ name: 'users'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    user_id : number;

    @Column({ type: 'varchar', length: 255,  unique: true })
    user_email: string;

    @Column({ type: 'varchar', length: 255 })
    user_password: string;

}