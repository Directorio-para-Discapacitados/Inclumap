import { Body, Controller, Param, Put, UseGuards, Get } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleEntity } from './entity/people.entity';
import { UpdatePeopleDto } from './dto/update-people.dto';

@Controller('people')
export class PeopleController {
  constructor(
    private readonly _peopleService: PeopleService
  ) { }

  @Get()
  async obtenerPersonas(): Promise<PeopleEntity[]> {
    return await this._peopleService.obtenerPersonas();
  }

  @Get(':id')
  async obtenerPersonaPorId(@Param('id') id: number): Promise<PeopleEntity> {
    return await this._peopleService.obtenerPersonaPorId(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updatePeopleDto: UpdatePeopleDto) {
    return this._peopleService.actualizarPersona(id, updatePeopleDto);
  }
}