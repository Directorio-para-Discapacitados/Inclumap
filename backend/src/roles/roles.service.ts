import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from './entity/rol.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
  ) {}

  async onModuleInit() {
    // Esperar a que TypeORM esté listo
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.initializeDefaultRoles();
    } catch (error) {
      this.logger.error('Error initializing default roles:', error);
    }
  }

  private async initializeDefaultRoles() {
    const defaultRoles = [
      { rol_id: 1, rol_name: 'Admin' },
      { rol_id: 2, rol_name: 'User' },
      { rol_id: 3, rol_name: 'Propietario' },
    ];

    for (const roleData of defaultRoles) {
      await this.createRoleIfNotExists(roleData);
    }
  }

  private async createRoleIfNotExists(roleData: {
    rol_id: number;
    rol_name: string;
  }): Promise<void> {
    try {
      const roleExists = await this.rolRepository.findOne({
        where: [{ rol_id: roleData.rol_id }, { rol_name: roleData.rol_name }],
      });

      if (!roleExists) {
        const newRole = this.rolRepository.create(roleData);
        await this.rolRepository.save(newRole);
        this.logger.debug(`Role ${roleData.rol_name} created successfully`);
      }
    } catch (error) {
      this.logger.warn(
        `Error creating role ${roleData.rol_name}:`,
        error.message,
      );
    }
  }

  async findAll(): Promise<RolEntity[]> {
    return this.rolRepository.find();
  }

  async findById(id: number): Promise<RolEntity | null> {
    return this.rolRepository.findOne({ where: { rol_id: id } });
  }

  async findByName(name: string): Promise<RolEntity | null> {
    return this.rolRepository.findOne({ where: { rol_name: name } });
  }
}
