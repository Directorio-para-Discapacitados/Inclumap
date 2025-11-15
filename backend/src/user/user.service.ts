import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { RolEntity } from 'src/roles/entity/rol.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PeopleEntity } from '../people/entity/people.entity';
import { BusinessEntity } from '../business/entity/business.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,

    @InjectRepository(UserRolesEntity)
    private readonly _userRolesRepository: Repository<UserRolesEntity>,

    @InjectRepository(RolEntity)
    private readonly _rolRepository: Repository<RolEntity>,

    @InjectRepository(PeopleEntity)
    private readonly _peopleRepository: Repository<PeopleEntity>,
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(BusinessEntity)
    private readonly _businessRepository: Repository<BusinessEntity>,
  ) {}

  // Crear un nuevo usuario
  async create(createUserDto: CreateUserDto): Promise<string> {
    const { user_email, user_password } = createUserDto;

    try {
      // Verificar si el correo ya está registrado
      const usuarioExistente = await this._userRepository.findOne({
        where: { user_email },
      });
      if (usuarioExistente) {
        throw new BadRequestException(
          'El correo electrónico ya esta registrado',
        );
      }

      // Crear y guardar el usuarios
      const nuevoUsuario = this._userRepository.create({
        user_email,
        user_password,
      });
      await this._userRepository.save(nuevoUsuario);

      return 'Usuario creado correctamente';
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async obtenerUsuarios(): Promise<any[]> {
    try {
      const usuarios = await this._userRepository.find({
        relations: ['userroles', 'userroles.rol'],
      });

      // Si no hay usuarios, se da una excepcion
      if (!usuarios.length) {
        throw new NotFoundException('No hay usuarios registrados');
      }

      return usuarios.map((usuario) => ({
        user_id: usuario.user_id,
        user_email: usuario.user_email,
        user_password: usuario.user_password,

        roles: usuario.userroles
          ? usuario.userroles.map((ur) => ({
              rol_id: ur.rol.rol_id,
              rol_name: ur.rol.rol_name,
            }))
          : [],
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error en el servidor');
    }
  }

  async obtenerUsuarioPorId(user_id: number, currentUser: any): Promise<any> {
    try {
      // ✅ VERIFICAR PERMISOS: Solo puede ver su propio usuario o admin
      const isOwner = user_id === currentUser.user_id;
      const isAdmin = currentUser.rolIds.includes(1); // rol admin = 1

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'No tienes permisos para ver este usuario',
        );
      }

      const usuario = await this._userRepository.findOne({
        where: { user_id },
        relations: ['userroles', 'userroles.rol'],
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const result = {
        user_id: usuario.user_id,
        user_email: usuario.user_email,
        user_password: usuario.user_password,
        roles:
          isAdmin || isOwner
            ? usuario.userroles.map((ur) => ({
                rol_id: ur.rol.rol_id,
                rol_name: ur.rol.rol_name,
              }))
            : undefined,
      };

      return result;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  async actualizarUsuario(
    user_id: number,
    dto: UpdateUserDto,
    currentUser: any,
  ): Promise<string> {
    try {
      // ✅ VERIFICAR PERMISOS: Solo puede actualizar su propio usuario o admin
      const isOwner = user_id === currentUser.user_id;
      const isAdmin = currentUser.rolIds.includes(1);

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar este usuario',
        );
      }

      // ✅ RESTRICCIÓN: Usuarios normales no pueden cambiar su rol
      if (dto.rol_id && !isAdmin) {
        throw new ForbiddenException('No tienes permisos para cambiar roles');
      }

      // Validar si el ID es válido
      if (!user_id) {
        throw new BadRequestException('ID de usuario invalido');
      }

      // Buscar el usuario por ID
      const usuario = await this._userRepository.findOne({
        where: { user_id },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar si el correo ya existe en otro usuario
      if (dto.user_email) {
        const existeEmail = await this._userRepository
          .createQueryBuilder('usuarios')
          .where('usuarios.user_id != :user_id', { user_id })
          .andWhere('usuarios.user_email = :user_email', {
            user_email: dto.user_email,
          })
          .getOne();

        if (existeEmail) {
          throw new BadRequestException(
            'El correo electrónico ya está registrado en otro usuario',
          );
        }
      }

      // ✅ ACTUALIZACIÓN SIMPLE - Sin hasheo (eso lo hace AuthService)
      if (dto.user_email) usuario.user_email = dto.user_email;
      if (dto.user_password) usuario.user_password = dto.user_password;

      // Si el rol está presente en el DTO y es admin, se actualiza
      if (dto.rol_id && isAdmin) {
        // Buscar el rol con el ID proporcionado
        const rol = await this._rolRepository.findOne({
          where: { rol_id: dto.rol_id },
        });
        if (!rol) {
          throw new NotFoundException('El rol especificado no existe');
        }

        // Actualizar la relación del rol en la tabla intermedia user_roles
        const userRole = await this._userRolesRepository.findOne({
          where: { user: usuario },
          relations: ['rol'],
        });

        if (userRole) {
          // Actualizar el rol existente
          userRole.rol = rol;
          await this._userRolesRepository.save(userRole);
        } else {
          // Si no existe la relación, crear una nueva
          const newUserRole = this._userRolesRepository.create({
            user: usuario,
            rol: rol,
          });
          await this._userRolesRepository.save(newUserRole);
        }
      }

      // Guardar el usuario actualizado
      await this._userRepository.save(usuario);

      return 'Usuario actualizado correctamente';
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al intentar actualizar el usuario',
      );
    }
  }

  async eliminarUsuario(user_id: number): Promise<string> {
    const usuario = await this._userRepository.findOne({
      where: { user_id },
      relations: ['userroles', 'people', 'business'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    try {
      // Paso 1: Verificar que no tenga negocios asignados
      if (usuario.business) {
        throw new BadRequestException(
          'No se puede eliminar el usuario porque tiene un negocio asignado. ' +
            'Primero elimine o reasigne el negocio.',
        );
      }

      // Paso 2: Eliminar todos los roles del usuario (tabla user_roles)
      if (usuario.userroles && usuario.userroles.length > 0) {
        for (const userRole of usuario.userroles) {
          await this._userRolesRepository.remove(userRole);
        }
      }

      // Paso 3: Eliminar datos de people si existen
      if (usuario.people) {
        await this._peopleRepository.remove(usuario.people);
      }

      // Paso 4: Finalmente eliminar el usuario
      await this._userRepository.remove(usuario);

      return 'Usuario eliminado correctamente';
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al intentar eliminar el usuario: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  async obtenerUsuarioCompleto(user_id: number): Promise<any> {
    try {
      // Obtener información del usuario con roles
      const usuario = await this._userRepository.findOne({
        where: { user_id },
        relations: ['userroles', 'userroles.rol'],
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Obtener información personal del usuario
      const people = await this._peopleRepository.findOne({
        where: { user: { user_id } },
      });

      // Obtener negocios del usuario
      const businesses = await this._businessRepository.find({
        where: { user: { user_id } },
        relations: [
          'business_accessibility',
          'business_accessibility.accessibility',
        ],
      });

      const result = {
        user: {
          user_id: usuario.user_id,
          user_email: usuario.user_email,
          roles: usuario.userroles.map((ur) => ({
            rol_id: ur.rol.rol_id,
            rol_name: ur.rol.rol_name,
          })),
        },
        people: people
          ? {
              people_id: people.people_id,
              firstName: people.firstName,
              firstLastName: people.firstLastName,
              cellphone: people.cellphone,
              address: people.address,
              gender: people.gender,
            }
          : null,
        businesses: businesses.map((business) => ({
          business_id: business.business_id,
          business_name: business.business_name,
          NIT: business.NIT,
          address: business.address,
          description: business.description,
          coordinates: business.coordinates,
          accessibilities:
            business.business_accessibility?.map(
              (ba) => ba.accessibility.accessibility_id,
            ) || [],
        })),
      };

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Error al obtener información completa:', error);
      throw new InternalServerErrorException(
        'Error al obtener información completa del usuario',
      );
    }
  }

  /**
   * Actualizar avatar del usuario
   */
  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; avatar_url: string }> {
    try {
      // Buscar el usuario
      const usuario = await this._userRepository.findOne({
        where: { user_id: userId },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Buscar los datos personales del usuario
      const people = await this._peopleRepository.findOne({
        where: { user: { user_id: userId } },
      });

      if (!people) {
        throw new NotFoundException(
          'No se encontraron datos personales del usuario',
        );
      }

      // Subir imagen a Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(
        file.buffer,
        'inclumap/avatars',
        `user_${userId}`,
      );

      // Actualizar la URL del avatar
      people.avatar = uploadResult.secure_url;
      await this._peopleRepository.save(people);

      return {
        message: 'Avatar actualizado correctamente',
        avatar_url: uploadResult.secure_url,
      };
    } catch (error) {
      console.error('❌ Error al actualizar avatar:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al actualizar el avatar');
    }
  }

  /**
   * Eliminar avatar del usuario
   */
  async deleteAvatar(userId: number): Promise<{ message: string }> {
    try {
      // Buscar el usuario
      const usuario = await this._userRepository.findOne({
        where: { user_id: userId },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Buscar los datos personales del usuario
      const people = await this._peopleRepository.findOne({
        where: { user: { user_id: userId } },
      });

      if (!people) {
        throw new NotFoundException(
          'No se encontraron datos personales del usuario',
        );
      }

      // Eliminar la URL del avatar (solo si existe)
      if (people.avatar) {
        // Opcional: eliminar de Cloudinary si se desea
        // const publicId = this.cloudinaryService.extractPublicIdFromUrl(people.avatar);
        // await this.cloudinaryService.deleteImage(publicId);
      }

      people.avatar = null;
      await this._peopleRepository.save(people);

      return { message: 'Avatar eliminado correctamente' };
    } catch (error) {
      console.error('❌ Error al eliminar avatar:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al eliminar el avatar');
    }
  }
}
