import { Body, Controller, Delete, Get, Param, Post, Put, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AccessibilityService } from './accessibility.service';
import { CreateAccesibilityDto } from './dto/create-accessibility.dto';
import { AccessibilityEntity } from './entity/accesibility.entity';
import { UpdateAccesibilityDto } from './dto/update-accessibiity.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('accessibility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessibilityController {
  constructor(private readonly _accessibilityService: AccessibilityService) {}

  @Post()
  @Roles(1)
  async crearAccesibilidad(@Body() createAccessibilityDto: CreateAccesibilityDto): Promise<string> {
    return this._accessibilityService.create(createAccessibilityDto);
  }

  @Get()
  @Roles(1, 2, 3)
  async obtenerAccesibilidades(): Promise<AccessibilityEntity[]> {
    return await this._accessibilityService.obtenerAccesibilidades();
  }

  @Get(':id')
  @Roles(1, 2, 3)
  async obtenerAccesibilidadPorId(@Param('id', ParseIntPipe) id: number): Promise<AccessibilityEntity> {
    return await this._accessibilityService.obtenerAccesibilidadesPorId(id);
  }

  @Put(':id')
  @Roles(1)
  async actualizarAccesibilidad(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateAccesibilidadDto: UpdateAccesibilityDto
  ): Promise<string> {
    return await this._accessibilityService.actualizarAccesibilidad(id, updateAccesibilidadDto);
  }

  @Delete(':id')
  @Roles(1)
  async eliminarAccesibilidad(@Param('id', ParseIntPipe) id: number): Promise<string> {
      return await this._accessibilityService.eliminarAccesibilidad(id);
  }
}