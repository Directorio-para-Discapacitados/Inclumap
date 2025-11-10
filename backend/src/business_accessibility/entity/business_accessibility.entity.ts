import { AccessibilityEntity } from "src/accessibility/entity/accesibility.entity";
import { BusinessEntity } from "src/business/entity/business.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'business_accessibility' })
export class BusinessAccessibilityEntity {
    @PrimaryGeneratedColumn()
    business_accessibility_id: number;


    @ManyToOne(() => BusinessEntity, (business) => business.business_accessibility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: BusinessEntity;

    

    @ManyToOne(() => AccessibilityEntity, (accessibility) => accessibility.business_accessibility)
    @JoinColumn({ name: 'accessibility_id' })
    accessibility: AccessibilityEntity;
    
}
