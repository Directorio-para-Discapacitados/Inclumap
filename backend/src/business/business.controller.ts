import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';



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
}
