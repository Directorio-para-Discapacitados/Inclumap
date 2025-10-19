import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'people' })
export class PeopleEntity {
    @PrimaryGeneratedColumn()
    people_id: number;

    @Column({type: 'varchar', length: 255})
    firstName: string;

    @Column({type: 'varchar', length: 255})
    firstLastName: string;

    @Column({type: 'varchar', length: 255})
    cellphone: string;

    @Column({type: 'varchar', length: 255})
    address: string;

    @Column({type: 'varchar', length: 255})
    gender: string;

    @OneToOne(() => UserEntity, (user) => user.people, { onDelete: 'CASCADE' })
    user: UserEntity;
}
