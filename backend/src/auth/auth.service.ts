import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RolEntity } from 'src/roles/entity/rol.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dtos/login.dto';
import { compare } from 'bcrypt';
import { CreateFullUserDto } from './dtos/createFullUser.dto';
import * as bcrypt from 'bcrypt';
import { PeopleEntity } from 'src/people/entity/people.entity';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,

    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,

    @InjectRepository(UserRolesEntity)
    private readonly userRolesRepository: Repository<UserRolesEntity>,

    private readonly jwtService: JwtService,
  ) { }

  async registerFullUser(userData: CreateFullUserDto): Promise<{ message: string; token: string }> {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await this.userRepository.findOne({ where: { user_email: userData.user_email } });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Generar un salt para mejorar la seguridad del hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.user_password, salt);

    // Crear el nuevo usuario
    const newUser = this.userRepository.create({
      user_email: userData.user_email,
      user_password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    // Verificar si se proporcionaron roles, de lo contrario asignar un rol por defecto
    let rol;
    if (userData.rolIds && userData.rolIds.length > 0) {
      rol = await this.rolRepository.findOne({ where: { rol_id: userData.rolIds[0] } });
    } else {

      rol = await this.rolRepository.findOne({ where: { rol_id: 2 } });
    }

    if (!rol) {
      throw new BadRequestException('Rol no encontrado');
    }

    // Crear la relación entre el usuario y el rol
    const userRole = this.userRolesRepository.create({
      user: newUser,
      rol: rol,
    });

    await this.userRolesRepository.save(userRole);

    // Crear la persona asociada a ese usuario
    const newPeople = this.peopleRepository.create({
      ...userData,
      user: newUser,
    });

    await this.peopleRepository.save(newPeople);

    // Crear el payload para el token JWT
    const payload = {
      user_email: newUser.user_email,
      firstName: newPeople.firstName,
      firstLastName: newPeople.firstLastName,
      cellphone: newPeople.cellphone,
      address: newPeople.address,
      rolIds: [rol.rol_id],
    };

    // Generar el token JWT
    const token = this.jwtService.sign(payload);

    return { message: 'Usuario registrados exitosamente', token };
  }



  async login(dto: LoginDto): Promise<any> {
    const { user_email, user_password } = dto;

    // Buscar el usuario en la base de datos por correo
    const user = await this.userRepository.findOne({
      where: { user_email },
      relations: ['userroles', 'userroles.rol'],
    });

    if (!user) throw new UnauthorizedException('Usuario no registrado, verifique su correo u contraseña');

    // Comparar la contraseña ingresada con la almacenada en la base de datos
    const passwordOK = await compare(dto.user_password, user.user_password);
    if (!passwordOK) throw new UnauthorizedException('Contraseña incorrecta');

    // Obtener el rol del usuario
    const userRole = user.userroles[0];
    if (!userRole) throw new UnauthorizedException('El usuario no tiene roles asignados');

    // Crear el token JWT con la información del usuario
    const payload = {
      user_id: user.user_id,
      user_email: user.user_email,
      rol_id: userRole.rol.rol_id,
      rol_name: userRole.rol.rol_name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { message: 'Usuario logueadi exitosamente', token };


  }
}


