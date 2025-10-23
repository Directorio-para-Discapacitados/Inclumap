import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';


@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly _userService: UserService) { }


    @Post()
    @Roles(1)
    async crearUsuario(@Body() createUserDto: CreateUserDto): Promise<string> {
        return this._userService.create(createUserDto);
    }

    @Get()
    @Roles(1) 
    async obtenerUsuarios(): Promise<UserEntity[]> {
        return await this._userService.obtenerUsuarios();
    }
    @Get(":id")
    @Roles(1, 2, 3)
    async obtenerUsuarioPorId(@User() currentUser: any, @Param('id') id: number): Promise<UserEntity> {
        return await this._userService.obtenerUsuarioPorId(id, currentUser);
    }


    @Put(":id")
    @Roles(1, 2, 3)
    async actualizarUsuario(@User() currentUser: any, @Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<string> {
        return await this._userService.actualizarUsuario(id, updateUserDto, currentUser);
    }

    @Delete(":id")
    @Roles(1)
    async eliminarUsuario(@Param('id') id: number): Promise<string> {
        return await this._userService.eliminarUsuario(id);
    }
}


