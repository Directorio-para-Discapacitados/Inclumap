import { Test, TestingModule } from '@nestjs/testing';
import { LocalRecognitionController } from './local-recognition.controller';
import { LocalRecognitionService } from './local-recognition.service'; // <-- 1. Importa el Servicio

describe('LocalRecognitionController', () => {
  let controller: LocalRecognitionController;

  // 2. Crea un mock del servicio
  const mockLocalRecognitionService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalRecognitionController],
      // 3. Provee el servicio simulado
      providers: [
        {
          provide: LocalRecognitionService,
          useValue: mockLocalRecognitionService,
        },
      ],
    }).compile();

    controller = module.get<LocalRecognitionController>(
      LocalRecognitionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
