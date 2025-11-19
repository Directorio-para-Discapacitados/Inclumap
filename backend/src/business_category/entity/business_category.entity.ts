import { BusinessEntity } from 'src/business/entity/business.entity';
import { CategoryEntity } from 'src/category/entity/category.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'business_category' })
export class BusinessCategoryEntity {
  @PrimaryGeneratedColumn()
  category_id: number;

  @ManyToOne(() => BusinessEntity, (business) => business.business_categories)
  @JoinColumn({ name: 'business_id' })
  business: BusinessEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.business_categories)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;
}
