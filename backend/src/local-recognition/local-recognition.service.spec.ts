import { Test, TestingModule } from '@nestjs/testing';
import { LocalRecognitionService } from './local-recognition.service';
import { getRepositoryToken } from '@nestjs/typeorm'; // <-- 1. Importa esto
import { BusinessEntity } from '../business/entity/business.entity'; // <-- 2. Importa Entidades
import { UserEntity } from '../user/entity/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // <-- 3. Importa Servicios
import { GOOGLE_VISION_CLIENT } from './google-vision.provider'; // <-- 4. Importa el Provider

describe('LocalRecognitionService', () => {
  let service: LocalRecognitionService;

  // 5. Crea mocks para todas las dependencias
  const mockGoogleVisionClient = {};
  const mockBusinessRepository = {};
  const mockUserRepository = {}; // <-- Necesitas este también
  const mockCloudinaryService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalRecognitionService,
        // 6. Provee todos los mocks
        {
          provide: GOOGLE_VISION_CLIENT,
          useValue: mockGoogleVisionClient,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(UserEntity), // <-- Provee el User Repository
          useValue: mockUserRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<LocalRecognitionService>(LocalRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
