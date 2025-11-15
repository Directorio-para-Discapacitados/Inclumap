import { Body, Controller, Param, Put, UseGuards, Get } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleEntity } from './entity/people.entity';
import { UpdatePeopleDto } from './dto/update-people.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('people')
@Controller('people')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeopleController {
  constructor(private readonly _peopleService: PeopleService) {}

  @Get()
  @Roles(1)
  async obtenerPersonas(): Promise<PeopleEntity[]> {
    return await this._peopleService.obtenerPersonas();
  }

  @Get('my-profile')
  @Roles(1, 2, 3)
  async obtenerMiPersona(@User() user: any): Promise<PeopleEntity> {
    return await this._peopleService.obtenerPersonaPorUserId(user.user_id);
  }

  @Put('my-profile')
  @Roles(1, 2, 3)
  async actualizarMiPerfil(
    @User() user: any,
    @Body() updatePeopleDto: UpdatePeopleDto,
  ) {
    return this._peopleService.actualizarMiPerfil(
      user.user_id,
      updatePeopleDto,
    );
  }

  @Get(':id')
  @Roles(1, 2, 3)
  async obtenerPersonaPorId(@Param('id') id: number): Promise<PeopleEntity> {
    return await this._peopleService.obtenerPersonaPorId(id);
  }

  @Put(':id')
  @Roles(1, 2, 3)
  async update(
    @User() user: any,
    @Param('id') id: number,
    @Body() updatePeopleDto: UpdatePeopleDto,
  ) {
    return this._peopleService.actualizarPersona(id, updatePeopleDto, user);
  }
}
