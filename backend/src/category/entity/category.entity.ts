import { BusinessCategoryEntity } from 'src/business_category/entity/business_category.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'category' })
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @OneToMany(
    () => BusinessCategoryEntity,
    (business_categories) => business_categories.category,
  )
  business_categories: BusinessCategoryEntity[];
}
