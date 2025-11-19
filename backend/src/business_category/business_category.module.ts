import { Module } from '@nestjs/common';
import { BusinessCategoryService } from './business_category.service';
import { BusinessCategoryController } from './business_category.controller';

@Module({
  providers: [BusinessCategoryService],
  controllers: [BusinessCategoryController]
})
export class BusinessCategoryModule {}
