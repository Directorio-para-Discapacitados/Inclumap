import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityController } from './accessibility.controller';
import { AccessibilityService } from './accessibility.service';
import { AccessibilityEntity } from './entity/accesibility.entity';
import { AccessibilitySeed } from './seed/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessibilityEntity])],
  controllers: [AccessibilityController],
  providers: [AccessibilityService, AccessibilitySeed],
  exports: [AccessibilityService],
})
export class AccessibilityModule implements OnApplicationBootstrap {
  constructor(private readonly accessibilitySeed: AccessibilitySeed) {}

  async onApplicationBootstrap() {
    await this.accessibilitySeed.seed();
  }
}
