import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
        relations: ['user']
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

  // Obtener una persona por ID
  async obtenerPersonaPorId(people_id: number): Promise<any> {
    try {
      const persona = await this._peopleRepository.findOne({
        where: { people_id },
        relations: ['user']
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

  async actualizarPersona(user_id: number, dto: UpdatePeopleDto): Promise<string> {
    // Validar si el ID del usuario es válido
    const usuario = await this._userRepository.findOne({ where: { user_id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
  
    // Buscar la persona asociada al usuario
    const persona = await this._peopleRepository.findOne({ where: { user: usuario } });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  
    // Actualizar los campos de la persona
    if (dto.firstName) persona.firstName = dto.firstName;
    if (dto.firstLastName) persona.firstLastName = dto.firstLastName;
    if (dto.cellphone) persona.cellphone = dto.cellphone;
    if (dto.address) persona.address = dto.address;
  
    // Guardar los cambios
    await this._peopleRepository.save(persona);
  
    return 'Información de la persona actualizada correctamente';
  }
}