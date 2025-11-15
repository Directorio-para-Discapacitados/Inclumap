import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccesibilityDto } from './dto/create-accessibility.dto';
import { AccessibilityEntity } from './entity/accesibility.entity';
import { UpdateAccesibilityDto } from './dto/update-accessibiity.dto';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';

@Injectable()
export class AccessibilityService {
  constructor(
    @InjectRepository(AccessibilityEntity)
    private readonly accessibilityRepository: Repository<AccessibilityEntity>,
  ) {}

  async create(createAccessibilityDto: CreateAccesibilityDto): Promise<string> {
    try {
      // Verificar si ya existe una accesibilidad con el mismo nombre
      const existingAccessibility = await this.accessibilityRepository.findOne({
        where: {
          accessibility_name: createAccessibilityDto.accessibility_name,
        },
      });

      if (existingAccessibility) {
        throw new ConflictException(
          'Ya existe una accesibilidad con este nombre',
        );
      }

      // Crear nueva accesibilidad
      const accessibility = this.accessibilityRepository.create(
        createAccessibilityDto,
      );
      await this.accessibilityRepository.save(accessibility);

      return 'Accesibilidad creada exitosamente';
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al crear la accesibilidad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async obtenerAccesibilidades(): Promise<AccessibilityEntity[]> {
    try {
      return await this.accessibilityRepository.find({
        order: { accessibility_name: 'ASC' },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al obtener las accesibilidades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async obtenerAccesibilidadesPorId(id: number): Promise<AccessibilityEntity> {
    try {
      const accessibility = await this.accessibilityRepository.findOne({
        where: { accessibility_id: id },
      });

      if (!accessibility) {
        throw new NotFoundException(`Accesibilidad con ID ${id} no encontrada`);
      }

      return accessibility;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al obtener la accesibilidad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async actualizarAccesibilidad(
    id: number,
    updateAccessibilityDto: UpdateAccesibilityDto,
  ): Promise<string> {
    try {
      await this.obtenerAccesibilidadesPorId(id);

      if (updateAccessibilityDto.accessibility_name) {
        const existingAccessibility =
          await this.accessibilityRepository.findOne({
            where: {
              accessibility_name: updateAccessibilityDto.accessibility_name,
            },
          });

        if (
          existingAccessibility &&
          existingAccessibility.accessibility_id !== id
        ) {
          throw new ConflictException(
            'Ya existe otra accesibilidad con este nombre',
          );
        }
      }

      // Actualizar la accesibilidad
      await this.accessibilityRepository.update(id, updateAccessibilityDto);

      return 'Accesibilidad actualizada exitosamente';
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al actualizar la accesibilidad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async eliminarAccesibilidad(id: number): Promise<string> {
    const queryRunner =
      this.accessibilityRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.obtenerAccesibilidadesPorId(id);

      const hasRelations = await queryRunner.manager
        .getRepository(BusinessAccessibilityEntity)
        .createQueryBuilder('business_accessibility')
        .where('business_accessibility.accessibility_id = :id', { id })
        .getCount();

      if (hasRelations > 0) {
        throw new ConflictException(
          'No se puede eliminar la accesibilidad porque está siendo utilizada en negocios',
        );
      }

      await queryRunner.manager.delete(AccessibilityEntity, id);

      await queryRunner.commitTransaction();
      return 'Accesibilidad eliminada exitosamente';
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error al eliminar la accesibilidad',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
