import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { RoleChangeEntity } from '../roles/entity/role-change.entity';
import { ALLOWED_ROLES } from '../config/roles.constants';




@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly _userRepository: Repository<UserEntity>,
        @InjectRepository(RoleChangeEntity)
        private readonly _roleChangeRepository: Repository<RoleChangeEntity>,

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

    // Cambiar rol de un usuario y registrar en audit log
    async changeUserRole(user_id: number, dto: ChangeRoleDto, req?: any): Promise<string> {
        const queryRunner = this._userRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validar existencia del usuario
            const usuario = await queryRunner.manager.findOne(UserEntity, { 
                where: { user_id },
                lock: { mode: 'pessimistic_write' }
            });
            if (!usuario) {
                throw new NotFoundException('Usuario no encontrado');
            }

            const previous = usuario.user_role;
            const next = dto.role;

            // Validar que el rol actual sea diferente al nuevo
            if (previous === next) {
                await queryRunner.rollbackTransaction();
                return 'No hay cambios en el rol';
            }

            // Validar que el rol esté permitido
            if (!ALLOWED_ROLES.includes(next)) {
                throw new BadRequestException(`Rol '${next}' no válido. Roles permitidos: ${ALLOWED_ROLES.join(', ')}`);
            }

            // Obtener el ID del administrador que realiza el cambio
            const changedBy = req?.user?.user_id ?? 
                            (req?.headers?.['x-user-id'] ? Number(req.headers['x-user-id']) : null);

            if (!changedBy) {
                throw new BadRequestException('No se pudo identificar al administrador que realiza el cambio');
            }

            // Actualizar el rol del usuario
            usuario.user_role = next;
            await queryRunner.manager.save(usuario);

            // Registrar el cambio en el log de auditoría
            const roleChange = queryRunner.manager.create(RoleChangeEntity, {
                user_id: usuario.user_id,
                previous_role: previous,
                new_role: next,
                changed_by: changedBy,
                reason: dto.reason ?? 'Sin razón especificada'
            });
            await queryRunner.manager.save(roleChange);

            // Confirmar la transacción
            await queryRunner.commitTransaction();
            return `Rol actualizado correctamente de '${previous}' a '${next}'`;

        } catch (error) {
            // Revertir cambios en caso de error
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new InternalServerErrorException(
                'Error al cambiar el rol del usuario. Por favor, inténtelo de nuevo.'
            );

        } finally {
            // Liberar el queryRunner
            await queryRunner.release();
        }
    }
}  


