import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessEntity,
      AccessibilityEntity,
      BusinessAccessibilityEntity,
    ]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
