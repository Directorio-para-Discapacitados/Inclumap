import { BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
    @Roles(3)
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

    @Delete(':id')
    @Roles(1, 3)
    async eliminarNegocio(@Param('id') id: number): Promise<string> {
        return await this._businessService.eliminarNegocio(id);
    }

    @Post('upload-logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadLogo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user: UserEntity,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }
    return this._businessService.saveLogo(user, file.buffer);
  }
}

    
