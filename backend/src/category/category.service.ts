import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './entity/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    try {
      const existing = await this.categoryRepository.findOne({
        where: { name: createCategoryDto.name },
      });

      if (existing) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }

      const category = this.categoryRepository.create(createCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error al crear la categoría');
    }
  }

  async findAll(): Promise<CategoryEntity[]> {
    return await this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    const category = await this.findOne(id);

    // Si intenta cambiar el nombre, verificar duplicados
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw new ConflictException('Ya existe otra categoría con ese nombre');
      }
    }

    const updated = this.categoryRepository.merge(category, updateCategoryDto);
    return await this.categoryRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id); // Verifica si existe
    await this.categoryRepository.remove(category);
    return { message: `Categoría ${id} eliminada correctamente` };
  }
}
