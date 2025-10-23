import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessEntity } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';



@Controller('business')
export class BusinessController {
    constructor(private readonly _businessService: BusinessService) { }

    @Post()
    async crearNegocio(@Body() createBusinessDto: CreateBusinessDto): Promise<string> {
        return await this._businessService.create(createBusinessDto);
    }

    @Get()
    async obtenerNegocios(): Promise<BusinessEntity[]> {
        return await this._businessService.obtenerNegocios();
    }

    @Get(':id')
    async obtenerNegocioPorId(@Param('id') id: number): Promise<BusinessEntity> {
        return await this._businessService.obtenerNegocioPorId(id);
    }

    @Put(':id')
    async actualizarNegocio(
        @Param('id') id: number,
        @Body() updateBusinessDto: UpdateBusinessDto,
    ): Promise<string> {
        return await this._businessService.actualizarNegocio(id, updateBusinessDto);
    }

    @Delete(':id')
    async eliminarNegocio(@Param('id') id: number): Promise<string> {
        return await this._businessService.eliminarNegocio(id);
    }
}
