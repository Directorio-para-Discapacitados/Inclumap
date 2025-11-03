import { Test, TestingModule } from '@nestjs/testing';
import { LocalRecognitionController } from './local-recognition.controller';

describe('LocalRecognitionController', () => {
  let controller: LocalRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalRecognitionController],
    }).compile();

    controller = module.get<LocalRecognitionController>(LocalRecognitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
