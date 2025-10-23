import {BadRequestException,ForbiddenException,Injectable,InternalServerErrorException,NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

  
  @Injectable()
  export class BusinessService {
    constructor(
      @InjectRepository(BusinessEntity)
      private readonly _businessRepository: Repository<BusinessEntity>,
    ) {}
  
    //  Crear un nuevo negocio
    async create(createBusinessDto: CreateBusinessDto): Promise<string> {
      const { business_name, NIT } = createBusinessDto;
  
      try {
        // Verificar si ya existe un negocio con el mismo NIT
        const negocioExistente = await this._businessRepository.findOne({
          where: { NIT },
        });
  
        if (negocioExistente) {
          throw new BadRequestException('El NIT ya está registrado en otro negocio');
        }
  
        // Crear y guardar el nuevo negocio
        const nuevoNegocio = this._businessRepository.create(createBusinessDto);
        await this._businessRepository.save(nuevoNegocio);
  
        return 'Negocio creado correctamente';
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        console.error('Error al crear negocio:', error);
        throw new InternalServerErrorException('Error al crear el negocio');
      }
    }
  
    //  Obtener todos los negocios
    async obtenerNegocios(): Promise<any[]> {
      try {
        const negocios = await this._businessRepository.find({
          relations: ['user', 'business_accessibility'], // opcional, según tus relaciones
        });
  
        if (!negocios.length) {
          throw new NotFoundException('No hay negocios registrados');
        }
  
        return negocios.map((negocio) => ({
          business_id: negocio.business_id,
          business_name: negocio.business_name,
          address: negocio.address,
          NIT: negocio.NIT,
          description: negocio.description,
          coordinates: negocio.coordinates,
        }));
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException('Error en el servidor al obtener negocios');
      }
    }
  
    // Obtener un negocio por ID
    async obtenerNegocioPorId(business_id: number): Promise<any> {
      try {
        const negocio = await this._businessRepository.findOne({
          where: { business_id },
          relations: ['user', 'business_accessibility'],
        });
  
        if (!negocio) {
          throw new NotFoundException('Negocio no encontrado');
        }
  
        return {
          business_id: negocio.business_id,
          business_name: negocio.business_name,
          address: negocio.address,
          NIT: negocio.NIT,
          description: negocio.description,
          coordinates: negocio.coordinates,
        };
      } catch (error) {
        throw new InternalServerErrorException('Error al obtener el negocio');
      }
    }
  
    async actualizarNegocio(
      business_id: number,
      dto: UpdateBusinessDto,
      user: any 
    ): Promise<string> {
      try {
        if (!business_id) {
          throw new BadRequestException('ID de negocio inválido');
        }
    
        const negocio = await this._businessRepository.findOne({ 
          where: { business_id },
          relations: ['user'] 
        });
        
        if (!negocio) {
          throw new NotFoundException('Negocio no encontrado');
        }
    
        // VERIFICAR PERMISOS: Solo admin o dueño puede actualizar
        const isOwner = negocio.user.user_id === user.user_id;
        const isAdmin = user.rolIds.includes(1); // rol admin = 1
    
        if (!isOwner && !isAdmin) {
          throw new ForbiddenException('No tienes permisos para actualizar este negocio');
        }
    
        // Validar NIT duplicado si se actualiza
        if (dto.NIT) {
          const existeNIT = await this._businessRepository
            .createQueryBuilder('negocio')
            .where('negocio.business_id != :business_id', { business_id })
            .andWhere('negocio.NIT = :NIT', { NIT: dto.NIT })
            .getOne();
    
          if (existeNIT) {
            throw new BadRequestException('El NIT ya está registrado en otro negocio');
          }
        }
    
        // Actualizar campos
        Object.assign(negocio, dto);
        await this._businessRepository.save(negocio);
    
        return 'Negocio actualizado correctamente';
      } catch (error) {
        if (error instanceof BadRequestException || 
            error instanceof NotFoundException ||
            error instanceof ForbiddenException) { 
          throw error;
        }
        throw new InternalServerErrorException('Error al intentar actualizar el negocio');
      }
    }
  
    //  Eliminar un negocio
    async eliminarNegocio(business_id: number): Promise<string> {
      const negocio = await this._businessRepository.findOne({
        where: { business_id },
        relations: ['user', 'business_accessibility'],
      });
  
      if (!negocio) {
        throw new NotFoundException('Negocio no encontrado');
      }
  
      try {
        await this._businessRepository.remove(negocio);
        return 'Negocio eliminado correctamente';
      } catch (error) {
        console.error('Error al eliminar negocio:', error);
        throw new InternalServerErrorException('Error al intentar eliminar el negocio');
      }
    }
  }
