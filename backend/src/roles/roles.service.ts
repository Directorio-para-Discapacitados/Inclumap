import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entity/role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly _roleRepository: Repository<RoleEntity>,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleEntity> {
    try {
      const role = this._roleRepository.create(dto);
      return await this._roleRepository.save(role);
    } catch (error) {
      throw new InternalServerErrorException('Error creating role');
    }
  }

  async findAll(): Promise<RoleEntity[]> {
    try {
      return await this._roleRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching roles');
    }
  }

  async findById(id: number): Promise<RoleEntity> {
    const role = await this._roleRepository.findOne({ where: { role_id: id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }
}
