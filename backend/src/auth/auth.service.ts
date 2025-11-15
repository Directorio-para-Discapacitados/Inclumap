// backend/src/auth/auth.service.ts (Código Completo)

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { MailsService } from 'src/mails/mails.service';
import { MoreThan } from 'typeorm';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthDto } from './dtos/google-auth.dto';
import { FindOneOptions } from 'typeorm';
import { MapsService } from 'src/maps/maps.service';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

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
    private readonly mailService: MailsService,
    private readonly configService: ConfigService,
    private readonly mapsService: MapsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async registerFullUser(
    userData: CreateFullUserDto,
  ): Promise<{ message: string; token: string }> {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await this.userRepository.findOne({
      where: { user_email: userData.user_email },
    });
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
      rol = await this.rolRepository.findOne({
        where: { rol_id: userData.rolIds[0] },
      });
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

  async registerFullBusiness(
    businessData: CreateFullBusinessDto,
  ): Promise<{ message: string; token: string }> {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await this.userRepository.findOne({
      where: { user_email: businessData.user_email },
    });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Verificar si el NIT ya está registrado
    const existingBusiness = await this.businessRepository.findOne({
      where: { NIT: businessData.NIT },
    });
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
    const rolesToAssign =
      businessData.rolIds && businessData.rolIds.length > 0
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

    // 🌍 Obtener coordenadas automáticamente usando MapsService
    const coordinates = await this.mapsService.getCoordinates(businessData.business_address);
    
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    if (coordinates) {
      latitude = coordinates.lat;
      longitude = coordinates.lon;
    }

    // Crear el negocio asociado con coordenadas automáticas
    const newBusiness = this.businessRepository.create({
      business_name: businessData.business_name,
      address: businessData.business_address,
      NIT: businessData.NIT,
      description: businessData.description,
      coordinates: businessData.coordinates,
      latitude: latitude,
      longitude: longitude,
      user: newUser,
    });

    let savedBusiness;
    try {
      savedBusiness = await this.businessRepository.save(newBusiness);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear el negocio: ${error.message}`);
    }

    // Crear relaciones de accesibilidad
    if (
      businessData.accessibilityIds &&
      businessData.accessibilityIds.length > 0
    ) {
      for (const accessibilityId of businessData.accessibilityIds) {
        const accessibility = await this.accessibilityRepository.findOne({
          where: { accessibility_id: accessibilityId },
        });

        if (!accessibility) {
          throw new BadRequestException(
            `Accesibilidad con ID ${accessibilityId} no encontrada`,
          );
        }

        const businessAccessibility =
          this.businessAccessibilityRepository.create({
            business: savedBusiness,
            accessibility: accessibility,
          });

        await this.businessAccessibilityRepository.save(businessAccessibility);
      }
    }

    // Obtener todos los roles asignados para el payload
    const userRoles = await this.userRolesRepository.find({
      where: { user: { user_id: newUser.user_id } },
      relations: ['rol'],
    });

    const rolIds = userRoles.map((ur) => ur.rol.rol_id);

    // Crear payload para el token JWT
    const payload = {
      user_id: newUser.user_id,
      user_email: newUser.user_email,
      firstName: newPeople.firstName,
      firstLastName: newPeople.firstLastName,
      cellphone: newPeople.cellphone,
      address: newPeople.address,
      business_id: savedBusiness.business_id,
      business_name: savedBusiness.business_name,
      business_address: savedBusiness.address,
      NIT: savedBusiness.NIT,
      rolIds: rolIds,
      accessibilityIds: businessData.accessibilityIds || [],
    };

    // Generar el token JWT
    const token = this.jwtService.sign(payload);

    return {
      message: 'Negocio registrado exitosamente',
      token,
    };
  }

  // --- INICIO DE LA CORRECCIÓN FUNCIÓN LOGIN ---
  async login(dto: LoginDto): Promise<any> {
    const { user_email, user_password } = dto;

    // Buscar el usuario en la base de datos por correo
    // AÑADIDO 'business' a las relaciones
    const user = await this.userRepository.findOne({
      where: { user_email },
      relations: ['people', 'userroles', 'userroles.rol', 'business'],
    });

    if (!user)
      throw new UnauthorizedException(
        'Usuario no registrado, verifique su correo u contraseña',
      );

    // Comparar la contraseña ingresada con la almacenada en la base de datos
    const passwordOK = await compare(dto.user_password, user.user_password);
    if (!passwordOK) throw new UnauthorizedException('Contraseña incorrecta');

    // Obtener TODOS los roles del usuario
    if (!user.userroles || user.userroles.length === 0)
      throw new UnauthorizedException('El usuario no tiene roles asignados');

    const rolIds = user.userroles.map((ur) => ur.rol.rol_id);

    // Crear el token JWT con la información del usuario
    const payload = {
      user_id: user.user_id,
      user_email: user.user_email,
      firstName: user.people?.firstName,
      firstLastName: user.people?.firstLastName,
      cellphone: user.people?.cellphone, // Añadido para consistencia
      address: user.people?.address,     // Añadido para consistencia
      rolIds: rolIds, // CORREGIDO: Se envía el array de roles
      
      // Añadido: Incluir info del negocio (será null si no tiene)
      business_id: user.business?.business_id || null,
      business_name: user.business?.business_name || null,
    };

    const token = this.jwtService.sign(payload);

    // CORREGIDO: Mensaje de éxito
    return { message: 'Usuario logueado exitosamente', token };
  }
  // --- FIN DE LA CORRECCIÓN FUNCIÓN LOGIN ---


  async upgradeToBusiness(
    userId: number,
    businessData: UpgradeToBusinessDto,
  ): Promise<{ message: string; token: string }> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['people', 'business', 'userroles', 'userroles.rol'],
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar si ya tiene negocio
    if (user.business) {
      throw new BadRequestException('El usuario ya tiene un negocio registrado');
    }

    // Verificar si el NIT ya está registrado
    const existingBusiness = await this.businessRepository.findOne({
      where: { NIT: businessData.NIT },
    });

    if (existingBusiness) {
      throw new BadRequestException('El NIT ya está registrado');
    }

    // Verificar si ya tiene rol de negocio
    const hasBusinessRole = user.userroles.some((ur) => ur.rol.rol_id === 3);

    // Agregar rol de negocio si no lo tiene
    if (!hasBusinessRole) {
      const businessRole = await this.rolRepository.findOne({
        where: { rol_id: 3 },
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

    // Crear el negocio
    const newBusiness = this.businessRepository.create({
      business_name: businessData.business_name,
      address: businessData.business_address,
      NIT: businessData.NIT,
      description: businessData.description,
      coordinates: businessData.coordinates,
      user: user,
    });

    await this.businessRepository.save(newBusiness);

    // Crear relaciones de accesibilidad
    if (
      businessData.accessibilityIds &&
      businessData.accessibilityIds.length > 0
    ) {
      for (const accessibilityId of businessData.accessibilityIds) {
        const accessibility = await this.accessibilityRepository.findOne({
          where: { accessibility_id: accessibilityId },
        });

        if (accessibility) {
          const businessAccessibility =
            this.businessAccessibilityRepository.create({
              business: newBusiness,
              accessibility: accessibility,
            });
          await this.businessAccessibilityRepository.save(businessAccessibility);
        }
      }
    }

    // Obtener usuario actualizado con todos los roles
    const updatedUser = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['people', 'userroles', 'userroles.rol', 'business'],
    });

    // Verificar que updatedUser no sea null
    if (!updatedUser) {
      throw new BadRequestException('Error al actualizar el usuario');
    }

    // Verificar que people existe
    if (!updatedUser.people) {
      throw new BadRequestException('Datos de persona no encontrados');
    }

    const rolIds = updatedUser.userroles.map((ur) => ur.rol.rol_id);

    // Generar nuevo token con la información actualizada
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

    // CORREGIDO: Esta función también debe usar rolIds
    const payload = {
      user_id: usuario['user_id'],
      user_email: usuario['user_email'],
      firstName: usuario['firstName'],
      firstLastName: usuario['firstLastName'],
      cellphone: usuario['cellphone'],
      address: usuario['address'],
      rolIds: usuario['rolIds'], // Asegúrate de que el payload original tenga 'rolIds'
      business_id: usuario['business_id'],
      business_name: usuario['business_name'],
    };
    const token = this.jwtService.sign(payload);

    return token;
  }

  //Generar Codigo de restablecimiento de contraseña
  generarcodigoResetPassword(): any {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    return codigo;
  }

  //Solicitar restablecimiento de contraseña
  async solicitarRestablecimientoPassword(
    userdto: usuarioEmailResetPasswordDto,
  ): Promise<{ message: string }> {
    //extraer el correo electrónico del DTO
    const { user_email } = userdto;

    try {
      const user = await this.userRepository.findOne({
        where: { user_email },
        relations: ['people'],
      });

      if (!user) {
        throw new UnauthorizedException('El correo electrónico no está registrado');
      }

      // Generar un código de restablecimiento de contraseña
      const resetPasswordCode = this.generarcodigoResetPassword();
      user.resetpassword_token = resetPasswordCode;
      user.resetpassword_token_expiration = new Date(Date.now() + 10 * 60 * 1000);

      await this.userRepository.save(user);

      // Construir objeto Usuario para el mail
      const usuarioMail = {
        user_email: user.user_email,
        firstName: user.people?.firstName || '',
      };

      //enviar correo electrónico al usuario con el código de restablecimiento
      await this.mailService.sendUserrequestPassword(
        usuarioMail,
        resetPasswordCode,
      );

      //Elimincacion del código de restablecimiento después de 10 minutos
      setTimeout(async () => {
        user.resetpassword_token = null;
        user.resetpassword_token_expiration = null;
        await this.userRepository.save(user);
      }, 10 * 60 * 1000);

      // Mensaje de éxito
      return {
        message:
          'Su solicitud se completó correctamente. Revise su correo electrónico.',
      };
    } catch (error) {
      throw new BadRequestException('Error en la solicitud:' + error.message);
    }
  }
  async verificarCodigoRestablecimiento(
    codigo: string,
  ): Promise<{ isValid: boolean; message: string; user_email?: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          resetpassword_token: codigo,
          resetpassword_token_expiration: MoreThan(new Date()),
        },
        relations: ['people'],
      });

      if (!user) {
        return {
          isValid: false,
          message: 'Código inválido o expirado',
        };
      }

      return {
        isValid: true,
        message: 'Código válido',
        user_email: user.user_email,
      };
    } catch (error) {
      throw new BadRequestException('Error verificando el código');
    }
  }

  // Restablecer contraseña
  async restablecerPassword(
    codigo: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          resetpassword_token: codigo,
          resetpassword_token_expiration: MoreThan(new Date()),
        },
      });

      if (!user) {
        throw new BadRequestException('Código inválido o expirado');
      }

      if (newPassword.length < 6) {
        throw new BadRequestException(
          'La contraseña debe tener al menos 6 caracteres',
        );
      }

      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      user.user_password = await bcrypt.hash(newPassword, salt);

      // Limpiar el código de restablecimiento
      user.resetpassword_token = null;
      user.resetpassword_token_expiration = null;

      await this.userRepository.save(user);

      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      throw new BadRequestException('Error restableciendo la contraseña');
    }
  }

  async changePassword(
    user_id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      // Buscar usuario
      const user = await this.userRepository.findOne({ where: { user_id } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.user_password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(
        changePasswordDto.newPassword,
        user.user_password,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la actual',
        );
      }

      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      user.user_password = await bcrypt.hash(changePasswordDto.newPassword, salt);

      await this.userRepository.save(user);

      return { message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al cambiar la contraseña');
    }
  }

  /**
   * Devuelve el estado post-login para mostrar advertencias en el frontend
   * - Si el usuario tiene negocio asociado: verifica logo_url y coordinates
   * - Si no tiene negocio: sugiere completar registro de negocio
   */
  async getPostLoginStatus(userId: number): Promise<{
    hasBusiness: boolean;
    businessId: number | null;
    missing: { logo: boolean; location: boolean };
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const options: FindOneOptions<BusinessEntity> = {
      where: { user: { user_id: userId } },
    };
    const business = await this.businessRepository.findOne(options);

    if (!business) {
      warnings.push('Completa el registro de negocio y sube la imagen del local.');
      return {
        hasBusiness: false,
        businessId: null,
        missing: { logo: true, location: true },
        warnings,
      };
    }

    const missingLogo = !business.logo_url || business.logo_url.trim().length === 0;
    const missingLocation = !business.coordinates || business.coordinates.trim().length === 0;

    if (missingLogo) warnings.push('Te falta subir la imagen (logo/fachada) del local.');
    if (missingLocation) warnings.push('Te falta establecer la ubicación exacta del local.');

    return {
      hasBusiness: true,
      businessId: business.business_id,
      missing: { logo: missingLogo, location: missingLocation },
      warnings,
    };
  }

  
  async googleLoginClient(
    googleAuthDto: GoogleAuthDto,
  ): Promise<{ message: string; token: string }> {
    const { idToken } = googleAuthDto;

    if (!idToken) {
      throw new BadRequestException('Google ID Token no proporcionado');
    }

    try {
      // Verificar el ID token con Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Token de Google inválido');
      }

      // Adaptar el payload de Google a la estructura que espera nuestro servicio
      const googleUser = {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
      };

      if (!googleUser.email) {
        throw new BadRequestException(
          'No se pudo obtener el email de Google. Asegúrate de que el scope "email" esté solicitado.',
        );
      }

    
      return this.googleLogin(googleUser);
    } catch (error) {
      console.error('Error verifying Google ID token:', error);
      throw new UnauthorizedException(
        'Error al validar el token de Google: ' + error.message,
      );
    }
  }

  
  async googleLogin(googleUser: any): Promise<{ message: string; token: string }> {
    try {
      const { email } = googleUser;

      if (!email) {
        throw new BadRequestException(
          'El perfil de Google no incluye un correo electrónico.',
        );
      }

      // BUSCAR AL USUARIO POR EMAIL
      const user = await this.userRepository.findOne({
        where: { user_email: email },
        relations: ['people', 'userroles', 'userroles.rol', 'business'],
      });

    
      
      if (!user) {
        throw new UnauthorizedException(
          'Usuario no registrado. Por favor, regístrese primero con correo y contraseña antes de usar Google.',
        );
      }

      
      if (!user.people) {
        
        throw new InternalServerErrorException(
          'Datos de persona no encontrados para este usuario. Contacte a soporte.',
        );
      }

      //  GENERAR EL PAYLOAD CON LOS DATOS COMPLETOS DE LA BD
      const rolIds =
        user.userroles && user.userroles.length > 0
          ? user.userroles.map((ur) => ur.rol.rol_id)
          : [2]; 

      // El payload prioriza los datos de la BD
      const payload = {
        user_id: user.user_id,
        user_email: user.user_email,
        firstName: user.people.firstName, 
        firstLastName: user.people.firstLastName, 
        cellphone: user.people.cellphone, 
        address: user.people.address, 
        rolIds: rolIds,
        business_id: user.business?.business_id || null,
        business_name: user.business?.business_name || null,
      };

      const token = this.jwtService.sign(payload);

      return {
        message: 'Login con Google exitoso',
        token,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException ||
        error instanceof UnauthorizedException 
      ) {
        throw error;
      }
      console.error('Error en googleLogin:', error);
      throw new InternalServerErrorException(
        'Error en login con Google: ' + error.message,
      );
    }
  }

  async getProfile(userId: number): Promise<any> {
    try {
      // Obtener el usuario con todas las relaciones necesarias
      const user = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'business', 'userroles', 'userroles.rol'],
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Obtener los IDs de roles
      const rolIds = user.userroles?.map((userRole) => userRole.rol.rol_id) || [];
      
      // Determinar el tipo de usuario y construir displayName
      let displayName: string;
      let roleDescription: string;
      let logo_url: string | null = null;
      let verified: boolean = false;
      
      if (rolIds.includes(3) && user.business?.business_name) {
        // Propietario de negocio
        displayName = user.business.business_name;
        roleDescription = "Propietario";
        logo_url = user.business.logo_url || null;
        verified = user.business.verified || false;
      } else if (user.people) {
        // Usuario normal
        displayName = `${user.people.firstName} ${user.people.firstLastName}`.trim();
        roleDescription = this.getRoleDescription(rolIds);
      } else {
        displayName = "Usuario";
        roleDescription = this.getRoleDescription(rolIds);
      }

      return {
        user_id: user.user_id,
        displayName,
        roleDescription,
        email: user.user_email,
        rolIds,
        avatar: user.avatar_url || null,
        logo_url,
        verified,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting profile:', error);
      throw new InternalServerErrorException('Error al obtener el perfil');
    }
  }

  private getRoleDescription(rolIds: number[]): string {
    if (rolIds.includes(3)) {
      return "Propietario";
    }
    if (rolIds.includes(1)) {
      return "Administrador";
    }
    if (rolIds.includes(2)) {
      return "Usuario";
    }
    return "Usuario";
  }

}