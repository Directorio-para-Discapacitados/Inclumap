import { BusinessAccessibilityEntity } from "src/business_accessibility/entity/business_accessibility.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'accessibility' })
export class AccessibilityEntity {
    @PrimaryGeneratedColumn()
    accessibility_id: number;

    @Column({type: 'varchar', length: 255})
    accessibility_name: string;

    @Column({type: 'varchar', length: 255})
    description: string;

    @OneToMany(() => BusinessAccessibilityEntity, (businessAccessibility) => businessAccessibility.accessibility)
    business_accessibility: BusinessAccessibilityEntity[];

}
