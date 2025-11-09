import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Put, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  ParseIntPipe,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiTags } from '@nestjs/swagger';
import { avatarMulterConfig } from '../config/multer-avatar.config';

@ApiTags('user')
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

    // Endpoints para gestión de avatar
    @Put(':id/avatar')
    @Roles(1, 2, 3)
    @UseInterceptors(FileInterceptor('avatar', avatarMulterConfig))
    async uploadAvatar(
        @User() currentUser: any,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ message: string; avatar_url: string }> {
        // Verificar que el usuario puede actualizar este perfil
        if (currentUser.role_id !== 1 && currentUser.user_id !== id) {
            throw new ForbiddenException('No tienes permisos para actualizar este avatar');
        }

        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        return await this._userService.updateAvatar(id, file);
    }

    @Delete(':id/avatar')
    @Roles(1, 2, 3)
    async deleteAvatar(
        @User() currentUser: any,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ message: string }> {
        // Verificar que el usuario puede actualizar este perfil
        if (currentUser.role_id !== 1 && currentUser.user_id !== id) {
            throw new ForbiddenException('No tienes permisos para eliminar este avatar');
        }

        return await this._userService.deleteAvatar(id);
    }
}


