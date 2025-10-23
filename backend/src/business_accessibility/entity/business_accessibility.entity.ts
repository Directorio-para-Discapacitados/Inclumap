import { AccessibilityEntity } from "src/accessibility/entity/accesibility.entity";
import { BusinessEntity } from "src/business/entity/business.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'business_accessibility' })
export class BusinessAccessibilityEntity {
    @PrimaryGeneratedColumn()
    business_accessibility_id: number;

    @ManyToOne(() => BusinessEntity, (business) => business.business_accessibility)
    business: BusinessEntity;

    @ManyToOne(() => AccessibilityEntity, (accessibility) => accessibility.business_accessibility)
    accessibility: AccessibilityEntity;
    
}
