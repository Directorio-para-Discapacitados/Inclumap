import { Module, OnModuleInit } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategorySeed } from './seed/category.seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entity/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
  ],
  controllers: [CategoryController], 
  providers: [
    CategoryService, 
    CategorySeed,    
  ],
  exports: [CategorySeed, TypeOrmModule], 
})
export class CategoryModule implements OnModuleInit {
  constructor(private readonly categorySeed: CategorySeed) {}

  async onModuleInit() {
    await this.categorySeed.seed();
  }
}