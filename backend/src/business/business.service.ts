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
import { BusinessCategoryEntity } from 'src/business_category/entity/business_category.entity';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';
import { BusinessImageEntity } from './entity/business-image.entity';
import { BusinessViewEntity } from './entity/business-view.entity';
import {
  BusinessStatisticsDto,
  RecordViewDto,
} from './dto/business-statistics.dto';

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
    @InjectRepository(BusinessCategoryEntity)
    private readonly _businessCategoryRepository: Repository<BusinessCategoryEntity>,
    @InjectRepository(BusinessAccessibilityEntity)
    private readonly _businessAccessibilityRepository: Repository<BusinessAccessibilityEntity>,
    @InjectRepository(BusinessImageEntity)
    private readonly businessImageRepository: Repository<BusinessImageEntity>,
    @InjectRepository(BusinessViewEntity)
    private readonly businessViewRepository: Repository<BusinessViewEntity>,
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
        } catch {
          // Error handled by empty block
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

      await this._businessRepository.save(nuevoNegocio);
      return 'Negocio creado correctamente';
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
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
          'business_accessibility.accessibility',
          'business_categories',
          'business_categories.category',
          'images',
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
                    cellphone: (negocio.user.people as any).cellphone,
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
          images: Array.isArray(negocio.images)
            ? negocio.images.map((img: any) => ({
                id: img.id,
                url: img.url,
              }))
            : [],
          user: userWithRoles,
          business_accessibility: Array.isArray(negocio.business_accessibility)
            ? negocio.business_accessibility.map((ba: any) => ({
                accessibility_id: ba.accessibility?.accessibility_id,
                accessibility_name: ba.accessibility?.accessibility_name,
                description: ba.accessibility?.description,
              }))
            : [],
          business_categories: Array.isArray(negocio.business_categories)
            ? negocio.business_categories.map((bc: any) => ({
                category_id: bc.category?.category_id,
                category: {
                  category_id: bc.category?.category_id,
                  name: bc.category?.name,
                },
              }))
            : [],
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
        relations: [
          'user',
          'business_accessibility',
          'business_accessibility.accessibility',
          'business_categories',
          'business_categories.category',
          'images',
        ],
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
        latitude: negocio.latitude,
        longitude: negocio.longitude,
        logo_url: negocio.logo_url,
        verified: negocio.verified,
        average_rating: negocio.average_rating,
        images: Array.isArray(negocio.images)
          ? negocio.images.map((img: any) => ({
              id: img.id,
              url: img.url,
            }))
          : [],
        business_accessibility: Array.isArray(negocio.business_accessibility)
          ? negocio.business_accessibility.map((ba: any) => ({
              accessibility_id: ba.accessibility?.accessibility_id,
              accessibility_name: ba.accessibility?.accessibility_name,
              description: ba.accessibility?.description,
            }))
          : [],
        business_categories: Array.isArray(negocio.business_categories)
          ? negocio.business_categories.map((bc: any) => ({
              category_id: bc.category?.category_id,
              category_name: bc.category?.name,
            }))
          : [],
      };
    } catch {
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

      // Actualizar categorías si se proporcionan
      if (dto.categoryIds !== undefined && Array.isArray(dto.categoryIds)) {
        // Eliminar categorías existentes
        await this._businessCategoryRepository.delete({
          business: { business_id },
        });

        // Agregar nuevas categorías
        if (dto.categoryIds.length > 0) {
          for (const categoryId of dto.categoryIds) {
            const businessCategory = this._businessCategoryRepository.create({
              business: negocio,
              category: { category_id: categoryId } as any,
            });
            await this._businessCategoryRepository.save(businessCategory);
          }
        }
      }

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
      relations: [
        'user',
        'business_accessibility',
        'business_categories',
        'images',
      ],
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

      if (negocio.images && negocio.images.length > 0) {
        for (const image of negocio.images as any[]) {
          const publicId =
            image.public_id ||
            this.cloudinaryService.extractPublicIdFromUrl(image.url);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteImage(publicId);
            } catch (error) {
              console.error('Error al eliminar imagen de Cloudinary:', error);
            }
          }
        }
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
        relations: ['business_categories', 'business_categories.category'],
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
  ): Promise<{ message: string; logo_url: string }> {
    // <--- CAMBIO 1: Tipo de retorno explícito
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

  async uploadBusinessImages(
    businessId: number,
    files: Express.Multer.File[],
    user: UserEntity,
  ): Promise<{ message: string; images: { id: number; url: string }[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron imágenes');
    }

    const negocio = await this._businessRepository.findOne({
      where: { business_id: businessId },
      relations: ['user'],
    });

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const isAdmin =
      user.userroles && user.userroles.some((ur) => ur.rol?.rol_id === 1);
    const isOwner = negocio.user && negocio.user.user_id === user.user_id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este negocio',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de imagen no permitido');
      }
      if (file.size > maxSize) {
        throw new BadRequestException(
          'El tamaño de la imagen excede el máximo permitido (5MB)',
        );
      }
    }

    const savedImages: BusinessImageEntity[] = [];

    for (const file of files) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file.buffer,
        'inclumap/business-images',
      );

      const image = this.businessImageRepository.create({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id ?? null,
        business: negocio,
      });

      const saved = await this.businessImageRepository.save(image);
      savedImages.push(saved);
    }

    return {
      message: 'Imágenes subidas correctamente',
      images: savedImages.map((img) => ({ id: img.id, url: img.url })),
    };
  }

  async deleteBusinessImage(
    businessId: number,
    imageId: number,
    user: UserEntity,
  ): Promise<{ message: string }> {
    const image = await this.businessImageRepository.findOne({
      where: { id: imageId, business: { business_id: businessId } },
      relations: [
        'business',
        'business.user',
        'business.user.userroles',
        'business.user.userroles.rol',
      ],
    });

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    const businessUser = image.business?.user;

    const isAdmin =
      user.userroles && user.userroles.some((ur) => ur.rol?.rol_id === 1);
    const isOwner = businessUser && businessUser.user_id === user.user_id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta imagen',
      );
    }

    const publicId =
      image.public_id ||
      this.cloudinaryService.extractPublicIdFromUrl(image.url);

    if (publicId) {
      try {
        await this.cloudinaryService.deleteImage(publicId);
      } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
      }
    }

    await this.businessImageRepository.remove(image);

    return { message: 'Imagen eliminada correctamente' };
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
        .leftJoinAndSelect('business.images', 'images')
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
        `Error al obtener el negocio: ${error.message || 'Error desconocido'}`,
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
      const business = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: ['user', 'user.userroles', 'user.userroles.rol'],
      });

      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      // Verificar que el usuario es el propietario o es admin
      const isAdmin =
        user.userroles && user.userroles.some((ur) => ur.rol?.rol_id === 1);
      const isOwner = business.user && business.user.user_id === user.user_id;

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
      // Actualizar coordenadas si se proporcionan
      if (
        updateDto.coordinates !== undefined &&
        updateDto.coordinates !== null &&
        updateDto.coordinates.trim().length > 0
      ) {
        business.coordinates = updateDto.coordinates;
        const coords = this.mapsService.parseCoordinatesFromStorage(
          updateDto.coordinates,
        );
        if (coords) {
          business.latitude = coords.lat;
          business.longitude = coords.lon;
        }
      }
      // NO actualizar logo con base64 - ignorar si viene en la solicitud
      if (updateDto.verified !== undefined && updateDto.verified !== null) {
        business.verified = updateDto.verified;
      }

      const updatedBusiness = await this._businessRepository.save(business);

      // Actualizar categorías si se proporcionan
      if (
        updateDto.categoryIds !== undefined &&
        Array.isArray(updateDto.categoryIds)
      ) {
        // Eliminar categorías existentes
        await this._businessCategoryRepository.delete({
          business: { business_id: businessId },
        });

        // Agregar nuevas categorías
        if (updateDto.categoryIds.length > 0) {
          for (const categoryId of updateDto.categoryIds) {
            const businessCategory = this._businessCategoryRepository.create({
              business: updatedBusiness,
              category: { category_id: categoryId } as any,
            });
            await this._businessCategoryRepository.save(businessCategory);
          }
        }
      }

      // Actualizar accesibilidades si se proporcionan
      if (
        updateDto.accessibilityIds !== undefined &&
        Array.isArray(updateDto.accessibilityIds)
      ) {
        // Eliminar accesibilidades existentes
        await this._businessAccessibilityRepository.delete({
          business: { business_id: businessId },
        });

        // Agregar nuevas accesibilidades
        if (updateDto.accessibilityIds.length > 0) {
          for (const accessibilityId of updateDto.accessibilityIds) {
            const businessAccessibility =
              this._businessAccessibilityRepository.create({
                business: updatedBusiness,
                accessibility: { accessibility_id: accessibilityId } as any,
              });
            await this._businessAccessibilityRepository.save(
              businessAccessibility,
            );
          }
        }
      }

      // Recargar el negocio con todas las relaciones para devolverlo actualizado
      const finalBusiness = await this._businessRepository.findOne({
        where: { business_id: businessId },
        relations: [
          'user',
          'business_categories',
          'business_categories.category',
          'business_accessibility',
          'business_accessibility.accessibility',
        ],
      });

      if (!finalBusiness) {
        throw new NotFoundException(
          'Negocio no encontrado después de actualizar',
        );
      }

      return finalBusiness;
    } catch (error) {
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

  // Registrar vista de negocio
  async recordView(recordViewDto: RecordViewDto): Promise<void> {
    try {
      const business = await this._businessRepository.findOne({
        where: { business_id: recordViewDto.business_id },
      });

      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      const view = this.businessViewRepository.create({
        business,
        user_ip: recordViewDto.user_ip,
        user_agent: recordViewDto.user_agent,
        referrer: recordViewDto.referrer,
      });

      await this.businessViewRepository.save(view);
    } catch (error) {
      // No lanzar error para no afectar la experiencia del usuario
      console.error('Error al registrar vista:', error);
    }
  }

  // Obtener estadísticas del negocio
  async getBusinessStatistics(
    businessId: number,
  ): Promise<BusinessStatisticsDto> {
    const business = await this._businessRepository.findOne({
      where: { business_id: businessId },
      relations: [
        'reviews',
        'reviews.user',
        'reviews.user.people',
        'business_accessibility',
        'business_accessibility.accessibility',
        'images',
      ],
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Calcular vistas usando hora de Colombia (UTC-5)
    // Colombia está 5 horas DETRÁS de UTC, entonces Colombia = UTC - 5 horas
    const COLOMBIA_OFFSET_HOURS = -5;
    const now = new Date(); // Fecha en UTC del servidor

    // Obtener la hora actual de Colombia en milisegundos desde epoch
    // Si el servidor está en UTC, restamos 5 horas
    // Si el servidor está en otra zona, primero convertimos a UTC
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    );
    const colombiaTimeMs = nowUTC + COLOMBIA_OFFSET_HOURS * 60 * 60 * 1000;
    const colombiaTime = new Date(colombiaTimeMs);

    const oneWeekAgo = new Date(
      colombiaTime.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const oneMonthAgo = new Date(
      colombiaTime.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
    const twoWeeksAgo = new Date(
      colombiaTime.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    const totalViews = await this.businessViewRepository.count({
      where: { business: { business_id: businessId } },
    });

    const viewsLastWeek = await this.businessViewRepository.count({
      where: {
        business: { business_id: businessId },
        viewed_at: new Date(oneWeekAgo.toISOString()) as any,
      },
    });

    const viewsLastMonth = await this.businessViewRepository.count({
      where: {
        business: { business_id: businessId },
        viewed_at: new Date(oneMonthAgo.toISOString()) as any,
      },
    });

    const viewsPreviousWeek = await this.businessViewRepository.count({
      where: {
        business: { business_id: businessId },
        viewed_at: new Date(twoWeeksAgo.toISOString()) as any,
      },
    });

    const trend =
      viewsPreviousWeek > 0
        ? ((viewsLastWeek - viewsPreviousWeek) / viewsPreviousWeek) * 100
        : 0;

    // Obtener todas las vistas para agrupar por períodos
    const allViews = await this.businessViewRepository.find({
      where: { business: { business_id: businessId } },
      order: { viewed_at: 'DESC' },
    });

    // Constante para conversiones de zona horaria
    const COLOMBIA_OFFSET_MS = COLOMBIA_OFFSET_HOURS * 60 * 60 * 1000;

    // Agrupar por día (24 horas del día actual en Colombia, de 00:00 a 23:59)
    const dailyViews: Array<{ date: string; count: number }> = [];
    const today = new Date(colombiaTime);
    today.setUTCHours(0, 0, 0, 0);

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setUTCHours(hour, 0, 0, 0);

      const hourEnd = new Date(today);
      hourEnd.setUTCHours(hour, 59, 59, 999);

      // Las fechas en la BD están en UTC, comparar directamente
      // porque hourStart y hourEnd ya están en el contexto de tiempo correcto
      const count = allViews.filter((v) => {
        const viewDate = new Date(v.viewed_at);
        const viewDateColombia = new Date(
          viewDate.getTime() + COLOMBIA_OFFSET_MS,
        );
        const viewHour = viewDateColombia.getUTCHours();
        const viewDay = viewDateColombia.getUTCDate();
        const viewMonth = viewDateColombia.getUTCMonth();
        const viewYear = viewDateColombia.getUTCFullYear();

        const todayDay = today.getUTCDate();
        const todayMonth = today.getUTCMonth();
        const todayYear = today.getUTCFullYear();

        return (
          viewYear === todayYear &&
          viewMonth === todayMonth &&
          viewDay === todayDay &&
          viewHour === hour
        );
      }).length;

      // Crear fecha con hora de Colombia explícita
      const colombiaDate = new Date(today);
      colombiaDate.setUTCHours(hour, 0, 0, 0);

      dailyViews.push({
        // Enviar formato que represente la hora local de Colombia
        date: `${colombiaDate.getUTCFullYear()}-${String(colombiaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(colombiaDate.getUTCDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00-05:00`,
        count,
      });
    }

    // Agrupar por semana (últimos 7 días en hora de Colombia)
    const weeklyViews: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(colombiaTime);
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const dayStart = new Date(targetDate);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Convertir a UTC para comparar con las fechas en la base de datos
      const dayStartUTC = new Date(dayStart.getTime() - COLOMBIA_OFFSET_MS);
      const dayEndUTC = new Date(dayEnd.getTime() - COLOMBIA_OFFSET_MS);

      const count = allViews.filter((v) => {
        const viewDate = new Date(v.viewed_at);
        return viewDate >= dayStartUTC && viewDate <= dayEndUTC;
      }).length;

      weeklyViews.push({
        date: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}T00:00:00-05:00`,
        count,
      });
    }

    // Agrupar por mes (últimas 4 semanas en hora de Colombia)
    const monthlyViews: Array<{ date: string; count: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(
        colombiaTime.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(
        colombiaTime.getTime() - i * 7 * 24 * 60 * 60 * 1000,
      );

      // Convertir a UTC para comparar
      const weekStartUTC = new Date(weekStart.getTime() - COLOMBIA_OFFSET_MS);
      const weekEndUTC = new Date(weekEnd.getTime() - COLOMBIA_OFFSET_MS);

      const count = allViews.filter((v) => {
        const viewDate = new Date(v.viewed_at);
        return viewDate >= weekStartUTC && viewDate < weekEndUTC;
      }).length;

      monthlyViews.push({
        date: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}T00:00:00-05:00`,
        count,
      });
    }

    // Agrupar por año (últimos 12 meses en hora de Colombia)
    const yearlyViews: Array<{ date: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(colombiaTime);
      targetDate.setMonth(targetDate.getMonth() - i);

      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
      );
      monthEnd.setHours(23, 59, 59, 999);

      // Convertir a UTC para comparar
      const monthStartUTC = new Date(monthStart.getTime() - COLOMBIA_OFFSET_MS);
      const monthEndUTC = new Date(monthEnd.getTime() - COLOMBIA_OFFSET_MS);

      const count = allViews.filter((v) => {
        const viewDate = new Date(v.viewed_at);
        return viewDate >= monthStartUTC && viewDate <= monthEndUTC;
      }).length;

      yearlyViews.push({
        date: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01T00:00:00-05:00`,
        count,
      });
    }

    // Calcular distribución de ratings
    const distribution = { five: 0, four: 0, three: 0, two: 0, one: 0 };
    business.reviews.forEach((review) => {
      if (review.rating === 5) distribution.five++;
      else if (review.rating === 4) distribution.four++;
      else if (review.rating === 3) distribution.three++;
      else if (review.rating === 2) distribution.two++;
      else if (review.rating === 1) distribution.one++;
    });

    // Calcular reseñas nuevas
    const newReviewsThisWeek = business.reviews.filter(
      (r) => new Date(r.created_at) >= oneWeekAgo,
    ).length;
    const newReviewsThisMonth = business.reviews.filter(
      (r) => new Date(r.created_at) >= oneMonthAgo,
    ).length;

    // Calcular sentimiento
    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    business.reviews.forEach((review) => {
      const label = review.sentiment_label?.toLowerCase() || '';
      if (label.includes('positiv')) sentiment.positive++;
      else if (label.includes('negativ')) sentiment.negative++;
      else sentiment.neutral++;
    });

    // Calcular accesibilidad
    const allAccessibilities = [
      'Rampa Acceso',
      'Baño adaptado',
      'Estacionamiento para discapacitados',
      'Puertas Anchas',
      'Circulación Interior',
      'Ascensor Accesible',
      'Pisos',
      'Barras de Apoyo',
      'Lavamanos Accesible',
      'Mostrador/Caja Accesible',
      'Señalización (SIA)',
      'Señalización Táctil/Braille',
    ];

    // Verificar si business_accessibility existe y tiene datos
    if (
      !business.business_accessibility ||
      !Array.isArray(business.business_accessibility)
    ) {
      business.business_accessibility = [];
    }

    // Filtrar y mapear accesibilidades completadas
    const completedAccessibilities = business.business_accessibility
      .filter(
        (ba) => ba && ba.accessibility && ba.accessibility.accessibility_name,
      )
      .map((ba) => ba.accessibility.accessibility_name);

    const missing = allAccessibilities.filter(
      (a) => !completedAccessibilities.includes(a),
    );

    const accessibilityScore =
      completedAccessibilities.length > 0
        ? (completedAccessibilities.length / allAccessibilities.length) * 100
        : 0;

    // Reseñas recientes
    const recentReviews = business.reviews
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5)
      .map((review) => ({
        review_id: review.review_id,
        rating: review.rating,
        comment: review.comment,
        sentiment_label: review.sentiment_label,
        created_at: review.created_at,
        owner_reply: review.owner_reply,
        user: {
          firstName:
            (review.user?.people as any)?.firstName ||
            (review.user?.people as any)?.first_name ||
            'Usuario',
          firstLastName:
            (review.user?.people as any)?.firstLastName ||
            (review.user?.people as any)?.first_last_name ||
            '',
          avatar:
            (review.user?.people as any)?.avatar ||
            review.user?.avatar_url ||
            null,
        },
      }));

    // Calcular fotos recientes
    const recentPhotos = business.images.length;

    const result = {
      views: {
        total: totalViews,
        lastWeek: viewsLastWeek,
        lastMonth: viewsLastMonth,
        trend: Math.round(trend),
        daily: dailyViews,
        weekly: weeklyViews,
        monthly: monthlyViews,
        yearly: yearlyViews,
      },
      rating: {
        current: Number(business.average_rating) || 0,
        previous:
          business.reviews.length > 1
            ? Number(
                business.reviews
                  .slice(0, -1)
                  .reduce((acc, r) => acc + r.rating, 0) /
                  (business.reviews.length - 1),
              )
            : 0,
        distribution,
      },
      reviews: {
        total: business.reviews.length,
        newThisWeek: newReviewsThisWeek,
        newThisMonth: newReviewsThisMonth,
        byStars: distribution,
        sentiment,
      },
      accessibility: {
        score: Math.round(accessibilityScore),
        total: allAccessibilities.length,
        completed: completedAccessibilities.length,
        missing,
        completedItems: completedAccessibilities,
      },
      photos: {
        count: business.images.length,
        hasLogo: !!business.logo_url,
        recentCount: recentPhotos,
      },
      notifications: {
        pending: 0, // Se puede integrar con NotificationService
        urgent: 0,
      },
      recentReviews,
    };

    return result;
  }
}
