import { Body, Controller, Delete, Get, Param, Post, Put, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';


@Controller('user')
export class UserController {
    constructor(private readonly _userService: UserService) { }


    @Post()
    async crearUsuario(@Body() createUserDto: CreateUserDto): Promise<string> {
        return this._userService.create(createUserDto);
    }

    @Get()
    async obtenerUsuarios(): Promise<UserEntity[]> {
        return await this._userService.obtenerUsuarios();
    }
    @Get(":id")
    async obtenerUsuarioPorId(@Param('id') id: number): Promise<UserEntity> {
        return await this._userService.obtenerUsuarioPorId(id);
    }


    @Put(":id")
    async actualizarUsuario(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<string> {
        return await this._userService.actualizarUsuario(id, updateUserDto);
    }

    @Delete(":id")
    async eliminarUsuario(@Param('id') id: number): Promise<string> {
        return await this._userService.eliminarUsuario(id);
    }

    @Patch(":id/role")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('administrador')
    async changeRole(@Param('id') id: number, @Body() dto: ChangeRoleDto, @Req() req: any): Promise<string> {
        return await this._userService.changeUserRole(id, dto, req);
    }
}


