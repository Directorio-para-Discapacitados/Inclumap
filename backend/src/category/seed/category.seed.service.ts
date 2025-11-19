import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entity/category.entity';

@Injectable()
export class CategorySeed {
  private readonly logger = new Logger(CategorySeed.name);

  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async seed() {
    const defaultCategories = [
      {
        name: 'Supermercado',
        description: 'Tiendas de autoservicio, abarrotes y víveres.',
      },
      {
        name: 'Droguería',
        description: 'Farmacias y venta de productos de salud.',
      },
      {
        name: 'Restaurante',
        description: 'Establecimientos de comida y servicio a la mesa.',
      },
      {
        name: 'Cafetería',
        description: 'Cafés, pastelerías y lugares de merienda.',
      },
      {
        name: 'Hotel',
        description: 'Alojamiento turístico y hospedaje.',
      },
      {
        name: 'Banco',
        description: 'Sucursales bancarias y servicios financieros.',
      },
      {
        name: 'Centro Comercial',
        description: 'Grandes superficies con múltiples tiendas.',
      },
      {
        name: 'Cine / Teatro',
        description: 'Salas de cine, teatros y espacios culturales.',
      },
      {
        name: 'Parque',
        description: 'Espacios públicos, plazas y zonas verdes.',
      },
      {
        name: 'Hospital / Clínica',
        description: 'Centros de atención médica y urgencias.',
      },
      {
        name: 'Gimnasio',
        description: 'Centros de acondicionamiento físico y deporte.',
      },
      {
        name: 'Bar / Discoteca',
        description: 'Vida nocturna y entretenimiento para adultos.',
      },
      {
        name: 'Panadería',
        description: 'Venta de pan y productos horneados.',
      },
      {
        name: 'Tienda de Ropa',
        description: 'Boutiques, almacenes de moda y calzado.',
      },
      {
        name: 'Peluquería / Spa',
        description: 'Salones de belleza y cuidado personal.',
      },
      {
        name: 'Notaría / Oficina',
        description: 'Trámites legales y servicios profesionales.',
      },
      {
        name: 'Veterinaria',
        description: 'Cuidado y atención para mascotas.',
      },
      {
        name: 'Taller Automotriz',
        description: 'Reparación y mantenimiento de vehículos.',
      },
      {
        name: 'Tecnología',
        description: 'Venta y reparación de equipos electrónicos.',
      },
      {
        name: 'Papelería',
        description: 'Artículos escolares, de oficina, libros y suministros.',
      },
      {
        name: 'Otros',
        description:
          'Cualquier otro tipo de negocio o servicio no listado anteriormente.',
      },
    ];

    let createdCount = 0;

    for (const categoryData of defaultCategories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!exists) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
        createdCount++;
        this.logger.log(`✓ Categoría creada: ${categoryData.name}`);
      } else {
        this.logger.log(`- Categoría ya existe: ${categoryData.name}`);
      }
    }

    this.logger.log(
      `Seed completado. ${createdCount} nuevas categorías creadas.`,
    );
  }
}