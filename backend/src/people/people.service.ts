import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeopleEntity } from './entity/people.entity';
import { UserEntity } from '../user/entity/user.entity';
import { UpdatePeopleDto } from './dto/update-people.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(PeopleEntity)
    private readonly _peopleRepository: Repository<PeopleEntity>,

    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {}

  // Obtener todas las personas
  async obtenerPersonas(): Promise<any[]> {
    try {
      const personas = await this._peopleRepository.find({
        relations: ['user'],
      });

      if (!personas.length) {
        throw new NotFoundException('No hay personas registradas');
      }

      // Mapea la respuesta según los campos de la entidad
      return personas.map((persona) => ({
        people_id: persona.people_id,
        firstName: persona.firstName,
        firstLastName: persona.firstLastName,
        cellphone: persona.cellphone,
        address: persona.address,
        user_id: persona.user?.user_id ?? null,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error en el servidor');
    }
  }

  async obtenerPersonaPorUserId(user_id: number): Promise<PeopleEntity> {
    try {
      const persona = await this._peopleRepository.findOne({
        where: { user: { user_id } },
        relations: ['user'],
      });

      if (!persona) {
        throw new NotFoundException('Persona no encontrada para este usuario');
      }

      return persona;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener la persona');
    }
  }

  // Obtener una persona por ID
  async obtenerPersonaPorId(people_id: number): Promise<any> {
    try {
      const persona = await this._peopleRepository.findOne({
        where: { people_id },
        relations: ['user'],
      });

      if (!persona) {
        throw new NotFoundException('Persona no encontrada');
      }

      return {
        people_id: persona.people_id,
        firstName: persona.firstName,
        firstLastName: persona.firstLastName,
        cellphone: persona.cellphone,
        address: persona.address,
        user_id: persona.user?.user_id ?? null,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener la persona');
    }
  }

  async actualizarPersona(
    user_id: number,
    dto: UpdatePeopleDto,
    currentUser: any,
  ): Promise<string> {
    try {
      // Asegurar que ambos sean números y comparar correctamente
      const userIdFromParam = Number(user_id);
      const userIdFromToken = Number(currentUser.user_id);
      const isOwner = userIdFromParam === userIdFromToken;
      const isAdmin = currentUser.rolIds.includes(1);

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar esta persona',
        );
      }

      // Validar si el ID del usuario es válido
      const usuario = await this._userRepository.findOne({
        where: { user_id },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Buscar la persona asociada al usuario
      const persona = await this._peopleRepository.findOne({
        where: { user: usuario },
      });
      if (!persona) {
        throw new NotFoundException('Persona no encontrada');
      }

      // Actualizar los campos de la persona
      if (dto.firstName) {
        persona.firstName = dto.firstName;
      }
      if (dto.firstLastName) {
        persona.firstLastName = dto.firstLastName;
      }
      if (dto.cellphone) {
        persona.cellphone = dto.cellphone;
      }
      if (dto.address) {
        persona.address = dto.address;
      }

      // Guardar los cambios
      await this._peopleRepository.save(persona);

      return 'Información de la persona actualizada correctamente';
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error al actualizar la persona');
    }
  }

  async actualizarMiPerfil(
    userId: number,
    dto: UpdatePeopleDto,
  ): Promise<string> {
    try {
      // Buscar la persona por user_id
      const persona = await this._peopleRepository.findOne({
        where: { user: { user_id: userId } },
      });

      if (!persona) {
        throw new NotFoundException('Perfil no encontrado');
      }

      // Actualizar los campos si están presentes en el DTO
      if (dto.firstName !== undefined) {
        persona.firstName = dto.firstName;
      }
      if (dto.firstLastName !== undefined) {
        persona.firstLastName = dto.firstLastName;
      }
      if (dto.cellphone !== undefined) {
        persona.cellphone = dto.cellphone;
      }
      if (dto.address !== undefined) {
        persona.address = dto.address;
      }
      if (dto.gender !== undefined) {
        persona.gender = dto.gender;
      }

      // Guardar los cambios
      await this._peopleRepository.save(persona);

      return 'Perfil actualizado correctamente';
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating profile:', error);
      throw new InternalServerErrorException('Error al actualizar el perfil');
    }
  }
}
