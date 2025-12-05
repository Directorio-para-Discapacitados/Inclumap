import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewEntity } from './entity/review.entity';
import { ReviewReport } from './entity/review-report.entity';
import { ReviewLikeEntity } from './entity/review-like.entity';
import { ReportHistoryEntity } from './entity/report-history.entity';
import { UserEntity } from '../user/entity/user.entity';
import { BusinessEntity } from '../business/entity/business.entity';
import { NotificationService } from '../notification/notification.service';
import { SentimentService } from '../sentiment/sentiment.service';
import { OffensiveContentDetector } from './offensive-content.detector';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('Sistema de Reportes de Reseñas', () => {
  let service: ReviewService;
  let reviewRepository: Repository<ReviewEntity>;
  let reportRepository: Repository<ReviewReport>;
  let notificationService: NotificationService;

  const mockUser = {
    user_id: 2,
    user_email: 'reporter@test.com',
    offensive_strikes: 0,
    is_banned: false,
    people: { full_name: 'Test User' },
  } as unknown as UserEntity;

  const mockReviewAuthor = {
    user_id: 3,
    user_email: 'author@test.com',
    offensive_strikes: 0,
    is_banned: false,
    people: { full_name: 'Review Author' },
  } as unknown as UserEntity;

  const mockReview = {
    review_id: 1,
    comment: 'Gran lugar para visitar',
    rating: 5,
    status: 'approved',
    user_id: 3,
    user: mockReviewAuthor,
    business: { business_id: 1, business_name: 'Mi Negocio' },
  } as unknown as ReviewEntity;

  const mockAdmin = {
    user_id: 1,
    user_email: 'admin@test.com',
    userroles: [{ rol: { rol_id: 1, rol_name: 'Admin' } }],
  } as unknown as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReviewLikeEntity),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReviewReport),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getCount: jest.fn().mockResolvedValue(0),
            })),
          },
        },
        {
          provide: getRepositoryToken(ReportHistoryEntity),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
        {
          provide: SentimentService,
          useValue: {
            analyzeSentiment: jest.fn(),
          },
        },
        {
          provide: OffensiveContentDetector,
          useValue: {
            isOffensive: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get<Repository<ReviewEntity>>(
      getRepositoryToken(ReviewEntity),
    );
    reportRepository = module.get<Repository<ReviewReport>>(
      getRepositoryToken(ReviewReport),
    );
    notificationService = module.get<NotificationService>(NotificationService);
  });

  describe('Crear Reporte de Reseña', () => {
    it('Debe crear un reporte exitosamente', async () => {
      jest
        .spyOn(reviewRepository, 'findOne' as any)
        .mockResolvedValue(mockReview);
      jest.spyOn(reportRepository, 'findOne' as any).mockResolvedValue(null);

      const mockSavedReport = {
        report_id: 1,
        status: 'pending',
      } as ReviewReport;
      jest
        .spyOn(reportRepository, 'create' as any)
        .mockReturnValue(mockSavedReport);
      jest
        .spyOn(reportRepository, 'save' as any)
        .mockResolvedValue(mockSavedReport);
      jest.spyOn(reviewRepository, 'save' as any).mockResolvedValue(mockReview);
      jest
        .spyOn(notificationService, 'createNotification' as any)
        .mockResolvedValue({} as any);

      const result = await service.createReviewReport(
        1,
        'Esta reseña contiene contenido ofensivo',
        mockUser,
      );

      expect(result).toHaveProperty('report_id');
      expect(result).toHaveProperty('message');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('Debe lanzar error si el usuario reporta su propia reseña', async () => {
      const ownReview = {
        ...mockReview,
        user_id: mockUser.user_id,
      } as ReviewEntity;
      jest
        .spyOn(reviewRepository, 'findOne' as any)
        .mockResolvedValue(ownReview);

      await expect(
        service.createReviewReport(1, 'Razón válida', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Debe lanzar error si ya existe un reporte pendiente', async () => {
      jest
        .spyOn(reviewRepository, 'findOne' as any)
        .mockResolvedValue(mockReview);
      jest
        .spyOn(reportRepository, 'findOne' as any)
        .mockResolvedValue({} as ReviewReport);

      await expect(
        service.createReviewReport(1, 'Razón válida', mockUser),
      ).rejects.toThrow(ConflictException);
    });

    it('Debe cambiar el estado de la reseña a in_review', async () => {
      jest
        .spyOn(reviewRepository, 'findOne' as any)
        .mockResolvedValue(mockReview);
      jest.spyOn(reportRepository, 'findOne' as any).mockResolvedValue(null);

      const saveSpy = jest.spyOn(reviewRepository, 'save' as any);
      jest
        .spyOn(reportRepository, 'create' as any)
        .mockReturnValue({} as ReviewReport);
      jest
        .spyOn(reportRepository, 'save' as any)
        .mockResolvedValue({} as ReviewReport);

      await service.createReviewReport(1, 'Razón válida', mockUser);

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_review',
        }),
      );
    });
  });

  describe('Resolver Reporte - Rechazar', () => {
    it('Debe rechazar un reporte y restaurar la reseña', async () => {
      const mockReport = {
        report_id: 1,
        status: 'pending',
        review: mockReview,
        user: mockUser,
      } as ReviewReport;

      jest
        .spyOn(reportRepository, 'findOne' as any)
        .mockResolvedValue(mockReport);
      jest.spyOn(reviewRepository, 'save' as any).mockResolvedValue(mockReview);
      jest.spyOn(reportRepository, 'save' as any).mockResolvedValue(mockReport);
      jest
        .spyOn(notificationService, 'createNotification')
        .mockResolvedValue({} as any);

      const result = await service.resolveReportDecision(
        1,
        'rejected',
        undefined,
        'La reseña es legítima',
        mockAdmin,
      );

      expect(result.report.status).toBe('rejected');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(reviewRepository.save).toHaveBeenCalled();
    });
  });

  describe('Resolver Reporte - Aceptar Sin Strike', () => {
    it('Debe aceptar reporte sin dar strike', async () => {
      const mockReport = {
        report_id: 1,
        status: 'pending',
        review: mockReview,
        user: mockUser,
      } as ReviewReport;

      jest
        .spyOn(reportRepository, 'findOne' as any)
        .mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save' as any).mockResolvedValue(mockReport);
      jest
        .spyOn(notificationService, 'createNotification')
        .mockResolvedValue({} as any);

      const result = await service.resolveReportDecision(
        1,
        'accepted',
        'without_strike',
        'Cuestionable pero no grave',
        mockAdmin,
      );

      expect(result.report.strike_action).toBe('without_strike');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        mockReviewAuthor.user_id,
        expect.any(String),
        expect.stringContaining('sin sanciones'),
        expect.any(Number),
      );
    });
  });

  describe('Resolver Reporte - Aceptar Con Strike', () => {
    it('Debe aceptar reporte y dar primer strike', async () => {
      const reportedUser = { ...mockReviewAuthor, offensive_strikes: 0 };
      const mockReport = {
        report_id: 1,
        status: 'pending',
        review: { ...mockReview, user: reportedUser },
        user: mockUser,
      } as any;

      jest
        .spyOn(reportRepository, 'findOne' as any)
        .mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save' as any).mockResolvedValue(mockReport);
      // Mock del repositorio de usuarios
      jest
        .spyOn(service['userRepository'] as any, 'save' as any)
        .mockResolvedValue(reportedUser);
      jest
        .spyOn(notificationService, 'createNotification' as any)
        .mockResolvedValue({} as any);

      const result = await service.resolveReportDecision(
        1,
        'accepted',
        'with_strike',
        'Lenguaje ofensivo',
        mockAdmin,
      );

      expect(result.report.strike_action).toBe('with_strike');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('Debe bloquear usuario al alcanzar 3 strikes', async () => {
      const reportedUser = { ...mockReviewAuthor, offensive_strikes: 2 };
      const mockReport = {
        report_id: 1,
        status: 'pending',
        review: { ...mockReview, user: reportedUser },
        user: mockUser,
      } as any;

      jest
        .spyOn(reportRepository, 'findOne' as any)
        .mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save' as any).mockResolvedValue(mockReport);
      const userSaveSpy = jest.spyOn(
        service['userRepository'] as any,
        'save' as any,
      );
      userSaveSpy.mockResolvedValue(reportedUser);
      jest
        .spyOn(notificationService, 'createNotification')
        .mockResolvedValue({} as any);

      await service.resolveReportDecision(
        1,
        'accepted',
        'with_strike',
        'Tercer strike',
        mockAdmin,
      );

      expect(userSaveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          is_banned: true,
        }),
      );
    });
  });

  describe('Obtener Reportes Pendientes', () => {
    it('Debe obtener lista paginada de reportes pendientes', async () => {
      const mockReports = [
        { report_id: 1, status: 'pending' },
        { report_id: 2, status: 'pending' },
      ];

      jest
        .spyOn(reportRepository, 'findAndCount' as any)
        .mockResolvedValue([mockReports, 2]);

      const result = await service.getPendingReports(1, 10);

      expect(result).toHaveProperty('data');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('Obtener Historial de Reportes', () => {
    it('Debe obtener reportes revisados (aceptados/rechazados)', async () => {
      const mockReports = [
        { report_id: 1, status: 'accepted', strike_action: 'with_strike' },
        { report_id: 2, status: 'rejected' },
      ];

      jest
        .spyOn(reportRepository, 'findAndCount' as any)
        .mockResolvedValue([mockReports, 2]);

      const result = await service.getReportHistoryList(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('Obtener Reportes de una Reseña', () => {
    it('Debe obtener todos los reportes para una reseña específica', async () => {
      jest
        .spyOn(reviewRepository, 'findOne' as any)
        .mockResolvedValue(mockReview);

      const mockReports = [
        { report_id: 1, review_id: 1, status: 'pending' },
        { report_id: 2, review_id: 1, status: 'accepted' },
      ];

      jest
        .spyOn(reportRepository, 'findAndCount')
        .mockResolvedValue([mockReports as unknown as ReviewReport[], 2]);

      const result = await service.getReviewReports(1, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('Debe lanzar error si la reseña no existe', async () => {
      jest.spyOn(reviewRepository, 'findOne' as any).mockResolvedValue(null);

      await expect(service.getReviewReports(999, 1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
