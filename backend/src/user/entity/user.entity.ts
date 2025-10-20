import { PeopleEntity } from "src/people/entity/people.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity({ name: 'users'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    user_id : number;

    @Column({ type: 'varchar', length: 255,  unique: true })
    user_email: string;

    @Column({ type: 'varchar', length: 255 })
    user_password: string;

    @OneToOne(() => PeopleEntity, (people) => people.user, { cascade: true, onDelete: 'CASCADE' })
    people: PeopleEntity;
}