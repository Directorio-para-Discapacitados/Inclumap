import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { RoleChangeEntity } from '../roles/entity/role-change.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { Connection, QueryRunner, Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let roleChangeRepository: Repository<RoleChangeEntity>;
  let queryRunner: QueryRunner;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConnection = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            manager: {
              connection: mockConnection as unknown as Connection,
            },
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RoleChangeEntity),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    roleChangeRepository = module.get<Repository<RoleChangeEntity>>(getRepositoryToken(RoleChangeEntity));
  });

  describe('changeUserRole', () => {
    const mockUser = {
      user_id: 1,
      user_email: 'test@test.com',
      user_role: 'usuario',
    };

    const mockAdmin = {
      user_id: 999,
      user_role: 'administrador',
    };

    beforeEach(() => {
      // Resetear implementaciones y llamadas para evitar contaminación entre pruebas
      jest.resetAllMocks();
      // Re-establecer que la conexión devuelva el queryRunner mock
      (mockConnection.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
    });

    it('debería cambiar el rol exitosamente', async () => {
      // Arrange
      const dto: ChangeRoleDto = { role: 'administrador', reason: 'Promoción' };
      const req = { user: mockAdmin };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(mockUser);
      mockQueryRunner.manager.save.mockResolvedValueOnce({ ...mockUser, user_role: dto.role });

      // Act
      const result = await service.changeUserRole(mockUser.user_id, dto, req);

      // Assert
      expect(result).toBe("Rol actualizado correctamente de 'usuario' a 'administrador'");
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debería retornar temprano si el rol es el mismo', async () => {
      // Arrange
      const dto: ChangeRoleDto = { role: 'usuario' };
      const req = { user: mockAdmin };
       mockQueryRunner.manager.findOne.mockResolvedValueOnce({
         ...mockUser,
         user_role: 'usuario' // Asegurarnos que el rol actual es el mismo que estamos intentando asignar
       });

      // Act
      const result = await service.changeUserRole(mockUser.user_id, dto, req);

      // Assert
      expect(result).toBe('No hay cambios en el rol');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el administrador no está identificado', async () => {
      // Arrange
      const dto: ChangeRoleDto = { role: 'administrador' };
      // Simular que el usuario existe y tiene un rol diferente al nuevo
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ ...mockUser, user_role: 'usuario' });
      // No se identifica admin en la petición
      const req = {};

      // Act & Assert
      await expect(service.changeUserRole(mockUser.user_id, dto, req))
        .rejects
        .toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      const dto: ChangeRoleDto = { role: 'administrador' };
      const req = { user: mockAdmin };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.changeUserRole(999, dto, req))
        .rejects
        .toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});