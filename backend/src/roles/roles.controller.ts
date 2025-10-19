import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly _rolesService: RolesService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this._rolesService.create(dto);
  }

  @Get()
  findAll() {
    return this._rolesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this._rolesService.findById(+id);
  }
}
