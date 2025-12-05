import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import {
  BusinessStatisticsDto,
  RecordViewDto,
} from './dto/business-statistics.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { UserEntity } from 'src/user/entity/user.entity';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('business')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
  constructor(private readonly _businessService: BusinessService) {}

  @Post()
  @Roles(1, 3) // Admin (1) y Propietario (3) pueden crear negocios
  async crearNegocio(
    @User() user: any,
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<string> {
    return await this._businessService.create(createBusinessDto);
  }

  @Get()
  @Roles(1, 2, 3)
  async obtenerNegocios(): Promise<BusinessEntity[]> {
    return await this._businessService.obtenerNegocios();
  }

  // ⚠️ Este endpoint DEBE ir ANTES de @Get(':id') para que funcione correctamente
  @Get('owner-business')
  @Roles(3) // Solo propietarios pueden acceder a su negocio
  async getOwnerBusiness(@User() user: UserEntity): Promise<BusinessEntity> {
    try {
      console.log('👤 Usuario autenticado:', user);
      console.log('🔑 User ID:', user?.user_id);
      console.log('🎭 Roles del usuario:', (user as any)?.rolIds);

      if (!user || !user.user_id) {
        throw new BadRequestException('Usuario no autenticado correctamente');
      }

      return await this._businessService.getOwnerBusiness(user.user_id);
    } catch (error) {
      console.error('❌ Error en getOwnerBusiness:', error);
      throw error;
    }
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
    return await this._businessService.actualizarNegocio(
      id,
      updateBusinessDto,
      user,
    );
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

    try {
      return await this._businessService.eliminarNegocioCompleto(
        businessId,
        shouldDeleteOwner,
      );
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
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }), // Agregado webp
        ],
        fileIsRequired: true, // 👈 Asegura que el validador falle si no hay archivo
      }),
    )
    file: Express.Multer.File,
    @User() user: UserEntity,
  ) {
    // Ya no necesitas el if (!file) porque ParseFilePipe lo maneja
    return this._businessService.updateBusinessLogo(user, file.buffer);
  }

  @Post(':id/images')
  @Roles(1, 3)
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadBusinessImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: UserEntity,
  ) {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }
    return this._businessService.uploadBusinessImages(businessId, files, user);
  }

  @Delete(':id/images/:imageId')
  @Roles(1, 3)
  async deleteBusinessImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @User() user: UserEntity,
  ) {
    const businessId = parseInt(id, 10);
    const imgId = parseInt(imageId, 10);
    if (isNaN(businessId) || isNaN(imgId)) {
      throw new BadRequestException('ID de negocio o imagen inválido');
    }
    return this._businessService.deleteBusinessImage(businessId, imgId, user);
  }

  @Patch(':id/remove-owner')
  @Roles(1) // Solo administradores pueden remover propietarios
  async removerPropietario(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }
    return await this._businessService.removerPropietario(businessId);
  }

  @Patch(':id/clear-owner')
  @Roles(1) // Solo administradores pueden limpiar propietarios
  async limpiarPropietario(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    try {
      // Buscar el negocio
      const negocio =
        await this._businessService.obtenerNegocioPorId(businessId);

      // Limpiar la relación directamente
      await this._businessService.limpiarPropietario(businessId);

      return {
        message: `Propietario removido del negocio "${negocio.business_name}" exitosamente`,
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

    try {
      return await this._businessService.asignarPropietario(
        businessId,
        newOwnerId,
      );
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
    failed: string[];
  }> {
    try {
      const result =
        await this._businessService.regeocodeBusinessesWithoutCoordinates();

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
      const message =
        await this._businessService.updateBusinessCoordinates(businessId);

      return { message };
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      throw error;
    }
  }

  @Patch(':id')
  @Roles(1, 3) // Admin y propietarios pueden actualizar
  async updateBusinessProfile(
    @Param('id') id: number,
    @Body() updateDto: UpdateBusinessDto,
    @User() user: UserEntity,
  ): Promise<BusinessEntity> {
    return await this._businessService.updateOwnerBusiness(id, updateDto, user);
  }

  @Post(':id/view')
  @Roles(1, 2, 3) // Todos pueden registrar vistas
  async recordBusinessView(
    @Param('id') id: number,
    @Body() recordViewDto: Partial<RecordViewDto>,
  ): Promise<{ message: string }> {
    await this._businessService.recordView({
      business_id: id,
      ...recordViewDto,
    });
    return { message: 'Vista registrada' };
  }

  @Get(':id/statistics')
  @Roles(1, 3) // Solo admin y propietarios pueden ver estadísticas
  async getBusinessStatistics(
    @Param('id') id: number,
  ): Promise<BusinessStatisticsDto> {
    return await this._businessService.getBusinessStatistics(id);
  }
}
