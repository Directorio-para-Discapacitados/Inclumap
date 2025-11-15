import { BusinessAccessibilityEntity } from "src/business_accessibility/entity/business_accessibility.entity";
import { ReviewEntity } from "src/review/entity/review.entity";
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

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'verification_image_url',})
    verification_image_url: string | null;

    @Column({ type: 'boolean', default: false, name: 'verified' })
    verified: boolean;

    @Column({type: 'varchar', length: 255})
    description: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    coordinates: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'latitude' })
    latitude: number | null;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true, name: 'longitude' })
    longitude: number | null;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0, name: 'average_rating',})
    average_rating: number; 

    @OneToMany(() => ReviewEntity, (review) => review.business)
    reviews: ReviewEntity[]; 

    @OneToMany(() => BusinessAccessibilityEntity, (businessAccessibility) => businessAccessibility.business, { cascade: true })
    business_accessibility: BusinessAccessibilityEntity[];

    @OneToOne(() => UserEntity, (user) => user.business, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity | null;


}