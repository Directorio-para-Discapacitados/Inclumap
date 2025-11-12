import { BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { UserEntity } from 'src/user/entity/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiTags('business')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
    constructor(private readonly _businessService: BusinessService) { }

    @Post()
    @Roles(1, 3) // Admin (1) y Propietario (3) pueden crear negocios
    async crearNegocio(@User() user: any, @Body() createBusinessDto: CreateBusinessDto): Promise<string> {
        return await this._businessService.create(createBusinessDto);
    }

    @Get()
    @Roles(1, 2, 3)
    async obtenerNegocios(): Promise<BusinessEntity[]> {
        return await this._businessService.obtenerNegocios();
    }

    @Get(':id')
    @Roles(1, 2, 3)
    async obtenerNegocioPorId(@Param('id') id: number): Promise<BusinessEntity> {
        return await this._businessService.obtenerNegocioPorId(id);
    }

    @Put(':id')
    @Roles(1, 3)
    
    async actualizarNegocio(
        @User() user: any,
        @Param('id') id: number,
        @Body() updateBusinessDto: UpdateBusinessDto,
    ): Promise<string> {
        return await this._businessService.actualizarNegocio(id, updateBusinessDto, user);
    }

  @Delete(':id/complete')
  @Roles(1) // Solo administradores pueden eliminar negocios completamente
  async eliminarNegocioCompleto(
    @Param('id') id: string,
    @Query('deleteOwner') deleteOwner?: string, // Query param opcional
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }
    
    const shouldDeleteOwner = deleteOwner === 'true';
    console.log(`🗑️ Eliminando negocio ${businessId} completamente. Eliminar propietario: ${shouldDeleteOwner}`);
    
    try {
      return await this._businessService.eliminarNegocioCompleto(businessId, shouldDeleteOwner);
    } catch (error) {
      console.error('Error al eliminar negocio completo:', error);
      throw error;
    }
  }

    @Delete(':id')
    @Roles(1, 3)
    async eliminarNegocio(@Param('id') id: number): Promise<string> {
        return await this._businessService.eliminarNegocio(id);
    }

    @Patch('logo')
    @UseGuards(JwtAuthGuard) 
    @UseInterceptors(FileInterceptor('logo')) 
    async uploadBusinessLogo(
      @UploadedFile(
        new ParseFilePipe({
          validators: [
            new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5 MB
            new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          ],
        }),
      )
      file: Express.Multer.File,
      @User() user: UserEntity, 
    ) {
      if (!file) {
        throw new BadRequestException('No se proporcionó ningún archivo de logo.');
      }
        return this._businessService.updateBusinessLogo(user, file.buffer);
    }

  @Patch(':id/remove-owner')
  @Roles(1) // Solo administradores pueden remover propietarios
  async removerPropietario(@Param('id') id: string): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }
    return await this._businessService.removerPropietario(businessId);
  }

  @Patch(':id/clear-owner')
  @Roles(1) // Solo administradores pueden limpiar propietarios
  async limpiarPropietario(@Param('id') id: string): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }
    
    console.log(`🔄 Administrador limpiando propietario del negocio ${businessId}`);
    
    try {
      // Buscar el negocio
      const negocio = await this._businessService.obtenerNegocioPorId(businessId);
      
      // Limpiar la relación directamente
      await this._businessService.limpiarPropietario(businessId);
      
      return {
        message: `Propietario removido del negocio "${negocio.business_name}" exitosamente`
      };
    } catch (error) {
      console.error('Error al limpiar propietario:', error);
      throw error;
    }
  }

  @Get('available/unowned')
  @Roles(1) // Solo administradores pueden ver negocios sin propietario
  async obtenerNegociosSinPropietario(): Promise<BusinessEntity[]> {
    return await this._businessService.obtenerNegociosSinPropietario();
  }

  @Patch(':id/assign-owner/:userId')
  @Roles(1) // Solo administradores pueden asignar propietarios
  async asignarPropietario(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    const newOwnerId = parseInt(userId, 10);
    
    if (isNaN(businessId) || isNaN(newOwnerId)) {
      throw new BadRequestException('ID de negocio o usuario inválido');
    }
    
    console.log(`🔄 Asignando usuario ${newOwnerId} como propietario del negocio ${businessId}`);
    
    try {
      return await this._businessService.asignarPropietario(businessId, newOwnerId);
    } catch (error) {
      console.error('Error al asignar propietario:', error);
      throw error;
    }
  }

  @Patch('regeocoding')
  @Roles(1) // Solo administradores pueden ejecutar re-geocodificación masiva
  async regeocodeBusinesses(): Promise<{ 
    message: string; 
    processed: number; 
    updated: number; 
    failed: string[] 
  }> {
    try {
      console.log('🗺️ Iniciando re-geocodificación masiva de negocios...');
      const result = await this._businessService.regeocodeBusinessesWithoutCoordinates();
      
      return {
        message: 'Proceso de re-geocodificación completado',
        processed: result.processed,
        updated: result.updated,
        failed: result.failed,
      };
    } catch (error) {
      console.error('Error en re-geocodificación masiva:', error);
      throw error;
    }
  }

  @Patch(':id/coordinates')
  @Roles(1, 3) // Administradores y propietarios pueden actualizar coordenadas
  async updateBusinessCoordinates(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    try {
      console.log(`🗺️ Actualizando coordenadas del negocio ${businessId}...`);
      const message = await this._businessService.updateBusinessCoordinates(businessId);
      
      return { message };
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      throw error;
    }
  }
}
