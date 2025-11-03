import { Test, TestingModule } from '@nestjs/testing';
import { LocalRecognitionService } from './local-recognition.service';

describe('LocalRecognitionService', () => {
  let service: LocalRecognitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalRecognitionService],
    }).compile();

    service = module.get<LocalRecognitionService>(LocalRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
