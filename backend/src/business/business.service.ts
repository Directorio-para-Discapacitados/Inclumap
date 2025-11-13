import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, EntityManager } from 'typeorm';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MapsService } from 'src/maps/maps.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { RolEntity } from 'src/roles/entity/rol.entity';

  
  @Injectable()
  export class BusinessService {
    constructor(
      @InjectRepository(BusinessEntity)
      private readonly _businessRepository: Repository<BusinessEntity>,
      @InjectRepository(UserEntity)
      private readonly _userRepository: Repository<UserEntity>,
      @InjectRepository(UserRolesEntity)
      private readonly _userRolesRepository: Repository<UserRolesEntity>,
      @InjectRepository(RolEntity)
      private readonly _rolRepository: Repository<RolEntity>,
      private readonly cloudinaryService: CloudinaryService,
      private readonly mapsService: MapsService,
    ) {}
  
  //  Crear un nuevo negocio
  async create(createBusinessDto: CreateBusinessDto): Promise<string> {
    const { business_name, NIT, user_id, address } = createBusinessDto;

    try {
      // Verificar si ya existe un negocio con el mismo NIT
      const negocioExistente = await this._businessRepository.findOne({
        where: { NIT },
      });

      if (negocioExistente) {
        throw new BadRequestException('El NIT ya está registrado en otro negocio');
      }

      // Verificar que el usuario existe
      const usuario = await this._userRepository.findOne({
        where: { user_id },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Geocodificar la dirección para obtener coordenadas
      let coordinates: { lat: number; lon: number } | null = null;
      let coordinatesString = '';

      if (address && address.trim().length > 0) {
        try {
          coordinates = await this.mapsService.getCoordinates(address);
          
          if (coordinates) {
            coordinatesString = this.mapsService.formatCoordinatesForStorage(coordinates);
          }
        } catch (error) {
          // Continuamos con el proceso aunque falle la geocodificación
          // El negocio se puede crear sin coordenadas
        }
      }

      // Crear y guardar el nuevo negocio
      const nuevoNegocio = this._businessRepository.create({
        ...createBusinessDto,
        coordinates: coordinatesString,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lon || null,
        user: usuario, // Establecer la relación con el usuario
      });
      
      console.log('Negocio creado (antes de save):', nuevoNegocio);
      const savedBusiness = await this._businessRepository.save(nuevoNegocio);
      return 'Negocio creado correctamente';
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el negocio');
    }
  }
  
  //  Obtener todos los negocios
  async obtenerNegocios(): Promise<any[]> {
    try {
      const negocios = await this._businessRepository.find({
          relations: [
            'user',
            'user.people',
            'user.userroles',
            'user.userroles.rol',
            'business_accessibility'
          ],
        });
        
        if (!negocios.length) {
          throw new NotFoundException('No hay negocios registrados');
        }
  
        return negocios.map((negocio) => {
          // Transformar los roles del usuario a un formato más simple
          const userWithRoles = negocio.user ? {
            user_id: negocio.user.user_id,
            roles: negocio.user.userroles?.map(userRole => ({
              id: userRole.rol.rol_id,
              name: userRole.rol.rol_name
            })) || [],
            people: negocio.user.people ? {
              firstName: (negocio.user.people as any).firstName || (negocio.user.people as any).first_name,
              firstLastName: (negocio.user.people as any).firstLastName || (negocio.user.people as any).first_last_name,
            } : undefined,
          } : null;

          return {
            business_id: negocio.business_id,
            business_name: negocio.business_name,
            address: negocio.address,
            NIT: negocio.NIT,
            description: negocio.description,
            coordinates: negocio.coordinates,
            latitude: negocio.latitude,
            longitude: negocio.longitude,
            average_rating: negocio.average_rating,
            logo_url: negocio.logo_url,
            verification_image_url: negocio.verification_image_url,
            user: userWithRoles, // Usuario con roles transformados
            business_accessibility: negocio.business_accessibility, // Incluir accesibilidades si están disponibles
          };
        });
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
        const isOwner = negocio.user && negocio.user.user_id === user.user_id;
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
        
        // Manejar especialmente el user_id si es null
        
        if (dto.user_id === null) {
          negocio.user = null;
        } else if (dto.user_id !== undefined) {
          // Verificar que el usuario existe si se proporciona un ID
          const usuario = await this._userRepository.findOne({
            where: { user_id: dto.user_id }
          });
          if (!usuario) {
            throw new BadRequestException('Usuario no encontrado');
          }
          negocio.user = usuario;
        }
        
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
        // Eliminar manualmente las accesibilidades primero si existen
        if (negocio.business_accessibility && negocio.business_accessibility.length > 0) {
          console.log(`🗑️ Eliminando ${negocio.business_accessibility.length} accesibilidades del negocio ${business_id}`);
          // No necesitamos eliminarlas manualmente, el remove del negocio lo hará por cascade
        }

        await this._businessRepository.remove(negocio);
        console.log(`✅ Negocio ${business_id} eliminado correctamente`);
        return 'Negocio eliminado correctamente';
      } catch (error) {
        console.error('Error al eliminar negocio:', error);
        console.error('Detalle completo del error:', JSON.stringify(error, null, 2));
        throw new InternalServerErrorException(`Error al intentar eliminar el negocio: ${error.message || 'Error desconocido'}`);
      }
    }

    async saveLogo(user: any, fileBuffer: Buffer) {
    const business = await this._businessRepository.findOne({
      where: { user: { user_id: user.user_id } },
    });

    if (!business) {
      throw new NotFoundException(
        'No se encontró un local asociado a este usuario.',
      );
    }

    const uploadResult = await this.cloudinaryService.uploadImage(
      fileBuffer,
      'inclumap_logos',
    );

    business.logo_url = uploadResult.secure_url;
    await this._businessRepository.save(business);

    return {
      message: 'Logo subido y guardado exitosamente.',
      logo_url: business.logo_url,
    };
  }

  // Remover propietario del negocio (poner user_id en null)
  async removerPropietario(businessId: number): Promise<{ message: string }> {
    try {
      // Verificar que el negocio existe
      const negocio = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user']
      });

      if (!negocio) {
        throw new NotFoundException(`Negocio con ID ${businessId} no encontrado`);
      }

      // Remover la asociación con el usuario (poner user_id en null)
      negocio.user = null;
      await this._businessRepository.save(negocio);

      return {
        message: `Propietario removido del negocio "${negocio.business_name}" exitosamente`
      };
    } catch (error) {
      console.error('Error al remover propietario del negocio:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Error interno del servidor al remover propietario');
    }
  }

  // Método específico para administradores: limpiar propietario sin restricciones
  async limpiarPropietario(businessId: number): Promise<void> {
    try {
      console.log(`🔄 Limpiando propietario del negocio ${businessId}`);

      // Actualizar directamente en la base de datos
      const result = await this._businessRepository.update(
        { business_id: businessId },
        { user: null }
      );

      if (result.affected === 0) {
        throw new NotFoundException(`Negocio con ID ${businessId} no encontrado`);
      }

      console.log(`✅ Propietario limpiado del negocio ${businessId}`);
    } catch (error) {
      console.error('Error al limpiar propietario:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Error interno del servidor al limpiar propietario');
    }
  }

  // Obtener negocios sin propietario (user_id es null)
  async obtenerNegociosSinPropietario(): Promise<BusinessEntity[]> {
    try {
      console.log('🔄 Obteniendo negocios sin propietario...');

      const negociosSinPropietario = await this._businessRepository.find({
        where: { user: IsNull() }, // Negocios sin propietario asignado
        select: [
          'business_id',
          'business_name', 
          'description',
          'address',
          'coordinates'
        ]
      });

      console.log(`✅ Encontrados ${negociosSinPropietario.length} negocios sin propietario`);
      return negociosSinPropietario;
    } catch (error) {
      console.error('Error al obtener negocios sin propietario:', error);
      throw new InternalServerErrorException('Error interno del servidor al obtener negocios sin propietario');
    }
  }

  // Asignar un propietario a un negocio
  async asignarPropietario(businessId: number, userId: number): Promise<{ message: string }> {
    try {
      console.log(`🔄 Asignando usuario ${userId} como propietario del negocio ${businessId}`);

      // 1. Verificar que el negocio existe y no tiene propietario
      const negocio = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user']
      });

      if (!negocio) {
        throw new NotFoundException(`Negocio con ID ${businessId} no encontrado`);
      }

      if (negocio.user) {
        throw new BadRequestException(`El negocio "${negocio.business_name}" ya tiene un propietario asignado`);
      }

      // 2. Verificar que el usuario existe
      const usuario = await this._userRepository.findOne({
        where: { user_id: userId },
        relations: ['userroles', 'userroles.rol']
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // 3. Verificar que el usuario no sea ya propietario de otro negocio
      const tieneNegocio = await this._businessRepository.findOne({
        where: { user: { user_id: userId } }
      });

      if (tieneNegocio) {
        throw new BadRequestException(`El usuario ya es propietario del negocio "${tieneNegocio.business_name}"`);
      }

      // 4. Asignar el usuario como propietario del negocio
      negocio.user = usuario;
      await this._businessRepository.save(negocio);

      // 5. Asignar rol de propietario al usuario (ID: 3)
      const tieneRolPropietario = usuario.userroles?.some(ur => ur.rol.rol_id === 3);
      
      if (!tieneRolPropietario) {
        // Buscar el rol de propietario
        const rolPropietario = await this._rolRepository.findOne({
          where: { rol_id: 3 }
        });

        if (rolPropietario) {
          // Crear la relación user_role usando el repositorio
          const nuevaRelacion = this._userRolesRepository.create({
            user: usuario,
            rol: rolPropietario
          });
          
          await this._userRolesRepository.save(nuevaRelacion);
          console.log(`✅ Rol de propietario asignado al usuario ${userId}`);
        } else {
          console.warn(`⚠️ Rol de propietario con ID 3 no encontrado`);
        }
      }

      return {
        message: `Usuario asignado como propietario del negocio "${negocio.business_name}" exitosamente`
      };
    } catch (error) {
      console.error('Error al asignar propietario:', error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Error interno del servidor al asignar propietario');
    }
  }

  // Eliminar negocio completamente y opcionalmente el propietario
  async eliminarNegocioCompleto(businessId: number, deleteOwner: boolean = false): Promise<{ message: string }> {
    try {
      console.log(`🗑️ Eliminando negocio ${businessId} completamente. Eliminar propietario: ${deleteOwner}`);

      // 1. Verificar que el negocio existe y obtener información del propietario
      const negocio = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user']
      });

      if (!negocio) {
        throw new NotFoundException(`Negocio con ID ${businessId} no encontrado`);
      }

      const businessName = negocio.business_name;
      let userAffected: any = null;

      // 2. Si tiene propietario y se debe eliminar completamente
      if (negocio.user && deleteOwner) {
        userAffected = negocio.user;
        const userId = negocio.user.user_id;
        console.log(`🗑️ Eliminando completamente al usuario propietario ${userId} (roles 2 y 3)`);

        // Primero limpiar la relación del negocio con el usuario
        negocio.user = null;
        await this._businessRepository.save(negocio);
        console.log(`✅ Relación negocio-usuario limpiada`);

        // Eliminar todos los roles del usuario (rol 2: usuario, rol 3: propietario)
        const rolesDelUsuario = await this._userRolesRepository.find({
          where: {
            user: { user_id: userId }
          }
        });

        if (rolesDelUsuario.length > 0) {
          await this._userRolesRepository.remove(rolesDelUsuario);
          console.log(`✅ ${rolesDelUsuario.length} roles eliminados del usuario ${userId}`);
        }

        // Eliminar el usuario completamente
        await this._userRepository.delete(userId);
        console.log(`✅ Usuario ${userId} eliminado completamente`);
      } 
      // 3. Si solo se debe remover el rol de propietario (no eliminar usuario)
      else if (negocio.user) {
        userAffected = negocio.user;
        const userId = negocio.user.user_id;
        console.log(`👤 Removiendo solo rol de propietario del usuario ${userId}`);

        // Primero limpiar la relación del negocio con el usuario
        negocio.user = null;
        await this._businessRepository.save(negocio);
        console.log(`✅ Relación negocio-usuario limpiada`);

        // Buscar y eliminar solo el rol de propietario (ID: 3)
        const rolPropietario = await this._userRolesRepository.findOne({
          where: {
            user: { user_id: userId },
            rol: { rol_id: 3 }
          }
        });

        if (rolPropietario) {
          await this._userRolesRepository.remove(rolPropietario);
          console.log(`✅ Rol de propietario removido del usuario ${userId}`);
        }
      }

      // 4. Usar el método existente para eliminar el negocio (que ya maneja business_accessibility)
      await this.eliminarNegocio(businessId);
      console.log(`🗑️ Negocio "${businessName}" eliminado completamente`);

      return {
        message: deleteOwner && userAffected
          ? `Negocio "${businessName}" y usuario propietario eliminados completamente (incluyendo accesibilidades y roles) exitosamente`
          : userAffected 
          ? `Negocio "${businessName}" eliminado completamente (incluyendo accesibilidades) y rol de propietario removido exitosamente`
          : `Negocio "${businessName}" eliminado completamente (incluyendo accesibilidades) exitosamente`
      };
    } catch (error) {
      console.error('Error al eliminar negocio completo:', error);
      console.error('Detalle del error:', error.message);
      console.error('Stack trace:', error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Mostrar el error real en lugar de un mensaje genérico
      throw new InternalServerErrorException(`Error al eliminar negocio: ${error.message}`);
    }
  }

  /**
   * Actualizar logo del negocio
   */
  async updateBusinessLogo(user: UserEntity, logoBuffer: Buffer): Promise<string> {
    try {
      console.log('📸 Actualizando logo del negocio...');

      // Buscar el negocio del usuario
      const negocio = await this._businessRepository.findOne({
        where: { user: { user_id: user.user_id } },
      });

      if (!negocio) {
        throw new NotFoundException('No se encontró un negocio asociado a este usuario');
      }

      // Subir imagen a Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(
        logoBuffer,
        'inclumap/business-logos',
        `business_${negocio.business_id}`
      );
      
      // Actualizar la URL del logo en el negocio
      negocio.logo_url = uploadResult.secure_url;
      await this._businessRepository.save(negocio);

      console.log('✅ Logo del negocio actualizado exitosamente');
      return 'Logo del negocio actualizado correctamente';
    } catch (error) {
      console.error('❌ Error al actualizar logo del negocio:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Error al actualizar el logo del negocio');
    }
  }

  /**
   * Re-geocodificar todos los negocios que no tienen coordenadas
   * Útil para migrar negocios existentes
   */
  async regeocodeBusinessesWithoutCoordinates(): Promise<{ processed: number; updated: number; failed: string[] }> {
    try {
      console.log('🗺️ Iniciando re-geocodificación de negocios sin coordenadas...');

      // Buscar negocios sin coordenadas
      const businessesWithoutCoords = await this._businessRepository.find({
        where: [
          { latitude: IsNull() },
          { longitude: IsNull() },
          { coordinates: '' },
          { coordinates: IsNull() }
        ]
      });

      console.log(`Encontrados ${businessesWithoutCoords.length} negocios sin coordenadas`);

      let updated = 0;
      const failed: string[] = [];

      for (const business of businessesWithoutCoords) {
        try {
          if (business.address && business.address.trim().length > 0) {
            console.log(`Geocodificando: ${business.business_name} - ${business.address}`);
            
            const coordinates = await this.mapsService.getCoordinates(business.address);
            
            if (coordinates) {
              // Actualizar el negocio con las nuevas coordenadas
              business.latitude = coordinates.lat;
              business.longitude = coordinates.lon;
              business.coordinates = this.mapsService.formatCoordinatesForStorage(coordinates);
              
              await this._businessRepository.save(business);
              updated++;
              
              console.log(`✅ Actualizado: ${business.business_name} -> lat: ${coordinates.lat}, lon: ${coordinates.lon}`);
            } else {
              failed.push(`${business.business_name} (ID: ${business.business_id}) - No se encontraron coordenadas`);
              console.warn(`❌ No se encontraron coordenadas para: ${business.business_name}`);
            }
          } else {
            failed.push(`${business.business_name} (ID: ${business.business_id}) - Dirección vacía`);
            console.warn(`❌ Dirección vacía para: ${business.business_name}`);
          }
          
          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          failed.push(`${business.business_name} (ID: ${business.business_id}) - Error: ${error.message}`);
          console.error(`❌ Error geocodificando ${business.business_name}:`, error.message);
        }
      }

      console.log(`🎯 Re-geocodificación completada: ${updated} actualizados, ${failed.length} fallos`);

      return {
        processed: businessesWithoutCoords.length,
        updated,
        failed
      };

    } catch (error) {
      console.error('❌ Error durante re-geocodificación:', error);
      throw new InternalServerErrorException('Error durante el proceso de re-geocodificación');
    }
  }

  /**
   * Actualizar coordenadas de un negocio específico
   */
  async updateBusinessCoordinates(businessId: number): Promise<string> {
    try {
      const business = await this._businessRepository.findOne({
        where: { business_id: businessId }
      });

      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      if (!business.address || business.address.trim().length === 0) {
        throw new BadRequestException('El negocio no tiene una dirección válida para geocodificar');
      }

      console.log(`🗺️ Actualizando coordenadas para: ${business.business_name} - ${business.address}`);

      const coordinates = await this.mapsService.getCoordinates(business.address);

      if (!coordinates) {
        throw new BadRequestException('No se pudieron obtener las coordenadas para esta dirección');
      }

      // Actualizar el negocio con las nuevas coordenadas
      business.latitude = coordinates.lat;
      business.longitude = coordinates.lon;
      business.coordinates = this.mapsService.formatCoordinatesForStorage(coordinates);

      await this._businessRepository.save(business);

      console.log(`✅ Coordenadas actualizadas: lat=${coordinates.lat}, lon=${coordinates.lon}`);

      return 'Coordenadas del negocio actualizadas correctamente';

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Error al actualizar coordenadas:', error);
      throw new InternalServerErrorException('Error al actualizar las coordenadas del negocio');
    }
  }
}
