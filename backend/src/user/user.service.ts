import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { RolEntity } from 'src/roles/entity/rol.entity';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,

    @InjectRepository(UserRolesEntity)
    private readonly _userRolesRepository: Repository<UserRolesEntity>,

    @InjectRepository(RolEntity)
    private readonly _rolRepository: Repository<RolEntity>,
  ) { }


    // Crear un nuevo usuario 
    async create(createUserDto: CreateUserDto): Promise<string> {
        const { user_email, user_password } = createUserDto;

        try {
            // Verificar si el correo ya está registrado
            const usuarioExistente = await this._userRepository.findOne({ where: { user_email } });
            if (usuarioExistente) {
                throw new BadRequestException('El correo electrónico ya esta registrado');
            }

            // Crear y guardar el usuarios
            const nuevoUsuario = this._userRepository.create({
                user_email,
                user_password,
            });
            await this._userRepository.save(nuevoUsuario);

            return 'Usuario creado correctamente';
        } catch (error) {
            if (
                error instanceof BadRequestException
            ) {
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

            // Se mapea la respuesta para incluir solo los campos necesarios
            return usuarios.map((usuario) => ({
                user_id: usuario.user_id,
                user_email: usuario.user_email,
                user_password: usuario.user_password,

            }));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error en el servidor');
        }
    }

    async obtenerUsuarioPorId(user_id: number): Promise<any> {
        try {
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
            };

            return result;
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener el usuario');
        }
    }

    async actualizarUsuario(user_id: number, dto: UpdateUserDto): Promise<string> {
        try {
          // Validar si el ID es válido
          if (!user_id) {
            throw new BadRequestException('ID de usuario invalido');
          }
    
          // Buscar el usuario por ID
          const usuario = await this._userRepository.findOne({ where: { user_id } });
          if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
          }
    
          // Verificar si el correo ya existe en otro usuario
          if (dto.user_email) {
            const existeEmail = await this._userRepository.createQueryBuilder('usuarios')
              .where('usuarios.user_id != :user_id', { user_id })
              .andWhere('usuarios.user_email = :user_email', { user_email: dto.user_email })
              .getOne();
    
            if (existeEmail) {
              throw new BadRequestException('El correo electrónico ya está registrado en otro usuario');
            }
          }
    
          // Actualizar los campos del usuario
          if (dto.user_email) usuario.user_email = dto.user_email;
          if (dto.user_password) usuario.user_password = dto.user_password;
    
          // Si el rol está presente en el DTO, se actualiza
          if (dto.rol_id) {
            // Buscar el rol con el ID proporcionado
            const rol = await this._rolRepository.findOne({ where: { rol_id: dto.rol_id } });
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
            error instanceof BadRequestException || error instanceof NotFoundException
          ) {
            throw error;
          }
    
          throw new InternalServerErrorException('Error al intentar actualizar el usuario');
        }
      }

    
  
      async eliminarUsuario(user_id: number): Promise<string> {
        const usuario = await this._userRepository.findOne({
          where: { user_id },
          relations: [
            'userroles',
            'people',
            'businesses'
            
          ],
        });
      
        if (!usuario) {
          throw new NotFoundException('Usuario no encontrado');
        }
      
        try {
          await this._userRepository.remove(usuario);
          return 'Usuario eliminado correctamente';
        } catch (error) {
          console.error('Error al eliminar usuario:', error); 
          throw new InternalServerErrorException('Error al intentar eliminar el usuario');
        }
      }
    }  


