import { BusinessEntity } from "src/business/entity/business.entity";
import { PeopleEntity } from "src/people/entity/people.entity";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';


@Entity({ name: 'user'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    user_id : number;

    @Column({ type: 'varchar', length: 255,  unique: true })
    user_email: string;

    @Column({ type: 'varchar', length: 255 })
    user_password: string;

    @Column({ type: 'varchar', length: 6, nullable: true, name: 'resetpassword_token' })
    resetpassword_token: string | null;

    @Column({ type: 'timestamp', nullable: true, name: 'resetpassword_token_expiration' })
    resetpassword_token_expiration: Date | null;


    @OneToOne(() => PeopleEntity, (people) => people.user, { cascade: true, onDelete: 'CASCADE' })
    people: PeopleEntity;

    @OneToOne(() => BusinessEntity, (business) => business.user, { cascade: true, onDelete: 'CASCADE' })
    business: BusinessEntity;

    @OneToMany(() => UserRolesEntity, (userroles) => userroles.user)
    userroles: UserRolesEntity[];
}