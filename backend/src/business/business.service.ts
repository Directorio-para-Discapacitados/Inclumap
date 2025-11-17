import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
    const { NIT, user_id, address } = createBusinessDto;

    try {
      // Verificar si ya existe un negocio con el mismo NIT
      const negocioExistente = await this._businessRepository.findOne({
        where: { NIT },
      });

      if (negocioExistente) {
        throw new BadRequestException(
          'El NIT ya está registrado en otro negocio',
        );
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
            coordinatesString =
              this.mapsService.formatCoordinatesForStorage(coordinates);
          }
        } catch (error) {}
      }

      // Crear y guardar el nuevo negocio
      const nuevoNegocio = this._businessRepository.create({
        ...createBusinessDto,
        coordinates: coordinatesString,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lon || null,
        user: usuario, // Establecer la relación con el usuario
      });

      const savedBusiness = await this._businessRepository.save(nuevoNegocio);
      return 'Negocio creado correctamente';
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
          'business_accessibility',
        ],
      });

      if (!negocios.length) {
        throw new NotFoundException('No hay negocios registrados');
      }

      return negocios.map((negocio) => {
        // Transformar los roles del usuario a un formato más simple
        const userWithRoles = negocio.user
          ? {
              user_id: negocio.user.user_id,
              id: negocio.user.user_id,
              email: negocio.user.user_email,
              user_email: negocio.user.user_email,
              roles:
                negocio.user.userroles?.map((userRole) => ({
                  id: userRole.rol.rol_id,
                  name: userRole.rol.rol_name,
                })) || [],
              people: negocio.user.people
                ? {
                    firstName:
                      (negocio.user.people as any).firstName ||
                      (negocio.user.people as any).first_name,
                    firstLastName:
                      (negocio.user.people as any).firstLastName ||
                      (negocio.user.people as any).first_last_name,
                  }
                : undefined,
            }
          : null;

        return {
          id: negocio.business_id,
          business_id: negocio.business_id,
          name: negocio.business_name,
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
          verified: negocio.verified || false,
          user: userWithRoles,
          business_accessibility: negocio.business_accessibility,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error en el servidor al obtener negocios',
      );
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
    user: any,
  ): Promise<string> {
    try {
      if (!business_id) {
        throw new BadRequestException('ID de negocio inválido');
      }

      const negocio = await this._businessRepository.findOne({
        where: { business_id },
        relations: ['user'],
      });

      if (!negocio) {
        throw new NotFoundException('Negocio no encontrado');
      }

      // VERIFICAR PERMISOS: Solo admin o dueño puede actualizar
      const isOwner = negocio.user && negocio.user.user_id === user.user_id;
      const isAdmin = user.rolIds.includes(1); // rol admin = 1

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar este negocio',
        );
      }

      // Validar NIT duplicado si se actualiza
      if (dto.NIT) {
        const existeNIT = await this._businessRepository
          .createQueryBuilder('negocio')
          .where('negocio.business_id != :business_id', { business_id })
          .andWhere('negocio.NIT = :NIT', { NIT: dto.NIT })
          .getOne();

        if (existeNIT) {
          throw new BadRequestException(
            'El NIT ya está registrado en otro negocio',
          );
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
          where: { user_id: dto.user_id },
        });
        if (!usuario) {
          throw new BadRequestException('Usuario no encontrado');
        }
        negocio.user = usuario;
      }

      await this._businessRepository.save(negocio);

      return 'Negocio actualizado correctamente';
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al intentar actualizar el negocio',
      );
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
      if (
        negocio.business_accessibility &&
        negocio.business_accessibility.length > 0
      ) {
        // No necesitamos eliminarlas manualmente, el remove del negocio lo hará por cascade
      }

      await this._businessRepository.remove(negocio);
      return 'Negocio eliminado correctamente';
    } catch (error) {
      console.error('Error al eliminar negocio:', error);
      console.error(
        'Detalle completo del error:',
        JSON.stringify(error, null, 2),
      );
      throw new InternalServerErrorException(
        `Error al intentar eliminar el negocio: ${error.message || 'Error desconocido'}`,
      );
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
        relations: ['user'],
      });

      if (!negocio) {
        throw new NotFoundException(
          `Negocio con ID ${businessId} no encontrado`,
        );
      }

      // Remover la asociación con el usuario (poner user_id en null)
      negocio.user = null;
      await this._businessRepository.save(negocio);

      return {
        message: `Propietario removido del negocio "${negocio.business_name}" exitosamente`,
      };
    } catch (error) {
      console.error('Error al remover propietario del negocio:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al remover propietario',
      );
    }
  }

  // Método específico para administradores: limpiar propietario sin restricciones
  async limpiarPropietario(businessId: number): Promise<void> {
    try {
      // Actualizar directamente en la base de datos
      const result = await this._businessRepository.update(
        { business_id: businessId },
        { user: null },
      );

      if (result.affected === 0) {
        throw new NotFoundException(
          `Negocio con ID ${businessId} no encontrado`,
        );
      }
    } catch (error) {
      console.error('Error al limpiar propietario:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al limpiar propietario',
      );
    }
  }

  // Obtener negocios sin propietario (user_id es null)
  async obtenerNegociosSinPropietario(): Promise<BusinessEntity[]> {
    try {
      const negociosSinPropietario = await this._businessRepository.find({
        where: { user: IsNull() }, // Negocios sin propietario asignado
        select: [
          'business_id',
          'business_name',
          'description',
          'address',
          'coordinates',
        ],
      });

      return negociosSinPropietario;
    } catch (error) {
      console.error('Error al obtener negocios sin propietario:', error);
      throw new InternalServerErrorException(
        'Error interno del servidor al obtener negocios sin propietario',
      );
    }
  }

  // Asignar un propietario a un negocio
  async asignarPropietario(
    businessId: number,
    userId: number,
  ): Promise<{ message: string }> {
    try {
      // 1. Verificar que el negocio existe y no tiene propietario
      const negocio = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user'],
      });

      if (!negocio) {
        throw new NotFoundException(
          `Negocio con ID ${businessId} no encontrado`,
        );
      }

      if (negocio.user) {
        throw new BadRequestException(
          `El negocio "${negocio.business_name}" ya tiene un propietario asignado`,
        );
      }

      // 2. Verificar que el usuario existe
      const usuario = await this._userRepository.findOne({
        where: { user_id: userId },
        relations: ['userroles', 'userroles.rol'],
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // 3. Verificar que el usuario no sea ya propietario de otro negocio
      const tieneNegocio = await this._businessRepository.findOne({
        where: { user: { user_id: userId } },
      });

      if (tieneNegocio) {
        throw new BadRequestException(
          `El usuario ya es propietario del negocio "${tieneNegocio.business_name}"`,
        );
      }

      // 4. Asignar el usuario como propietario del negocio
      negocio.user = usuario;
      await this._businessRepository.save(negocio);

      // 5. Asignar rol de propietario al usuario (ID: 3)
      const tieneRolPropietario = usuario.userroles?.some(
        (ur) => ur.rol.rol_id === 3,
      );

      if (!tieneRolPropietario) {
        // Buscar el rol de propietario
        const rolPropietario = await this._rolRepository.findOne({
          where: { rol_id: 3 },
        });

        if (rolPropietario) {
          // Crear la relación user_role usando el repositorio
          const nuevaRelacion = this._userRolesRepository.create({
            user: usuario,
            rol: rolPropietario,
          });

          await this._userRolesRepository.save(nuevaRelacion);
        } else {
          console.warn(`⚠️ Rol de propietario con ID 3 no encontrado`);
        }
      }

      return {
        message: `Usuario asignado como propietario del negocio "${negocio.business_name}" exitosamente`,
      };
    } catch (error) {
      console.error('Error al asignar propietario:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al asignar propietario',
      );
    }
  }

  // Eliminar negocio completamente y opcionalmente el propietario
  async eliminarNegocioCompleto(
    businessId: number,
    deleteOwner: boolean = false,
  ): Promise<{ message: string }> {
    try {
      // 1. Verificar que el negocio existe y obtener información del propietario
      const negocio = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user'],
      });

      if (!negocio) {
        throw new NotFoundException(
          `Negocio con ID ${businessId} no encontrado`,
        );
      }

      const businessName = negocio.business_name;
      let userAffected: any = null;

      // 2. Si tiene propietario y se debe eliminar completamente
      if (negocio.user && deleteOwner) {
        userAffected = negocio.user;
        const userId = negocio.user.user_id;

        // Primero limpiar la relación del negocio con el usuario
        negocio.user = null;
        await this._businessRepository.save(negocio);

        // Eliminar todos los roles del usuario (rol 2: usuario, rol 3: propietario)
        const rolesDelUsuario = await this._userRolesRepository.find({
          where: {
            user: { user_id: userId },
          },
        });

        if (rolesDelUsuario.length > 0) {
          await this._userRolesRepository.remove(rolesDelUsuario);
        }

        // Eliminar el usuario completamente
        await this._userRepository.delete(userId);
      }
      // 3. Si solo se debe remover el rol de propietario (no eliminar usuario)
      else if (negocio.user) {
        userAffected = negocio.user;
        const userId = negocio.user.user_id;

        // Primero limpiar la relación del negocio con el usuario
        negocio.user = null;
        await this._businessRepository.save(negocio);

        // Buscar y eliminar solo el rol de propietario (ID: 3)
        const rolPropietario = await this._userRolesRepository.findOne({
          where: {
            user: { user_id: userId },
            rol: { rol_id: 3 },
          },
        });

        if (rolPropietario) {
          await this._userRolesRepository.remove(rolPropietario);
        }
      }

      // 4. Usar el método existente para eliminar el negocio (que ya maneja business_accessibility)
      await this.eliminarNegocio(businessId);

      return {
        message:
          deleteOwner && userAffected
            ? `Negocio "${businessName}" y usuario propietario eliminados completamente (incluyendo accesibilidades y roles) exitosamente`
            : userAffected
              ? `Negocio "${businessName}" eliminado completamente (incluyendo accesibilidades) y rol de propietario removido exitosamente`
              : `Negocio "${businessName}" eliminado completamente (incluyendo accesibilidades) exitosamente`,
      };
    } catch (error) {
      console.error('Error al eliminar negocio completo:', error);
      console.error('Detalle del error:', error.message);
      console.error('Stack trace:', error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      // Mostrar el error real en lugar de un mensaje genérico
      throw new InternalServerErrorException(
        `Error al eliminar negocio: ${error.message}`,
      );
    }
  }

  async updateBusinessLogo(
    user: UserEntity,
    logoBuffer: Buffer,
  ): Promise<{ message: string; logo_url: string }> { // <--- CAMBIO 1: Tipo de retorno explícito
    try {
      const negocio = await this._businessRepository.findOne({
        where: { user: { user_id: user.user_id } },
      });

      if (!negocio) {
        throw new NotFoundException(
          'No se encontró un negocio asociado a este usuario',
        );
      }

      // Subir imagen a Cloudinary forzando el ID para sobrescribir
      const uploadResult = await this.cloudinaryService.uploadImage(
        logoBuffer,
        'inclumap/business-logos',
        `business_${negocio.business_id}`, 
      );

      negocio.logo_url = uploadResult.secure_url;
      await this._businessRepository.save(negocio);

      // <--- CAMBIO 2: Retornar un OBJETO, no un string plano
      return {
        message: 'Logo del negocio actualizado correctamente',
        logo_url: negocio.logo_url,
      };
    } catch (error) {
      console.error('❌ Error al actualizar logo:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al actualizar el logo del negocio',
      );
    }
  }

  /**
   * Re-geocodificar todos los negocios que no tienen coordenadas
   * Útil para migrar negocios existentes
   */
  async regeocodeBusinessesWithoutCoordinates(): Promise<{
    processed: number;
    updated: number;
    failed: string[];
  }> {
    try {
      // Buscar negocios sin coordenadas
      const businessesWithoutCoords = await this._businessRepository.find({
        where: [
          { latitude: IsNull() },
          { longitude: IsNull() },
          { coordinates: '' },
          { coordinates: IsNull() },
        ],
      });

      let updated = 0;
      const failed: string[] = [];

      for (const business of businessesWithoutCoords) {
        try {
          if (business.address && business.address.trim().length > 0) {
            const coordinates = await this.mapsService.getCoordinates(
              business.address,
            );

            if (coordinates) {
              // Actualizar el negocio con las nuevas coordenadas
              business.latitude = coordinates.lat;
              business.longitude = coordinates.lon;
              business.coordinates =
                this.mapsService.formatCoordinatesForStorage(coordinates);

              await this._businessRepository.save(business);
              updated++;
            } else {
              failed.push(
                `${business.business_name} (ID: ${business.business_id}) - No se encontraron coordenadas`,
              );
              console.warn(
                `❌ No se encontraron coordenadas para: ${business.business_name}`,
              );
            }
          } else {
            failed.push(
              `${business.business_name} (ID: ${business.business_id}) - Dirección vacía`,
            );
            console.warn(`❌ Dirección vacía para: ${business.business_name}`);
          }

          // Pequeña pausa para evitar rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          failed.push(
            `${business.business_name} (ID: ${business.business_id}) - Error: ${error.message}`,
          );
          console.error(
            `❌ Error geocodificando ${business.business_name}:`,
            error.message,
          );
        }
      }

      return {
        processed: businessesWithoutCoords.length,
        updated,
        failed,
      };
    } catch (error) {
      console.error('❌ Error durante re-geocodificación:', error);
      throw new InternalServerErrorException(
        'Error durante el proceso de re-geocodificación',
      );
    }
  }

  /**
   * Actualizar coordenadas de un negocio específico
   */
  async updateBusinessCoordinates(businessId: number): Promise<string> {
    try {
      const business = await this._businessRepository.findOne({
        where: { business_id: businessId },
      });

      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      if (!business.address || business.address.trim().length === 0) {
        throw new BadRequestException(
          'El negocio no tiene una dirección válida para geocodificar',
        );
      }

      const coordinates = await this.mapsService.getCoordinates(
        business.address,
      );

      if (!coordinates) {
        throw new BadRequestException(
          'No se pudieron obtener las coordenadas para esta dirección',
        );
      }

      // Actualizar el negocio con las nuevas coordenadas
      business.latitude = coordinates.lat;
      business.longitude = coordinates.lon;
      business.coordinates =
        this.mapsService.formatCoordinatesForStorage(coordinates);

      await this._businessRepository.save(business);

      return 'Coordenadas del negocio actualizadas correctamente';
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('❌ Error al actualizar coordenadas:', error);
      throw new InternalServerErrorException(
        'Error al actualizar las coordenadas del negocio',
      );
    }
  }

  // Obtener el negocio del usuario autenticado (propietario)
  async getOwnerBusiness(userId: number): Promise<BusinessEntity> {
    try {
      const business = await this._businessRepository
        .createQueryBuilder('business')
        .leftJoinAndSelect('business.user', 'user')
        .leftJoinAndSelect('user.people', 'people')
        .leftJoinAndSelect('user.userroles', 'userroles')
        .leftJoinAndSelect('userroles.rol', 'rol')
        .leftJoinAndSelect('business.business_accessibility', 'accessibility')
        .where('business.user_id = :userId', { userId })
        .getOne();

      if (!business) {
        throw new NotFoundException('No tienes un negocio registrado');
      }

      return business;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al obtener el negocio del propietario',
      );
    }
  }

  // Actualizar el negocio del propietario con validación de permisos
  async updateOwnerBusiness(
    businessId: number,
    updateDto: UpdateBusinessDto,
    user: UserEntity,
  ): Promise<BusinessEntity> {
    try {
      console.log(
        '🔍 [updateOwnerBusiness] businessId:',
        businessId,
        'updateDto:',
        updateDto,
      );

      const business = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user', 'user.userroles', 'user.userroles.rol'],
      });

      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      console.log(
        '📊 [updateOwnerBusiness] Business found:',
        business.business_id,
      );

      // Verificar que el usuario es el propietario o es admin
      const isAdmin =
        user.userroles && user.userroles.some((ur) => ur.rol?.rol_id === 1);
      const isOwner = business.user && business.user.user_id === user.user_id;

      console.log(
        '🔐 [updateOwnerBusiness] isAdmin:',
        isAdmin,
        'isOwner:',
        isOwner,
        'user.user_id:',
        user.user_id,
        'business.user.user_id:',
        business.user?.user_id,
      );

      if (!isAdmin && !isOwner) {
        throw new ForbiddenException(
          'No tienes permiso para actualizar este negocio',
        );
      }

      // Actualizar cada campo explícitamente
      if (
        updateDto.business_name !== undefined &&
        updateDto.business_name !== null
      ) {
        business.business_name = updateDto.business_name;
      }
      if (updateDto.address !== undefined && updateDto.address !== null) {
        business.address = updateDto.address;
      }
      if (
        updateDto.description !== undefined &&
        updateDto.description !== null
      ) {
        business.description = updateDto.description;
      }
      // NO actualizar logo con base64 - ignorar si viene en la solicitud
      if (updateDto.verified !== undefined && updateDto.verified !== null) {
        console.log(
          '✅ [updateOwnerBusiness] Setting verified to:',
          updateDto.verified,
        );
        business.verified = updateDto.verified;
      }

      console.log('💾 [updateOwnerBusiness] Saving business:', {
        verified: business.verified,
        business_name: business.business_name,
      });

      const updatedBusiness = await this._businessRepository.save(business);

      console.log(
        '✔️ [updateOwnerBusiness] Business saved successfully:',
        updatedBusiness.business_id,
      );

      return updatedBusiness;
    } catch (error) {
      console.error('❌ [updateOwnerBusiness] Error:', error.message);
      console.error('❌ [updateOwnerBusiness] Full error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el negocio: ' + error.message,
      );
    }
  }
}
