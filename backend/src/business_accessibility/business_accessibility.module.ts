import { Module } from '@nestjs/common';
import { BusinessAccessibilityService } from './business_accessibility.service';
import { BusinessAccessibilityController } from './business_accessibility.controller';

@Module({
  providers: [BusinessAccessibilityService],
  controllers: [BusinessAccessibilityController]
})
export class BusinessAccessibilityModule {}
