import { BusinessAccessibilityEntity } from "src/business_accessibility/entity/business_accessibility.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'business' })
export class BusinessEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column({type: 'varchar', length: 255})
    business_name: string;

    @Column({type: 'varchar', length: 255})
    address: string;

    @Column({type: 'varchar', length: 255})
    NIT: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    logo_url: string | null;

    @Column({type: 'varchar', length: 255})
    description: string;

    @Column({type: 'varchar', length: 255})
    coordinates: string;

    @OneToMany(() => BusinessAccessibilityEntity, (businessAccessibility) => businessAccessibility.business)
    business_accessibility: BusinessAccessibilityEntity[];

    @OneToOne(() => UserEntity, (user) => user.business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;


}