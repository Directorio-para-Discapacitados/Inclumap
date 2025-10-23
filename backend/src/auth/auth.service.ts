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
import { BusinessEntity } from 'src/business/entity/business.entity';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { CreateFullBusinessDto } from './dtos/createFullBusiness.dto';


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

    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,

    @InjectRepository(BusinessAccessibilityEntity)
    private readonly businessAccessibilityRepository: Repository<BusinessAccessibilityEntity>,

    @InjectRepository(AccessibilityEntity) 
    private readonly accessibilityRepository: Repository<AccessibilityEntity>,

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

  async registerFullBusiness(businessData: CreateFullBusinessDto): Promise<{ message: string; token: string }> {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await this.userRepository.findOne({ where: { user_email: businessData.user_email } });
    if (existingUser) {
        throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Verificar si el NIT ya está registrado
    const existingBusiness = await this.businessRepository.findOne({ where: { NIT: businessData.NIT } });
    if (existingBusiness) {
        throw new BadRequestException('El NIT ya está registrado');
    }

    // Generar un salt para mejorar la seguridad del hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(businessData.user_password, salt);

    // Crear el nuevo usuario
    const newUser = this.userRepository.create({
        user_email: businessData.user_email,
        user_password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    // Verificar si se proporcionaron roles, de lo contrario asignar un rol por defecto
    let rol;
    if (businessData.rolIds && businessData.rolIds.length > 0) {
        rol = await this.rolRepository.findOne({ where: { rol_id: businessData.rolIds[0] } });
    } else {
        rol = await this.rolRepository.findOne({ where: { rol_id: 3 } }); // Rol por defecto para negocios
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
        firstName: businessData.firstName,
        firstLastName: businessData.firstLastName,
        cellphone: businessData.cellphone,
        address: businessData.address,
        gender: businessData.gender,
        user: newUser,
    });

    await this.peopleRepository.save(newPeople);

    // Crear el negocio asociado a ese usuario
    const newBusiness = this.businessRepository.create({
        business_name: businessData.business_name,
        address: businessData.business_address,
        NIT: businessData.NIT,
        description: businessData.description,
        coordinates: businessData.coordinates,
        user: newUser,
    });

    await this.businessRepository.save(newBusiness);

    // Crear las relaciones de accesibilidad si se proporcionan
    if (businessData.accessibilityIds && businessData.accessibilityIds.length > 0) {
        for (const accessibilityId of businessData.accessibilityIds) {
            // Buscar la accesibilidad en AccessibilityEntity
            const accessibility = await this.accessibilityRepository.findOne({ 
                where: { accessibility_id: accessibilityId } 
            });
            
            if (!accessibility) {
                throw new BadRequestException(`Accesibilidad con ID ${accessibilityId} no encontrada`);
            }

            // Crear la relación en business_accessibility
            const businessAccessibility = this.businessAccessibilityRepository.create({
                business: newBusiness,
                accessibility: accessibility,
            });
            
            await this.businessAccessibilityRepository.save(businessAccessibility);
        }
    }

    // Crear el payload para el token JWT
    const payload = {
        user_email: newUser.user_email,
        firstName: newPeople.firstName,
        firstLastName: newPeople.firstLastName,
        cellphone: newPeople.cellphone,
        address: newPeople.address,
        business_name: newBusiness.business_name,
        business_address: newBusiness.address,
        NIT: newBusiness.NIT,
        rolIds: [rol.rol_id],
        accessibilityIds: businessData.accessibilityIds || [],
    };

    // Generar el token JWT
    const token = this.jwtService.sign(payload);

    return { message: 'Negocio registrado exitosamente', token };
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


