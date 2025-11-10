import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRolesEntity } from './entity/user_rol.entity';
import { UserEntity } from '../user/entity/user.entity';
import { RolEntity } from '../roles/entity/rol.entity';

@Injectable()
export class UserRolService {
  constructor(
    @InjectRepository(UserRolesEntity)
    private readonly userRolesRepository: Repository<UserRolesEntity>,
    
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
  ) {}

  async addUserRole(userId: number, rolId: number): Promise<string> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({ where: { user_id: userId } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar que el rol existe
      const role = await this.rolRepository.findOne({ where: { rol_id: rolId } });
      if (!role) {
        throw new NotFoundException('Rol no encontrado');
      }

      // Verificar que la relación no existe ya
      const existingUserRole = await this.userRolesRepository.findOne({
        where: { 
          user: { user_id: userId },
          rol: { rol_id: rolId }
        }
      });

      if (existingUserRole) {
        throw new ConflictException('El usuario ya tiene este rol asignado');
      }

      // Crear la nueva relación usuario-rol
      const userRole = this.userRolesRepository.create({
        user: user,
        rol: role
      });

      await this.userRolesRepository.save(userRole);

      return `Rol ${role.rol_name} añadido exitosamente al usuario ${user.user_email}`;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      console.error('Error al añadir rol al usuario:', error);
      throw new InternalServerErrorException('Error interno del servidor al añadir rol');
    }
  }

  async removeUserRole(userId: number, rolId: number): Promise<string> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({ where: { user_id: userId } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar que el rol existe
      const role = await this.rolRepository.findOne({ where: { rol_id: rolId } });
      if (!role) {
        throw new NotFoundException('Rol no encontrado');
      }

      // Buscar la relación usuario-rol
      const userRole = await this.userRolesRepository.findOne({
        where: { 
          user: { user_id: userId },
          rol: { rol_id: rolId }
        }
      });

      if (!userRole) {
        throw new NotFoundException('El usuario no tiene asignado este rol');
      }

      // Eliminar la relación
      await this.userRolesRepository.remove(userRole);

      return `Rol ${role.rol_name} removido exitosamente del usuario ${user.user_email}`;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('Error al remover rol del usuario:', error);
      throw new InternalServerErrorException('Error interno del servidor al remover rol');
    }
  }
}
