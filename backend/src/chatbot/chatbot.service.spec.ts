import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessEntity } from '../business/entity/business.entity';
import { AccessibilityEntity } from '../accessibility/entity/accesibility.entity';

describe('ChatbotService', () => {
  let service: ChatbotService;

  const mockBusinessRepository = {};
  const mockAccessibilityRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,

        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(AccessibilityEntity),
          useValue: mockAccessibilityRepository,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
