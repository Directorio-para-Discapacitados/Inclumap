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
import { TokenDto } from './dtos/token.dto';
import { usuarioEmailResetPasswordDto } from './dtos/usuario-email-resetpassword.dto';
import { UpgradeToBusinessDto } from './dtos/upgradeToBusiness.dto';


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

    // Generar hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(businessData.user_password, salt);

    // Crear el nuevo usuario
    const newUser = this.userRepository.create({
        user_email: businessData.user_email,
        user_password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    // Asignar múltiples roles: Usuario (2) + Propietario/Negocio (3)
    const rolesToAssign = businessData.rolIds && businessData.rolIds.length > 0 
        ? businessData.rolIds 
        : [2, 3]; // Por defecto: usuario + negocio

    for (const rolId of rolesToAssign) {
        const rol = await this.rolRepository.findOne({ where: { rol_id: rolId } });
        
        if (!rol) {
            throw new BadRequestException(`Rol con ID ${rolId} no encontrado`);
        }

        // Crear la relación entre el usuario y el rol
        const userRole = this.userRolesRepository.create({
            user: newUser,
            rol: rol,
        });

        await this.userRolesRepository.save(userRole);
    }

    // Crear la persona asociada
    const newPeople = this.peopleRepository.create({
        firstName: businessData.firstName,
        firstLastName: businessData.firstLastName,
        cellphone: businessData.cellphone,
        address: businessData.address,
        gender: businessData.gender,
        user: newUser,
    });

    await this.peopleRepository.save(newPeople);

    // Crear el negocio asociado
    const newBusiness = this.businessRepository.create({
        business_name: businessData.business_name,
        address: businessData.business_address,
        NIT: businessData.NIT,
        description: businessData.description,
        coordinates: businessData.coordinates,
        user: newUser,
    });

    await this.businessRepository.save(newBusiness);

    // Crear relaciones de accesibilidad
    if (businessData.accessibilityIds && businessData.accessibilityIds.length > 0) {
        for (const accessibilityId of businessData.accessibilityIds) {
            const accessibility = await this.accessibilityRepository.findOne({ 
                where: { accessibility_id: accessibilityId } 
            });
            
            if (!accessibility) {
                throw new BadRequestException(`Accesibilidad con ID ${accessibilityId} no encontrada`);
            }

            const businessAccessibility = this.businessAccessibilityRepository.create({
                business: newBusiness,
                accessibility: accessibility,
            });
            
            await this.businessAccessibilityRepository.save(businessAccessibility);
        }
    }

    // Obtener todos los roles asignados para el payload
    const userRoles = await this.userRolesRepository.find({
        where: { user: { user_id: newUser.user_id } },
        relations: ['rol']
    });

    const rolIds = userRoles.map(ur => ur.rol.rol_id);

    // Crear payload para el token JWT
    const payload = {
        user_id: newUser.user_id,
        user_email: newUser.user_email,
        firstName: newPeople.firstName,
        firstLastName: newPeople.firstLastName,
        cellphone: newPeople.cellphone,
        address: newPeople.address,
        business_id: newBusiness.business_id,
        business_name: newBusiness.business_name,
        business_address: newBusiness.address,
        NIT: newBusiness.NIT,
        rolIds: rolIds,
        accessibilityIds: businessData.accessibilityIds || [],
    };

    // Generar el token JWT
    const token = this.jwtService.sign(payload);

    return { 
        message: 'Negocio registrado exitosamente', token,
       };
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

    const token = this.jwtService.sign(payload);

    return { message: 'Usuario loguead0 exitosamente', token };

  }

  async upgradeToBusiness(userId: number, businessData: UpgradeToBusinessDto): Promise<{ message: string; token: string }> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'business', 'userroles', 'userroles.rol']
    });

    if (!user) {
        throw new BadRequestException('Usuario no encontrado');
    }

    // 2. Verificar si ya tiene negocio
    if (user.business) {
        throw new BadRequestException('El usuario ya tiene un negocio registrado');
    }

    // 3. Verificar si el NIT ya está registrado
    const existingBusiness = await this.businessRepository.findOne({
        where: { NIT: businessData.NIT }
    });

    if (existingBusiness) {
        throw new BadRequestException('El NIT ya está registrado');
    }

    // 4. Verificar si ya tiene rol de negocio
    const hasBusinessRole = user.userroles.some(ur => ur.rol.rol_id === 3);
    
    // 5. Agregar rol de negocio si no lo tiene
    if (!hasBusinessRole) {
        const businessRole = await this.rolRepository.findOne({
            where: { rol_id: 3 }
        });

        if (!businessRole) {
            throw new BadRequestException('Rol de negocio no encontrado');
        }

        const userRole = this.userRolesRepository.create({
            user: user,
            rol: businessRole,
        });

        await this.userRolesRepository.save(userRole);
    }

    // 6. Crear el negocio
    const newBusiness = this.businessRepository.create({
        business_name: businessData.business_name,
        address: businessData.business_address,
        NIT: businessData.NIT,
        description: businessData.description,
        coordinates: businessData.coordinates,
        user: user,
    });

    await this.businessRepository.save(newBusiness);

    // 7. Crear relaciones de accesibilidad
    if (businessData.accessibilityIds && businessData.accessibilityIds.length > 0) {
        for (const accessibilityId of businessData.accessibilityIds) {
            const accessibility = await this.accessibilityRepository.findOne({
                where: { accessibility_id: accessibilityId }
            });
            
            if (accessibility) {
                const businessAccessibility = this.businessAccessibilityRepository.create({
                    business: newBusiness,
                    accessibility: accessibility,
                });
                await this.businessAccessibilityRepository.save(businessAccessibility);
            }
        }
    }

    // 8. Obtener usuario actualizado con todos los roles
    const updatedUser = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'userroles', 'userroles.rol', 'business']
    });

    // Verificar que updatedUser no sea null
    if (!updatedUser) {
        throw new BadRequestException('Error al actualizar el usuario');
    }

    // Verificar que people existe
    if (!updatedUser.people) {
        throw new BadRequestException('Datos de persona no encontrados');
    }

    const rolIds = updatedUser.userroles.map(ur => ur.rol.rol_id);

    // 9. Generar nuevo token con la información actualizada
    const payload = {
        user_id: updatedUser.user_id,
        user_email: updatedUser.user_email,
        firstName: updatedUser.people.firstName,
        firstLastName: updatedUser.people.firstLastName,
        cellphone: updatedUser.people.cellphone,
        address: updatedUser.people.address,
        business_id: newBusiness.business_id,
        business_name: newBusiness.business_name,
        business_address: newBusiness.address,
        NIT: newBusiness.NIT,
        rolIds: rolIds,
        accessibilityIds: businessData.accessibilityIds || [],
    };

    const token = this.jwtService.sign(payload);

    return {
        message: 'Negocio registrado exitosamente',
        token,
    };
}


  //Metodo refrescarToken
  async refreshToken(dto: TokenDto): Promise<any> {

    const usuario = await this.jwtService.decode(dto.token);

    const payload = {
      user_id: usuario['user_id'],
      user_email: usuario['user_email'],
      rol_id: usuario['rol_id'],
      rol_name: usuario['rol_name'],
    }
    const token = this.jwtService.sign(payload);

    return token;
  }

  //Generar Codigo de restablecimiento de contraseña
  generarcodigoResetPassword(): any {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    return codigo;
  }


   //Solicitar restablecimiento de contraseña
   async solicitarRestablecimientoPassword(userdto: usuarioEmailResetPasswordDto): Promise<void> {
    const { user_email } = userdto;

    try {
      const user = await this.userRepository.findOne({ where: { user_email }, relations: ['people', 'business'] });

      if (!user) {
        throw new BadRequestException('El correo electrónico no está registrado');
      }

      // Generar un código de restablecimiento de contraseña
      const resetPasswordCode = this.generarcodigoResetPassword();
      user.resetpassword_token = resetPasswordCode;
      user.resetpassword_token_expiration = new Date(Date.now() + 10 * 60 * 1000);

      await this.userRepository.save(user);

      
      //Elimincacion del código de restablecimiento después de 10 minutos
      setTimeout(async () => {
        user.resetpassword_token = null;
        user.resetpassword_token_expiration = null;
        await this.userRepository.save(user);
      }, 10 * 60 * 1000);

      

    } catch (error) {
      throw new BadRequestException('Error en la solicitud:' + error);
    }
  }


}


